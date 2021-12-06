import * as core from "@actions/core";
import * as io from "@actions/io";
import { Method, parseMethod } from "../types/method";
import { ExecOptions } from "@actions/exec/lib/interfaces";
import { exec } from "@actions/exec";

const AZ_CONNECTED_PROXY_TIMEOUT_SECONDS = 120;
const AZ_CONNECTED_PROXY_TIMEOUT_MS = AZ_CONNECTED_PROXY_TIMEOUT_SECONDS * 1000;

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

      runAzCliCommand(
        azPath,
        `connectedk8s proxy -n ${clusterName} -g ${resourceGroupName} --token ${saToken} -f-`,
        runAzCliOptions
      );
      await sleep(AZ_CONNECTED_PROXY_TIMEOUT_MS);
      await exec("^C"); //  kill the az connectedk8s proxy command so it doesn't block forever

      return kubeconfig;
    case Method.SERVICE_PRINCIPAL:
      runAzCliCommand(
        azPath,
        `connectedk8s proxy -n ${clusterName} -g ${resourceGroupName} -f-`,
        runAzCliOptions
      );
      await sleep(AZ_CONNECTED_PROXY_TIMEOUT_MS);
      await exec("^C"); // kill the az connectedk8s proxy command so it doesn't block forever

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
  await exec(`${azPath} ${command}`, [], options);
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
