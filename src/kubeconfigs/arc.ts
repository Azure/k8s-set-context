import * as core from "@actions/core";
import * as io from "@actions/io";
import { Method, parseMethod } from "../types/method";
import { ExecOptions } from "@actions/exec/lib/interfaces";
import { exec } from "@actions/exec";
import { spawn } from "child_process";
import process from "process";

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

  switch (method) {
    case Method.SERVICE_ACCOUNT:
      const saToken = core.getInput("token", { required: true });
      return await runAzCliCommandBlocking(
        azPath,
        `connectedk8s proxy -n ${clusterName} -g ${resourceGroupName} --token ${saToken} -f-`
      );
    case Method.SERVICE_PRINCIPAL:
      return await runAzCliCommandBlocking(
        azPath,
        `connectedk8s proxy -n ${clusterName} -g ${resourceGroupName} -f-`
      );
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

/**
 * Executes an az cli command with a timeout then returns stdout
 * @param azPath The path to the az tool
 * @param command The command that should be invoked
 * @returns Stdout of the command execution
 */
export async function runAzCliCommandBlocking(
  azPath: string,
  command: string
): Promise<string> {
  const process = spawn(`${azPath} ${command}`, {
    detached: true,
  });

  let output = "";
  process.stdout.on("data", (data) => {
    output += data.toString();
  });

  process.unref();
  await sleep(AZ_TIMEOUT_SECONDS);
  return output;
}

const sleep = (seconds: number) =>
  new Promise((resolve) => setTimeout(resolve, seconds * 1000));
