import { getRequiredInputError } from "../tests/util";
import { run } from "./run";
import fs from "fs";
import * as utils from "./utils";

describe("Run", () => {
  it("throws error without cluster type", async () => {
    await expect(run()).rejects.toThrow(getRequiredInputError("cluster-type"));
  });

  it("writes kubeconfig and sets context", async () => {
    const kubeconfig = "kubeconfig";

    process.env["INPUT_CLUSTER-TYPE"] = "default";
    process.env["RUNNER_TEMP"] = "/sample/path";

    jest
      .spyOn(utils, "getKubeconfig")
      .mockImplementation(async () => kubeconfig);
    jest.spyOn(fs, "writeFileSync").mockImplementation(() => {});
    jest.spyOn(fs, "chmodSync").mockImplementation(() => {});
    jest.spyOn(utils, "setContext").mockImplementation(() => {});

    expect(await run());
    expect(utils.getKubeconfig).toHaveBeenCalled();
    expect(fs.writeFileSync).toHaveBeenCalled();
    expect(fs.chmodSync).toHaveBeenCalled();
    expect(utils.setContext).toHaveBeenCalled();
  });
});
