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
const core = __importStar(require("@actions/core"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const cluster_1 = require("./types/cluster");
const client_node_1 = require("@kubernetes/client-node");
const default_1 = require("./kubeconfigs/default");
const arc_1 = require("./kubeconfigs/arc");
/**
 * Sets the Kubernetes context based on supplied action inputs
 */
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        // get inputs
        const clusterType = cluster_1.parseClusterType(core.getInput("cluster-type", {
            required: true,
        }));
        const runnerTempDirectory = process.env["RUNNER_TEMP"];
        const kubeconfigPath = path.join(runnerTempDirectory, `kubeconfig_${Date.now()}`);
        const kubeconfig = yield getKubeconfig(clusterType);
        // output kubeconfig
        core.debug(`Writing kubeconfig contents to ${kubeconfigPath}`);
        fs.writeFileSync(kubeconfigPath, kubeconfig);
        fs.chmodSync(kubeconfigPath, "600");
        core.debug("Setting KUBECONFIG environment variable");
        core.exportVariable("KUBECONFIG", kubeconfigPath);
        // set context
        setContext(kubeconfigPath);
    });
}
/**
 * Gets the kubeconfig based on Kubernetes cluster type
 * @param type The cluster type for the kubeconfig (defaults to generic)
 * @returns A promise of the kubeconfig
 */
function getKubeconfig(type) {
    return __awaiter(this, void 0, void 0, function* () {
        switch (type) {
            case cluster_1.Cluster.ARC: {
                return yield arc_1.getArcKubeconfig();
            }
            case undefined: {
                core.warning("Cluster type not recognized. Defaulting to generic.");
            }
            default: {
                return default_1.getDefaultKubeconfig();
            }
        }
    });
}
/**
 * Sets the context by writing to the kubeconfig
 * @param kubeconfigPath The path to the kubeconfig
 */
function setContext(kubeconfigPath) {
    const context = core.getInput("context");
    if (!context) {
        core.debug("Can't set context because context is unspecified.");
        return;
    }
    // load current kubeconfig
    const kc = new client_node_1.KubeConfig();
    // update kubeconfig
    kc.loadFromFile(kubeconfigPath);
    kc.setCurrentContext(context);
    // write updated kubeconfig
    core.debug(`Writing updated kubeconfig contents to ${kubeconfigPath}`);
    fs.writeFileSync(kubeconfigPath, kc.exportConfig());
    fs.chmodSync(kubeconfigPath, "600");
}
// Run the application
run().catch(core.setFailed);
