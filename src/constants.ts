import * as util from "util";

export enum ClusterType {
  ARC = "arc",
  GENERIC = "generic",
}

export const parseClusterType = (str: string): ClusterType | undefined =>
  ClusterType[str.toLowerCase() as keyof typeof ClusterType];

export enum Method {
  KUBECONFIG = "kubeconfig",
  SERVICE_ACCOUNT = "service-account",
  SERVICE_PRINCIPAL = "service-principal",
}

export const parseMethod = (str: string): Method | undefined =>
  Method[str.toLowerCase() as keyof typeof Method];

export interface K8sSecret {
  data: {
    token: string;
    "ca.crt": string;
  };
}

const k8sSecretMissingFieldError = (field: string): Error =>
  Error(util.format("K8s secret yaml does not contain %s field", field));

export function parseK8sSecret(secret: any): K8sSecret {
  if (!secret) throw Error("K8s secret yaml is invalid");
  if (!secret.data) throw k8sSecretMissingFieldError("data");
  if (!secret.data.token) throw k8sSecretMissingFieldError("token");
  if (!secret.data["ca.crt"]) throw k8sSecretMissingFieldError("ca.crt");

  return secret as K8sSecret;
}

export function createKubeconfig(
  certAuth: string,
  token: string,
  clusterUrl: string
) {
  return {
    apiVersion: "v1",
    kind: "Config",
    clusters: [
      {
        cluster: {
          "certificate-authority-data": certAuth,
          server: clusterUrl,
        },
      },
    ],
    users: [
      {
        user: {
          token: token,
        },
      },
    ],
  };
}
