import { describe, expect, it } from "vitest";
import { evaluateTimelineDawMusicianTrialReadiness } from "../../lib/timeline/TimelineDawMusicianTrialReadinessPolicy";

describe("musician trial readiness", () => {
  it("holds a read-only audition session from hands-on trial", () => {
    const result = evaluateTimelineDawMusicianTrialReadiness(["session:read", "transport:read", "feedback:create"]);
    expect(result).toMatchObject({ ready: false, completed: 3, required: 7 });
    expect(result.blockers).toEqual(expect.arrayContaining(["Record a new take", "Make a reversible arrangement edit", "Save and reopen the work", "Create and download a test export"]));
  });

  it("passes only when every essential musician step is granted", () => {
    const result = evaluateTimelineDawMusicianTrialReadiness([
      "session:read", "transport:read", "recording:create", "arrangement:edit", "session:write", "export:create", "feedback:create",
    ]);
    expect(result.ready).toBe(true);
    expect(result.blockers).toEqual([]);
  });
});
