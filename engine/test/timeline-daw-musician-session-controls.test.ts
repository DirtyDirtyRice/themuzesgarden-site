import { describe, expect, it } from "vitest";
import { TIMELINE_DAW_MUSICIAN_ACTION, TIMELINE_DAW_MUSICIAN_SESSION_STATE } from "../../lib/timeline/TimelineDawMusicianSessionControls";

describe("DAW musician session controls", () => {
  it("uses music-language labels instead of engine lifecycle commands", () => {
    expect(TIMELINE_DAW_MUSICIAN_ACTION.validate.label).toBe("Check Studio Setup");
    expect(TIMELINE_DAW_MUSICIAN_ACTION.activate.label).toBe("Open Music Tools");
    expect(TIMELINE_DAW_MUSICIAN_ACTION.resume.label).toBe("Continue This Session");
  });

  it("marks only irreversible session closure as dangerous", () => {
    expect(TIMELINE_DAW_MUSICIAN_ACTION.close.danger).toBe(true);
    expect(Object.entries(TIMELINE_DAW_MUSICIAN_ACTION).filter(([, value]) => value.danger).map(([key]) => key)).toEqual(["close"]);
    expect(TIMELINE_DAW_MUSICIAN_ACTION.close.explanation).toContain("cannot");
  });

  it("explains every session state in plain language", () => {
    expect(Object.values(TIMELINE_DAW_MUSICIAN_SESSION_STATE).every((value) => value.label.length > 4 && value.explanation.endsWith("."))).toBe(true);
    expect(TIMELINE_DAW_MUSICIAN_SESSION_STATE.active.label).toContain("music");
  });
});
