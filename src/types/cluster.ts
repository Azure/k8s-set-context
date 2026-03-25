export enum Cluster {
   ARC = 'arc',
   GENERIC = 'generic'
}

/**
 * Converts a string to the Cluster enum
 * @param str The cluster type (case insensitive)
 * @returns The Cluster enum or undefined if it can't be parsed
 */
export const parseCluster = (str: string): Cluster | undefined => {
   const key = Object.keys(Cluster).find(
      (k) =>
         Cluster[k as keyof typeof Cluster].toLowerCase() === str.toLowerCase()
   ) as keyof typeof Cluster | undefined
   return key !== undefined ? Cluster[key] : undefined
}
