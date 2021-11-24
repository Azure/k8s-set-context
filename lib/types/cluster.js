"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseClusterType = exports.Cluster = void 0;
var Cluster;
(function (Cluster) {
    Cluster["ARC"] = "arc";
    Cluster["GENERIC"] = "generic";
})(Cluster = exports.Cluster || (exports.Cluster = {}));
/**
 * Converts a string to the Cluster enum
 * @param str The cluster type (case insensitive)
 * @returns The Cluster enum or undefined if it can't be parsed
 */
exports.parseClusterType = (str) => Cluster[str.toLowerCase()];
