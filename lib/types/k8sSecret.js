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
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseK8sSecret = void 0;
const util = __importStar(require("util"));
/**
 * Throws an error if an object does not have all required fields to be a K8sSecret
 * @param secret
 * @returns A type guarded K8sSecret
 */
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
const k8sSecretMissingFieldError = (field) => Error(util.format("K8s secret yaml does not contain %s field", field));
