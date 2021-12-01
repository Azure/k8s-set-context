import * as core from "@actions/core";
import * as path from "path";
import * as fs from "fs";
import { Cluster, parseCluster } from "./types/cluster";
import { KubeConfig } from "@kubernetes/client-node";
import { getDefaultKubeconfig } from "./kubeconfigs/default";
import { getArcKubeconfig } from "./kubeconfigs/arc";

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

/**
 * Gets the kubeconfig based on Kubernetes cluster type
 * @param type The cluster type for the kubeconfig (defaults to generic)
 * @returns A promise of the kubeconfig
 */
export async function getKubeconfig(
  type: Cluster | undefined
): Promise<string> {
  switch (type) {
    case Cluster.ARC: {
      return await getArcKubeconfig();
    }
    case undefined: {
      core.warning("Cluster type not recognized. Defaulting to generic.");
    }
    default: {
      return getDefaultKubeconfig();
    }
  }
}

/**
 * Sets the context by writing to the kubeconfig
 * @param kubeconfigPath The path to the kubeconfig
 */
export function setContext(kubeconfigPath: string) {
  const context: string = core.getInput("context");
  if (!context) {
    core.debug("Can't set context because context is unspecified.");
    return;
  }

  // load current kubeconfig
  const kc = new KubeConfig();

  // update kubeconfig
  kc.loadFromFile(kubeconfigPath);
  kc.setCurrentContext(context);

  // write updated kubeconfig
  core.debug(`Writing updated kubeconfig contents to ${kubeconfigPath}`);
  fs.writeFileSync(kubeconfigPath, kc.exportConfig());
  fs.chmodSync(kubeconfigPath, "600");
}

// Run the application
run().catch(core.setFailed);
