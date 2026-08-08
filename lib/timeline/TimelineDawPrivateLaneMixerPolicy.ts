export type TimelineDawPrivateLaneMix = {
  muted: boolean;
  soloed: boolean;
  gain: number;
  pan: number;
};

export function parseTimelineDawPrivateLaneMix(value: unknown): TimelineDawPrivateLaneMix {
  if (!value || typeof value !== "object") throw new Error("Private lane mixer settings are required.");
  const input = value as Record<string, unknown>;
  if (typeof input.muted !== "boolean" || typeof input.soloed !== "boolean") {
    throw new Error("Private lane mute and solo settings must be boolean.");
  }
  const gain = Number(input.gain);
  const pan = Number(input.pan);
  if (!Number.isFinite(gain) || gain < 0 || gain > 2) throw new Error("Private lane gain must be from 0 to 2.");
  if (!Number.isFinite(pan) || pan < -1 || pan > 1) throw new Error("Private lane pan must be from -1 to 1.");
  return { muted: input.muted, soloed: input.soloed, gain, pan };
}

export function resolveTimelineDawPrivateLaneAudibility(
  lanes: Array<{ id: string; muted: boolean; soloed: boolean }>,
): ReadonlyMap<string, boolean> {
  const anySoloed = lanes.some((lane) => lane.soloed);
  return new Map(lanes.map((lane) => [lane.id, !lane.muted && (!anySoloed || lane.soloed)]));
}
