export enum Method {
   KUBECONFIG = 'kubeconfig',
   SERVICE_ACCOUNT = 'service-account',
   SERVICE_PRINCIPAL = 'service-principal'
}

/**
 * Converts a string to the Method enum
 * @param str The method (case insensitive)
 * @returns The Method enum or undefined if it can't be parsed
 */
export const parseMethod = (str: string): Method | undefined =>
   Method[
      Object.keys(Method).filter(
         (k) => Method[k].toString().toLowerCase() === str.toLowerCase()
      )[0] as keyof typeof Method
   ]
