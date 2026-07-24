import { performance } from "node:perf_hooks";
import { describe, expect, it } from "vitest";
import {
  TimelineSongTrackRepositoryEngine,
  type TimelineSongTrackCreate,
} from "../../lib/timeline/TimelineSongTrackRepositoryEngine";

function track(
  title: string,
  overrides: Partial<TimelineSongTrackCreate> = {},
): TimelineSongTrackCreate {
  return {
    projectId: "project-1",
    songId: "song-1",
    title,
    kind: "audio",
    tags: ["guitar", "take"],
    ...overrides,
  };
}

describe("TimelineSongTrackRepositoryEngine", () => {
  it("atomically refuses invalid bulk imports without partial tracks", () => {
    const engine = new TimelineSongTrackRepositoryEngine();
    const result = engine.createTracks(
      [
        track("Valid", { id: "duplicate-track" }),
        track("Duplicate", { id: "duplicate-track" }),
        track("Missing title", { title: "" }),
      ],
      "member-1",
    );

    expect(result.accepted).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(["track-id-duplicate", "title-required"]),
    );
    expect(engine.statistics("song-1").total).toBe(0);
  });

  it("indexes and pages a real 10,000-track song without loading every row", () => {
    const engine = new TimelineSongTrackRepositoryEngine();
    const tracks = Array.from({ length: 10_000 }, (_, index) =>
      track(`Guitar take ${String(index + 1).padStart(5, "0")}`, {
        order: index,
        kind: index % 10 === 0 ? "midi" : "audio",
        tags: index % 100 === 0 ? ["featured", "guitar"] : ["guitar"],
      }),
    );
    const startedAt = performance.now();
    const created = engine.createTracks(tracks, "member-1");
    const first = engine.query({ songId: "song-1", limit: 500 });
    const second = engine.query({
      songId: "song-1",
      limit: 500,
      cursor: first.nextCursor!,
    });
    const featured = engine.query({
      songId: "song-1",
      tags: ["featured"],
      limit: 100,
    });
    const elapsed = performance.now() - startedAt;

    expect(created.accepted).toBe(true);
    expect(created.tracks).toHaveLength(10_000);
    expect(engine.statistics("song-1")).toMatchObject({
      total: 10_000,
      active: 10_000,
      byKind: { audio: 9_000, midi: 1_000 },
    });
    expect(first.tracks).toHaveLength(500);
    expect(first.total).toBe(10_000);
    expect(first.hasMore).toBe(true);
    expect(second.tracks[0].title).toBe("Guitar take 00501");
    expect(featured.total).toBe(100);
    expect(featured.hasMore).toBe(false);
    expect(elapsed).toBeLessThan(10_000);
  });

  it("supports folders while preventing cycles and cross-song parents", () => {
    const engine = new TimelineSongTrackRepositoryEngine();
    const folder = engine.createTrack(
      track("Guitars", { id: "folder-1", kind: "folder" }),
      "member-1",
    ).tracks[0];
    const child = engine.createTrack(
      track("Lead guitar", {
        id: "lead-1",
        parentTrackId: folder.id,
      }),
      "member-1",
    ).tracks[0];
    const cycle = engine.updateTrack({
      trackId: folder.id,
      patch: { parentTrackId: child.id },
      updatedBy: "member-1",
    });
    const otherSongFolder = engine.createTrack(
      track("Other song folder", {
        id: "folder-2",
        songId: "song-2",
        kind: "folder",
      }),
      "member-1",
    ).tracks[0];
    const mismatch = engine.updateTrack({
      trackId: child.id,
      patch: { parentTrackId: otherSongFolder.id },
      updatedBy: "member-1",
    });
    const folderPage = engine.query({
      songId: "song-1",
      parentTrackId: folder.id,
    });

    expect(cycle.accepted).toBe(false);
    expect(cycle.issues[0].code).toBe("parent-cycle");
    expect(mismatch.accepted).toBe(false);
    expect(mismatch.issues[0].code).toBe("parent-song-mismatch");
    expect(folderPage.tracks.map((entry) => entry.id)).toEqual([child.id]);
  });

  it("moves large selections to recoverable trash atomically", () => {
    const engine = new TimelineSongTrackRepositoryEngine();
    const created = engine.createTracks(
      Array.from({ length: 1_000 }, (_, index) => track(`Take ${index + 1}`)),
      "member-1",
    ).tracks;
    const selectedIds = created.slice(100, 300).map((entry) => entry.id);
    const trashed = engine.moveToTrash({
      trackIds: selectedIds,
      deletedBy: "member-1",
    });
    const activePage = engine.query({ songId: "song-1", limit: 100 });
    const trashPage = engine.query({
      songId: "song-1",
      states: ["trash"],
      limit: 500,
    });
    const trashedStatistics = engine.statistics("song-1");
    const restored = engine.restoreFromTrash({
      trackIds: selectedIds,
      restoredBy: "member-1",
    });

    expect(trashed.accepted).toBe(true);
    expect(trashedStatistics.trash).toBe(200);
    expect(activePage.total).toBe(800);
    expect(trashPage.total).toBe(200);
    expect(restored.accepted).toBe(true);
    expect(engine.statistics("song-1")).toMatchObject({
      total: 1_000,
      active: 1_000,
      trash: 0,
    });
  });

  it("restores 10,000 stable identities and continues its ID sequence", () => {
    const beforeRestart = new TimelineSongTrackRepositoryEngine();
    const created = beforeRestart.createTracks(
      Array.from({ length: 10_000 }, (_, index) =>
        track(`Restart track ${index + 1}`),
      ),
      "member-1",
    ).tracks;
    const afterRestart = new TimelineSongTrackRepositoryEngine();
    afterRestart.restoreArchive(beforeRestart.exportArchive());
    const next = afterRestart.createTrack(
      track("Track after restart"),
      "member-1",
    ).tracks[0];

    expect(afterRestart.getTrack(created[4_999].id)?.title).toBe(
      "Restart track 5000",
    );
    expect(afterRestart.statistics("song-1").total).toBe(10_001);
    expect(next.id).toBe("timeline-song-track-10001");
  });
});
