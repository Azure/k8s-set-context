export enum Cluster {
  ARC = "arc",
  GENERIC = "generic",
}

/**
 * Converts a string to the Cluster enum
 * @param str The cluster type (case insensitive)
 * @returns The Cluster enum or undefined if it can't be parsed
 */
export const parseClusterType = (str: string): Cluster | undefined =>
  Cluster[str.toLowerCase() as keyof typeof Cluster];
