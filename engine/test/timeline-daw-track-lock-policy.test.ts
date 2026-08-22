import { describe, expect, it } from "vitest";
import { parseTimelineDawTrackLocks, serializeTimelineDawTrackLocks, toggleTimelineDawTrackLock } from "../../lib/timeline/TimelineDawTrackLockPolicy";

describe("DAW track lock policy", () => {
  it("restores only exact lanes that still belong to the session", () => {
    expect([...parseTimelineDawTrackLocks('["lane-b","foreign","lane-a"]', ["lane-a", "lane-b"])]).toEqual(["lane-b", "lane-a"]);
    expect(parseTimelineDawTrackLocks("broken", ["lane-a"]).size).toBe(0);
  });

  it("locks and unlocks one lane without changing another lane", () => {
    const locked = toggleTimelineDawTrackLock(new Set(["lane-a"]), "lane-b");
    expect(serializeTimelineDawTrackLocks(locked)).toBe('["lane-a","lane-b"]');
    expect([...toggleTimelineDawTrackLock(locked, "lane-a")]).toEqual(["lane-b"]);
  });
});
