import * as core from "@actions/core";
import * as path from "path";
import * as fs from "fs";
import * as io from "@actions/io";
import * as toolCache from "@actions/tool-cache";
import * as os from "os";
import { ToolRunner } from "@actions/exec/lib/toolrunner";
import * as jsyaml from "js-yaml";
import * as util from "util";
import {
  ClusterType,
  Method,
  parseClusterType,
  parseMethod,
  K8sSecret,
  parseK8sSecret,
  createKubeconfig,
} from "./constants";

async function run() {
  // get inputs
  const clusterType: ClusterType | undefined = parseClusterType(
    core.getInput("cluster-type", {
      required: true,
    })
  );
  const kubeconfig: string = getKubeconfig(clusterType);
  const runnerTempDirectory: string = process.env["RUNNER_TEMP"]; // Using process.env until the core libs are updated
  const kubeconfigPath: string = path.join(
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
  setContext(kubeconfigPath);
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
      return getDefaultKubeconfig();
    }
  }
}

function getDefaultKubeconfig(): string {
  const method: Method | undefined = parseMethod(
    core.getInput("Method", { required: true })
  );

  switch (method) {
    case undefined: {
      core.warning("Method not recognized. Defaulting to kubeconfig");
    }
    case Method.KUBECONFIG: {
      core.debug("Setting context using kubeconfig");
      return core.getInput("kubeconfig", { required: true });
    }
    case Method.SERVICE_ACCOUNT: {
      const clusterUrl = core.getInput("k8s-url", { required: true });
      core.debug(
        "Found clusterUrl. Creating kubeconfig using certificate and token"
      );

      const k8sSecret: string = core.getInput("k8s-secret", {
        required: true,
      });
      const parsedK8sSecret: K8sSecret = parseK8sSecret(
        jsyaml.safeLoad(k8sSecret)
      );
      const certAuth: string = parsedK8sSecret.data["ca.crt"];
      const token: string = Buffer.from(
        parsedK8sSecret.data.token,
        "base64"
      ).toString();

      return JSON.stringify(createKubeconfig(certAuth, token, clusterUrl));
    }
  }
}

function setContext(kubeconfigPath: string) {
  const context: string = core.getInput("context");
}

// run the application
run().catch(core.setFailed);
