import { createHash } from "node:crypto";

export type TimelineDawPrivateClipGainPoint = { frame: number; gainDb: number };
export type TimelineDawPrivateSpectralRepair = {
  id: string; startFrame: number; endFrame: number; lowHz: number; highHz: number;
  attenuationDb: number; bypassed: boolean; provenance: string;
};
export type TimelineDawPrivateClipRepairState = {
  laneId: string; revision: number; bypassed: boolean;
  gainPoints: TimelineDawPrivateClipGainPoint[]; spectralRepairs: TimelineDawPrivateSpectralRepair[];
};

const finite = (value: unknown, label: string) => { const number = Number(value); if (!Number.isFinite(number)) throw new Error(`${label} must be finite.`); return number; };
export function parseTimelineDawPrivateClipRepair(value: unknown, laneId: string, sampleRate: number, frameCount: number): TimelineDawPrivateClipRepairState {
  if (!value || typeof value !== "object") throw new Error("Clip repair state is required.");
  const input = value as Record<string, unknown>, revision = Math.trunc(finite(input.revision ?? 0, "Clip repair revision"));
  if (revision < 0) throw new Error("Clip repair revision cannot be negative.");
  const gainPoints = (Array.isArray(input.gainPoints) ? input.gainPoints : []).map((raw) => { const point = raw as Record<string, unknown>, frame = Math.trunc(finite(point.frame, "Clip gain frame")), gainDb = finite(point.gainDb, "Clip gain"); if (frame < 0 || frame > frameCount) throw new Error("Clip gain frame is outside the lane."); if (gainDb < -96 || gainDb > 24) throw new Error("Clip gain must be from -96 to 24 dB."); return { frame, gainDb }; }).sort((a, b) => a.frame - b.frame);
  if (gainPoints.length > 512 || gainPoints.some((point, index) => index > 0 && gainPoints[index - 1].frame === point.frame)) throw new Error("Clip gain points must contain at most 512 unique frames.");
  const spectralRepairs = (Array.isArray(input.spectralRepairs) ? input.spectralRepairs : []).map((raw, index) => { const repair = raw as Record<string, unknown>, startFrame = Math.trunc(finite(repair.startFrame, "Repair start")), endFrame = Math.trunc(finite(repair.endFrame, "Repair end")), lowHz = finite(repair.lowHz, "Repair low frequency"), highHz = finite(repair.highHz, "Repair high frequency"), attenuationDb = finite(repair.attenuationDb, "Repair attenuation"), id = typeof repair.id === "string" && repair.id.trim() ? repair.id.trim() : `repair-${index}`, provenance = typeof repair.provenance === "string" ? repair.provenance.trim().slice(0, 240) : "manual"; if (startFrame < 0 || endFrame <= startFrame || endFrame > frameCount) throw new Error("Spectral repair range is outside the lane."); if (lowHz < 20 || highHz <= lowHz || highHz > sampleRate / 2) throw new Error("Spectral repair frequencies are invalid for the lane sample rate."); if (attenuationDb < -96 || attenuationDb > 0) throw new Error("Spectral repair attenuation must be from -96 to 0 dB."); return { id, startFrame, endFrame, lowHz, highHz, attenuationDb, bypassed: Boolean(repair.bypassed), provenance: provenance || "manual" }; });
  if (spectralRepairs.length > 128 || new Set(spectralRepairs.map((repair) => repair.id)).size !== spectralRepairs.length) throw new Error("Spectral repairs must contain at most 128 unique IDs.");
  return { laneId, revision, bypassed: Boolean(input.bypassed), gainPoints, spectralRepairs };
}

export function timelineDawPrivateClipGainAtFrame(points: TimelineDawPrivateClipGainPoint[], frame: number): number {
  if (!points.length) return 1; if (frame <= points[0].frame) return 10 ** (points[0].gainDb / 20); const last = points[points.length - 1]; if (frame >= last.frame) return 10 ** (last.gainDb / 20);
  const right = points.findIndex((point) => point.frame >= frame), left = points[right - 1], ratio = (frame - left.frame) / (points[right].frame - left.frame), gainDb = left.gainDb + (points[right].gainDb - left.gainDb) * ratio; return 10 ** (gainDb / 20);
}

export function timelineDawPrivateClipRepairChecksum(state: TimelineDawPrivateClipRepairState): string { return `sha256:${createHash("sha256").update(JSON.stringify({ laneId: state.laneId, revision: state.revision, bypassed: state.bypassed, gainPoints: state.gainPoints, spectralRepairs: [...state.spectralRepairs].sort((a, b) => a.id.localeCompare(b.id)) })).digest("hex")}`; }

export function applyTimelineDawPrivateClipRepairs(channels: Float32Array[], sampleRate: number, state?: TimelineDawPrivateClipRepairState): Float32Array[] {
  const output = channels.map((channel) => new Float32Array(channel)); if (!state || state.bypassed) return output;
  for (const channel of output) for (let frame = 0; frame < channel.length; frame += 1) channel[frame] *= timelineDawPrivateClipGainAtFrame(state.gainPoints, frame);
  for (const repair of state.spectralRepairs.filter((item) => !item.bypassed)) for (const channel of output) { let low = 0, high = 0; const lowAlpha = 1 - Math.exp(-2 * Math.PI * repair.lowHz / sampleRate), highAlpha = 1 - Math.exp(-2 * Math.PI * repair.highHz / sampleRate), mix = 1 - 10 ** (repair.attenuationDb / 20); for (let frame = 0; frame < channel.length; frame += 1) { low += lowAlpha * (channel[frame] - low); high += highAlpha * (channel[frame] - high); if (frame >= repair.startFrame && frame < repair.endFrame) channel[frame] -= (high - low) * mix; } }
  return output;
}

export function assertTimelineDawPrivateClipRepairRevision(expected: number, current: number): void { if (expected !== current) throw new Error(`Clip repair changed from revision ${expected} to ${current}. Reload before saving.`); }
