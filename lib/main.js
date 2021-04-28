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
const exec = require("@actions/exec");
const io = require("@actions/io");
const actions_secret_parser_1 = require("actions-secret-parser");
var azPath;
var prefix = !!process.env.AZURE_HTTP_USER_AGENT ? `${process.env.AZURE_HTTP_USER_AGENT}` : "";
var azPSHostEnv = !!process.env.AZUREPS_HOST_ENVIRONMENT ? `${process.env.AZUREPS_HOST_ENVIRONMENT}` : "";
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Set user agent variable
            var isAzCLISuccess = false;
            let usrAgentRepo = `${process.env.GITHUB_REPOSITORY}`;
            let actionName = 'AzureLogin';
            let userAgentString = (!!prefix ? `${prefix}+` : '') + `GITHUBACTIONS/${actionName}@v1_${usrAgentRepo}`;
            let azurePSHostEnv = (!!azPSHostEnv ? `${azPSHostEnv}+` : '') + `GITHUBACTIONS/${actionName}@v1_${usrAgentRepo}`;
            core.exportVariable('AZURE_HTTP_USER_AGENT', userAgentString);
            core.exportVariable('AZUREPS_HOST_ENVIRONMENT', azurePSHostEnv);
            azPath = yield io.which("az", true);
            let azureSupportedCloudName = new Set([
                "azureusgovernment",
                "azurechinacloud",
                "azuregermancloud",
                "azurecloud",
                "azurestack"
            ]);
            let output = "";
            const execOptions = {
                listeners: {
                    stdout: (data) => {
                        output += data.toString();
                    }
                }
            };
            yield executeAzCliCommand("--version", true, execOptions);
            core.debug(`az cli version used:\n${output}`);
            let creds = core.getInput('creds', { required: true });
            let secrets = new actions_secret_parser_1.SecretParser(creds, actions_secret_parser_1.FormatType.JSON);
            let servicePrincipalId = secrets.getSecret("$.clientId", false);
            let servicePrincipalKey = secrets.getSecret("$.clientSecret", true);
            let tenantId = secrets.getSecret("$.tenantId", false);
            let subscriptionId = secrets.getSecret("$.subscriptionId", false);
            let resourceManagerEndpointUrl = secrets.getSecret("$.resourceManagerEndpointUrl", false);
            let environment = core.getInput("environment").toLowerCase();
            if (!servicePrincipalId || !servicePrincipalKey || !tenantId) {
                throw new Error("Not all values are present in the creds object. Ensure clientId, clientSecret and tenantId are supplied.");
            }
            if (!subscriptionId) {
                throw new Error("Not all values are present in the creds object. Ensure subscriptionId is supplied.");
            }
            if (!azureSupportedCloudName.has(environment)) {
                throw new Error("Unsupported value for environment is passed.The list of supported values for environment are ‘azureusgovernment', ‘azurechinacloud’, ‘azuregermancloud’, ‘azurecloud’ or ’azurestack’");
            }
            // Attempting Az cli login
            if (environment == "azurestack") {
                if (!resourceManagerEndpointUrl) {
                    throw new Error("resourceManagerEndpointUrl is a required parameter when environment is defined.");
                }
                console.log(`Unregistering cloud: "${environment}" first if it exists`);
                try {
                    yield executeAzCliCommand(`cloud set -n AzureCloud`, true);
                    yield executeAzCliCommand(`cloud unregister -n "${environment}"`, false);
                }
                catch (error) {
                    console.log(`Ignore cloud not registered error: "${error}"`);
                }
                console.log(`Registering cloud: "${environment}" with ARM endpoint: "${resourceManagerEndpointUrl}"`);
                try {
                    let baseUri = resourceManagerEndpointUrl;
                    if (baseUri.endsWith('/')) {
                        baseUri = baseUri.substring(0, baseUri.length - 1); // need to remove trailing / from resourceManagerEndpointUrl to correctly derive suffixes below
                    }
                    let suffixKeyvault = ".vault" + baseUri.substring(baseUri.indexOf('.')); // keyvault suffix starts with .
                    let suffixStorage = baseUri.substring(baseUri.indexOf('.') + 1); // storage suffix starts without .
                    let profileVersion = "2019-03-01-hybrid";
                    yield executeAzCliCommand(`cloud register -n "${environment}" --endpoint-resource-manager "${resourceManagerEndpointUrl}" --suffix-keyvault-dns "${suffixKeyvault}" --suffix-storage-endpoint "${suffixStorage}" --profile "${profileVersion}"`, false);
                }
                catch (error) {
                    core.error(`Error while trying to register cloud "${environment}": "${error}"`);
                }
                console.log(`Done registering cloud: "${environment}"`);
            }
            yield executeAzCliCommand(`cloud set -n "${environment}"`, false);
            console.log(`Done setting cloud: "${environment}"`);
            let args = [
                "--service-principal",
                "-u", servicePrincipalId,
                "-p", servicePrincipalKey,
                "--tenant", tenantId
            ];
            yield executeAzCliCommand(`login`, true, {}, args);
            args = [
                "--subscription",
                subscriptionId
            ];
            yield executeAzCliCommand(`account set`, true, {}, args);
            isAzCLISuccess = true;
            console.log("Login successful.");
        }
        catch (error) {
            if (!isAzCLISuccess) {
                core.error("Az CLI Login failed. Please check the credentials. For more information refer https://aka.ms/create-secrets-for-GitHub-workflows");
            }
            core.setFailed(error);
        }
        finally {
            // Reset AZURE_HTTP_USER_AGENT
            core.exportVariable('AZURE_HTTP_USER_AGENT', prefix);
            core.exportVariable('AZUREPS_HOST_ENVIRONMENT', azPSHostEnv);
        }
    });
}
exports.main = main;
function executeAzCliCommand(command, silent, execOptions = {}, args = []) {
    return __awaiter(this, void 0, void 0, function* () {
        execOptions.silent = !!silent;
        try {
            yield exec.exec(`"${azPath}" ${command}`, args, execOptions);
        }
        catch (error) {
            throw new Error(error);
        }
    });
}
exports.executeAzCliCommand = executeAzCliCommand;
