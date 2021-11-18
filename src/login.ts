import * as core from "@actions/core";
import * as path from "path";
import * as fs from "fs";
import * as io from "@actions/io";
import * as jsyaml from "js-yaml";
import {
  ClusterType,
  Method,
  parseClusterType,
  parseMethod,
  K8sSecret,
  parseK8sSecret,
  createKubeconfig,
  runAzCliCommand,
} from "./constants";
import { KubeConfig } from "@kubernetes/client-node";
import { ExecOptions } from "@actions/exec/lib/interfaces";

async function run() {
  // get inputs
  const clusterType: ClusterType | undefined = parseClusterType(
    core.getInput("cluster-type", {
      required: true,
    })
  );
  const runnerTempDirectory: string = process.env["RUNNER_TEMP"]; // Using process.env until the core libs are updated
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

async function getKubeconfig(type: ClusterType): Promise<string> {
  switch (type) {
    case ClusterType.ARC: {
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

function getDefaultKubeconfig(): string {
  const method: Method | undefined = parseMethod(
    core.getInput("Method", { required: true })
  );

  switch (method) {
    case Method.SERVICE_ACCOUNT: {
      const clusterUrl = core.getInput("k8s-url", { required: true });
      core.debug(
        "Found clusterUrl. Creating kubeconfig using certificate and token"
      );

      const k8sSecret: string = core.getInput("k8s-secret", {
        required: true,
      });
      const parsedK8sSecret: K8sSecret = parseK8sSecret(jsyaml.load(k8sSecret));
      const certAuth: string = parsedK8sSecret.data["ca.crt"];
      const token: string = Buffer.from(
        parsedK8sSecret.data.token,
        "base64"
      ).toString();

      return createKubeconfig(certAuth, token, clusterUrl);
    }
    case Method.SERVICE_PRINCIPAL: {
      core.warning(
        "Service Principal method not supported for default cluster type"
      );
    }
    case undefined: {
      core.warning("Defaulting to kubeconfig method");
    }
    default: {
      core.debug("Setting context using kubeconfig");
      return core.getInput("kubeconfig", { required: true });
    }
  }
}

function setContext(kubeconfigPath: string) {
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

async function getArcKubeconfig(): Promise<string> {
  const resourceGroupName = core.getInput("resource-group", { required: true });
  const clusterName = core.getInput("cluster-name", { required: true });
  const azPath = await io.which("az", true);

  await runAzCliCommand(azPath, "account show");

  try {
    await runAzCliCommand(azPath, "extension remove -n connectedk8s");
  } catch {
    // expected when it is the first time running the action
    core.debug("Failed to remove connectedk8s");
  }

  await runAzCliCommand(azPath, "extension add -n konnectedk8s");
  await runAzCliCommand(azPath, "extension list");

  const method: Method | undefined = parseMethod(
    core.getInput("Method", { required: true })
  );

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
        `connectedk8s proxy -n ${clusterName} -g ${resourceGroupName} --token ${saToken} -f`,
        runAzCliOptions
      );
    case Method.SERVICE_PRINCIPAL:
      await runAzCliCommand(
        azPath,
        `connectedk8s proxy -n ${clusterName} -g ${resourceGroupName} -f`,
        runAzCliOptions
      );
    case undefined:
      core.warning("Defaulting to kubeconfig method");
    case Method.KUBECONFIG:
    default:
      throw Error("Kubeconfig method not supported for Arc cluste");
  }
}

// run the application
run().catch(core.setFailed);
