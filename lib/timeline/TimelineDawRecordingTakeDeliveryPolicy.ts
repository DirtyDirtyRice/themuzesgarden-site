const BUCKET = "timeline-daw-render-sources";
const PREFIX = `supabase://${BUCKET}/`;

function segment(value: string, label: string): string {
  const normalized = value.trim();
  if (!/^[a-zA-Z0-9._-]+$/.test(normalized)) throw new Error(`${label} is invalid.`);
  return normalized;
}

export function resolveTimelineDawTakeStoragePath(
  uri: string,
  ownerId: string,
  sessionId: string,
): string {
  const owner = segment(ownerId, "Recording take owner ID");
  const session = segment(sessionId, "Recording take session ID");
  const expected = `${PREFIX}${owner}/${session}/`;
  if (!uri.startsWith(expected)) throw new Error("Recording source does not belong to this owner and session.");
  const path = uri.slice(PREFIX.length);
  if (!path.toLowerCase().endsWith(".wav") || path.includes("..") || path.includes("\\")) {
    throw new Error("Recording source path is invalid.");
  }
  return path;
}

export const TIMELINE_DAW_TAKE_BUCKET = BUCKET;
export const TIMELINE_DAW_TAKE_DELIVERY_SECONDS = 300;
