import { describe, expect, it } from "vitest";

import {
  TimelineProjectSyncEngine,
  type TimelineProjectSnapshotEntry,
} from "../../lib/timeline/TimelineProjectSyncEngine";

const modifiedAt = "2026-07-25T12:00:00.000Z";

function entry(
  stableId: string,
  fingerprint: string,
  path = `${stableId}.json`,
): Omit<TimelineProjectSnapshotEntry, "id"> {
  return {
    stableId,
    path,
    kind: "metadata",
    fingerprint,
    sizeBytes: 100,
    modifiedAt,
  };
}

function verify(
  engine: TimelineProjectSyncEngine,
  snapshot: ReturnType<TimelineProjectSyncEngine["createSnapshot"]>,
) {
  return engine.verifySnapshot({
    snapshotId: snapshot.id,
    observedFingerprints: Object.fromEntries(
      snapshot.entries.map((value) => [value.stableId, value.fingerprint]),
    ),
    verifiedBy: "backup-worker",
  });
}

function locationPair(engine = new TimelineProjectSyncEngine()) {
  const local = engine.registerLocation({
    projectId: "song-1",
    name: "Studio",
    kind: "local",
    writable: true,
    createdBy: "owner-1",
  });
  const cloud = engine.registerLocation({
    projectId: "song-1",
    name: "Cloud",
    kind: "cloud",
    writable: true,
    createdBy: "owner-1",
  });
  return { engine, local, cloud };
}

describe("TimelineProjectSyncEngine", () => {
  it("rejects unsafe snapshot paths and duplicate stable identities", () => {
    const { engine, local } = locationPair();
    expect(() =>
      engine.createSnapshot({
        locationId: local.id,
        entries: [entry("project-1", "hash-1", "../outside.json")],
        createdBy: "owner-1",
      }),
    ).toThrow("cannot traverse");
    expect(() =>
      engine.createSnapshot({
        locationId: local.id,
        entries: [entry("same", "hash-1"), entry("same", "hash-2", "other.json")],
        createdBy: "owner-1",
      }),
    ).toThrow("Duplicate stable ID");
  });

  it("requires observed fingerprints before a backup becomes current", () => {
    const { engine, local } = locationPair();
    const snapshot = engine.createSnapshot({
      locationId: local.id,
      entries: [entry("project-1", "hash-1")],
      createdBy: "owner-1",
    });
    expect(() =>
      engine.verifySnapshot({
        snapshotId: snapshot.id,
        observedFingerprints: {},
        verifiedBy: "worker-1",
      }),
    ).toThrow("was not observed");
    expect(() => engine.promoteSnapshot({ snapshotId: snapshot.id, promotedBy: "owner-1" }))
      .toThrow("verified");
    const current = engine.promoteSnapshot({
      snapshotId: verify(engine, snapshot).id,
      promotedBy: "owner-1",
    });
    expect(current.status).toBe("current");
  });

  it("applies a conflict-free first backup without changing the source", () => {
    const { engine, local, cloud } = locationPair();
    const source = engine.createSnapshot({
      locationId: local.id,
      entries: [entry("project-1", "hash-1"), entry("lyrics-1", "hash-2", "lyrics/song.txt")],
      createdBy: "owner-1",
    });
    engine.promoteSnapshot({ snapshotId: verify(engine, source).id, promotedBy: "owner-1" });
    const plan = engine.planSync({
      sourceLocationId: local.id,
      destinationLocationId: cloud.id,
      direction: "push",
      createdBy: "owner-1",
    });
    expect(plan.status).toBe("planned");
    const applied = engine.applySync({ sessionId: plan.id, appliedBy: "owner-1" });
    expect(applied.status).toBe("applied");
    expect(engine.getSnapshot(applied.resultSnapshotId!)?.entries).toHaveLength(2);
    expect(engine.listLocations().find((value) => value.id === local.id)?.currentSnapshotId)
      .toBe(source.id);
  });

  it("holds divergent edits until every conflict has an explicit resolution", () => {
    const { engine, local, cloud } = locationPair();
    const base = engine.createSnapshot({
      locationId: local.id,
      entries: [entry("lyrics-1", "base", "lyrics/song.txt")],
      createdBy: "owner-1",
    });
    engine.promoteSnapshot({ snapshotId: verify(engine, base).id, promotedBy: "owner-1" });
    const firstPlan = engine.planSync({
      sourceLocationId: local.id,
      destinationLocationId: cloud.id,
      direction: "push",
      createdBy: "owner-1",
    });
    const firstApplied = engine.applySync({ sessionId: firstPlan.id, appliedBy: "owner-1" });
    const cloudBase = engine.getSnapshot(firstApplied.resultSnapshotId!)!;

    const localEdit = engine.createSnapshot({
      locationId: local.id,
      parentSnapshotId: base.id,
      entries: [entry("lyrics-1", "local-edit", "lyrics/song.txt")],
      createdBy: "writer-1",
    });
    engine.promoteSnapshot({ snapshotId: verify(engine, localEdit).id, promotedBy: "writer-1" });
    const cloudEdit = engine.createSnapshot({
      locationId: cloud.id,
      parentSnapshotId: base.id,
      entries: [entry("lyrics-1", "cloud-edit", "lyrics/song.txt")],
      createdBy: "writer-2",
    });
    engine.promoteSnapshot({ snapshotId: verify(engine, cloudEdit).id, promotedBy: "writer-2" });

    const held = engine.planSync({
      sourceLocationId: local.id,
      destinationLocationId: cloud.id,
      baseSnapshotId: base.id,
      direction: "bidirectional",
      createdBy: "owner-1",
    });
    expect(cloudBase.fingerprint).not.toBe(base.fingerprint);
    expect(held.status).toBe("held");
    expect(() => engine.applySync({ sessionId: held.id, appliedBy: "owner-1" }))
      .toThrow("unresolved");
    const resolved = engine.resolveConflict({
      sessionId: held.id,
      conflictId: held.conflicts[0].id,
      resolution: "keep-both",
      resolvedBy: "owner-1",
    });
    expect(resolved.status).toBe("resolved");
    const applied = engine.applySync({ sessionId: held.id, appliedBy: "owner-1" });
    expect(engine.getSnapshot(applied.resultSnapshotId!)?.entries).toHaveLength(2);
  });

  it("detects stale plans and verifies restore rehearsals", () => {
    const { engine, local, cloud } = locationPair();
    const source = engine.createSnapshot({
      locationId: local.id,
      entries: [entry("project-1", "hash-1")],
      createdBy: "owner-1",
    });
    engine.promoteSnapshot({ snapshotId: verify(engine, source).id, promotedBy: "owner-1" });
    const plan = engine.planSync({
      sourceLocationId: local.id,
      destinationLocationId: cloud.id,
      direction: "push",
      createdBy: "owner-1",
    });
    const changed = engine.createSnapshot({
      locationId: local.id,
      entries: [entry("project-1", "hash-2")],
      createdBy: "owner-1",
    });
    engine.promoteSnapshot({ snapshotId: verify(engine, changed).id, promotedBy: "owner-1" });
    expect(() => engine.applySync({ sessionId: plan.id, appliedBy: "owner-1" }))
      .toThrow("Source changed");
    expect(
      engine.verifyRestore({
        snapshotId: source.id,
        restoredEntries: [entry("project-1", "hash-1")],
        verifiedBy: "recovery-operator",
      }),
    ).toBe(true);
    expect(() =>
      engine.verifyRestore({
        snapshotId: source.id,
        restoredEntries: [entry("project-1", "wrong")],
        verifiedBy: "recovery-operator",
      }),
    ).toThrow("does not match");
  });

  it("restores verified history with stable IDs and continues every sequence", () => {
    const { engine, local } = locationPair();
    const snapshot = engine.createSnapshot({
      locationId: local.id,
      entries: [entry("project-1", "hash-1")],
      createdBy: "owner-1",
    });
    verify(engine, snapshot);
    const restored = new TimelineProjectSyncEngine();
    restored.restoreArchive(engine.exportArchive());
    expect(restored.getSnapshot(snapshot.id)?.fingerprint).toBe(snapshot.fingerprint);
    const nextLocation = restored.registerLocation({
      projectId: "song-2",
      name: "Other studio",
      kind: "local",
      writable: true,
      createdBy: "owner-1",
    });
    expect(nextLocation.id).toBe("timeline-sync-location-3");
    expect(restored.listLedger().at(-1)?.id).toBe("timeline-sync-ledger-5");
  });
});
