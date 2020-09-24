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
const core = require("@actions/core");
const client_1 = require("./client");
const querystring = require("querystring");
function getAzureAccessToken(servicePrincipalId, servicePrincipalKey, tenantId, authorityUrl, managementEndpointUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!servicePrincipalId || !servicePrincipalKey || !tenantId || !authorityUrl) {
            throw new Error("Not all values are present in the creds object. Ensure appId, password and tenant are supplied");
        }
        return new Promise((resolve, reject) => {
            let webRequest = new client_1.WebRequest();
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
            let webRequestOptions = {
                retriableStatusCodes: [400, 408, 409, 500, 502, 503, 504],
            };
            client_1.sendRequest(webRequest, webRequestOptions).then((response) => {
                if (response.statusCode == 200) {
                    resolve(response.body.access_token);
                }
                else if ([400, 401, 403].indexOf(response.statusCode) != -1) {
                    reject('ExpiredServicePrincipal');
                }
                else {
                    reject('CouldNotFetchAccessTokenforAzureStatusCode');
                }
            }, (error) => {
                reject(error);
            });
        });
    });
}
function getArcKubeconfig() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let creds = core.getInput('creds');
            let credsObject;
            try {
                credsObject = JSON.parse(creds);
            }
            catch (ex) {
                throw new Error('Credentials object is not a valid JSON: ' + ex);
            }
            let servicePrincipalId = credsObject["clientId"];
            let servicePrincipalKey = credsObject["clientSecret"];
            let tenantId = credsObject["tenantId"];
            let authorityUrl = credsObject["activeDirectoryEndpointUrl"] || "https://login.microsoftonline.com";
            let managementEndpointUrl = credsObject["resourceManagerEndpointUrl"] || "https://management.azure.com/";
            let subscriptionId = credsObject["subscriptionId"];
            let azureSessionToken = yield getAzureAccessToken(servicePrincipalId, servicePrincipalKey, tenantId, authorityUrl, managementEndpointUrl).catch(ex => {
                throw new Error('Could not fetch the azure access token: ' + ex);
            });
            let resourceGroupName = core.getInput('resource-group');
            let clusterName = core.getInput('cluster-name');
            let saToken = core.getInput('token');
            return new Promise((resolve, reject) => {
                var webRequest = new client_1.WebRequest();
                webRequest.method = 'POST';
                webRequest.uri = `${managementEndpointUrl}/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Kubernetes/connectedClusters/${clusterName}/listClusterUserCredentials?api-version=2020-01-01-preview`;
                webRequest.headers = {
                    'Authorization': 'Bearer ' + azureSessionToken,
                    'Content-Type': 'application/json; charset=utf-8'
                };
                webRequest.body = JSON.stringify({
                    authenticationMethod: "Token",
                    value: {
                        token: saToken
                    }
                });
                client_1.sendRequest(webRequest).then((response) => {
                    let kubeconfigs = response.body.kubeconfigs;
                    if (kubeconfigs && kubeconfigs.length > 0) {
                        var kubeconfig = Buffer.from(kubeconfigs[0].value, 'base64');
                        resolve(kubeconfig.toString());
                    }
                    else {
                        reject(JSON.stringify(response.body));
                    }
                }).catch(reject);
            });
        }
        catch (ex) {
            return Promise.reject(ex);
        }
    });
}
exports.getArcKubeconfig = getArcKubeconfig;
