import { describe, expect, it } from "vitest";
import { isTimelineDawPrivateFreezeStale, parseTimelineDawPrivateFreezeTarget, timelineDawPrivateFreezeRecipeChecksum } from "../../lib/timeline/TimelineDawPrivateFreezePolicy";
const recipe = { sourceKind: "bus" as const, sourceId: "bus-1", laneIds: ["lane-1"], routing: { gain: 1 }, inserts: [{ slot: 0 }], sends: [] };
describe("private freeze policy", () => {
  it("fingerprints canonical processing recipes", () => { expect(timelineDawPrivateFreezeRecipeChecksum(recipe)).toMatch(/^sha256:[a-f0-9]{64}$/); expect(timelineDawPrivateFreezeRecipeChecksum({ ...recipe, routing: { gain: 0.5 } })).not.toBe(timelineDawPrivateFreezeRecipeChecksum(recipe)); });
  it("detects stale freezes", () => { const checksum = timelineDawPrivateFreezeRecipeChecksum(recipe); expect(isTimelineDawPrivateFreezeStale(checksum, recipe)).toBe(false); expect(isTimelineDawPrivateFreezeStale(checksum, { ...recipe, sends: [{ level: 1 }] })).toBe(true); });
  it("validates lane and bus targets", () => { expect(parseTimelineDawPrivateFreezeTarget({ sourceKind: "lane", sourceId: " lane-1 " })).toEqual({ sourceKind: "lane", sourceId: "lane-1" }); expect(() => parseTimelineDawPrivateFreezeTarget({ sourceKind: "master", sourceId: "x" })).toThrow(/lane or bus/); });
});
