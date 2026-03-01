// engine/intelligence/transitionMemory.ts

/**
 * TRANSITION MEMORY
 *
 * Builder Mode Rule:
 * EXTEND — DO NOT RESTRUCTURE
 *
 * This module safely records completed transitions
 * during the current live session.
 *
 * No persistence.
 * No side effects.
 * Pure memory capture.
 */

export type TransitionMemoryRecord = {
  id: string;

  fromTrack?: string;
  toTrack?: string;

  startTick: number;
  endTick: number;
  durationTicks: number;

  barPosition?: string;
  successScore?: number;

  timestamp: number;
};

const memory: TransitionMemoryRecord[] = [];

/**
 * Record a completed transition
 */
export function recordTransition(
  data: Omit<TransitionMemoryRecord, "timestamp" | "durationTicks">
) {
  const record: TransitionMemoryRecord = {
    ...data,
    durationTicks: data.endTick - data.startTick,
    timestamp: Date.now(),
  };

  memory.push(record);

  // Builder visibility
  console.log("[TransitionMemory] recorded", record);
}

/**
 * Read all transition memory
 */
export function getTransitionMemory(): TransitionMemoryRecord[] {
  return [...memory];
}

/**
 * Get last transition
 */
export function getLastTransition(): TransitionMemoryRecord | null {
  if (memory.length === 0) return null;
  return memory[memory.length - 1];
}

/**
 * Clear session memory
 */
export function clearTransitionMemory() {
  memory.length = 0;
  console.log("[TransitionMemory] cleared");
}

/**
 * Session stats (future intelligence hook)
 */
export function getMemoryStats() {
  return {
    totalTransitions: memory.length,
    avgDuration:
      memory.length === 0
        ? 0
        : memory.reduce((a, b) => a + b.durationTicks, 0) / memory.length,
  };
}

/**
 * Find the most recent record for an id (safe helper)
 */
export function findTransitionRecord(id: string): TransitionMemoryRecord | null {
  for (let i = memory.length - 1; i >= 0; i--) {
    if (memory[i]?.id === id) return memory[i];
  }
  return null;
}

/**
 * Update the most recent record for an id (safe helper)
 * Returns true if updated, false if not found.
 */
export function updateTransitionRecord(
  id: string,
  patch: Partial<Omit<TransitionMemoryRecord, "id">>
): boolean {
  for (let i = memory.length - 1; i >= 0; i--) {
    const rec = memory[i];
    if (!rec) continue;
    if (rec.id !== id) continue;

    memory[i] = { ...rec, ...patch };
    console.log("[TransitionMemory] updated", memory[i]);
    return true;
  }
  return false;
}