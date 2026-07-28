import type { TimelineDawRenderCommand } from "./TimelineDawRenderService";

const allowedKeys = new Set([
  "action", "sessionId", "expectedWorkspaceRevision", "name", "target", "sourceIds",
  "startSample", "endSample", "sampleRate", "bitDepth", "channels", "format",
  "normalizePeakDb", "dither",
]);
const targets = new Set(["mix", "stem", "selection"]);
const formats = new Set(["wav", "flac", "mp3"]);
const bitDepths = new Set([16, 24, 32]);

function text(value: unknown, label: string, maximum: number): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} is required.`);
  const normalized = value.trim();
  if (normalized.length > maximum) throw new Error(`${label} is too long.`);
  return normalized;
}

function whole(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative safe integer.`);
  }
  return value;
}

export function parseTimelineDawRenderCommand(raw: unknown): TimelineDawRenderCommand {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("DAW render command must be an object.");
  }
  const value = raw as Record<string, unknown>;
  const unexpected = Object.keys(value).filter((key) => !allowedKeys.has(key));
  if (unexpected.length) throw new Error(`DAW render command contains unsupported field: ${unexpected[0]}.`);
  if (value.action !== "prepare") throw new Error("DAW render action is invalid.");

  const sessionId = text(value.sessionId, "sessionId", 200);
  const name = text(value.name, "Render name", 200);
  const expectedWorkspaceRevision = whole(value.expectedWorkspaceRevision, "expectedWorkspaceRevision");
  const startSample = whole(value.startSample, "startSample");
  const endSample = whole(value.endSample, "endSample");
  const sampleRate = whole(value.sampleRate, "sampleRate");
  const channels = whole(value.channels, "channels");
  if (endSample <= startSample) throw new Error("Render endSample must be after startSample.");
  if (sampleRate < 8_000 || sampleRate > 384_000) throw new Error("sampleRate must be from 8000 to 384000.");
  if (channels < 1 || channels > 64) throw new Error("channels must be from 1 to 64.");
  if (!targets.has(String(value.target))) throw new Error("Render target is invalid.");
  if (!formats.has(String(value.format))) throw new Error("Render format is invalid.");
  if (typeof value.bitDepth !== "number" || !bitDepths.has(value.bitDepth)) {
    throw new Error("bitDepth must be 16, 24, or 32.");
  }
  if (!Array.isArray(value.sourceIds) || value.sourceIds.length === 0 || value.sourceIds.length > 256) {
    throw new Error("sourceIds must contain from 1 to 256 sources.");
  }
  const sourceIds = value.sourceIds.map((source) => text(source, "Render source", 200));
  const normalizePeakDb = value.normalizePeakDb === undefined || value.normalizePeakDb === null
    ? null
    : value.normalizePeakDb;
  if (
    normalizePeakDb !== null
    && (typeof normalizePeakDb !== "number" || !Number.isFinite(normalizePeakDb)
      || normalizePeakDb < -24 || normalizePeakDb > 0)
  ) {
    throw new Error("normalizePeakDb must be null or from -24 to 0.");
  }
  if (value.dither !== undefined && typeof value.dither !== "boolean") {
    throw new Error("dither must be a boolean.");
  }
  if (value.format === "mp3" && (value.bitDepth !== 16 || channels > 2)) {
    throw new Error("MP3 requires 16-bit mono or stereo output.");
  }

  return {
    action: "prepare", sessionId, expectedWorkspaceRevision, name,
    target: value.target as TimelineDawRenderCommand["target"],
    sourceIds: [...new Set(sourceIds)], startSample, endSample, sampleRate,
    bitDepth: value.bitDepth as 16 | 24 | 32, channels,
    format: value.format as TimelineDawRenderCommand["format"],
    normalizePeakDb, dither: value.dither ?? false,
  };
}
