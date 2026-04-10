import type { AnyTrack } from "./playerTypes";
import type { PlaybackQueueSource } from "./audioEngineState";

export function getActiveQueue(args: {
  source: PlaybackQueueSource;
  allTracks: AnyTrack[];
  projectTracks: AnyTrack[];
}): AnyTrack[] {
  const { source, allTracks, projectTracks } = args;
  return source === "search" ? allTracks : projectTracks;
}

export function getTrackForCurrentPlayIntent(args: {
  nowId: string | null;
  activeQueue: AnyTrack[];
  allTracks: AnyTrack[];
}): AnyTrack | null {
  const { nowId, activeQueue, allTracks } = args;
  const nowIdValue = String(nowId ?? "").trim();

  if (nowIdValue) {
    const fromActiveQueue =
      activeQueue.find((t) => String(t.id) === nowIdValue) ?? null;
    if (fromActiveQueue) return fromActiveQueue;

    const fromLibrary =
      allTracks.find((t) => String(t.id) === nowIdValue) ?? null;
    if (fromLibrary) return fromLibrary;
  }

  if (activeQueue.length > 0) {
    return activeQueue[0] ?? null;
  }

  if (allTracks.length > 0) {
    return allTracks[0] ?? null;
  }

  return null;
}

export function safeIndexOfNow(args: {
  list: AnyTrack[];
  nowId: string | null;
}): number {
  const { list, nowId } = args;
  if (!list.length) return -1;

  const nid = String(nowId ?? "");
  return list.findIndex((t) => String(t.id) === nid);
}

export function pickNextTrack(args: {
  list: AnyTrack[];
  nowId: string | null;
  shuffle: boolean;
}): AnyTrack | null {
  const { list, nowId, shuffle } = args;
  if (!list.length) return null;

  if (shuffle) {
    const cur = String(nowId ?? "");
    const pool = list.filter((t) => String(t.id) !== cur);
    const pickFrom = pool.length ? pool : list;
    const r = Math.floor(Math.random() * pickFrom.length);
    return pickFrom[r] ?? null;
  }

  const idx = safeIndexOfNow({ list, nowId });
  const nextIdx = idx >= 0 ? (idx + 1) % list.length : 0;
  return list[nextIdx] ?? null;
}

export function pickPrevTrack(args: {
  list: AnyTrack[];
  nowId: string | null;
  shuffle: boolean;
}): AnyTrack | null {
  const { list, nowId, shuffle } = args;
  if (!list.length) return null;

  if (shuffle) {
    return pickNextTrack({ list, nowId, shuffle: true });
  }

  const idx = safeIndexOfNow({ list, nowId });
  const prevIdx = idx >= 0 ? (idx - 1 + list.length) % list.length : 0;
  return list[prevIdx] ?? null;
}

export function pickPlayAllTrack(args: {
  projectTracks: AnyTrack[];
  shuffle: boolean;
}): AnyTrack | null {
  const { projectTracks, shuffle } = args;
  if (!projectTracks.length) return null;

  if (shuffle) {
    const r = Math.floor(Math.random() * projectTracks.length);
    return projectTracks[r] ?? null;
  }

  return projectTracks[0] ?? null;
}