export type TimelineDawPrivateAutomationParameter = "gain" | "pan";
export type TimelineDawPrivateAutomationInterpolation = "linear" | "hold";
export type TimelineDawPrivateAutomationPoint = { id: string; samplePosition: number; value: number; interpolation: TimelineDawPrivateAutomationInterpolation };
export type TimelineDawPrivateAutomationEnvelope = { id: string; sourceKind: "lane" | "bus"; sourceId: string; parameter: TimelineDawPrivateAutomationParameter; bypassed: boolean; points: TimelineDawPrivateAutomationPoint[] };

const limits = { gain: [0, 2], pan: [-1, 1] } as const;

export function parseTimelineDawPrivateAutomationEnvelope(value: unknown): Omit<TimelineDawPrivateAutomationEnvelope, "id"> & { id?: string } {
  if (!value || typeof value !== "object") throw new Error("Private automation envelope is required.");
  const input = value as Record<string, unknown>;
  if (input.sourceKind !== "lane" && input.sourceKind !== "bus") throw new Error("Automation source must be a lane or bus.");
  const sourceId = typeof input.sourceId === "string" ? input.sourceId.trim() : "";
  if (!sourceId || (input.parameter !== "gain" && input.parameter !== "pan")) throw new Error("Automation source and parameter are required.");
  if (!Array.isArray(input.points)) throw new Error("Automation control points are required.");
  const [minimum, maximum] = limits[input.parameter];
  const points = input.points.map((point, index) => {
    if (!point || typeof point !== "object") throw new Error("Automation control point is invalid.");
    const item = point as Record<string, unknown>, samplePosition = Number(item.samplePosition), pointValue = Number(item.value);
    if (!Number.isSafeInteger(samplePosition) || samplePosition < 0) throw new Error("Automation sample positions must be non-negative integers.");
    if (!Number.isFinite(pointValue) || pointValue < minimum || pointValue > maximum) throw new Error(`Automation ${input.parameter} values must be between ${minimum} and ${maximum}.`);
    if (item.interpolation !== "linear" && item.interpolation !== "hold") throw new Error("Automation interpolation must be linear or hold.");
    return { id: typeof item.id === "string" && item.id.trim() ? item.id.trim() : `point-${index}`, samplePosition, value: pointValue, interpolation: item.interpolation as TimelineDawPrivateAutomationInterpolation };
  });
  for (let index = 1; index < points.length; index += 1) if (points[index].samplePosition <= points[index - 1].samplePosition) throw new Error("Automation sample positions must increase monotonically.");
  return { id: typeof input.id === "string" && input.id.trim() ? input.id.trim() : undefined, sourceKind: input.sourceKind, sourceId, parameter: input.parameter, bypassed: Boolean(input.bypassed), points };
}

export function timelineDawPrivateAutomationValue(envelope: Pick<TimelineDawPrivateAutomationEnvelope, "bypassed" | "points"> | undefined, samplePosition: number, fallback: number): number {
  if (!envelope || envelope.bypassed || !envelope.points.length) return fallback;
  const points = envelope.points;
  if (samplePosition <= points[0].samplePosition) return points[0].value;
  const rightIndex = points.findIndex((point) => point.samplePosition >= samplePosition);
  if (rightIndex < 0) return points[points.length - 1].value;
  const left = points[rightIndex - 1], right = points[rightIndex];
  if (left.interpolation === "hold" || right.samplePosition === left.samplePosition) return left.value;
  return left.value + (right.value - left.value) * ((samplePosition - left.samplePosition) / (right.samplePosition - left.samplePosition));
}
