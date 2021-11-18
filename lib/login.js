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
const io = __importStar(require("@actions/io"));
const jsyaml = __importStar(require("js-yaml"));
const constants_1 = require("./constants");
const client_node_1 = require("@kubernetes/client-node");
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        // get inputs
        const clusterType = constants_1.parseClusterType(core.getInput("cluster-type", {
            required: true,
        }));
        const runnerTempDirectory = process.env["RUNNER_TEMP"]; // Using process.env until the core libs are updated
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
function getKubeconfig(type) {
    return __awaiter(this, void 0, void 0, function* () {
        switch (type) {
            case constants_1.ClusterType.ARC: {
                return yield getArcKubeconfig();
            }
            case undefined: {
                core.warning("Cluster type not recognized. Defaulting to generic.");
            }
            default: {
                return getDefaultKubeconfig();
            }
        }
    });
}
function getDefaultKubeconfig() {
    const method = constants_1.parseMethod(core.getInput("Method", { required: true }));
    switch (method) {
        case constants_1.Method.SERVICE_ACCOUNT: {
            const clusterUrl = core.getInput("k8s-url", { required: true });
            core.debug("Found clusterUrl. Creating kubeconfig using certificate and token");
            const k8sSecret = core.getInput("k8s-secret", {
                required: true,
            });
            const parsedK8sSecret = constants_1.parseK8sSecret(jsyaml.load(k8sSecret));
            const certAuth = parsedK8sSecret.data["ca.crt"];
            const token = Buffer.from(parsedK8sSecret.data.token, "base64").toString();
            return constants_1.createKubeconfig(certAuth, token, clusterUrl);
        }
        case constants_1.Method.SERVICE_PRINCIPAL: {
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
function getArcKubeconfig() {
    return __awaiter(this, void 0, void 0, function* () {
        const resourceGroupName = core.getInput("resource-group", { required: true });
        const clusterName = core.getInput("cluster-name", { required: true });
        const azPath = yield io.which("az", true);
        yield constants_1.runAzCliCommand(azPath, "account show");
        try {
            yield constants_1.runAzCliCommand(azPath, "extension remove -n connectedk8s");
        }
        catch (_a) {
            // expected when it is the first time running the action
            core.debug("Failed to remove connectedk8s");
        }
        yield constants_1.runAzCliCommand(azPath, "extension add -n konnectedk8s");
        yield constants_1.runAzCliCommand(azPath, "extension list");
        const method = constants_1.parseMethod(core.getInput("Method", { required: true }));
        let kubeconfig = "";
        const runAzCliOptions = {
            listeners: {
                stdout: (b) => (kubeconfig += b.toString()),
            },
        };
        switch (method) {
            case constants_1.Method.SERVICE_ACCOUNT:
                const saToken = core.getInput("token", { required: true });
                yield constants_1.runAzCliCommand(azPath, `connectedk8s proxy -n ${clusterName} -g ${resourceGroupName} --token ${saToken} -f`, runAzCliOptions);
            case constants_1.Method.SERVICE_PRINCIPAL:
                yield constants_1.runAzCliCommand(azPath, `connectedk8s proxy -n ${clusterName} -g ${resourceGroupName} -f`, runAzCliOptions);
            case undefined:
                core.warning("Defaulting to kubeconfig method");
            case constants_1.Method.KUBECONFIG:
            default:
                throw Error("Kubeconfig method not supported for Arc cluste");
        }
    });
}
// run the application
run().catch(core.setFailed);
