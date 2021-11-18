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
exports.runAzCliCommand = exports.createKubeconfig = exports.parseK8sSecret = exports.parseMethod = exports.Method = exports.parseClusterType = exports.ClusterType = void 0;
const util = __importStar(require("util"));
const client_node_1 = require("@kubernetes/client-node");
const exec_1 = require("@actions/exec");
var ClusterType;
(function (ClusterType) {
    ClusterType["ARC"] = "arc";
    ClusterType["GENERIC"] = "generic";
})(ClusterType = exports.ClusterType || (exports.ClusterType = {}));
exports.parseClusterType = (str) => ClusterType[str.toLowerCase()];
var Method;
(function (Method) {
    Method["KUBECONFIG"] = "kubeconfig";
    Method["SERVICE_ACCOUNT"] = "service-account";
    Method["SERVICE_PRINCIPAL"] = "service-principal";
})(Method = exports.Method || (exports.Method = {}));
exports.parseMethod = (str) => Method[str.toLowerCase()];
const k8sSecretMissingFieldError = (field) => Error(util.format("K8s secret yaml does not contain %s field", field));
function parseK8sSecret(secret) {
    if (!secret)
        throw Error("K8s secret yaml is invalid");
    if (!secret.data)
        throw k8sSecretMissingFieldError("data");
    if (!secret.data.token)
        throw k8sSecretMissingFieldError("token");
    if (!secret.data["ca.crt"])
        throw k8sSecretMissingFieldError("ca.crt");
    return secret;
}
exports.parseK8sSecret = parseK8sSecret;
function createKubeconfig(certAuth, token, clusterUrl) {
    const kc = new client_node_1.KubeConfig();
    // TODO: check what defaults should be here
    // TODO: make these options
    kc.addCluster({ name: certAuth, server: clusterUrl, skipTLSVerify: false });
    kc.addUser({ name: "token", token: token });
    return kc.exportConfig();
}
exports.createKubeconfig = createKubeconfig;
function runAzCliCommand(azPath, command, options = {}, silent = false) {
    return __awaiter(this, void 0, void 0, function* () {
        options.silent = silent;
        yield exec_1.exec(`"${azPath}" ${command}`, [], options);
    });
}
exports.runAzCliCommand = runAzCliCommand;
