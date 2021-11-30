import * as actions from "@actions/exec";
import * as io from "@actions/io";
import { getRequiredInputError } from "../../tests/util";
import { getArcKubeconfig, runAzCliCommand } from "./arc";

describe("Arc kubeconfig", () => {
  test("it runs an az cli command", async () => {
    const path = "path";
    const command = "command";

    jest.spyOn(actions, "exec").mockImplementation(async () => 0);

    expect(await runAzCliCommand(path, command));
    expect(actions.exec).toBeCalledWith(`${path} ${command}`, [], {});
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
    const path = "path";

    beforeEach(() => {
      process.env["INPUT_RESOURCE-GROUP"] = group;
      process.env["INPUT_CLUSTER-NAME"] = name;

      jest.spyOn(io, "which").mockImplementation(async () => path);
      jest
        .spyOn(actions, "exec")
        .mockImplementation(async (commandLine, args, options) => 0);
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

      it("gets the kubeconfig with service account method", async () => {
        const token = "token";
        process.env["INPUT_TOKEN"] = token;

        expect(await getArcKubeconfig()).toBe("");

        expect(actions.exec).toHaveBeenNthCalledWith(
          1,
          `${path} account show`,
          [],
          {}
        );
        expect(actions.exec).toHaveBeenNthCalledWith(
          2,
          `${path} extension remove -n connectedk8s`,
          [],
          {}
        );
        expect(actions.exec).toHaveBeenNthCalledWith(
          3,
          `${path} extension add -n connectedk8s`,
          [],
          {}
        );
        expect(actions.exec).toHaveBeenNthCalledWith(
          4,
          `${path} extension list`,
          [],
          {}
        );
        expect(actions.exec).toHaveBeenNthCalledWith(
          5,
          `${path} connectedk8s proxy -n ${name} -g ${group} --token ${token} -f`,
          [],
          expect.objectContaining({})
        );
      });
    });

    describe("service principal method", () => {
      beforeEach(() => {
        process.env["INPUT_METHOD"] = "service-principal";
      });

      it("gets the kubeconfig with service principal method", async () => {
        expect(await getArcKubeconfig()).toBe("");

        expect(actions.exec).toHaveBeenNthCalledWith(
          1,
          `${path} account show`,
          [],
          {}
        );
        expect(actions.exec).toHaveBeenNthCalledWith(
          2,
          `${path} extension remove -n connectedk8s`,
          [],
          {}
        );
        expect(actions.exec).toHaveBeenNthCalledWith(
          3,
          `${path} extension add -n connectedk8s`,
          [],
          {}
        );
        expect(actions.exec).toHaveBeenNthCalledWith(
          4,
          `${path} extension list`,
          [],
          {}
        );
        expect(actions.exec).toHaveBeenNthCalledWith(
          5,
          `${path} connectedk8s proxy -n ${name} -g ${group} -f`,
          [],
          expect.objectContaining({})
        );
      });
    });
  });
});
