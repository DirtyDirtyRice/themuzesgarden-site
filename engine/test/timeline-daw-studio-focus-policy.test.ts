import { describe, expect, it } from "vitest";
import { findTimelineDawStudioFocusArea, TIMELINE_DAW_STUDIO_FOCUS_AREAS, parseTimelineDawStudioFocusArea, timelineDawStudioFocusStorageKey } from "../../lib/timeline/TimelineDawStudioFocusPolicy";

describe("DAW Studio focus policy", () => {
  it("accepts only known high-level Studio areas", () => {
    expect(parseTimelineDawStudioFocusArea("transport")).toBe("transport");
    expect(parseTimelineDawStudioFocusArea("arrange")).toBe("arrange");
    expect(parseTimelineDawStudioFocusArea("private-lane-id")).toBeNull();
    expect(parseTimelineDawStudioFocusArea({ id: "export" })).toBeNull();
  });

  it("puts essential musician destinations before advanced owner tools", () => {
    const musician = TIMELINE_DAW_STUDIO_FOCUS_AREAS.filter((area) => area.musician);
    expect(musician.map((area) => area.id)).toEqual(["transport", "arrange", "record", "mix", "recover", "export"]);
    expect(musician.every((area) => area.help.length >= 20)).toBe(true);
    expect(findTimelineDawStudioFocusArea("arrange")?.label).toContain("MIDI");
    expect(findTimelineDawStudioFocusArea("unknown")).toBeNull();
  });

  it("keeps the musician workflow in a natural song-making order", () => {
    const order = TIMELINE_DAW_STUDIO_FOCUS_AREAS.filter((area) => area.musician).map((area) => area.id);
    expect(order.indexOf("transport")).toBeLessThan(order.indexOf("record"));
    expect(order.indexOf("record")).toBeLessThan(order.indexOf("mix"));
    expect(order.indexOf("mix")).toBeLessThan(order.indexOf("export"));
  });

  it("scopes browser focus state to one session", () => {
    expect(timelineDawStudioFocusStorageKey("session-1")).toBe("muzes:daw-studio-focus:session-1");
    expect(() => timelineDawStudioFocusStorageKey(" ")).toThrow("valid DAW session");
  });
});
