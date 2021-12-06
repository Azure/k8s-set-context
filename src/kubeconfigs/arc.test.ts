import * as actions from "@actions/exec";
import * as io from "@actions/io";
import { getRequiredInputError } from "../../tests/util";
import { getArcKubeconfig, runAzCliCommand } from "./arc";

describe("Arc kubeconfig", () => {
  test("it runs an az cli command", async () => {
    const path = "path";
    const args = ["args"];

    jest.spyOn(actions, "exec").mockImplementation(async () => 0);

    expect(await runAzCliCommand(path, args));
    expect(actions.exec).toBeCalledWith(path, args, {});
  });

  test("it throws error without resource group", async () => {
    await expect(getArcKubeconfig()).rejects.toThrow(
      getRequiredInputError("resource-group")
    );
  });

  test("it throws error without cluster name", async () => {
    process.env["INPUT_RESOURCE-GROUP"] = "group";
    await expect(getArcKubeconfig()).rejects.toThrow(
      getRequiredInputError("cluster-name")
    );
  });

  describe("runs az cli commands", () => {
    const group = "group";
    const name = "name";

    beforeEach(() => {
      process.env["INPUT_RESOURCE-GROUP"] = group;
      process.env["INPUT_CLUSTER-NAME"] = name;
    });

    it("throws an error without method", async () => {
      await expect(getArcKubeconfig()).rejects.toThrow(
        getRequiredInputError("method")
      );
    });

    describe("service account method", () => {
      beforeEach(() => {
        process.env["INPUT_METHOD"] = "service-account";
      });

      it("throws an error without token", async () => {
        await expect(getArcKubeconfig()).rejects.toThrow(
          getRequiredInputError("token")
        );
      });
    });
  });
});
