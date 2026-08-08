import { describe, expect, it } from "vitest";
import { parseTimelineDawPrivateAutomationEnvelope, timelineDawPrivateAutomationValue } from "../../lib/timeline/TimelineDawPrivateAutomationPolicy";

describe("private mix automation", () => {
  const envelope = parseTimelineDawPrivateAutomationEnvelope({ sourceKind: "lane", sourceId: "lane-1", parameter: "gain", bypassed: false, points: [
    { id: "a", samplePosition: 0, value: 0, interpolation: "linear" },
    { id: "b", samplePosition: 100, value: 2, interpolation: "hold" },
    { id: "c", samplePosition: 200, value: 1, interpolation: "linear" },
  ] });

  it("validates ordered, bounded, sample-aligned points", () => {
    expect(envelope.points).toHaveLength(3);
    expect(() => parseTimelineDawPrivateAutomationEnvelope({ ...envelope, points: [envelope.points[1], envelope.points[0]] })).toThrow(/monotonically/);
    expect(() => parseTimelineDawPrivateAutomationEnvelope({ ...envelope, points: [{ samplePosition: 0, value: 3, interpolation: "linear" }] })).toThrow(/between 0 and 2/);
  });

  it("evaluates deterministic linear and hold interpolation with bypass", () => {
    expect(timelineDawPrivateAutomationValue(envelope as never, 50, 1)).toBe(1);
    expect(timelineDawPrivateAutomationValue(envelope as never, 150, 1)).toBe(2);
    expect(timelineDawPrivateAutomationValue({ ...envelope, bypassed: true } as never, 50, 0.75)).toBe(0.75);
  });
});
