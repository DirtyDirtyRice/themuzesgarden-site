import { describe, expect, it } from "vitest";
import { findTimelineDawStudioFocusArea, TIMELINE_DAW_STUDIO_FOCUS_AREAS, parseTimelineDawStudioFocusArea, parseTimelineDawStudioScrollPosition, resolveTimelineDawStudioRestoreState, shouldTimelineDawWorkspaceAreaOpen, timelineDawCompactMenuGroups, timelineDawStudioFocusStorageKey, timelineDawStudioScrollStorageKey } from "../../lib/timeline/TimelineDawStudioFocusPolicy";

describe("DAW Studio focus policy", () => {
  it("accepts only known high-level Studio areas", () => {
    expect(parseTimelineDawStudioFocusArea("transport")).toBe("transport");
    expect(parseTimelineDawStudioFocusArea("arrange")).toBe("arrange");
    expect(parseTimelineDawStudioFocusArea("private-lane-id")).toBeNull();
    expect(parseTimelineDawStudioFocusArea({ id: "export" })).toBeNull();
  });

  it("puts essential musician destinations before advanced owner tools", () => {
    const musician = TIMELINE_DAW_STUDIO_FOCUS_AREAS.filter((area) => area.musician);
    expect(musician.map((area) => area.id)).toEqual(["transport", "arrange", "record", "mix", "recover", "export", "verbal"]);
    expect(musician.every((area) => area.help.length >= 20)).toBe(true);
    expect(findTimelineDawStudioFocusArea("arrange")?.label).toContain("MIDI");
    expect(findTimelineDawStudioFocusArea("unknown")).toBeNull();
  });

  it("keeps the musician workflow in a natural song-making order", () => {
    const order = TIMELINE_DAW_STUDIO_FOCUS_AREAS.filter((area) => area.musician).map((area) => area.id);
    expect(order.indexOf("transport")).toBeLessThan(order.indexOf("record"));
    expect(order.indexOf("record")).toBeLessThan(order.indexOf("mix"));
    expect(order.indexOf("mix")).toBeLessThan(order.indexOf("export"));
    expect(order.indexOf("export")).toBeLessThan(order.indexOf("verbal"));
  });

  it("builds one compact, complete, non-duplicated work-area menu", () => {
    const groups = timelineDawCompactMenuGroups();
    expect(groups.map((group) => group.label)).toEqual(["Make music", "Advanced and owner tools"]);
    const areas = [...groups[0].areas, ...groups[1].areas];
    expect(areas.map((area) => area.id)).toEqual(TIMELINE_DAW_STUDIO_FOCUS_AREAS.map((area) => area.id));
    expect(new Set(areas.map((area) => area.id)).size).toBe(areas.length);
    expect(areas.every((area) => area.menuLabel.length >= 3 && area.menuLabel.length <= 21)).toBe(true);
  });

  it("allows exactly one validated Studio work area to remain open", () => {
    const openForMix = TIMELINE_DAW_STUDIO_FOCUS_AREAS.filter((area) => shouldTimelineDawWorkspaceAreaOpen(area.id, "mix"));
    expect(openForMix.map((area) => area.id)).toEqual(["mix"]);
    expect(shouldTimelineDawWorkspaceAreaOpen("record", "mix")).toBe(false);
    expect(shouldTimelineDawWorkspaceAreaOpen("private-lane-id", "mix")).toBe(false);
    expect(shouldTimelineDawWorkspaceAreaOpen("mix", "not-real")).toBe(false);
  });

  it("scopes browser focus state to one session", () => {
    expect(timelineDawStudioFocusStorageKey("session-1")).toBe("muzes:daw-studio-focus:session-1");
    expect(timelineDawStudioScrollStorageKey("session-1")).toBe("muzes:daw-studio-scroll:session-1");
    expect(() => timelineDawStudioFocusStorageKey(" ")).toThrow("valid DAW session");
  });

  it("restores only bounded page positions", () => {
    expect(parseTimelineDawStudioScrollPosition("1234.4")).toBe(1234);
    expect(parseTimelineDawStudioScrollPosition("-5")).toBe(0);
    expect(parseTimelineDawStudioScrollPosition("invalid")).toBe(0);
  });

  it("restores one validated area and bounded scroll position as one refresh state", () => {
    expect(resolveTimelineDawStudioRestoreState("record", "2468.4")).toEqual({ area: "record", scrollTop: 2468 });
    expect(resolveTimelineDawStudioRestoreState("private-lane-id", "-40")).toEqual({ area: null, scrollTop: 0 });
    expect(resolveTimelineDawStudioRestoreState({ area: "mix" }, "not-a-number")).toEqual({ area: null, scrollTop: 0 });
  });
});
