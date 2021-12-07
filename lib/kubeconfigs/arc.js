"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.getArcKubeconfig = exports.KUBECONFIG_LOCATION = void 0;
const core = __importStar(require("@actions/core"));
const io = __importStar(require("@actions/io"));
const method_1 = require("../types/method");
const path = __importStar(require("path"));
const azCommands_1 = require("./azCommands");
const RUNNER_TEMP = process.env["RUNNER_TEMP"] || "";
exports.KUBECONFIG_LOCATION = path.join(RUNNER_TEMP, `arc_kubeconfig_${Date.now()}`);
/**
 * Gets the kubeconfig based on provided method for an Arc Kubernetes cluster
 * @returns The kubeconfig wrapped in a Promise
 */
function getArcKubeconfig() {
    return __awaiter(this, void 0, void 0, function* () {
        const resourceGroupName = core.getInput("resource-group", { required: true });
        const clusterName = core.getInput("cluster-name", { required: true });
        const azPath = yield io.which("az", true);
        const method = method_1.parseMethod(core.getInput("method", { required: true }));
        yield azCommands_1.runAzCliCommand(azPath, ["extension", "add", "-n", "connectedk8s"]);
        switch (method) {
            case method_1.Method.SERVICE_ACCOUNT:
                const saToken = core.getInput("token", { required: true });
                return yield azCommands_1.runAzKubeconfigCommandBlocking(azPath, [
                    "connectedk8s",
                    "proxy",
                    "-n",
                    clusterName,
                    "-g",
                    resourceGroupName,
                    "--token",
                    saToken,
                    "-f",
                    exports.KUBECONFIG_LOCATION,
                ], exports.KUBECONFIG_LOCATION);
            case method_1.Method.SERVICE_PRINCIPAL:
                return yield azCommands_1.runAzKubeconfigCommandBlocking(azPath, [
                    "connectedk8s",
                    "proxy",
                    "-n",
                    clusterName,
                    "-g",
                    resourceGroupName,
                    "-f",
                    exports.KUBECONFIG_LOCATION,
                ], exports.KUBECONFIG_LOCATION);
            case undefined:
                core.warning("Defaulting to kubeconfig method");
            case method_1.Method.KUBECONFIG:
            default:
                throw Error("Kubeconfig method not supported for Arc cluster");
        }
    });
}
exports.getArcKubeconfig = getArcKubeconfig;
