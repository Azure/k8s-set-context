import * as core from '@actions/core';
import * as path from 'path';
import {spawn} from 'child_process';
import * as fs from 'fs';
import * as io from '@actions/io';
import * as exec from '@actions/exec';
var azPath: string;
    
const kubeconfig_timeout = 120;//timeout in seconds

export async function getArcKubeconfig() {
    try {
        let method = core.getInput('method');
        if (method != 'service-account' && method != 'service-principal'){
            throw Error("Supported methods for arc cluster are 'service-account' and 'service-principal'.");
        }        
        
        let resourceGroupName = core.getInput('resource-group');
        let clusterName = core.getInput('cluster-name');
        if(!resourceGroupName){
            throw Error("'resourceGroupName' is not passed for arc cluster.")
        }
        if(!clusterName){
            throw Error("'clusterName' is not passed for arc cluster.")
        }
        azPath = await io.which("az", true);
        await executeAzCliCommand(`account show`, false);
        try{
            await executeAzCliCommand(`extension remove -n connectedk8s`, false);
        }
        catch{
            //ignore if this causes an error
        }
        await executeAzCliCommand(`extension add -n connectedk8s`, false);
        await executeAzCliCommand(`extension list`, false);
        const runnerTempDirectory = process.env['RUNNER_TEMP']; // Using process.env until the core libs are updated
        const kubeconfigPath = path.join(runnerTempDirectory, `kubeconfig_${Date.now()}`);
        if (method == 'service-account'){
            let saToken = core.getInput('token');
            if(!saToken){
                throw Error("'saToken' is not passed for 'service-account' method.")
            }
            console.log("using 'service-account' method for authenticating to arc cluster.")
            const proc=spawn(azPath,['connectedk8s','proxy','-n',clusterName,'-g',resourceGroupName,'-f',kubeconfigPath,'--token',saToken], {
                detached: true,
                stdio: 'ignore'
            });
            proc.unref();
        } else{
            console.log("using 'service-principal' method for authenticating to arc cluster.")
            const proc=spawn(azPath,['connectedk8s','proxy','-n',clusterName,'-g',resourceGroupName,'-f',kubeconfigPath], {
                detached: true,
                stdio: 'ignore'
            });
            proc.unref();
        }
        console.log(`Waiting for ${kubeconfig_timeout} seconds for kubeconfig to be merged....`)
        await sleep(kubeconfig_timeout*1000) //sleeping for 2 minutes to allow kubeconfig to be merged
        fs.chmodSync(kubeconfigPath, '600');
        core.exportVariable('KUBECONFIG', kubeconfigPath);
        console.log('KUBECONFIG environment variable is set');
    } catch (error) {
        throw new Error(error);
    }
}

export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function executeAzCliCommand(
    command: string, 
    silent?: boolean, 
    execOptions: any = {}, 
    args: any = []) {
    execOptions.silent = !!silent;
    try {
        await exec.exec(`"${azPath}" ${command}`, args,  execOptions); 
    }
    catch (error) {
        throw new Error(error);
    }
}