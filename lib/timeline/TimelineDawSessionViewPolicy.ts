import type { TimelineDawTrackRegionLabel, TimelineDawTrackRegionLabels } from "./TimelineDawTrackRegionLabelPolicy";

export type TimelineDawSessionClipSlot = Pick<TimelineDawTrackRegionLabel, "id" | "laneId" | "name" | "startSeconds" | "endSeconds" | "color">;

export type TimelineDawSessionScene = {
  id: string;
  name: string;
  slots: TimelineDawSessionClipSlot[];
};

export type TimelineDawSessionLaunchQuantization = "immediate" | "beat" | "two-beats" | "bar";
export type TimelineDawSessionFollowAction = "stop" | "next" | "loop";
export type TimelineDawSessionNavigationAction = "previous" | "replay" | "next";

export function createTimelineDawSessionNavigationIndex(
  currentIndex: number,
  sceneCount: number,
  action: TimelineDawSessionNavigationAction,
): number | null {
  if (!Number.isInteger(currentIndex) || !Number.isInteger(sceneCount) || sceneCount < 1 || currentIndex < 0 || currentIndex >= sceneCount) return null;
  if (action === "replay") return currentIndex;
  if (action === "previous") return currentIndex > 0 ? currentIndex - 1 : null;
  return currentIndex + 1 < sceneCount ? currentIndex + 1 : null;
}

export function createTimelineDawSessionFollowIndex(
  currentIndex: number,
  sceneCount: number,
  action: TimelineDawSessionFollowAction,
): number | null {
  if (!Number.isInteger(currentIndex) || !Number.isInteger(sceneCount) || sceneCount < 1 || currentIndex < 0 || currentIndex >= sceneCount) return null;
  if (action === "loop") return currentIndex;
  if (action === "next") return currentIndex + 1 < sceneCount ? currentIndex + 1 : null;
  return null;
}

export function createTimelineDawSessionLaunchDelay(input: {
  playheadSeconds: number;
  bpm: number;
  quantization: TimelineDawSessionLaunchQuantization;
  beatsPerBar?: number;
}) {
  if (input.quantization === "immediate") return 0;
  if (!Number.isFinite(input.playheadSeconds) || input.playheadSeconds < 0) throw new Error("Session View playhead position is invalid.");
  if (!Number.isFinite(input.bpm) || input.bpm < 30 || input.bpm > 300) throw new Error("Session View BPM must be between 30 and 300.");
  const beatsPerBar = Math.min(12, Math.max(1, Math.floor(input.beatsPerBar ?? 4)));
  const quantumBeats = input.quantization === "beat" ? 1 : input.quantization === "two-beats" ? 2 : beatsPerBar;
  const beatSeconds = 60 / input.bpm;
  const quantumSeconds = beatSeconds * quantumBeats;
  const remainder = input.playheadSeconds % quantumSeconds;
  if (remainder < 1e-6 || quantumSeconds - remainder < 1e-6) return 0;
  return Math.ceil((quantumSeconds - remainder) * 1000);
}

function sceneKey(name: string) {
  return name.trim().toLocaleLowerCase();
}

export function createTimelineDawSessionScenes(
  labels: TimelineDawTrackRegionLabels,
  laneIds: string[],
): TimelineDawSessionScene[] {
  const validLaneIds = new Set(laneIds);
  const scenes = new Map<string, TimelineDawSessionScene>();

  for (const laneId of laneIds) {
    const seenOnLane = new Set<string>();
    const laneLabels = [...(labels[laneId] ?? [])]
      .filter((label) => validLaneIds.has(label.laneId) && label.laneId === laneId)
      .sort((left, right) => left.startSeconds - right.startSeconds || left.id.localeCompare(right.id));

    for (const label of laneLabels) {
      const key = sceneKey(label.name);
      if (!key || seenOnLane.has(key)) continue;
      seenOnLane.add(key);
      const current = scenes.get(key) ?? { id: `session-scene:${key}`, name: label.name.trim(), slots: [] };
      current.slots.push({
        id: label.id,
        laneId: label.laneId,
        name: label.name.trim(),
        startSeconds: label.startSeconds,
        endSeconds: label.endSeconds,
        color: label.color,
      });
      scenes.set(key, current);
    }
  }

  return [...scenes.values()].sort((left, right) => {
    const leftStart = Math.min(...left.slots.map((slot) => slot.startSeconds));
    const rightStart = Math.min(...right.slots.map((slot) => slot.startSeconds));
    return leftStart - rightStart || left.name.localeCompare(right.name);
  });
}

export function createTimelineDawSessionSceneLaunch(scene: TimelineDawSessionScene) {
  if (!scene.slots.length) throw new Error("A Session View scene needs at least one clip slot.");
  const laneIds = new Set<string>();
  return scene.slots.map((slot) => {
    if (laneIds.has(slot.laneId)) throw new Error("A Session View scene can launch only one clip per track.");
    if (!Number.isFinite(slot.startSeconds) || !Number.isFinite(slot.endSeconds) || slot.startSeconds < 0 || slot.endSeconds <= slot.startSeconds) {
      throw new Error("A Session View clip has an invalid audio range.");
    }
    laneIds.add(slot.laneId);
    return { laneId: slot.laneId, startSeconds: slot.startSeconds, endSeconds: slot.endSeconds };
  });
}
