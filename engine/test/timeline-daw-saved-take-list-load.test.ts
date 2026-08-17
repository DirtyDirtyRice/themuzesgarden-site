import { describe, expect, it } from "vitest";
import { timelineDawSavedTakeListStatus } from "../../lib/timeline/TimelineDawSavedTakeListLoad";

describe("TimelineDawSavedTakeListLoad", () => {
  it("does not describe an unfinished first load as an empty session", () => {
    expect(timelineDawSavedTakeListStatus({ state: "loading", takeCount: 0 }))
      .toEqual({ summary: "Loading saved takes…", guidance: null });
  });

  it("distinguishes a verified empty session from a load failure", () => {
    expect(timelineDawSavedTakeListStatus({ state: "ready", takeCount: 0 }))
      .toMatchObject({ summary: "No saved takes yet", guidance: expect.stringMatching(/record and save/i) });
    expect(timelineDawSavedTakeListStatus({ state: "failed", takeCount: 0 }))
      .toMatchObject({ summary: "Saved takes could not be confirmed", guidance: expect.stringMatching(/do not assume/i) });
  });

  it("keeps previously loaded takes visible during refresh and failure", () => {
    expect(timelineDawSavedTakeListStatus({ state: "loading", takeCount: 3 }).summary).toMatch(/Refreshing 3/);
    expect(timelineDawSavedTakeListStatus({ state: "failed", takeCount: 3 }).summary).toMatch(/3 previously loaded/);
  });
});
