import { describe, expect, it } from "vitest";
import { addTimelineDawTrackRegionLabel, createTimelineDawTrackRegionSequence, parseTimelineDawTrackRegionLabels, removeTimelineDawTrackRegionLabel, timelineDawTrackLocalSeconds, updateTimelineDawTrackRegionLabel } from "../../lib/timeline/TimelineDawTrackRegionLabelPolicy";

describe("DAW track region label policy", () => {
  it("converts the timeline playhead into stretched track-local seconds", () => {
    expect(timelineDawTrackLocalSeconds({ playheadSeconds: 14, timelineStartSeconds: 10, sourceDurationSeconds: 20, stretchRatio: 2, transformBypassed: false })).toBe(2);
    expect(timelineDawTrackLocalSeconds({ playheadSeconds: 40, timelineStartSeconds: 10, sourceDurationSeconds: 20, stretchRatio: 2, transformBypassed: true })).toBe(20);
  });

  it("restores only bounded labels belonging to current lanes", () => {
    const stored = JSON.stringify({ a: [{ id: "one", laneId: "a", name: " Chorus ", startSeconds: 2, endSeconds: 5, color: "rose" }, { id: "bad", laneId: "a", name: "Bad", startSeconds: 8, endSeconds: 20, color: "cyan" }], foreign: [{ id: "x", laneId: "foreign", name: "X", startSeconds: 0, endSeconds: 1, color: "cyan" }] });
    expect(parseTimelineDawTrackRegionLabels(stored, { a: 10 })).toEqual({ a: [{ id: "one", laneId: "a", name: "Chorus", startSeconds: 2, endSeconds: 5, color: "rose" }] });
    expect(parseTimelineDawTrackRegionLabels("broken", { a: 10 })).toEqual({});
  });

  it("adds and removes a named region without touching another lane", () => {
    const added = addTimelineDawTrackRegionLabel({}, { id: "r1", laneId: "a", name: "Verse", startSeconds: 1, endSeconds: 3, color: "cyan" });
    expect(added.a).toHaveLength(1);
    expect(removeTimelineDawTrackRegionLabel({ ...added, b: [{ id: "r2", laneId: "b", name: "Solo", startSeconds: 2, endSeconds: 4, color: "amber" }] }, "a", "r1")).toEqual({ b: [{ id: "r2", laneId: "b", name: "Solo", startSeconds: 2, endSeconds: 4, color: "amber" }] });
  });

  it("plays named regions in musical timeline order without changing the labels", () => {
    const labels = [
      { id: "chorus", laneId: "a", name: "Chorus", startSeconds: 20, endSeconds: 24, color: "rose" as const },
      { id: "verse", laneId: "a", name: "Verse", startSeconds: 4, endSeconds: 8, color: "cyan" as const },
    ];
    expect(createTimelineDawTrackRegionSequence(labels)).toEqual([
      { laneId: "a", startSeconds: 4, endSeconds: 8 },
      { laneId: "a", startSeconds: 20, endSeconds: 24 },
    ]);
    expect(labels[0].name).toBe("Chorus");
  });

  it("renames and moves a saved boundary only when the complete region stays valid", () => {
    const labels = { a: [{ id: "r1", laneId: "a", name: "Verse", startSeconds: 2, endSeconds: 6, color: "cyan" as const }] };
    expect(updateTimelineDawTrackRegionLabel(labels, "a", "r1", { name: " Pre-Chorus ", startSeconds: 3 }, 10).a[0]).toMatchObject({ name: "Pre-Chorus", startSeconds: 3, endSeconds: 6 });
    expect(updateTimelineDawTrackRegionLabel(labels, "a", "r1", { startSeconds: 7 }, 10)).toBe(labels);
    expect(updateTimelineDawTrackRegionLabel(labels, "a", "r1", { endSeconds: 11 }, 10)).toBe(labels);
  });
});
