export enum ClusterType {
  ARC = "arc",
  GENERIC = "generic",
}

export function parseClusterType(str: string): ClusterType | undefined {
  return ClusterType[str as keyof typeof ClusterType];
}
