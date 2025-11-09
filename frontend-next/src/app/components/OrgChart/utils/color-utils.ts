import { nodeColors } from "../constants";

export function hashToIndex(key: string, modulo: number): number {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % modulo;
}

export function getNodeColor(nodeId: string) {
  const index = hashToIndex(nodeId, nodeColors.length);
  return nodeColors[index];
}
