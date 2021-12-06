import * as core from "@actions/core";
import * as io from "@actions/io";
import { Method, parseMethod } from "../types/method";
import { ExecOptions } from "@actions/exec/lib/interfaces";
import { exec } from "@actions/exec";

const AZ_TIMEOUT_SECONDS = 120;

/**
 * Gets the kubeconfig based on provided method for an Arc Kubernetes cluster
 * @returns The kubeconfig wrapped in a Promise
 */
export async function getArcKubeconfig(): Promise<string> {
  const resourceGroupName = core.getInput("resource-group", { required: true });
  const clusterName = core.getInput("cluster-name", { required: true });
  const azPath = await io.which("az", true);

  const method: Method | undefined = parseMethod(
    core.getInput("method", { required: true })
  );

  await runAzCliCommand(azPath, "extension add -n connectedk8s");

  let kubeconfig = "";
  const runAzCliOptions: ExecOptions = {
    listeners: {
      stdout: (b: Buffer) => (kubeconfig += b.toString()),
    },
  };
  switch (method) {
    case Method.SERVICE_ACCOUNT:
      const saToken = core.getInput("token", { required: true });

      await runAzCliCommand(
        azPath,
        `connectedk8s proxy -n ${clusterName} -g ${resourceGroupName} --token ${saToken} -f-`,
        runAzCliOptions
      );

      return kubeconfig;
    case Method.SERVICE_PRINCIPAL:
      await runAzCliCommand(
        azPath,
        `connectedk8s proxy -n ${clusterName} -g ${resourceGroupName} -f-`,
        runAzCliOptions
      );

      return kubeconfig;
    case undefined:
      core.warning("Defaulting to kubeconfig method");
    case Method.KUBECONFIG:
    default:
      throw Error("Kubeconfig method not supported for Arc cluster");
  }
}

/**
 * Executes an az cli command
 * @param azPath The path to the az tool
 * @param command The command that should be invoked
 * @param options Optional options for the command execution
 */
export async function runAzCliCommand(
  azPath: string,
  command: string,
  options: ExecOptions = {}
) {
  await exec(
    `timeout ${AZ_TIMEOUT_SECONDS}s ${azPath} ${command}`,
    [],
    options
  );
}
