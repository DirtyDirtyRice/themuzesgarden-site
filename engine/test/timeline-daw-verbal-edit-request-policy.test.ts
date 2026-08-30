import { describe, expect, it } from "vitest";
import {
  parseTimelineDawVerbalEditRequest,
  createTimelineDawProtectedEditPlan,
  decideTimelineDawVerbalEditPlan,
  createTimelineDawVerbalRevisionHistory,
  moveTimelineDawVerbalRevisionHistory,
  recognizeTimelineDawVerbalSections,
  createTimelineDawVerbalSectionRecipe,
  createTimelineDawGeneratedSectionPlan,
  createTimelineDawGeneratedTransitionPlan,
  matchTimelineDawTracksByDescription,
  createTimelineDawPerformanceLayerPlan,
  createTimelineDawHarmonyContext,
  createTimelineDawHarmonyRecipe,
  createTimelineDawInstrumentRangePlan,
  createTimelineDawMicroEditRecipe,
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

  it("prepares a provider-held verse, chorus, or bridge with exact musical placement", () => {
    const sections = [{ id: "verse", name: "Verse", startTick: 0, endTick: 7680 }];
    const plan = createTimelineDawGeneratedSectionPlan({ sectionType: "bridge", bars: 8, beatsPerBar: 4, ticksPerBeat: 960, prompt: "Use the verse groove with a new sax response.", sections, placementAfterSectionId: "verse" });
    expect(plan).toMatchObject({ name: "Generated Bridge", durationTicks: 30720, placementStartTick: 7680, status: "held-for-generation-provider", executionAllowed: false });
    expect(plan.requiredProvenance).toEqual(["provider", "model", "request-id", "rights-record", "output-fingerprint"]);
  });

  it("rejects unsupported section generation and invented placement", () => {
    const sections = [{ id: "verse", name: "Verse", startTick: 0, endTick: 100 }];
    expect(() => createTimelineDawGeneratedSectionPlan({ sectionType: "solo", bars: 8, prompt: "Make a long guitar solo section.", sections })).toThrow("verse, chorus, or bridge");
    expect(() => createTimelineDawGeneratedSectionPlan({ sectionType: "verse", bars: 0, prompt: "Make a second verse section.", sections })).toThrow("1 to 128");
    expect(() => createTimelineDawGeneratedSectionPlan({ sectionType: "chorus", bars: 8, prompt: "too short", sections })).toThrow("at least 10");
    expect(() => createTimelineDawGeneratedSectionPlan({ sectionType: "bridge", bars: 8, prompt: "Make a contrasting bridge section.", sections, placementAfterSectionId: "missing" })).toThrow("not found");
  });

  it("plans entry and exit transitions around a generated section", () => {
    const sections = [
      { id: "verse", name: "Verse", startTick: 0, endTick: 7680 },
      { id: "chorus", name: "Chorus", startTick: 7680, endTick: 15360 },
    ];
    const generationPlan = createTimelineDawGeneratedSectionPlan({ sectionType: "bridge", bars: 8, prompt: "Create a contrasting bridge groove.", sections, placementAfterSectionId: "verse" });
    expect(createTimelineDawGeneratedTransitionPlan({ generationPlan, sections, style: "crossfade", crossfadeTicks: 240, tempoCompatibility: "confirmed", keyCompatibility: "confirmed" })).toMatchObject({ entryFromSectionId: "verse", exitToSectionId: "chorus", crossfadeTicks: 240, warnings: [], status: "held-for-transition-review", executionAllowed: false });
  });

  it("holds unconfirmed tempo/key and validates transition boundaries", () => {
    const sections = [{ id: "verse", name: "Verse", startTick: 0, endTick: 7680 }];
    const generationPlan = createTimelineDawGeneratedSectionPlan({ sectionType: "chorus", bars: 4, prompt: "Create a bright chorus response.", sections });
    const held = createTimelineDawGeneratedTransitionPlan({ generationPlan, sections, style: "pickup" });
    expect(held).toMatchObject({ entryFromSectionId: "verse", exitToSectionId: null, preservePickup: true });
    expect(held.warnings).toHaveLength(2);
    expect(() => createTimelineDawGeneratedTransitionPlan({ generationPlan, sections, style: "crossfade", crossfadeTicks: 0 })).toThrow("positive crossfade");
    expect(() => createTimelineDawGeneratedTransitionPlan({ generationPlan, sections, style: "crossfade", crossfadeTicks: generationPlan.durationTicks })).toThrow("safe whole-tick");
  });

  it("matches spoken instrument descriptions to real session tracks", () => {
    const tracks = [
      { id: "guitar", name: "Lead Electric Guitar", kind: "audio" as const },
      { id: "drums", name: "Main Drum Kit", kind: "audio" as const },
      { id: "vocal", name: "Background Vocals", kind: "audio" as const },
    ];
    expect(matchTimelineDawTracksByDescription({ description: "double the lead guitar", tracks })).toMatchObject({ selectedTrackId: "guitar", confidence: "high", executionAllowed: false });
    expect(matchTimelineDawTracksByDescription({ description: "Background Vocals", tracks })).toMatchObject({ selectedTrackId: "vocal", confidence: "exact" });
  });

  it("holds ambiguous track descriptions and accepts explicit musician selection", () => {
    const tracks = [
      { id: "guitar-1", name: "Rhythm Guitar Left", kind: "audio" as const },
      { id: "guitar-2", name: "Rhythm Guitar Right", kind: "audio" as const },
    ];
    expect(matchTimelineDawTracksByDescription({ description: "rhythm guitar", tracks })).toMatchObject({ selectedTrackId: null, confidence: "ambiguous" });
    expect(matchTimelineDawTracksByDescription({ description: "rhythm guitar", tracks, selectedTrackId: "guitar-2" }).selectedTrackId).toBe("guitar-2");
    expect(matchTimelineDawTracksByDescription({ description: "saxophone", tracks })).toMatchObject({ selectedTrackId: null, confidence: "unmatched", matches: [] });
  });

  it("plans a source-preserving performance double", () => {
    const tracks = [{ id: "lead", name: "Lead Guitar", kind: "audio" as const }];
    expect(createTimelineDawPerformanceLayerPlan({ instruction: "Double the lead guitar performance", tracks, sourceTrackId: "lead" })).toEqual({
      sourceTrackId: "lead",
      sourceTrackName: "Lead Guitar",
      operation: "double",
      addedLayerCount: 1,
      layerNames: ["Lead Guitar Double 1"],
      placement: "same-timeline-position",
      timingPolicy: "source-locked-pending-humanize-review",
      sourceMutable: false,
      status: "held-for-layer-review",
      executionAllowed: false,
    });
  });

  it("plans two added layers for a triple and rejects uncertain targets", () => {
    const tracks = [{ id: "sax", name: "Tenor Sax", kind: "audio" as const }];
    expect(createTimelineDawPerformanceLayerPlan({ instruction: "Triple this sax performance", tracks, sourceTrackId: "sax" })).toMatchObject({ operation: "triple", addedLayerCount: 2, layerNames: ["Tenor Sax Triple 1", "Tenor Sax Triple 2"] });
    expect(() => createTimelineDawPerformanceLayerPlan({ instruction: "Layer the sax", tracks, sourceTrackId: "sax" })).toThrow("double or triple");
    expect(() => createTimelineDawPerformanceLayerPlan({ instruction: "Double the sax", tracks, sourceTrackId: null })).toThrow("Confirm the real source track");
  });

  it("holds confirmed tonic, scale, chord, and interval context without editing", () => {
    expect(createTimelineDawHarmonyContext({ tonic: "Bb", scale: "mixolydian", chord: "Bb7", interval: "third", direction: "above" })).toEqual({
      tonic: "Bb",
      scale: "mixolydian",
      chord: "Bb7",
      interval: "third",
      direction: "above",
      reference: "confirmed-chord",
      ambiguities: [],
      status: "held-for-harmony-context-review",
      executionAllowed: false,
    });
  });

  it("flags missing chord context and rejects unsupported musical context", () => {
    expect(createTimelineDawHarmonyContext({ tonic: "F#", scale: "minor", interval: "fifth", direction: "below" })).toMatchObject({ reference: "tonic-and-scale", ambiguities: [expect.stringContaining("Chord-by-chord")] });
    expect(() => createTimelineDawHarmonyContext({ tonic: "H", scale: "major", interval: "third", direction: "above" })).toThrow("Confirm a tonic");
    expect(() => createTimelineDawHarmonyContext({ tonic: "C", scale: "blues", interval: "third", direction: "above" })).toThrow("supported scale");
    expect(() => createTimelineDawHarmonyContext({ tonic: "C", scale: "major", interval: "seventh", direction: "above" })).toThrow("third or fifth");
  });

  it("prepares a nondestructive harmony recipe for a selected timeline range", () => {
    const context = createTimelineDawHarmonyContext({ tonic: "A", scale: "minor", chord: "Am7", interval: "third", direction: "above" });
    const tracks = [{ id: "lead", name: "Lead Vocal", kind: "audio" as const }];
    expect(createTimelineDawHarmonyRecipe({ context, tracks, sourceTrackId: "lead", startTick: 960, endTick: 2880 })).toEqual({
      sourceTrackId: "lead",
      sourceTrackName: "Lead Vocal",
      startTick: 960,
      endTick: 2880,
      interval: "third",
      direction: "above",
      tonalReference: "Am7",
      notePolicy: "confirmed-chord-tones",
      outputLaneName: "Lead Vocal Harmony third above",
      preserveRhythm: true,
      preserveSource: true,
      status: "held-for-harmony-note-review",
      executionAllowed: false,
    });
  });

  it("uses scale context when no chord is confirmed and validates the selected range", () => {
    const context = createTimelineDawHarmonyContext({ tonic: "D", scale: "dorian", interval: "fifth", direction: "below" });
    const tracks = [{ id: "riff", name: "Main Riff", kind: "audio" as const }];
    expect(createTimelineDawHarmonyRecipe({ context, tracks, sourceTrackId: "riff", startTick: 0, endTick: 3840 })).toMatchObject({ tonalReference: "D dorian", notePolicy: "diatonic-scale" });
    expect(() => createTimelineDawHarmonyRecipe({ context, tracks, sourceTrackId: null, startTick: 0, endTick: 3840 })).toThrow("Confirm the real source track");
    expect(() => createTimelineDawHarmonyRecipe({ context, tracks, sourceTrackId: "riff", startTick: 100, endTick: 100 })).toThrow("after the start");
  });

  it("limits a replacement instrument to a real named section", () => {
    const tracks = [{ id: "lead", name: "Lead Guitar", kind: "audio" as const }];
    const sections = [{ id: "solo", name: "Solo 1", startTick: 7680, endTick: 11520 }];
    expect(createTimelineDawInstrumentRangePlan({ tracks, sourceTrackId: "lead", targetInstrument: "Tenor Sax", sections, sectionId: "solo", crossfadeTicks: 120 })).toEqual({
      sourceTrackId: "lead",
      sourceTrackName: "Lead Guitar",
      targetInstrument: "Tenor Sax",
      rangeSource: "named-section",
      sectionId: "solo",
      sectionName: "Solo 1",
      startTick: 7680,
      endTick: 11520,
      entryCrossfadeTicks: 120,
      exitCrossfadeTicks: 120,
      outsideRangePolicy: "original-instrument-only",
      preserveSource: true,
      status: "held-for-instrument-range-review",
      executionAllowed: false,
    });
  });

  it("supports exact tick ranges and rejects unsafe boundaries", () => {
    const tracks = [{ id: "riff", name: "Main Riff", kind: "audio" as const }];
    expect(createTimelineDawInstrumentRangePlan({ tracks, sourceTrackId: "riff", targetInstrument: "Muted Trumpet", sections: [], startTick: 960, endTick: 1920 })).toMatchObject({ rangeSource: "exact-ticks", sectionId: null, startTick: 960, endTick: 1920 });
    expect(() => createTimelineDawInstrumentRangePlan({ tracks, sourceTrackId: "riff", targetInstrument: "x", sections: [], startTick: 0, endTick: 960 })).toThrow("2 to 100");
    expect(() => createTimelineDawInstrumentRangePlan({ tracks, sourceTrackId: "riff", targetInstrument: "Sax", sections: [], sectionId: "missing" })).toThrow("no longer exists");
    expect(() => createTimelineDawInstrumentRangePlan({ tracks, sourceTrackId: "riff", targetInstrument: "Sax", sections: [], startTick: 0, endTick: 100, crossfadeTicks: 51 })).toThrow("fit safely");
  });

  it("holds a precise verbal riff edit as a protected draft revision", () => {
    const tracks = [{ id: "bass", name: "Bass Guitar", kind: "audio" as const }];
    expect(createTimelineDawMicroEditRecipe({ tracks, sourceTrackId: "bass", targetKind: "riff", targetLabel: "opening bass riff", startTick: 0, endTick: 960, operation: "repeat", instruction: "Repeat the opening bass riff one more time." })).toEqual({
      sourceTrackId: "bass",
      sourceTrackName: "Bass Guitar",
      targetKind: "riff",
      targetLabel: "opening bass riff",
      startTick: 0,
      endTick: 960,
      operation: "repeat",
      instruction: "Repeat the opening bass riff one more time.",
      precision: "range-confirmed",
      sourceMutable: false,
      createsDraftRevision: true,
      status: "held-for-micro-edit-review",
      executionAllowed: false,
    });
  });

  it("supports phrase, chord, and note targets while rejecting vague micro-edits", () => {
    const tracks = [{ id: "keys", name: "Electric Piano", kind: "midi" as const }];
    for (const targetKind of ["phrase", "chord", "note"] as const) {
      expect(createTimelineDawMicroEditRecipe({ tracks, sourceTrackId: "keys", targetKind, targetLabel: `${targetKind} target`, startTick: 480, endTick: 960, operation: "transpose", instruction: `Transpose this ${targetKind} up within the confirmed key.` })).toMatchObject({ targetKind, operation: "transpose", executionAllowed: false });
    }
    expect(() => createTimelineDawMicroEditRecipe({ tracks, sourceTrackId: "keys", targetKind: "beat", targetLabel: "beat", startTick: 0, endTick: 480, operation: "move", instruction: "Move this beat to the next bar." })).toThrow("phrase, riff, chord, or note");
    expect(() => createTimelineDawMicroEditRecipe({ tracks, sourceTrackId: "keys", targetKind: "note", targetLabel: "C4", startTick: 480, endTick: 480, operation: "move", instruction: "Move this note to the next beat." })).toThrow("after the start");
  });
});
