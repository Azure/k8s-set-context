import * as core from '@actions/core';
import * as path from 'path';
import * as fs from 'fs';
import * as io from '@actions/io';
import * as toolCache from '@actions/tool-cache';
import * as os from 'os';
import { ToolRunner } from "@actions/exec/lib/toolrunner";
import * as jsyaml from 'js-yaml';
import * as util from 'util';
import { getArcKubeconfig } from './arc-login';

export function getKubeconfig(): string {
    const method = core.getInput('method', { required: true });
    if (method == 'kubeconfig') {
        const kubeconfig = core.getInput('kubeconfig', { required: true });
        core.debug("Setting context using kubeconfig");
        return kubeconfig;
    }
    else if (method == 'service-account') {
        const clusterUrl = core.getInput('k8s-url', { required: true });
        core.debug("Found clusterUrl, creating kubeconfig using certificate and token");
        let k8sSecret = core.getInput('k8s-secret', { required: true });
        var parsedk8sSecret = jsyaml.safeLoad(k8sSecret);
        let kubernetesServiceAccountSecretFieldNotPresent = 'The service account secret yaml does not contain %s; field. Make sure that its present and try again.';
        if (!parsedk8sSecret) {
            throw Error("The service account secret yaml specified is invalid. Make sure that its a valid yaml and try again.");
        }

        if (!parsedk8sSecret.data) {
            throw Error(util.format(kubernetesServiceAccountSecretFieldNotPresent, "data"));
        }

        if (!parsedk8sSecret.data.token) {
            throw Error(util.format(kubernetesServiceAccountSecretFieldNotPresent, "data.token"));
        }

        if (!parsedk8sSecret.data["ca.crt"]) {
            throw Error(util.format(kubernetesServiceAccountSecretFieldNotPresent, "data[ca.crt]"));
        }

        const certAuth = parsedk8sSecret.data["ca.crt"];
        const token = Buffer.from(parsedk8sSecret.data.token, 'base64').toString();
        const kubeconfigObject = {
            "apiVersion": "v1",
            "kind": "Config",
            "clusters": [
                {
                    "cluster": {
                        "certificate-authority-data": certAuth,
                        "server": clusterUrl
                    }
                }
            ],
            "users": [
                {
                    "user": {
                        "token": token
                    }
                }
            ]
        };

        return JSON.stringify(kubeconfigObject);
    }
    else {
        throw Error("Invalid method specified. Acceptable values are kubeconfig and service-account.");
    }
}

export function getExecutableExtension(): string {
    if (os.type().match(/^Win/)) {
        return '.exe';
    }

    return '';
}

export async function getKubectlPath() {
    let kubectlPath = await io.which('kubectl', false);
    if (!kubectlPath) {
        const allVersions = toolCache.findAllVersions('kubectl');
        kubectlPath = allVersions.length > 0 ? toolCache.find('kubectl', allVersions[0]) : '';
        if (!kubectlPath) {
            throw new Error('Kubectl is not installed');
        }

        kubectlPath = path.join(kubectlPath, `kubectl${getExecutableExtension()}`);
    }
    return kubectlPath;
}

export async function setContext(kubeconfigPath: string) {
    let context = core.getInput('context');
    if (context) {
        //To use kubectl commands, the environment variable KUBECONFIG needs to be set for this step 
        process.env['KUBECONFIG'] = kubeconfigPath;
        const kubectlPath = await getKubectlPath();
        let toolRunner = new ToolRunner(kubectlPath, ['config', 'use-context', context]);
        await toolRunner.exec();
        toolRunner = new ToolRunner(kubectlPath, ['config', 'current-context']);
        await toolRunner.exec();
    }
}

export async function run() {
    try {
        let kubeconfig = '';
        const cluster_type = core.getInput('cluster-type', { required: true });
        if (cluster_type == 'arc') {
            await getArcKubeconfig().catch(ex => {
                throw new Error('Error: Could not get the KUBECONFIG for arc cluster: ' + ex);
            });
        }
        else {
            const runnerTempDirectory = process.env['RUNNER_TEMP']; // Using process.env until the core libs are updated
            const kubeconfigPath = path.join(runnerTempDirectory, `kubeconfig_${Date.now()}`);
            kubeconfig = getKubeconfig();
            core.debug(`Writing kubeconfig contents to ${kubeconfigPath}`);
            fs.writeFileSync(kubeconfigPath, kubeconfig);
            fs.chmodSync(kubeconfigPath, '600');
            core.exportVariable('KUBECONFIG', kubeconfigPath);
            console.log('KUBECONFIG environment variable is set');
            await setContext(kubeconfigPath);
        }
    } catch (ex) {
        return Promise.reject(ex);
    }
}

run().catch(core.setFailed);