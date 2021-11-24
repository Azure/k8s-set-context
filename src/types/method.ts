export enum Method {
  KUBECONFIG = "kubeconfig",
  SERVICE_ACCOUNT = "service-account",
  SERVICE_PRINCIPAL = "service-principal",
}

/**
 * Converts a string to the Method enum
 * @param str The method (case insensitive)
 * @returns The Method enum or undefined if it can't be parsed
 */
export const parseMethod = (str: string): Method | undefined =>
  Method[str.toLowerCase() as keyof typeof Method];
