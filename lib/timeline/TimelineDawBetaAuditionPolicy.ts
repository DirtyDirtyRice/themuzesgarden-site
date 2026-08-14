import { createHash } from "node:crypto";

export const TIMELINE_DAW_BETA_AUDITION_EVENTS = ["audition-opened", "playback-started", "playback-completed", "playback-failed", "feedback-checkpoint"] as const;
export type TimelineDawBetaAuditionEvent = (typeof TIMELINE_DAW_BETA_AUDITION_EVENTS)[number];

export function parseTimelineDawBetaAuditionEvent(input: Record<string, unknown>) {
  const action = String(input.action ?? "") as TimelineDawBetaAuditionEvent;
  if (!TIMELINE_DAW_BETA_AUDITION_EVENTS.includes(action)) throw new Error("Audition event is invalid.");
  const positionSeconds = Number(input.positionSeconds ?? 0);
  if (!Number.isFinite(positionSeconds) || positionSeconds < 0 || positionSeconds > 86400) throw new Error("Audition position is invalid.");
  const detail = String(input.detail ?? "").trim();
  if (detail.length > 500) throw new Error("Audition detail cannot exceed 500 characters.");
  return { action, positionSeconds, detail };
}

export function createTimelineDawBetaAuditionChecksum(input: Record<string, unknown>) {
  return `sha256:${createHash("sha256").update(JSON.stringify(input)).digest("hex")}`;
}

export function assertTimelineDawBetaAuditionSource(input: { sourceUri: string; sourceChecksum: string; ownerId: string; sessionId: string }) {
  const prefix = `supabase://timeline-daw-render-sources/${input.ownerId}/${input.sessionId}/`;
  if (!input.sourceUri.startsWith(prefix)) throw new Error("Audition source is outside the protected session path.");
  if (!/^sha256:[a-f0-9]{64}$/.test(input.sourceChecksum)) throw new Error("Audition source checksum is invalid.");
  return { storagePath: input.sourceUri.slice("supabase://timeline-daw-render-sources/".length), expiresInSeconds: 300 };
}
