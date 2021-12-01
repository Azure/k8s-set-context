import { getRequiredInputError } from "../tests/util";
import { setContext } from "./run";
import fs from "fs";

describe("Run", () => {
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
