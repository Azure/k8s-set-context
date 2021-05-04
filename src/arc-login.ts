import * as core from '@actions/core';
import { rejects } from 'assert';
import { WebRequest, WebRequestOptions, WebResponse, sendRequest } from './client';
import * as querystring from 'querystring';
import * as path from 'path';
import {spawn} from 'child_process';
import * as fs from 'fs';
import * as io from '@actions/io';
import * as exec from '@actions/exec';
var azPath: string;
    
const kubeconfig_timeout = 120;//timeout in seconds
async function getAzureAccessToken(servicePrincipalId, servicePrincipalKey, tenantId, authorityUrl, managementEndpointUrl: string): Promise<string> {

    if (!servicePrincipalId || !servicePrincipalKey || !tenantId || !authorityUrl) {
        throw new Error("Not all values are present in the creds object. Ensure appId, password and tenant are supplied");
    }
    return new Promise<string>((resolve, reject) => {
        let webRequest = new WebRequest();
        webRequest.method = "POST";
        webRequest.uri = `${authorityUrl}/${tenantId}/oauth2/token/`;
        webRequest.body = querystring.stringify({
            resource: managementEndpointUrl,
            client_id: servicePrincipalId,
            grant_type: "client_credentials",
            client_secret: servicePrincipalKey
        });
        webRequest.headers = {
            "Content-Type": "application/x-www-form-urlencoded; charset=utf-8"
        };

        let webRequestOptions: WebRequestOptions = {
            retriableStatusCodes: [400, 408, 409, 500, 502, 503, 504],
        };

        sendRequest(webRequest, webRequestOptions).then(
            (response: WebResponse) => {
                if (response.statusCode == 200) {
                    resolve(response.body.access_token);
                }
                else if ([400, 401, 403].indexOf(response.statusCode) != -1) {
                    reject('ExpiredServicePrincipal');
                }
                else {
                    reject('CouldNotFetchAccessTokenforAzureStatusCode');
                }
            },
            (error) => {
                reject(error)
            }
        );
    });
}

export async function getArcKubeconfig(): Promise<string> {
    try {
        let method = core.getInput('method');
        if (method != 'service-account' && method != 'SPN'){
            throw Error("Supported methods for arc cluster are 'service-account' and 'SPN'.");
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
            console.log('using service account method for authenticating to arc cluster.')
            const proc=spawn(azPath,['connectedk8s','proxy','-n',clusterName,'-g',resourceGroupName,'-f',kubeconfigPath,'--token',saToken], {
                detached: true,
                stdio: 'ignore'
            });
            proc.unref();
        } else{
            console.log('using spn method for authenticating to arc cluster.')
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
    } catch (ex) {
        return Promise.reject(ex);
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function executeAzCliCommand(
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