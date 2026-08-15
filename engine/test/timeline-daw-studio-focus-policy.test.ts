import { describe, expect, it } from "vitest";
import { parseTimelineDawStudioFocusArea, timelineDawStudioFocusStorageKey } from "../../lib/timeline/TimelineDawStudioFocusPolicy";

describe("DAW Studio focus policy", () => {
  it("accepts only known high-level Studio areas", () => {
    expect(parseTimelineDawStudioFocusArea("transport")).toBe("transport");
    expect(parseTimelineDawStudioFocusArea("private-lane-id")).toBeNull();
    expect(parseTimelineDawStudioFocusArea({ id: "export" })).toBeNull();
  });

  it("scopes browser focus state to one session", () => {
    expect(timelineDawStudioFocusStorageKey("session-1")).toBe("muzes:daw-studio-focus:session-1");
    expect(() => timelineDawStudioFocusStorageKey(" ")).toThrow("valid DAW session");
  });
});
