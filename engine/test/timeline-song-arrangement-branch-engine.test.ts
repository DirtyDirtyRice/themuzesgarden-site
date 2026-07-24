import { describe, expect, it } from "vitest";
import { TimelineSongArrangementBranchEngine } from "../../lib/timeline/TimelineSongArrangementBranchEngine";

describe("TimelineSongArrangementBranchEngine", () => {
  it("forks lightweight arrangements and merges independent track changes", () => {
    const engine = new TimelineSongArrangementBranchEngine();
    const main = engine.createRoot({
      songId: "song-1",
      name: "Main",
      state: { "track-1": "revision-1", "track-2": "revision-1" },
      createdBy: "member-1",
    });
    const acoustic = engine.fork({
      sourceBranchId: main.id,
      name: "Acoustic",
      createdBy: "member-1",
    });
    engine.commit({
      branchId: acoustic.id,
      expectedHead: 0,
      message: "New acoustic vocal",
      changes: [{ kind: "set", trackId: "track-1", revisionId: "revision-2" }],
      committedBy: "member-1",
    });
    engine.commit({
      branchId: main.id,
      expectedHead: 0,
      message: "New drums",
      changes: [{ kind: "set", trackId: "track-2", revisionId: "revision-2" }],
      committedBy: "member-1",
    });

    const merge = engine.merge({
      sourceBranchId: acoustic.id,
      targetBranchId: main.id,
      mergedBy: "member-1",
    });

    expect(merge.status).toBe("merged");
    expect(engine.getBranch(main.id)?.state).toEqual({
      "track-1": "revision-2",
      "track-2": "revision-2",
    });
  });

  it("holds conflicting edits until an explicit source or target decision", () => {
    const engine = new TimelineSongArrangementBranchEngine();
    const main = engine.createRoot({
      songId: "song-1",
      name: "Main",
      state: { "track-1": "revision-1" },
      createdBy: "member-1",
    });
    const alternate = engine.fork({
      sourceBranchId: main.id,
      name: "Alternate",
      createdBy: "member-1",
    });
    engine.commit({
      branchId: alternate.id,
      expectedHead: 0,
      message: "Alternate vocal",
      changes: [{ kind: "set", trackId: "track-1", revisionId: "revision-2" }],
      committedBy: "member-1",
    });
    engine.commit({
      branchId: main.id,
      expectedHead: 0,
      message: "Main vocal",
      changes: [{ kind: "set", trackId: "track-1", revisionId: "revision-3" }],
      committedBy: "member-1",
    });
    const merge = engine.merge({
      sourceBranchId: alternate.id,
      targetBranchId: main.id,
      mergedBy: "member-1",
    });

    expect(merge.status).toBe("conflicted");
    expect(engine.getBranch(main.id)?.state["track-1"]).toBe("revision-3");
    expect(() =>
      engine.resolveMerge({
        mergeId: merge.id,
        resolutions: {},
        resolvedBy: "member-1",
      }),
    ).toThrow("Every arrangement conflict requires a resolution");

    const resolved = engine.resolveMerge({
      mergeId: merge.id,
      resolutions: { "track-1": "source" },
      resolvedBy: "member-1",
    });
    expect(resolved.status).toBe("merged");
    expect(engine.getBranch(main.id)?.state["track-1"]).toBe("revision-2");
  });

  it("rejects stale writers instead of silently overwriting a branch", () => {
    const engine = new TimelineSongArrangementBranchEngine();
    const main = engine.createRoot({
      songId: "song-1",
      name: "Main",
      createdBy: "member-1",
    });
    engine.commit({
      branchId: main.id,
      expectedHead: 0,
      message: "First",
      changes: [{ kind: "set", trackId: "track-1", revisionId: "revision-1" }],
      committedBy: "member-1",
    });

    expect(() =>
      engine.commit({
        branchId: main.id,
        expectedHead: 0,
        message: "Stale",
        changes: [
          { kind: "set", trackId: "track-1", revisionId: "revision-stale" },
        ],
        committedBy: "member-2",
      }),
    ).toThrow("Stale arrangement head");
  });

  it("restores branch history and continues stable IDs after restart", () => {
    const engine = new TimelineSongArrangementBranchEngine();
    const main = engine.createRoot({
      songId: "song-1",
      name: "Main",
      createdBy: "member-1",
    });
    engine.commit({
      branchId: main.id,
      expectedHead: 0,
      message: "Track",
      changes: [{ kind: "set", trackId: "track-1", revisionId: "revision-1" }],
      committedBy: "member-1",
    });
    const restarted = new TimelineSongArrangementBranchEngine();
    restarted.restoreArchive(engine.exportArchive());

    expect(
      restarted.fork({
        sourceBranchId: main.id,
        name: "Next",
        createdBy: "member-1",
      }).id,
    ).toBe("timeline-arrangement-branch-2");
    expect(() =>
      restarted.restoreArchive({
        branches: [main, main],
        commits: [],
        merges: [],
      }),
    ).toThrow("Duplicate arrangement branch ID");
  });
});
