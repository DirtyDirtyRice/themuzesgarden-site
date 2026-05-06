import { getMemoryStats, getTransitionMemory } from "../../engine/intelligence/transitionMemory";

export function readMemorySnapshot() {
  const stats = getMemoryStats();
  const all = getTransitionMemory();

  return {
    memTotal: stats.totalTransitions,
    memAvgDuration: stats.avgDuration,
    memRecent: all.slice(-10).reverse(),
  };
}