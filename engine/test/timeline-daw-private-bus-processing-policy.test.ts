import { describe, expect, it } from "vitest";
import { assertTimelineDawPrivateBusSendAcyclic, parseTimelineDawPrivateInsert, parseTimelineDawPrivateSend } from "../../lib/timeline/TimelineDawPrivateBusProcessingPolicy";

describe("private bus processing policy", () => {
  it("accepts bounded pre-fader sends and effect parameters", () => {
    expect(parseTimelineDawPrivateSend({ sourceKind: "lane", sourceId: "lane", destinationBusId: "bus", level: 0.5, preFader: true, muted: false }).level).toBe(0.5);
    expect(parseTimelineDawPrivateInsert({ sourceKind: "bus", sourceId: "bus", slot: 1, effect: "compressor", bypassed: false, parameters: { threshold: -18, ratio: 3 } }).parameters).toEqual({ threshold: -18, ratio: 3 });
  });
  it("rejects direct and transitive bus feedback", () => {
    expect(() => parseTimelineDawPrivateSend({ sourceKind: "bus", sourceId: "a", destinationBusId: "a", level: 1, preFader: false, muted: false })).toThrow(/itself/);
    expect(() => assertTimelineDawPrivateBusSendAcyclic([{ sourceKind: "bus", sourceId: "a", destinationBusId: "b", muted: false }, { sourceKind: "bus", sourceId: "b", destinationBusId: "c", muted: false }, { sourceKind: "bus", sourceId: "c", destinationBusId: "a", muted: false }])).toThrow(/feedback cycle/);
  });
  it("ignores muted edges while checking cycles", () => {
    expect(() => assertTimelineDawPrivateBusSendAcyclic([{ sourceKind: "bus", sourceId: "a", destinationBusId: "b", muted: false }, { sourceKind: "bus", sourceId: "b", destinationBusId: "a", muted: true }])).not.toThrow();
  });
});
