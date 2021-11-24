"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cluster_1 = require("./cluster");
describe("Cluster type", () => {
    test("it has ARC and GENERIC values", () => {
        const vals = Object.values(cluster_1.Cluster);
        expect(vals.includes("arc")).toBe(true);
        expect(vals.includes("generic")).toBe(true);
    });
    test("it can parse valid values from a string", () => {
        expect(cluster_1.parseCluster("arc")).toBe(cluster_1.Cluster.ARC);
        expect(cluster_1.parseCluster("Arc")).toBe(cluster_1.Cluster.ARC);
        expect(cluster_1.parseCluster("ARC")).toBe(cluster_1.Cluster.ARC);
        expect(cluster_1.parseCluster("generic")).toBe(cluster_1.Cluster.GENERIC);
        expect(cluster_1.parseCluster("Generic")).toBe(cluster_1.Cluster.GENERIC);
        expect(cluster_1.parseCluster("GENERIC")).toBe(cluster_1.Cluster.GENERIC);
    });
    test("it will return undefined if it can't parse values from a string", () => {
        expect(cluster_1.parseCluster("invalid")).toBe(undefined);
        expect(cluster_1.parseCluster("unsupportedType")).toBe(undefined);
    });
});
