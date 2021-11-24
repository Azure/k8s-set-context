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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createKubeconfig = exports.getDefaultKubeconfig = void 0;
const core = __importStar(require("@actions/core"));
const jsyaml = __importStar(require("js-yaml"));
const k8sSecret_1 = require("../types/k8sSecret");
const method_1 = require("../types/method");
const client_node_1 = require("@kubernetes/client-node");
/**
 * Gets the kubeconfig based on provided method for a default Kubernetes cluster
 * @returns The kubeconfig
 */
function getDefaultKubeconfig() {
    const method = method_1.parseMethod(core.getInput("Method", { required: true }));
    switch (method) {
        case method_1.Method.SERVICE_ACCOUNT: {
            const clusterUrl = core.getInput("k8s-url", { required: true });
            core.debug("Found clusterUrl. Creating kubeconfig using certificate and token");
            const k8sSecret = core.getInput("k8s-secret", {
                required: true,
            });
            const parsedK8sSecret = k8sSecret_1.parseK8sSecret(jsyaml.load(k8sSecret));
            const certAuth = parsedK8sSecret.data["ca.crt"];
            const token = Buffer.from(parsedK8sSecret.data.token, "base64").toString();
            return createKubeconfig(certAuth, token, clusterUrl);
        }
        case method_1.Method.SERVICE_PRINCIPAL: {
            core.warning("Service Principal method not supported for default cluster type");
        }
        case undefined: {
            core.warning("Defaulting to kubeconfig method");
        }
        default: {
            core.debug("Setting context using kubeconfig");
            return core.getInput("kubeconfig", { required: true });
        }
    }
}
exports.getDefaultKubeconfig = getDefaultKubeconfig;
/**
 * Creates a kubeconfig and returns the string representation
 * @param certAuth The certificate authentication of the cluster
 * @param token The user token
 * @param clusterUrl The server url of the cluster
 * @returns The kubeconfig as a string
 */
function createKubeconfig(certAuth, token, clusterUrl) {
    const kc = new client_node_1.KubeConfig();
    // TODO: check what defaults should be here
    // TODO: make these options
    kc.addCluster({ name: certAuth, server: clusterUrl, skipTLSVerify: false });
    kc.addUser({ name: "token", token: token });
    return kc.exportConfig();
}
exports.createKubeconfig = createKubeconfig;
