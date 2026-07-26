import { describe, expect, it } from "vitest";
import { TimelineAudioClipAndArrangementEngine } from "../../lib/timeline/TimelineAudioClipAndArrangementEngine";

const clock = () => new Date("2026-07-25T12:00:00.000Z");
const create = (engine: TimelineAudioClipAndArrangementEngine) => engine.createArrangement({
  projectId: "project-1", songId: "song-1", multiTrackSessionId: "session-1", transportId: "transport-1", name: "Main arrangement", sampleRate: 48_000, createdBy: "steve",
});
const add = (engine: TimelineAudioClipAndArrangementEngine, arrangementId: string, expectedHead: number, overrides: Record<string, unknown> = {}) => engine.addClip({
  arrangementId, expectedHead, trackId: "track-1", sourceArtifactId: "artifact-1", sourceFingerprint: "sha256:a", timelineStartTick: 0, timelineEndTick: 960, sourceStartSample: 0, sourceEndSample: 48_000, editedBy: "steve", ...overrides,
});

describe("TimelineAudioClipAndArrangementEngine", () => {
  it("places, edits, validates, and activates a non-destructive arrangement", () => {
    const engine = new TimelineAudioClipAndArrangementEngine(clock);
    let arrangement = create(engine);
    arrangement = add(engine, arrangement.id, arrangement.head);
    const clipId = arrangement.clips[0].id;
    arrangement = engine.moveClip({ arrangementId: arrangement.id, expectedHead: arrangement.head, clipId, timelineStartTick: 480, lane: 2, editedBy: "steve" });
    arrangement = engine.trimClip({ arrangementId: arrangement.id, expectedHead: arrangement.head, clipId, timelineStartTick: 480, timelineEndTick: 1200, sourceStartSample: 2_000, sourceEndSample: 38_000, editedBy: "steve" });
    arrangement = engine.updateClip({ arrangementId: arrangement.id, expectedHead: arrangement.head, clipId, gainDb: -3, fadeInTicks: 60, fadeOutTicks: 90, loop: true, editedBy: "steve" });
    arrangement = engine.validate({ arrangementId: arrangement.id, expectedHead: arrangement.head, validatedBy: "steve" });
    expect(arrangement.status).toBe("validated");
    arrangement = engine.activate({ arrangementId: arrangement.id, expectedHead: arrangement.head, activatedBy: "steve" });
    expect(arrangement.status).toBe("active");
    expect(arrangement.clips[0]).toMatchObject({ gainDb: -3, lane: 2, loop: true });
  });

  it("splits a clip into stable children and rejects stale writers", () => {
    const engine = new TimelineAudioClipAndArrangementEngine(clock);
    let arrangement = create(engine);
    arrangement = add(engine, arrangement.id, arrangement.head);
    const original = arrangement.clips[0];
    const staleHead = arrangement.head;
    arrangement = engine.splitClip({ arrangementId: arrangement.id, expectedHead: arrangement.head, clipId: original.id, splitTick: 480, splitSourceSample: 24_000, editedBy: "steve" });
    const children = arrangement.clips.filter((clip) => clip.parentClipId === original.id);
    expect(children.map((clip) => [clip.timelineStartTick, clip.timelineEndTick, clip.sourceStartSample, clip.sourceEndSample])).toEqual([[0, 480, 0, 24_000], [480, 960, 24_000, 48_000]]);
    expect(arrangement.clips.find((clip) => clip.id === original.id)).toMatchObject({ archived: true, supersededBy: children.map((clip) => clip.id) });
    expect(() => add(engine, arrangement.id, staleHead, { trackId: "track-2" })).toThrow(/head conflict/);
  });

  it("protects lanes from accidental overlap and permits valid crossfades", () => {
    const engine = new TimelineAudioClipAndArrangementEngine(clock);
    let arrangement = create(engine);
    arrangement = add(engine, arrangement.id, arrangement.head);
    expect(() => add(engine, arrangement.id, arrangement.head, { timelineStartTick: 900, timelineEndTick: 1500, sourceArtifactId: "artifact-2" })).toThrow(/overlaps/);
    arrangement = add(engine, arrangement.id, arrangement.head, { timelineStartTick: 900, timelineEndTick: 1500, lane: 2, sourceArtifactId: "artifact-2" });
    arrangement = engine.updateClip({ arrangementId: arrangement.id, expectedHead: arrangement.head, clipId: arrangement.clips[0].id, fadeOutTicks: 120, allowCrossfade: true, editedBy: "steve" });
    arrangement = engine.updateClip({ arrangementId: arrangement.id, expectedHead: arrangement.head, clipId: arrangement.clips[1].id, fadeInTicks: 120, allowCrossfade: true, editedBy: "steve" });
    arrangement = engine.moveClip({ arrangementId: arrangement.id, expectedHead: arrangement.head, clipId: arrangement.clips[1].id, timelineStartTick: 900, lane: 1, editedBy: "steve" });
    expect(arrangement.clips[1].lane).toBe(1);
  });

  it("queries ordered clips and recovers archived clips", () => {
    const engine = new TimelineAudioClipAndArrangementEngine(clock);
    let arrangement = create(engine);
    arrangement = add(engine, arrangement.id, arrangement.head, { timelineStartTick: 960, timelineEndTick: 1920 });
    arrangement = add(engine, arrangement.id, arrangement.head, { timelineStartTick: 0, timelineEndTick: 480, trackId: "track-2", sourceArtifactId: "artifact-2" });
    const archivedId = arrangement.clips[0].id;
    arrangement = engine.archiveClip({ arrangementId: arrangement.id, expectedHead: arrangement.head, clipId: archivedId, archivedBy: "steve" });
    expect(engine.listClips(arrangement.id).map((clip) => clip.trackId)).toEqual(["track-2"]);
    arrangement = engine.restoreClip({ arrangementId: arrangement.id, expectedHead: arrangement.head, clipId: archivedId, restoredBy: "steve" });
    expect(engine.listClips(arrangement.id).map((clip) => clip.timelineStartTick)).toEqual([0, 960]);
  });

  it("restores arrangement, clip, and event identities without reuse", () => {
    const source = new TimelineAudioClipAndArrangementEngine(clock);
    let arrangement = create(source);
    arrangement = add(source, arrangement.id, arrangement.head);
    const archive = source.exportArchive();
    const restored = new TimelineAudioClipAndArrangementEngine(clock);
    restored.restoreArchive(archive);
    const next = create(restored);
    expect(next.id).not.toBe(arrangement.id);
    expect(restored.listEvents(arrangement.id)).toEqual(archive.events);
    expect(() => restored.restoreArchive({ arrangements: [...archive.arrangements, archive.arrangements[0]], events: archive.events })).toThrow(/Duplicate/);
  });
});
