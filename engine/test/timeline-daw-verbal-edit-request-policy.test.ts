import { describe, expect, it } from "vitest";
import {
  parseTimelineDawVerbalEditRequest,
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
});
