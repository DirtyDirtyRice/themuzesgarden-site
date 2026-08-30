import { describe, expect, it } from "vitest";
import { parseTimelineDawMixerViewMode, timelineDawCompactMixerStorageKey } from "../../lib/timeline/TimelineDawCompactMixerPolicy";

describe("timeline DAW compact mixer policy", () => {
  it("defaults malformed or absent values to the full mixer", () => {
    expect(parseTimelineDawMixerViewMode(null)).toBe("full");
    expect(parseTimelineDawMixerViewMode("tiny")).toBe("full");
  });
  it("restores only the allowlisted compact value", () => expect(parseTimelineDawMixerViewMode("compact")).toBe("compact"));
  it("scopes display preference to one session", () => expect(timelineDawCompactMixerStorageKey("session-1")).toBe("muzes:daw:mixer-view:v1:session-1"));
  it("rejects a missing session", () => expect(() => timelineDawCompactMixerStorageKey(" ")).toThrow(/valid session/i));
});
