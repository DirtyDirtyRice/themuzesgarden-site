import { createHash } from "node:crypto";

export type TimelineDawExperimentSegment = {
  versionId: string;
  sourceChecksum: string;
  startSeconds: number;
  endSeconds: number;
  repeats: number;
  gainDb: number;
  fadeInSeconds: number;
  fadeOutSeconds: number;
  effect: { kind: "none" | "lowpass"; cutoffHz: number | null };
};
export type TimelineDawExperimentRecipe = { name: string; format: "wav" | "mp3"; segments: TimelineDawExperimentSegment[] };

const checksumPattern = /^sha256:[a-f0-9]{64}$/;
export function parseTimelineDawExperimentRecipe(value: unknown, durations: ReadonlyMap<string, number>): TimelineDawExperimentRecipe {
  if (!value || typeof value !== "object") throw new Error("Experiment recipe is required.");
  const input = value as Record<string, unknown>;
  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (!name || name.length > 120) throw new Error("Experiment name is invalid.");
  const format = input.format === "mp3" ? "mp3" : input.format === "wav" ? "wav" : null;
  if (!format) throw new Error("Experiment format must be WAV or MP3.");
  if (!Array.isArray(input.segments) || input.segments.length < 1 || input.segments.length > 128) throw new Error("Experiment requires 1 to 128 segments.");
  const segments = input.segments.map((raw, index) => {
    if (!raw || typeof raw !== "object") throw new Error(`Experiment segment ${index + 1} is invalid.`);
    const segment = raw as Record<string, unknown>, versionId = String(segment.versionId ?? "").trim(), sourceChecksum = String(segment.sourceChecksum ?? "").toLowerCase();
    const duration = durations.get(versionId), startSeconds = Number(segment.startSeconds), endSeconds = Number(segment.endSeconds), repeats = Math.round(Number(segment.repeats ?? 1)), gainDb = Number(segment.gainDb ?? 0), fadeInSeconds = Number(segment.fadeInSeconds ?? 0), fadeOutSeconds = Number(segment.fadeOutSeconds ?? 0);
    const effectRaw = segment.effect && typeof segment.effect === "object" ? segment.effect as Record<string, unknown> : {}, kind = effectRaw.kind === "lowpass" ? "lowpass" : effectRaw.kind === "none" || effectRaw.kind == null ? "none" : null, cutoffHz = kind === "lowpass" ? Number(effectRaw.cutoffHz) : null;
    if (!versionId || duration == null) throw new Error(`Experiment segment ${index + 1} source is unavailable.`);
    if (!checksumPattern.test(sourceChecksum)) throw new Error(`Experiment segment ${index + 1} checksum is invalid.`);
    if (!Number.isFinite(startSeconds) || !Number.isFinite(endSeconds) || startSeconds < 0 || endSeconds <= startSeconds || endSeconds > duration + 1e-6) throw new Error(`Experiment segment ${index + 1} range is outside its source.`);
    if (!Number.isInteger(repeats) || repeats < 1 || repeats > 16) throw new Error(`Experiment segment ${index + 1} repeats are invalid.`);
    if (!Number.isFinite(gainDb) || gainDb < -60 || gainDb > 12) throw new Error(`Experiment segment ${index + 1} gain is invalid.`);
    const length = endSeconds - startSeconds;
    if (!Number.isFinite(fadeInSeconds) || !Number.isFinite(fadeOutSeconds) || fadeInSeconds < 0 || fadeOutSeconds < 0 || fadeInSeconds + fadeOutSeconds > length) throw new Error(`Experiment segment ${index + 1} fades overlap.`);
    if (!kind || (kind === "lowpass" && (!Number.isFinite(cutoffHz) || (cutoffHz as number) < 20 || (cutoffHz as number) > 20000))) throw new Error(`Experiment segment ${index + 1} effect is invalid.`);
    return { versionId, sourceChecksum, startSeconds, endSeconds, repeats, gainDb, fadeInSeconds, fadeOutSeconds, effect: { kind, cutoffHz } } as TimelineDawExperimentSegment;
  });
  return { name, format, segments };
}

export function timelineDawExperimentRecipeChecksum(recipe: TimelineDawExperimentRecipe): string {
  return `sha256:${createHash("sha256").update(JSON.stringify(recipe)).digest("hex")}`;
}

export function suggestTimelineDawSourceFamily(name: string, known: Array<{ id: string; name: string }>): { familyId: string | null; confidence: number; reviewRequired: boolean } {
  const normalize = (value: string) => value.toLowerCase().replace(/\.[^.]+$/, "").replace(/\b(acapella|a cappella|demo|mix|version|kompoz|hybrid|guitar|voice|v\d+)\b/g, " ").replace(/[^a-z0-9]+/g, " ").trim();
  const target = normalize(name), scored = known.map(item => ({ id: item.id, score: target && normalize(item.name) === target ? 1 : 0 })).filter(item => item.score > 0);
  return { familyId: scored.length === 1 ? scored[0].id : null, confidence: scored.length === 1 ? 1 : 0, reviewRequired: scored.length !== 1 };
}