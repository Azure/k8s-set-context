"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.setContext = exports.getKubectlPath = exports.getExecutableExtension = exports.getKubeconfig = void 0;
const core = require("@actions/core");
const path = require("path");
const fs = require("fs");
const io = require("@actions/io");
const toolCache = require("@actions/tool-cache");
const os = require("os");
const toolrunner_1 = require("@actions/exec/lib/toolrunner");
const jsyaml = require("js-yaml");
const util = require("util");
function getKubeconfig() {
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
exports.getKubeconfig = getKubeconfig;
function getExecutableExtension() {
    if (os.type().match(/^Win/)) {
        return '.exe';
    }
    return '';
}
exports.getExecutableExtension = getExecutableExtension;
function getKubectlPath() {
    return __awaiter(this, void 0, void 0, function* () {
        let kubectlPath = yield io.which('kubectl', false);
        if (!kubectlPath) {
            const allVersions = toolCache.findAllVersions('kubectl');
            kubectlPath = allVersions.length > 0 ? toolCache.find('kubectl', allVersions[0]) : '';
            if (!kubectlPath) {
                throw new Error('Kubectl is not installed');
            }
            kubectlPath = path.join(kubectlPath, `kubectl${getExecutableExtension()}`);
        }
        return kubectlPath;
    });
}
exports.getKubectlPath = getKubectlPath;
function setContext(kubeconfigPath) {
    return __awaiter(this, void 0, void 0, function* () {
        let context = core.getInput('context');
        if (context) {
            //To use kubectl commands, the environment variable KUBECONFIG needs to be set for this step 
            process.env['KUBECONFIG'] = kubeconfigPath;
            const kubectlPath = yield getKubectlPath();
            let toolRunner = new toolrunner_1.ToolRunner(kubectlPath, ['config', 'use-context', context]);
            yield toolRunner.exec();
            toolRunner = new toolrunner_1.ToolRunner(kubectlPath, ['config', 'current-context']);
            yield toolRunner.exec();
        }
    });
}
exports.setContext = setContext;
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        let kubeconfig = getKubeconfig();
        const runnerTempDirectory = process.env['RUNNER_TEMP']; // Using process.env until the core libs are updated
        const kubeconfigPath = path.join(runnerTempDirectory, `kubeconfig_${Date.now()}`);
        core.debug(`Writing kubeconfig contents to ${kubeconfigPath}`);
        fs.writeFileSync(kubeconfigPath, kubeconfig);
        fs.chmodSync(kubeconfigPath, '600');
        core.exportVariable('KUBECONFIG', kubeconfigPath);
        console.log('KUBECONFIG environment variable is set');
        yield setContext(kubeconfigPath);
    });
}
exports.run = run;
run().catch(core.setFailed);
