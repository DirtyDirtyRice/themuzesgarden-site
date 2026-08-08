import { describe, expect, it } from "vitest";
import { parseTimelineDawTakeCompPromotion } from "../../lib/timeline/TimelineDawTakeCompPromotionPolicy";

const checksum = `sha256:${"a".repeat(64)}`;

describe("TimelineDawTakeCompPromotionPolicy", () => {
  it("normalizes a completed render and allows a newer render to be re-promoted", () => {
    expect(parseTimelineDawTakeCompPromotion({
      compId: "comp-1",
      name: "  Lead Vocal Comp  ",
      renderUri: "supabase://timeline-daw-renders/owner/session/comp-1.wav",
      renderChecksum: checksum.toUpperCase(),
      promotedSourceUri: "supabase://timeline-daw-render-sources/owner/session/old.wav",
      promotedRenderChecksum: `sha256:${"b".repeat(64)}`,
    })).toEqual({
      compId: "comp-1",
      renderUri: "supabase://timeline-daw-renders/owner/session/comp-1.wav",
      renderChecksum: checksum,
      sourceName: "Lead-Vocal-Comp-promoted.wav",
    });
  });

  it("rejects missing, invalid, and already-current renders", () => {
    expect(() => parseTimelineDawTakeCompPromotion({ compId: "comp-1" })).toThrow(/completed comp render/);
    expect(() => parseTimelineDawTakeCompPromotion({
      compId: "comp-1", name: "Comp", renderUri: "render.wav", renderChecksum: "bad",
    })).toThrow(/checksum/);
    expect(() => parseTimelineDawTakeCompPromotion({
      compId: "comp-1",
      name: "Comp",
      renderUri: "render.wav",
      renderChecksum: checksum,
      promotedSourceUri: "source.wav",
      promotedRenderChecksum: checksum,
    })).toThrow(/already promoted/);
  });
});
