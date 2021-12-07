import * as fs from "fs";
import { ExecOptions } from "@actions/exec/lib/interfaces";
import { exec } from "@actions/exec";
import { spawn } from "child_process";

const AZ_TIMEOUT_SECONDS: number = 120;

/**
 * Executes an az cli command
 * @param azPath The path to the az tool
 * @param args The arguments to be invoked
 * @param options Optional options for the command execution
 */
export async function runAzCliCommand(
  azPath: string,
  args: string[],
  options: ExecOptions = {}
) {
  await exec(azPath, args, options);
}
/**
 * Executes an az cli command that will set the kubeconfig
 * @param azPath The path to the az tool
 * @param args The arguments to be be invoked
 * @param kubeconfigPath The path to the kubeconfig that is updated by the command
 * @returns The contents of the kubeconfig
 */
export async function runAzKubeconfigCommandBlocking(
  azPath: string,
  args: string[],
  kubeconfigPath: string
): Promise<string> {
  const proc = spawn(azPath, args, {
    detached: true,
    stdio: "ignore",
  });
  proc.unref();

  await sleep(AZ_TIMEOUT_SECONDS);
  return fs.readFileSync(kubeconfigPath).toString();
}

const sleep = (seconds: number) =>
  new Promise((resolve) => setTimeout(resolve, seconds * 1000));
