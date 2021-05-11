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
const path = require("path");
const child_process_1 = require("child_process");
const fs = require("fs");
const io = require("@actions/io");
const exec = require("@actions/exec");
var azPath;
const kubeconfig_timeout = 120; //timeout in seconds
function getArcKubeconfig() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let method = core.getInput('method');
            if (method != 'service-account' && method != 'service-principal') {
                throw Error("Supported methods for arc cluster are 'service-account' and 'service-principal'.");
            }
            let resourceGroupName = core.getInput('resource-group');
            let clusterName = core.getInput('cluster-name');
            if (!resourceGroupName) {
                throw Error("'resourceGroupName' is not passed for arc cluster.");
            }
            if (!clusterName) {
                throw Error("'clusterName' is not passed for arc cluster.");
            }
            azPath = yield io.which("az", true);
            yield executeAzCliCommand(`account show`, false);
            try {
                yield executeAzCliCommand(`extension remove -n connectedk8s`, false);
            }
            catch (_a) {
                //ignore if this causes an error
            }
            yield executeAzCliCommand(`extension add -n connectedk8s`, false);
            yield executeAzCliCommand(`extension list`, false);
            const runnerTempDirectory = process.env['RUNNER_TEMP']; // Using process.env until the core libs are updated
            const kubeconfigPath = path.join(runnerTempDirectory, `kubeconfig_${Date.now()}`);
            if (method == 'service-account') {
                let saToken = core.getInput('token');
                if (!saToken) {
                    throw Error("'saToken' is not passed for 'service-account' method.");
                }
                console.log("using 'service-account' method for authenticating to arc cluster.");
                const proc = child_process_1.spawn(azPath, ['connectedk8s', 'proxy', '-n', clusterName, '-g', resourceGroupName, '-f', kubeconfigPath, '--token', saToken], {
                    detached: true,
                    stdio: 'ignore'
                });
                proc.unref();
            }
            else {
                console.log("using 'service-principal' method for authenticating to arc cluster.");
                const proc = child_process_1.spawn(azPath, ['connectedk8s', 'proxy', '-n', clusterName, '-g', resourceGroupName, '-f', kubeconfigPath], {
                    detached: true,
                    stdio: 'ignore'
                });
                proc.unref();
            }
            console.log(`Waiting for ${kubeconfig_timeout} seconds for kubeconfig to be merged....`);
            yield sleep(kubeconfig_timeout * 1000); //sleeping for 2 minutes to allow kubeconfig to be merged
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
