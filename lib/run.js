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
exports.run = void 0;
const core = __importStar(require("@actions/core"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const cluster_1 = require("./types/cluster");
const utils_1 = require("./utils");
/**
 * Sets the Kubernetes context based on supplied action inputs
 */
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        // get inputs
        const clusterType = cluster_1.parseCluster(core.getInput("cluster-type", {
            required: true,
        }));
        const runnerTempDirectory = process.env["RUNNER_TEMP"];
        const kubeconfigPath = path.join(runnerTempDirectory, `kubeconfig_${Date.now()}`);
        // get kubeconfig and update context
        const kubeconfig = yield utils_1.getKubeconfig(clusterType);
        const kubeconfigWithContext = utils_1.setContext(kubeconfig);
        // output kubeconfig
        core.debug(`Writing kubeconfig contents to ${kubeconfigPath}`);
        fs.writeFileSync(kubeconfigPath, kubeconfigWithContext);
        fs.chmodSync(kubeconfigPath, "600");
        core.debug("Setting KUBECONFIG environment variable");
        core.exportVariable("KUBECONFIG", kubeconfigPath);
    });
}
exports.run = run;
// Run the application
run().catch(core.setFailed);
