export type TimelineDawPrivateAudioLaneInput = {
  name: string;
  sourceId: string;
  sourceUri: string;
  sourceChecksum: string;
  sampleRate: number;
  channelCount: number;
  frameCount: number;
  durationSeconds: number;
  timelineStartSeconds: number;
  compId: string | null;
  compRenderChecksum: string | null;
};

function positiveInteger(value: unknown, label: string): number {
  if (!Number.isInteger(value) || Number(value) <= 0) throw new Error(`${label} must be a positive integer.`);
  return Number(value);
}

export function parseTimelineDawPrivateAudioLane(
  value: unknown,
  ownerId: string,
  sessionId: string,
): TimelineDawPrivateAudioLaneInput {
  if (!value || typeof value !== "object") throw new Error("Private audio lane is required.");
  const input = value as Record<string, unknown>;
  const name = typeof input.name === "string" ? input.name.trim().replace(/\s+/g, " ") : "";
  const sourceId = typeof input.sourceId === "string" ? input.sourceId.trim() : "";
  const sourceUri = typeof input.sourceUri === "string" ? input.sourceUri.trim() : "";
  const sourceChecksum = typeof input.sourceChecksum === "string" ? input.sourceChecksum.trim().toLowerCase() : "";
  if (!name || name.length > 120) throw new Error("Lane name must contain 1 to 120 characters.");
  if (!sourceId) throw new Error("Lane source ID is required.");
  const expectedPrefix = `supabase://timeline-daw-render-sources/${ownerId}/${sessionId}/`;
  if (!sourceUri.startsWith(expectedPrefix)) throw new Error("Lane source does not belong to this owner and session.");
  if (!/^sha256:[a-f0-9]{64}$/.test(sourceChecksum)) throw new Error("Lane source checksum is invalid.");
  const sampleRate = positiveInteger(input.sampleRate, "Lane sample rate");
  const channelCount = positiveInteger(input.channelCount, "Lane channel count");
  const frameCount = positiveInteger(input.frameCount, "Lane frame count");
  const durationSeconds = Number(input.durationSeconds);
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0 || Math.abs(durationSeconds - frameCount / sampleRate) > 0.001) {
    throw new Error("Lane duration does not match its audio geometry.");
  }
  const timelineStartSeconds = Number(input.timelineStartSeconds);
  if (!Number.isFinite(timelineStartSeconds) || timelineStartSeconds < 0 || timelineStartSeconds > 86_400) {
    throw new Error("Lane timeline position must be from 0 to 86400 seconds.");
  }
  const compId = typeof input.compId === "string" && input.compId.trim() ? input.compId.trim() : null;
  const compRenderChecksum = typeof input.compRenderChecksum === "string" && input.compRenderChecksum.trim()
    ? input.compRenderChecksum.trim().toLowerCase()
    : null;
  if ((compId === null) !== (compRenderChecksum === null)) throw new Error("Lane comp provenance must be complete.");
  if (compRenderChecksum && !/^sha256:[a-f0-9]{64}$/.test(compRenderChecksum)) throw new Error("Lane comp checksum is invalid.");
  return { name, sourceId, sourceUri, sourceChecksum, sampleRate, channelCount, frameCount, durationSeconds, timelineStartSeconds, compId, compRenderChecksum };
}
