import fs from "fs";
import * as arc from "./kubeconfigs/arc";
import * as def from "./kubeconfigs/default";
import { Cluster } from "./types/cluster";
import { getKubeconfig, setContext } from "./utils";

describe("Utils", () => {
  describe("get kubeconfig", () => {
    test("it gets arc kubeconfig when type is arc", async () => {
      const arcKubeconfig = "arckubeconfig";
      jest
        .spyOn(arc, "getArcKubeconfig")
        .mockImplementation(async () => arcKubeconfig);

      expect(await getKubeconfig(Cluster.ARC)).toBe(arcKubeconfig);
    });

    test("it defaults to default kubeconfig", async () => {
      const defaultKubeconfig = "arckubeconfig";
      jest
        .spyOn(def, "getDefaultKubeconfig")
        .mockImplementation(() => defaultKubeconfig);

      expect(await getKubeconfig(undefined)).toBe(defaultKubeconfig);
      expect(await getKubeconfig(Cluster.GENERIC)).toBe(defaultKubeconfig);
    });
  });

  describe("set context", () => {
    beforeEach(() => {
      jest.spyOn(fs, "writeFileSync").mockImplementation(() => {});
      jest.spyOn(fs, "chmodSync").mockImplementation(() => {});
    });

    test("it returns early without context", () => {
      expect(() => setContext("path")).not.toThrow();
      expect(fs.writeFileSync).not.toHaveBeenCalled();
      expect(fs.chmodSync).not.toHaveBeenCalled();
    });

    test("it writes the context to a path", () => {
      process.env["INPUT_CONTEXT"] = "context";
      expect(() => setContext("tests/sample-kubeconfig.yml")).not.toThrow();
      expect(fs.writeFileSync).toHaveBeenCalled();
      expect(fs.chmodSync).toHaveBeenCalled();
    });
  });
});
