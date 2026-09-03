export type TimelineDawPrivateBusMix = { muted: boolean; soloed: boolean; gain: number; pan: number };

export function parseTimelineDawPrivateBus(value: unknown) {
  if (!value || typeof value !== "object") throw new Error("Private bus settings are required.");
  const input = value as Record<string, unknown>;
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const gain = Number(input.gain); const pan = Number(input.pan);
  if (!name || name.length > 80) throw new Error("Private bus name must be from 1 to 80 characters.");
  if (typeof input.muted !== "boolean" || typeof input.soloed !== "boolean") throw new Error("Private bus mute and solo settings must be boolean.");
  if (!Number.isFinite(gain) || gain < 0 || gain > 2) throw new Error("Private bus gain must be from 0 to 2.");
  if (!Number.isFinite(pan) || pan < -1 || pan > 1) throw new Error("Private bus pan must be from -1 to 1.");
  return { name, muted: input.muted, soloed: input.soloed, gain, pan };
}

export function resolveTimelineDawPrivateRoutingAudibility(
  lanes: Array<{ id: string; busId: string | null; muted: boolean; soloed: boolean; soloSafe?: boolean }>,
  buses: Array<{ id: string; muted: boolean; soloed: boolean }>,
): ReadonlyMap<string, boolean> {
  const anyLaneSolo = lanes.some((lane) => lane.soloed);
  const anyBusSolo = buses.some((bus) => bus.soloed);
  const byId = new Map(buses.map((bus) => [bus.id, bus]));
  return new Map(lanes.map((lane) => {
    const bus = lane.busId ? byId.get(lane.busId) : undefined;
    const busAllows = !bus?.muted && (!anyBusSolo || Boolean(bus?.soloed));
    const laneAllows = !lane.muted && (!anyLaneSolo || lane.soloed || Boolean(lane.soloSafe));
    return [lane.id, laneAllows && busAllows];
  }));
}
