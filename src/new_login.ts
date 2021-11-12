import * as core from "@actions/core";
import * as path from "path";
import * as fs from "fs";
import * as io from "@actions/io";
import * as toolCache from "@actions/tool-cache";
import * as os from "os";
import { ToolRunner } from "@actions/exec/lib/toolrunner";
import * as jsyaml from "js-yaml";
import * as util from "util";
import { ClusterType, parseClusterType } from "./constants";

async function run() {
  // get inputs
  const clusterType: ClusterType | undefined = parseClusterType(
    core.getInput("cluster-type", {
      required: true,
    })
  );
  const kubeconfig: string = getKubeconfig(clusterType);
  const runnerTempDirectory = process.env["RUNNER_TEMP"]; // Using process.env until the core libs are updated
  const kubeconfigPath = path.join(
    runnerTempDirectory,
    `kubeconfig_${Date.now()}`
  );

  // output kubeconfig
  core.debug(`Writing kubeconfig contents to ${kubeconfigPath}`);
  fs.writeFileSync(kubeconfigPath, kubeconfig);
  fs.chmodSync(kubeconfigPath, "600");
  core.debug("Setting KUBECONFIG environment variable");
  core.exportVariable("KUBECONFIG", kubeconfigPath);

  // set context
}

function getKubeconfig(type: ClusterType): string {
  switch (type) {
    case ClusterType.ARC: {
      return "ARC";
    }
    case undefined: {
      core.warning("Cluster type not recognized. Defaulting to generic.");
    }
    default: {
      return "GENERIC";
    }
  }
}

// run the application
run().catch(core.setFailed);
