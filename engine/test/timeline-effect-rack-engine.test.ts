import { describe, expect, it } from "vitest";

import { TimelineEffectRackEngine } from "../../lib/timeline/TimelineEffectRackEngine";
import { TimelineMixSessionEngine } from "../../lib/timeline/TimelineMixSessionEngine";

function track(mixes: TimelineMixSessionEngine, title: string) {
  const created = mixes.audio.revisions.tracks.createTrack(
    {
      projectId: "project-1",
      songId: "song-1",
      title,
      kind: "audio",
      contentFingerprint: `sha256-${title}`,
    },
    "member-1",
  ).tracks[0];
  const revision = mixes.audio.revisions.createDraft({
    trackId: created.id,
    label: `${title} source`,
    source: "recording",
    outputArtifactUri: `audio://${title}.wav`,
    outputFingerprint: `sha256-${title}`,
    createdBy: "member-1",
  }).revision!;
  mixes.audio.revisions.addOperation({
    revisionId: revision.id,
    kind: "annotation",
    description: "Source",
    createdBy: "member-1",
  });
  mixes.audio.revisions.validate({
    revisionId: revision.id,
    validatedBy: "member-1",
  });
  mixes.audio.revisions.activate({
    revisionId: revision.id,
    activatedBy: "member-1",
  });
  return created;
}

function setup() {
  const mixes = new TimelineMixSessionEngine();
  const master = track(mixes, "master");
  const vocal = track(mixes, "vocal");
  const session = mixes.createSession({
    songId: "song-1",
    masterTrackId: master.id,
    name: "Mix",
    createdBy: "member-1",
  });
  const mixed = mixes.addLane({
    sessionId: session.id,
    expectedHead: 0,
    trackId: vocal.id,
    editedBy: "member-1",
  });
  const engine = new TimelineEffectRackEngine(mixes);
  const rack = engine.createRack({
    sessionId: mixed.id,
    targetKind: "lane",
    targetId: mixed.lanes[0].id,
    createdBy: "member-1",
  });
  return { engine, mixes, session: mixed, rack };
}

describe("TimelineEffectRackEngine", () => {
  it("creates a validated ordered signal chain", () => {
    const { engine, rack } = setup();
    engine.addEffect({
      rackId: rack.id,
      expectedHead: 0,
      definitionId: "garden.equalizer",
      parameters: { highPassHz: 80 },
      editedBy: "member-1",
    });
    const chain = engine.addEffect({
      rackId: rack.id,
      expectedHead: 1,
      definitionId: "garden.compressor",
      parameters: { ratio: 6 },
      editedBy: "member-1",
    });
    const reordered = engine.updateEffect({
      rackId: rack.id,
      expectedHead: 2,
      effectId: chain.effects[1].id,
      patch: { order: -1, wet: 0.75 },
      editedBy: "member-1",
    });
    expect(reordered.effects.map((effect) => effect.definitionId)).toEqual([
      "garden.compressor",
      "garden.equalizer",
    ]);
  });

  it("holds unknown parameters, invalid ranges, and stale edits", () => {
    const { engine, rack } = setup();
    engine.addEffect({
      rackId: rack.id,
      expectedHead: 0,
      definitionId: "garden.reverb",
      editedBy: "member-1",
    });
    expect(() =>
      engine.addEffect({
        rackId: rack.id,
        expectedHead: 0,
        definitionId: "garden.delay",
        editedBy: "member-2",
      }),
    ).toThrow(/stale/i);
    expect(() =>
      engine.addEffect({
        rackId: rack.id,
        expectedHead: 1,
        definitionId: "garden.reverb",
        parameters: { missingControl: 1 },
        editedBy: "member-1",
      }),
    ).toThrow(/unknown/i);
    expect(() =>
      engine.addEffect({
        rackId: rack.id,
        expectedHead: 1,
        definitionId: "garden.delay",
        wet: 1.5,
        editedBy: "member-1",
      }),
    ).toThrow(/between/i);
  });

  it("saves and reapplies definition-compatible presets", () => {
    const { engine, rack } = setup();
    const added = engine.addEffect({
      rackId: rack.id,
      expectedHead: 0,
      definitionId: "garden.compressor",
      wet: 0.8,
      parameters: { ratio: 8, thresholdDb: -24 },
      editedBy: "member-1",
    });
    const preset = engine.createPreset({
      rackId: rack.id,
      effectId: added.effects[0].id,
      name: "Vocal control",
      createdBy: "member-1",
    });
    const changed = engine.updateEffect({
      rackId: rack.id,
      expectedHead: 1,
      effectId: added.effects[0].id,
      patch: { parameters: { ratio: 2 } },
      editedBy: "member-1",
    });
    const restored = engine.applyPreset({
      rackId: rack.id,
      expectedHead: changed.head,
      effectId: added.effects[0].id,
      presetId: preset.id,
      editedBy: "member-1",
    });
    expect(restored.effects[0].parameters.ratio).toBe(8);
    expect(restored.effects[0].presetId).toBe(preset.id);
  });

  it("detects rack and mix drift after an immutable snapshot", () => {
    const { engine, mixes, session, rack } = setup();
    const snapshot = engine.createSnapshot({
      sessionId: session.id,
      createdBy: "member-1",
    });
    expect(engine.verifySnapshot(snapshot.id).valid).toBe(true);
    engine.addEffect({
      rackId: rack.id,
      expectedHead: 0,
      definitionId: "garden.utility",
      editedBy: "member-1",
    });
    expect(engine.verifySnapshot(snapshot.id).rackChanged).toBe(true);
    mixes.addBus({
      sessionId: session.id,
      expectedHead: session.head,
      name: "FX",
      kind: "aux",
      editedBy: "member-1",
    });
    expect(engine.verifySnapshot(snapshot.id).mixChanged).toBe(true);
  });

  it("restores stable rack, effect, and preset identities", () => {
    const { engine, mixes, session, rack } = setup();
    const added = engine.addEffect({
      rackId: rack.id,
      expectedHead: 0,
      definitionId: "garden.saturation",
      editedBy: "member-1",
    });
    engine.createPreset({
      rackId: rack.id,
      effectId: added.effects[0].id,
      name: "Warm",
      createdBy: "member-1",
    });
    const restored = new TimelineEffectRackEngine(mixes);
    restored.restoreArchive(engine.exportArchive());
    const busRack = restored.createRack({
      sessionId: session.id,
      targetKind: "bus",
      targetId: session.buses[0].id,
      createdBy: "member-1",
    });
    expect(restored.getRack(rack.id)?.effects[0].id).toBe("timeline-effect-1");
    expect(busRack.id).toBe("timeline-effect-rack-2");
  });
});
