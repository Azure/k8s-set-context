export enum Cluster {
   ARC = 'arc',
   GENERIC = 'generic',
   AKS = 'aks'
}

/**
 * Converts a string to the Cluster enum
 * @param str The cluster type (case insensitive)
 * @returns The Cluster enum or undefined if it can't be parsed
 */
export const parseCluster = (str: string): Cluster | undefined =>
   Cluster[
      Object.keys(Cluster).filter(
         (k) => Cluster[k].toString().toLowerCase() === str.toLowerCase()
      )[0] as keyof typeof Cluster
   ]
