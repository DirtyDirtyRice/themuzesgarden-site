import { describe, expect, it } from "vitest";

import { TimelineLyricPronunciationEngine } from "../../lib/timeline/TimelineLyricPronunciationEngine";

function engineWithLexicon() {
  const engine = new TimelineLyricPronunciationEngine();
  engine.registerLexicon([
    { word: "lead", sense: "guide", phonemes: "L IY D", contextWords: ["way", "follow"] },
    { word: "lead", sense: "metal", phonemes: "L EH D", contextWords: ["heavy", "metal"] },
  ]);
  return engine;
}

describe("TimelineLyricPronunciationEngine", () => {
  it("parses bracketed performance metadata without putting it in sung lyrics", () => {
    const engine = engineWithLexicon();
    const value = engine.createPackage({
      projectId: "song-1",
      name: "Lead lyric",
      sourceText:
        "You lead the way [target=lead;sense=guide;phonemes=L IY D]\n" +
        "Carry me [target=me;holdBars=2;crescendoBeats=2;octaveEnd=1;reference=voice-note-1]",
      createdBy: "writer-1",
    });
    expect(value.plainLyrics).toBe("You lead the way\nCarry me");
    expect(value.directives[1]).toMatchObject({
      target: "me",
      holdBars: 2,
      crescendoBeats: 2,
      octaveEnd: 1,
      referenceAssetId: "voice-note-1",
    });
  });

  it("holds ambiguous same-spelling words for a human answer", () => {
    const engine = engineWithLexicon();
    const value = engine.createPackage({
      projectId: "song-1",
      name: "Ambiguous lyric",
      sourceText: "The lead will remain",
      createdBy: "writer-1",
    });
    const checked = engine.validate({ packageId: value.id, validatedBy: "language-ai" });
    expect(checked.status).toBe("held");
    expect(checked.issues.some((issue) => issue.gate === "context")).toBe(true);
    expect(() => engine.approve({ packageId: checked.id, approvedBy: "producer-1" })).toThrow(
      "three lyric validation gates",
    );
  });

  it("requires a human correction and revalidation before proceeding", () => {
    const engine = engineWithLexicon();
    const value = engine.createPackage({
      projectId: "song-1",
      name: "Corrected lyric",
      sourceText: "The lead will remain",
      createdBy: "writer-1",
    });
    const held = engine.validate({ packageId: value.id, validatedBy: "language-ai" });
    const revised = engine.resolveIssue({
      packageId: held.id,
      issueId: held.issues.find((issue) => issue.gate === "context")!.id,
      resolution: "Lead means the metal.",
      correctedSourceText: "The lead will remain [target=lead;sense=metal;phonemes=L EH D]",
      resolvedBy: "writer-1",
    });
    expect(revised.status).toBe("incomplete");
    const validated = engine.validate({ packageId: revised.id, validatedBy: "language-ai" });
    expect(validated.status).toBe("validated");
    expect(validated.passes).toHaveLength(3);
    expect(validated.passes.every((pass) => pass.passed)).toBe(true);
  });

  it("validates held-note, crescendo, and octave instructions together", () => {
    const engine = engineWithLexicon();
    const value = engine.createPackage({
      projectId: "song-1",
      name: "Broken delivery",
      sourceText: "Carry me [target=me;crescendoBeats=2;octaveEnd=1]",
      createdBy: "writer-1",
    });
    const held = engine.validate({ packageId: value.id, validatedBy: "language-ai" });
    expect(held.status).toBe("held");
    expect(
      held.issues.filter((issue) => issue.gate === "phoneme").map((issue) => issue.message),
    ).toEqual(
      expect.arrayContaining([
        expect.stringContaining("positive held duration"),
        expect.stringContaining("requires a held lyric duration"),
      ]),
    );
  });

  it("requires independent approval and keeps one active package", () => {
    const engine = engineWithLexicon();
    const first = engine.createPackage({
      projectId: "song-1",
      name: "Final lyric",
      sourceText: "You lead the way [target=lead;sense=guide;phonemes=L IY D]",
      createdBy: "writer-1",
    });
    const validated = engine.validate({ packageId: first.id, validatedBy: "language-ai" });
    expect(() => engine.approve({ packageId: validated.id, approvedBy: "writer-1" })).toThrow(
      "independent",
    );
    engine.approve({ packageId: validated.id, approvedBy: "producer-1" });
    expect(engine.activate({ packageId: validated.id, activatedBy: "producer-1" }).status).toBe(
      "active",
    );
  });

  it("restores fingerprinted packages, lexicon, and stable identities", () => {
    const engine = engineWithLexicon();
    const value = engine.createPackage({
      projectId: "song-1",
      name: "Archive lyric",
      sourceText: "You lead the way [target=lead;sense=guide;phonemes=L IY D]",
      createdBy: "writer-1",
    });
    const restored = new TimelineLyricPronunciationEngine();
    restored.restoreArchive(engine.exportArchive());
    expect(restored.getPackage(value.id)?.fingerprint).toBe(value.fingerprint);
    expect(restored.listReceipts()[0].id).toBe("timeline-lyric-receipt-1");
    const next = restored.createPackage({
      projectId: "song-2",
      name: "Next lyric",
      sourceText: "We follow",
      createdBy: "writer-1",
    });
    expect(next.id).toBe("timeline-lyric-package-2");
  });
});
