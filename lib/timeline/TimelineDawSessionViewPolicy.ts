import type { TimelineDawTrackRegionLabel, TimelineDawTrackRegionLabels } from "./TimelineDawTrackRegionLabelPolicy";

export type TimelineDawSessionClipSlot = Pick<TimelineDawTrackRegionLabel, "id" | "laneId" | "name" | "startSeconds" | "endSeconds" | "color">;

export type TimelineDawSessionScene = {
  id: string;
  name: string;
  slots: TimelineDawSessionClipSlot[];
};

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
