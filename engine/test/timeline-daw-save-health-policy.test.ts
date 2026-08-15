import { describe, expect, it } from "vitest";
import { createTimelineDawSaveHealthView } from "../../lib/timeline/TimelineDawSaveHealthPolicy";

describe("DAW save health policy", () => {
  it("reports the authoritative saved revision", () => {
    expect(createTimelineDawSaveHealthView("saved", 12)).toMatchObject({ label: "Saved", detail: "Durable workspace revision 12 is current.", canRefresh: false });
  });

  it("distinguishes saving, stale, and conflict states", () => {
    expect(createTimelineDawSaveHealthView("saving", 4).label).toBe("Saving…");
    expect(createTimelineDawSaveHealthView("stale", 4)).toMatchObject({ tone: "warning", canRefresh: true });
    expect(createTimelineDawSaveHealthView("conflicted", 4)).toMatchObject({ tone: "danger", canRefresh: true });
  });
});
