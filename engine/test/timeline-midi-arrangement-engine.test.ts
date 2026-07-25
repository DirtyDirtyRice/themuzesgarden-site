import { describe, expect, it } from "vitest";

import { TimelineMidiArrangementEngine } from "../../lib/timeline/TimelineMidiArrangementEngine";

function create(engine = new TimelineMidiArrangementEngine()) {
  const arrangement = engine.createArrangement({
    projectId: "song-1",
    name: "Main MIDI arrangement",
    lengthTicks: 7_680,
    tempoMap: [
      { tick: 0, bpm: 120 },
      { tick: 3_840, bpm: 124 },
    ],
    timeSignatures: [{ tick: 0, numerator: 4, denominator: 4 }],
    sections: [
      { name: "Verse", startTick: 0, endTick: 3_840 },
      { name: "Chorus", startTick: 3_840, endTick: 7_680 },
    ],
    tracks: [
      {
        name: "Bass",
        instrument: "Electric Bass",
        program: 33,
        channel: 1,
        muted: false,
        notes: [
          {
            pitch: 45,
            velocity: 100,
            startTick: 125,
            durationTicks: 480,
            channel: 1,
          },
        ],
      },
    ],
    createdBy: "arranger-1",
  });
  return { engine, arrangement };
}

describe("TimelineMidiArrangementEngine", () => {
  it("rejects invalid notes and musical maps before they become code", () => {
    const engine = new TimelineMidiArrangementEngine();
    expect(() =>
      engine.createArrangement({
        projectId: "song-1",
        name: "Broken",
        lengthTicks: 960,
        tempoMap: [{ tick: 20, bpm: 120 }],
        timeSignatures: [{ tick: 0, numerator: 4, denominator: 4 }],
        sections: [{ name: "Song", startTick: 0, endTick: 960 }],
        tracks: [],
        createdBy: "arranger-1",
      }),
    ).toThrow("begin at tick 0");
  });

  it("creates non-destructive quantized and transposed revisions", () => {
    const { engine, arrangement } = create();
    const trackId = arrangement.tracks[0].id;
    const quantized = engine.transform({
      arrangementId: arrangement.id,
      transform: {
        kind: "quantize",
        trackIds: [trackId],
        gridTicks: 120,
        strength: 1,
      },
      createdBy: "arranger-1",
    });
    const transposed = engine.transform({
      arrangementId: quantized.id,
      transform: {
        kind: "transpose",
        trackIds: [trackId],
        semitones: 12,
      },
      createdBy: "arranger-1",
    });
    expect(arrangement.tracks[0].notes[0].startTick).toBe(125);
    expect(quantized.tracks[0].notes[0].startTick).toBe(120);
    expect(transposed.tracks[0].notes[0].pitch).toBe(57);
    expect(transposed.parentArrangementId).toBe(quantized.id);
  });

  it("holds valid arrangements for independent human approval", () => {
    const { engine, arrangement } = create();
    expect(
      engine.submitForApproval({
        arrangementId: arrangement.id,
        submittedBy: "arranger-1",
      }).status,
    ).toBe("held");
    expect(() =>
      engine.approve({
        arrangementId: arrangement.id,
        approvedBy: "arranger-1",
      }),
    ).toThrow("independent");
    expect(
      engine.approve({
        arrangementId: arrangement.id,
        approvedBy: "producer-1",
      }).status,
    ).toBe("approved");
  });

  it("keeps exactly one active arrangement per project", () => {
    const { engine, arrangement } = create();
    engine.submitForApproval({
      arrangementId: arrangement.id,
      submittedBy: "arranger-1",
    });
    engine.approve({
      arrangementId: arrangement.id,
      approvedBy: "producer-1",
    });
    engine.activate({
      arrangementId: arrangement.id,
      activatedBy: "producer-1",
    });
    const revised = engine.transform({
      arrangementId: arrangement.id,
      transform: {
        kind: "velocity-scale",
        trackIds: [arrangement.tracks[0].id],
        factor: 0.8,
      },
      createdBy: "arranger-1",
    });
    engine.submitForApproval({
      arrangementId: revised.id,
      submittedBy: "arranger-1",
    });
    engine.approve({
      arrangementId: revised.id,
      approvedBy: "producer-1",
    });
    engine.activate({
      arrangementId: revised.id,
      activatedBy: "producer-1",
    });
    expect(engine.activeArrangement("song-1")?.id).toBe(revised.id);
    expect(engine.getArrangement(arrangement.id)?.status).toBe("archived");
  });

  it("restores fingerprinted history and continues stable identities", () => {
    const { engine, arrangement } = create();
    const restored = new TimelineMidiArrangementEngine();
    restored.restoreArchive(engine.exportArchive());
    expect(restored.getArrangement(arrangement.id)?.fingerprint).toBe(
      arrangement.fingerprint,
    );
    expect(restored.listReceipts("song-1")[0].id).toBe(
      "timeline-midi-receipt-1",
    );
    const next = create(restored).arrangement;
    expect(next.id).toBe("timeline-midi-arrangement-2");
    expect(next.tracks[0].id).toBe("timeline-midi-track-2");
  });
});
