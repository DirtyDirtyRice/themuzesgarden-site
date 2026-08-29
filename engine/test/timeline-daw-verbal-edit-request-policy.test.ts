import { describe, expect, it } from "vitest";
import {
  parseTimelineDawVerbalEditRequest,
  createTimelineDawProtectedEditPlan,
  summarizeTimelineDawVerbalEditRequest,
  TIMELINE_DAW_VERBAL_EDIT_SCOPES,
} from "../../lib/timeline/TimelineDawVerbalEditRequestPolicy";

describe("DAW verbal edit request policy", () => {
  it("holds a normalized plain-language request without executing an edit", () => {
    const request = parseTimelineDawVerbalEditRequest({
      instruction: "  Keep my riff   under every verse and preserve my melody. ",
      scope: "section",
      preserveSources: true,
    });
    expect(request).toEqual({
      instruction: "Keep my riff under every verse and preserve my melody.",
      scope: "section",
      preserveSources: true,
    });
    expect(summarizeTimelineDawVerbalEditRequest(request)).toMatchObject({
      scopeLabel: "Verse, chorus, bridge, or other section",
      safetyLabel: expect.stringContaining("unchanged"),
    });
  });

  it("supports musical scope from the whole song down to notes", () => {
    expect(TIMELINE_DAW_VERBAL_EDIT_SCOPES.map((item) => item.id)).toEqual([
      "whole-song", "section", "track", "phrase", "notes",
    ]);
  });

  it("rejects missing, oversized, invented-scope, and unprotected requests", () => {
    expect(() => parseTimelineDawVerbalEditRequest({ instruction: "short", scope: "track", preserveSources: true })).toThrow("at least 10");
    expect(() => parseTimelineDawVerbalEditRequest({ instruction: "x".repeat(4_001), scope: "track", preserveSources: true })).toThrow("4,000");
    expect(() => parseTimelineDawVerbalEditRequest({ instruction: "Make the chorus bigger.", scope: "imaginary", preserveSources: true })).toThrow("Choose which part");
    expect(() => parseTimelineDawVerbalEditRequest({ instruction: "Make the chorus bigger.", scope: "section", preserveSources: false })).toThrow("must remain on");
  });

  it("creates a visible held plan while keeping execution locked", () => {
    const request = parseTimelineDawVerbalEditRequest({
      instruction: "Double the guitar riff during the second chorus.",
      scope: "phrase",
      preserveSources: true,
    });
    const plan = createTimelineDawProtectedEditPlan(request);
    expect(plan).toMatchObject({
      status: "held-for-review",
      target: "Phrase, riff, chord, or drum pattern",
      executionAllowed: false,
    });
    expect(plan.steps).toHaveLength(4);
    expect(plan.steps.at(-1)).toContain("musician approval");
    expect(plan.protections.join(" ")).toContain("Do not overwrite");
    expect(plan.questions).toEqual(["Which exact occurrence or time range should this affect?"]);
  });

  it("asks whole-song requests which existing parts must remain unchanged", () => {
    const plan = createTimelineDawProtectedEditPlan(parseTimelineDawVerbalEditRequest({
      instruction: "Turn this phone recording into a rough funky R&B arrangement.",
      scope: "whole-song",
      preserveSources: true,
    }));
    expect(plan.steps[0]).toContain("complete arrangement");
    expect(plan.questions[0]).toContain("remain exactly");
  });
});
