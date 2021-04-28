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
const az_login = require("./main");
const path = require("path");
const child_process_1 = require("child_process");
const fs = require("fs");
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
            let method = core.getInput('method');
            if (method != 'service-account' && method != 'spn') {
                throw Error("Supported methods for arc cluster are 'service-account' and 'spn'.");
            }
            let resourceGroupName = core.getInput('resource-group');
            let clusterName = core.getInput('cluster-name');
            if (!resourceGroupName) {
                throw Error("'resourceGroupName' is not passed for arc cluster.");
            }
            if (!clusterName) {
                throw Error("'clusterName' is not passed for arc cluster.");
            }
            yield az_login.main();
            yield az_login.executeAzCliCommand(`account show`, false);
            yield az_login.executeAzCliCommand(`extension add -n connectedk8s`, false);
            yield az_login.executeAzCliCommand(`extension list`, false);
            const runnerTempDirectory = process.env['RUNNER_TEMP']; // Using process.env until the core libs are updated
            const kubeconfigPath = path.join(runnerTempDirectory, `kubeconfig_${Date.now()}`);
            if (method == 'service-account') {
                let saToken = core.getInput('token');
                if (!saToken) {
                    throw Error("'saToken' is not passed for 'service-account' method.");
                }
                console.log('using service account method for authenticating to arc cluster.');
                child_process_1.spawn('az', ['connectedk8s', 'proxy', '-n', clusterName, '-g', resourceGroupName, '-f', kubeconfigPath, '--token', saToken], {
                    detached: true,
                    stdio: 'ignore'
                }).unref();
            }
            else {
                console.log('using spn method for authenticating to arc cluster.');
                child_process_1.spawn('az', ['connectedk8s', 'proxy', '-n', clusterName, '-g', resourceGroupName, '-f', kubeconfigPath], {
                    detached: true,
                    stdio: 'ignore'
                }).unref();
            }
            console.log('started proxy');
            yield sleep(120000); //sleeping for 2 minutes to allow kubeconfig to be merged
            fs.chmodSync(kubeconfigPath, '600');
            core.exportVariable('KUBECONFIG', kubeconfigPath);
            console.log('KUBECONFIG environment variable is set');
        }
        catch (ex) {
            return Promise.reject(ex);
        }
    });
}
exports.getArcKubeconfig = getArcKubeconfig;
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}