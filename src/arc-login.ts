import * as core from '@actions/core';
import { rejects } from 'assert';
import { WebRequest, WebRequestOptions, WebResponse, sendRequest } from './client';
import * as querystring from 'querystring';

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
        let creds = core.getInput('creds');
        let credsObject: { [key: string]: string; };
        try {
            credsObject = JSON.parse(creds);
        } catch (ex) {
            throw new Error('Credentials object is not a valid JSON: ' + ex);
        }

        let servicePrincipalId = credsObject["clientId"];
        let servicePrincipalKey = credsObject["clientSecret"];
        let tenantId = credsObject["tenantId"];
        let authorityUrl = credsObject["activeDirectoryEndpointUrl"] || "https://login.microsoftonline.com";
        let managementEndpointUrl = credsObject["resourceManagerEndpointUrl"] || "https://management.azure.com/";
        let subscriptionId = credsObject["subscriptionId"];

        let azureSessionToken = await getAzureAccessToken(servicePrincipalId, servicePrincipalKey, tenantId, authorityUrl, managementEndpointUrl).catch(ex => {
            throw new Error('Could not fetch the azure access token: ' + ex);
        });
        let resourceGroupName = core.getInput('resource-group');
        let clusterName = core.getInput('cluster-name');
        let saToken = core.getInput('token');
        return new Promise<string>((resolve, reject) => {
            var webRequest = new WebRequest();
            webRequest.method = 'POST';
            webRequest.uri = `${managementEndpointUrl}/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Kubernetes/connectedClusters/${clusterName}/listClusterUserCredentials?api-version=2020-01-01-preview`;
            webRequest.headers = {
                'Authorization': 'Bearer ' + azureSessionToken,
                'Content-Type': 'application/json; charset=utf-8'
            }
            webRequest.body = JSON.stringify({
                authenticationMethod: "Token",
                value: {
                    token: saToken
                }
            });
            sendRequest(webRequest).then((response: WebResponse) => {
                let kubeconfigs = response.body.kubeconfigs;
                if (kubeconfigs && kubeconfigs.length > 0) {
                    var kubeconfig = Buffer.from(kubeconfigs[0].value, 'base64');
                    resolve(kubeconfig.toString());
                } else {
                    reject(JSON.stringify(response.body));
                }
            }).catch(reject);
        });
    } catch (ex) {
        return Promise.reject(ex);
    }
}