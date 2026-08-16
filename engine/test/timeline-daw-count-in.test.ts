import { describe, expect, it } from "vitest";
import { createTimelineDawCountIn } from "../../lib/timeline/TimelineDawCountIn";

describe("audible DAW count-in", () => {
  it("creates tempo and meter aware accented beats", () => {
    const beats = createTimelineDawCountIn({ bars: 2, beatsPerBar: 3, bpm: 120 });
    expect(beats).toHaveLength(6);
    expect(beats[0]).toMatchObject({ bar: 1, beat: 1, accent: true, delayMs: 500 });
    expect(beats[3]).toMatchObject({ bar: 2, beat: 1, accent: true });
  });
  it("allows no count-in and rejects unsafe timing", () => {
    expect(createTimelineDawCountIn({ bars: 0, beatsPerBar: 4, bpm: 120 })).toEqual([]);
    expect(() => createTimelineDawCountIn({ bars: 9, beatsPerBar: 4, bpm: 120 })).toThrow();
  });
});
