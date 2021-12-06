"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseCluster = exports.Cluster = void 0;
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
exports.parseCluster = (str) => Cluster[Object.keys(Cluster).filter((k) => Cluster[k].toString().toLowerCase() === str.toLowerCase())[0]];
