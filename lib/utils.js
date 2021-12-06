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
exports.setContext = exports.getKubeconfig = void 0;
const core = __importStar(require("@actions/core"));
const client_node_1 = require("@kubernetes/client-node");
const default_1 = require("./kubeconfigs/default");
const arc_1 = require("./kubeconfigs/arc");
const cluster_1 = require("./types/cluster");
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
exports.getKubeconfig = getKubeconfig;
/**
 * Sets the context by updating the kubeconfig
 * @param kubeconfig The kubeconfig
 * @returns Updated kubeconfig with the context
 */
function setContext(kubeconfig) {
    const context = core.getInput("context");
    if (!context) {
        core.debug("Can't set context because context is unspecified.");
        return kubeconfig;
    }
    // load current kubeconfig
    const kc = new client_node_1.KubeConfig();
    kc.loadFromString(kubeconfig);
    // update kubeconfig
    kc.setCurrentContext(context);
    return kc.exportConfig();
}
exports.setContext = setContext;
