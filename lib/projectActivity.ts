import { emitProjectActivity } from "./appEvents";

export type ActivityType = "play" | "link" | "unlink" | "note";

export type ActivityItem = {
  id: string;
  type: ActivityType;
  label: string;
  time: number;
  trackId?: string | null;
};

export const APP_EVENT_ACTIVITY_UPDATED = "muzesgarden-activity-updated";
export const APP_EVENT_ACTIVITY_TRACK_JUMP = "muzesgarden-activity-track-jump";

function storageKey(projectId: string) {
  return `muzesgarden:activity:${projectId}`;
}

function safeUuid() {
  try {
    return crypto.randomUUID();
  } catch {
    return `activity-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

function normalizeActivityItem(raw: any): ActivityItem | null {
  if (!raw || typeof raw !== "object") return null;

  const id =
    typeof raw.id === "string" && raw.id.trim() ? raw.id : safeUuid();

  const type = raw.type;
  const safeType: ActivityType =
    type === "play" || type === "link" || type === "unlink" || type === "note"
      ? type
      : "note";

  const label =
    typeof raw.label === "string" && raw.label.trim() ? raw.label : "Event";

  const time =
    typeof raw.time === "number" && Number.isFinite(raw.time)
      ? raw.time
      : Date.now();

  const trackId =
    typeof raw.trackId === "string" && raw.trackId.trim()
      ? raw.trackId
      : null;

  return {
    id,
    type: safeType,
    label,
    time,
    trackId,
  };
}

export function readProjectActivity(projectId: string): ActivityItem[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(storageKey(projectId)) || "[]";
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) return [];

    return parsed
      .map(normalizeActivityItem)
      .filter((item): item is ActivityItem => !!item);
  } catch {
    return [];
  }
}

export function logProjectActivity(
  projectId: string,
  type: ActivityType,
  label: string,
  meta?: {
    trackId?: string | null;
  }
) {
  if (typeof window === "undefined") return;

  const existing = readProjectActivity(projectId);

  const item: ActivityItem = {
    id: safeUuid(),
    type,
    label,
    time: Date.now(),
    trackId:
      typeof meta?.trackId === "string" && meta.trackId.trim()
        ? meta.trackId
        : null,
  };

  const next = [item, ...existing].slice(0, 100);

  localStorage.setItem(storageKey(projectId), JSON.stringify(next));

  emitProjectActivity({
    projectId,
    type,
    label,
    trackId:
      typeof meta?.trackId === "string" && meta.trackId.trim()
        ? meta.trackId
        : undefined,
  });

  window.dispatchEvent(
    new CustomEvent(APP_EVENT_ACTIVITY_UPDATED, {
      detail: { projectId },
    })
  );
}

export function emitActivityTrackJump(projectId: string, trackId: string) {
  if (typeof window === "undefined") return;
  if (!projectId || !trackId) return;

  window.dispatchEvent(
    new CustomEvent(APP_EVENT_ACTIVITY_TRACK_JUMP, {
      detail: {
        projectId,
        trackId,
      },
    })
  );
}