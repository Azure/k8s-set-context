import * as core from "@actions/core";
import * as path from "path";
import * as fs from "fs";
import { Cluster, parseCluster } from "./types/cluster";
import { setContext, getKubeconfig } from "./utils";

/**
 * Sets the Kubernetes context based on supplied action inputs
 */
export async function run() {
  // get inputs
  const clusterType: Cluster | undefined = parseCluster(
    core.getInput("cluster-type", {
      required: true,
    })
  );
  const runnerTempDirectory: string = process.env["RUNNER_TEMP"];
  const kubeconfigPath: string = path.join(
    runnerTempDirectory,
    `kubeconfig_${Date.now()}`
  );
  const kubeconfig: string = await getKubeconfig(clusterType);

  // output kubeconfig
  core.debug(`Writing kubeconfig contents to ${kubeconfigPath}`);
  fs.writeFileSync(kubeconfigPath, kubeconfig);
  fs.chmodSync(kubeconfigPath, "600");
  core.debug("Setting KUBECONFIG environment variable");
  core.exportVariable("KUBECONFIG", kubeconfigPath);

  // set context
  setContext(kubeconfigPath);
}

// Run the application
run().catch(core.setFailed);
