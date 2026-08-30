import { describe, expect, it } from "vitest";
import {
  parseTimelineDawVerbalEditRequest,
  createTimelineDawProtectedEditPlan,
  decideTimelineDawVerbalEditPlan,
  createTimelineDawVerbalRevisionHistory,
  moveTimelineDawVerbalRevisionHistory,
  recognizeTimelineDawVerbalSections,
  createTimelineDawVerbalSectionRecipe,
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

  it("records approval without unlocking musical execution", () => {
    expect(decideTimelineDawVerbalEditPlan({ decision: "approved" })).toEqual({
      status: "approved",
      explanation: "The musician approved this plan for a later protected execution step.",
      executionAllowed: false,
    });
  });

  it("requires an explanation for rejection and revision", () => {
    expect(() => decideTimelineDawVerbalEditPlan({ decision: "rejected" })).toThrow("Explain");
    expect(() => decideTimelineDawVerbalEditPlan({ decision: "revision-requested", explanation: "no" })).toThrow("Explain");
    expect(decideTimelineDawVerbalEditPlan({ decision: "revision-requested", explanation: "  Keep the original drums.  " })).toEqual({
      status: "revision-requested",
      explanation: "Keep the original drums.",
      executionAllowed: false,
    });
  });

  it("rejects invented decisions and oversized explanations", () => {
    expect(() => decideTimelineDawVerbalEditPlan({ decision: "apply-now" })).toThrow("Choose approve");
    expect(() => decideTimelineDawVerbalEditPlan({ decision: "rejected", explanation: "x".repeat(2_001) })).toThrow("2,000");
  });

  it("creates a protected draft over an immutable source only after approval", () => {
    const request = parseTimelineDawVerbalEditRequest({ instruction: "Extend the bridge by four bars.", scope: "section", preserveSources: true });
    expect(() => createTimelineDawVerbalRevisionHistory({ request, decision: decideTimelineDawVerbalEditPlan({ decision: "rejected", explanation: "Keep the bridge unchanged." }) })).toThrow("Approve");
    const history = createTimelineDawVerbalRevisionHistory({ request, decision: decideTimelineDawVerbalEditPlan({ decision: "approved" }) });
    expect(history.activeIndex).toBe(1);
    expect(history.revisions).toHaveLength(2);
    expect(history.revisions[0]).toMatchObject({ kind: "immutable-source", sourceMutable: false, parentRevisionId: null });
    expect(history.revisions[1]).toMatchObject({ kind: "protected-draft", sourceMutable: false, parentRevisionId: history.revisions[0].id });
    expect(history.revisions[1].sourceId).toBe(history.revisions[0].sourceId);
  });

  it("undoes instantly to the original and redoes the protected draft", () => {
    const request = parseTimelineDawVerbalEditRequest({ instruction: "Double the final guitar phrase.", scope: "phrase", preserveSources: true });
    const history = createTimelineDawVerbalRevisionHistory({ request, decision: decideTimelineDawVerbalEditPlan({ decision: "approved" }) });
    const undone = moveTimelineDawVerbalRevisionHistory(history, "undo");
    expect(undone.activeIndex).toBe(0);
    expect(undone.revisions).toBe(history.revisions);
    expect(moveTimelineDawVerbalRevisionHistory(undone, "redo").activeIndex).toBe(1);
    expect(moveTimelineDawVerbalRevisionHistory(undone, "undo").activeIndex).toBe(0);
  });

  it("recognizes one exact saved section name and selects its protected range", () => {
    const result = recognizeTimelineDawVerbalSections({ instruction: "Extend the Bridge by four bars.", sections: [
      { id: "verse-1", name: "Verse 1", startTick: 0, endTick: 7680 },
      { id: "bridge", name: "Bridge", startTick: 7680, endTick: 11520 },
    ] });
    expect(result).toMatchObject({ recognizedSectionIds: ["bridge"], selectedSectionId: "bridge", confidence: "exact" });
    expect(result.sections[1]).toMatchObject({ name: "Bridge", startTick: 7680, endTick: 11520 });
  });

  it("holds ambiguous or unmatched section wording for explicit musician selection", () => {
    const sections = [
      { id: "chorus-1", name: "Chorus 1", startTick: 0, endTick: 3840 },
      { id: "chorus-2", name: "Chorus 2", startTick: 3840, endTick: 7680 },
    ];
    expect(recognizeTimelineDawVerbalSections({ instruction: "Copy Chorus 1 after Chorus 2.", sections })).toMatchObject({ confidence: "ambiguous", selectedSectionId: null });
    expect(recognizeTimelineDawVerbalSections({ instruction: "Make that part longer.", sections, selectedSectionId: "chorus-2" })).toMatchObject({ confidence: "unmatched", selectedSectionId: "chorus-2" });
  });

  it("rejects malformed section ranges before presenting named targets", () => {
    expect(recognizeTimelineDawVerbalSections({ instruction: "Extend Verse.", sections: [
      { id: "bad", name: "Bad", startTick: 100, endTick: 50 },
      { id: "verse", name: "Verse", startTick: 0, endTick: 1920 },
    ] }).sections).toEqual([{ id: "verse", name: "Verse", startTick: 0, endTick: 1920 }]);
  });

  it("previews copy, move, remove, and extend as source-preserving complete-section recipes", () => {
    const sections = [
      { id: "verse", name: "Verse", startTick: 0, endTick: 100 },
      { id: "chorus", name: "Chorus", startTick: 100, endTick: 180 },
      { id: "bridge", name: "Bridge", startTick: 180, endTick: 240 },
    ];
    const copied = createTimelineDawVerbalSectionRecipe({ operation: "copy", sections, sourceSectionId: "chorus", destinationSectionId: "bridge" });
    expect(copied.after.map((section) => section.name)).toEqual(["Verse", "Chorus", "Bridge", "Chorus Copy"]);
    expect(copied.after[3]).toMatchObject({ sourceSectionId: "chorus", startTick: 240, endTick: 320 });
    expect(createTimelineDawVerbalSectionRecipe({ operation: "move", sections, sourceSectionId: "bridge", destinationSectionId: "verse" }).after.map((section) => section.name)).toEqual(["Verse", "Bridge", "Chorus"]);
    expect(createTimelineDawVerbalSectionRecipe({ operation: "remove", sections, sourceSectionId: "chorus" }).after.map((section) => section.name)).toEqual(["Verse", "Bridge"]);
    expect(createTimelineDawVerbalSectionRecipe({ operation: "extend", sections, sourceSectionId: "verse", durationTicks: 20 }).after[1].startTick).toBe(120);
    expect(copied.executionAllowed).toBe(false);
  });

  it("adds a named placeholder section and rejects unsafe section recipes", () => {
    const sections = [{ id: "verse", name: "Verse", startTick: 0, endTick: 100 }];
    expect(createTimelineDawVerbalSectionRecipe({ operation: "add", sections, addedName: "New Bridge", durationTicks: 60 }).after[1]).toMatchObject({ name: "New Bridge", startTick: 100, endTick: 160, sourceSectionId: null });
    expect(() => createTimelineDawVerbalSectionRecipe({ operation: "remove", sections, sourceSectionId: "missing" })).toThrow("source section");
    expect(() => createTimelineDawVerbalSectionRecipe({ operation: "extend", sections, sourceSectionId: "verse", durationTicks: -1 })).toThrow("positive");
  });
});
