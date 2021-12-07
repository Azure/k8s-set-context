import * as core from "@actions/core";
import * as io from "@actions/io";
import { Method, parseMethod } from "../types/method";
import * as path from "path";
import { runAzCliCommand, runAzKubeconfigCommandBlocking } from "./azCommands";

const RUNNER_TEMP: string = process.env["RUNNER_TEMP"] || "";
export const KUBECONFIG_LOCATION: string = path.join(
  RUNNER_TEMP,
  `arc_kubeconfig_${Date.now()}`
);

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

  await runAzCliCommand(azPath, ["extension", "add", "-n", "connectedk8s"]);

  switch (method) {
    case Method.SERVICE_ACCOUNT:
      const saToken = core.getInput("token", { required: true });
      return await runAzKubeconfigCommandBlocking(
        azPath,
        [
          "connectedk8s",
          "proxy",
          "-n",
          clusterName,
          "-g",
          resourceGroupName,
          "--token",
          saToken,
          "-f",
          KUBECONFIG_LOCATION,
        ],
        KUBECONFIG_LOCATION
      );
    case Method.SERVICE_PRINCIPAL:
      return await runAzKubeconfigCommandBlocking(
        azPath,
        [
          "connectedk8s",
          "proxy",
          "-n",
          clusterName,
          "-g",
          resourceGroupName,
          "-f",
          KUBECONFIG_LOCATION,
        ],
        KUBECONFIG_LOCATION
      );
    case undefined:
      core.warning("Defaulting to kubeconfig method");
    case Method.KUBECONFIG:
    default:
      throw Error("Kubeconfig method not supported for Arc cluster");
  }
}
