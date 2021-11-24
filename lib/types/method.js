"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseMethod = exports.Method = void 0;
var Method;
(function (Method) {
    Method["KUBECONFIG"] = "kubeconfig";
    Method["SERVICE_ACCOUNT"] = "service-account";
    Method["SERVICE_PRINCIPAL"] = "service-principal";
})(Method = exports.Method || (exports.Method = {}));
/**
 * Converts a string to the Method enum
 * @param str The method (case insensitive)
 * @returns The Method enum or undefined if it can't be parsed
 */
exports.parseMethod = (str) => Method[str.toLowerCase()];
