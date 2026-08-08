import { parseTimelineDawPrivateSidechain, type TimelineDawPrivateSidechain } from "./TimelineDawPrivateSidechainPolicy";
export type TimelineDawPrivateSend = {
  id: string;
  sourceKind: "lane" | "bus";
  sourceId: string;
  destinationBusId: string;
  level: number;
  preFader: boolean;
  muted: boolean;
};

export type TimelineDawPrivateInsert = {
  id: string;
  sourceKind: "lane" | "bus";
  sourceId: string;
  slot: number;
  effect: "gain" | "filter" | "compressor" | "gate";
  bypassed: boolean;
  parameters: Record<string, number>;
  latencySamples?: number;
  sidechain?: TimelineDawPrivateSidechain | null;
};

const finite = (value: unknown, name: string, minimum: number, maximum: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < minimum || parsed > maximum) throw new Error(`${name} must be from ${minimum} to ${maximum}.`);
  return parsed;
};

export function parseTimelineDawPrivateSend(value: unknown): Omit<TimelineDawPrivateSend, "id"> {
  if (!value || typeof value !== "object") throw new Error("Private send settings are required.");
  const input = value as Record<string, unknown>;
  if (input.sourceKind !== "lane" && input.sourceKind !== "bus") throw new Error("Private send source must be a lane or bus.");
  const sourceId = typeof input.sourceId === "string" ? input.sourceId.trim() : "";
  const destinationBusId = typeof input.destinationBusId === "string" ? input.destinationBusId.trim() : "";
  if (!sourceId || !destinationBusId) throw new Error("Private send source and destination are required.");
  if (input.sourceKind === "bus" && sourceId === destinationBusId) throw new Error("A bus cannot send to itself.");
  if (typeof input.preFader !== "boolean" || typeof input.muted !== "boolean") throw new Error("Private send mode and mute state must be boolean.");
  return { sourceKind: input.sourceKind, sourceId, destinationBusId, level: finite(input.level, "Private send level", 0, 2), preFader: input.preFader, muted: input.muted };
}

export function assertTimelineDawPrivateBusSendAcyclic(sends: Array<Pick<TimelineDawPrivateSend, "sourceKind" | "sourceId" | "destinationBusId" | "muted">>): void {
  const edges = new Map<string, string[]>();
  for (const send of sends) if (!send.muted && send.sourceKind === "bus") edges.set(send.sourceId, [...(edges.get(send.sourceId) ?? []), send.destinationBusId]);
  const visiting = new Set<string>(); const visited = new Set<string>();
  const visit = (id: string) => { if (visiting.has(id)) throw new Error("Private bus sends cannot create a feedback cycle."); if (visited.has(id)) return; visiting.add(id); for (const next of edges.get(id) ?? []) visit(next); visiting.delete(id); visited.add(id); };
  for (const id of edges.keys()) visit(id);
}

export function parseTimelineDawPrivateInsert(value: unknown): Omit<TimelineDawPrivateInsert, "id"> {
  if (!value || typeof value !== "object") throw new Error("Private insert settings are required.");
  const input = value as Record<string, unknown>; const sourceId = typeof input.sourceId === "string" ? input.sourceId.trim() : "";
  if ((input.sourceKind !== "lane" && input.sourceKind !== "bus") || !sourceId) throw new Error("Private insert source is required.");
  if (input.effect !== "gain" && input.effect !== "filter" && input.effect !== "compressor" && input.effect !== "gate") throw new Error("Private insert effect is not supported.");
  if (typeof input.bypassed !== "boolean") throw new Error("Private insert bypass state must be boolean.");
  const slot = finite(input.slot, "Private insert slot", 0, 2); if (!Number.isInteger(slot)) throw new Error("Private insert slot must be an integer.");
  const values = (input.parameters && typeof input.parameters === "object" ? input.parameters : {}) as Record<string, unknown>;
  const parameters: Record<string, number> = input.effect === "gain" ? { gain: finite(values.gain ?? 1, "Insert gain", 0, 4) }
    : input.effect === "filter" ? { frequency: finite(values.frequency ?? 12000, "Filter frequency", 20, 20000), q: finite(values.q ?? 0.7, "Filter Q", 0.0001, 30) }
    : { threshold: finite(values.threshold ?? -24, "Dynamics threshold", -100, 0), ratio: finite(values.ratio ?? 4, "Dynamics ratio", 1, 20) };
  return { sourceKind: input.sourceKind, sourceId, slot, effect: input.effect, bypassed: input.bypassed, parameters, latencySamples: Math.round(finite(input.latencySamples ?? 0, "Insert latency", 0, 192000)), sidechain: parseTimelineDawPrivateSidechain(input.sidechain) };
}
