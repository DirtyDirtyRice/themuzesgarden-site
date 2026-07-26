import { describe, expect, it } from "vitest";
import { TimelineMultiTrackSessionEngine } from "../../lib/timeline/TimelineMultiTrackSessionEngine";
import { TimelineSongTrackRepositoryEngine } from "../../lib/timeline/TimelineSongTrackRepositoryEngine";

function setup() {
  const repository = new TimelineSongTrackRepositoryEngine(
    () => new Date("2026-07-25T12:00:00.000Z"),
  );
  const engine = new TimelineMultiTrackSessionEngine(
    repository,
    () => new Date("2026-07-25T12:00:00.000Z"),
  );
  const session = engine.createSession({
    projectId: "project-1",
    songId: "song-1",
    name: "Album session",
    privacy: "private",
    permittedUserIds: ["collaborator-1"],
    createdBy: "steve",
  });
  return { repository, engine, session };
}

function createTrack(
  repository: TimelineSongTrackRepositoryEngine,
  title: string,
  kind: "audio" | "midi" | "automation" | "prompt" | "reference" | "bus" | "folder",
  options: { projectId?: string; songId?: string } = {},
) {
  return repository.createTrack(
    {
      projectId: options.projectId ?? "project-1",
      songId: options.songId ?? "song-1",
      title,
      kind,
    },
    "steve",
  ).tracks[0];
}

describe("TimelineMultiTrackSessionEngine", () => {
  it("organizes DAW roles and activates a validated one-master session", () => {
    const { repository, engine, session } = setup();
    const folder = createTrack(repository, "Band", "folder");
    const guitar = createTrack(repository, "Guitar", "audio");
    const vocal = createTrack(repository, "Lead vocal", "audio");
    const instrument = createTrack(repository, "Synth", "midi");
    const bus = createTrack(repository, "Reverb return", "bus");
    const master = createTrack(repository, "Master", "bus");
    let current = session;
    for (const [track, role] of [
      [folder, "folder"],
      [guitar, "audio"],
      [vocal, "vocal"],
      [instrument, "instrument"],
      [bus, "return"],
      [master, "master"],
    ] as const) {
      current = engine.attachTrack({
        sessionId: current.id,
        expectedHead: current.head,
        trackId: track.id,
        role,
        recordArmed: role === "vocal",
        inputMonitoring: role === "vocal",
        editedBy: "steve",
      });
    }
    const validated = engine.validate({
      sessionId: current.id,
      expectedHead: current.head,
      validatedBy: "reviewer",
    });
    expect(validated.status).toBe("validated");
    expect(validated.issues).toEqual([]);
    const active = engine.activate({
      sessionId: validated.id,
      expectedHead: validated.head,
      activatedBy: "reviewer",
    });
    expect(active.status).toBe("active");
    expect(engine.statistics(active.id)).toMatchObject({
      total: 6,
      armed: 1,
      byRole: { vocal: 1, return: 1, master: 1 },
    });
  });

  it("rejects stale, duplicate, cross-song, incompatible, and second-master tracks", () => {
    const { repository, engine, session } = setup();
    const audio = createTrack(repository, "Audio", "audio");
    const otherSong = createTrack(repository, "Other", "audio", {
      songId: "song-2",
    });
    const masterA = createTrack(repository, "Master A", "bus");
    const masterB = createTrack(repository, "Master B", "bus");
    let current = engine.attachTrack({
      sessionId: session.id,
      expectedHead: session.head,
      trackId: audio.id,
      role: "audio",
      editedBy: "steve",
    });
    expect(() =>
      engine.attachTrack({
        sessionId: current.id,
        expectedHead: 0,
        trackId: masterA.id,
        role: "master",
        editedBy: "steve",
      }),
    ).toThrow(/head conflict/i);
    expect(() =>
      engine.attachTrack({
        sessionId: current.id,
        expectedHead: current.head,
        trackId: audio.id,
        role: "audio",
        editedBy: "steve",
      }),
    ).toThrow(/already attached/i);
    expect(() =>
      engine.attachTrack({
        sessionId: current.id,
        expectedHead: current.head,
        trackId: otherSong.id,
        role: "audio",
        editedBy: "steve",
      }),
    ).toThrow(/same song and project/i);
    expect(() =>
      engine.attachTrack({
        sessionId: current.id,
        expectedHead: current.head,
        trackId: masterA.id,
        role: "vocal",
        editedBy: "steve",
      }),
    ).toThrow(/incompatible/i);
    current = engine.attachTrack({
      sessionId: current.id,
      expectedHead: current.head,
      trackId: masterA.id,
      role: "master",
      editedBy: "steve",
    });
    expect(() =>
      engine.attachTrack({
        sessionId: current.id,
        expectedHead: current.head,
        trackId: masterB.id,
        role: "master",
        editedBy: "steve",
      }),
    ).toThrow(/only one master/i);
  });

  it("holds incomplete or externally archived sessions and enforces privacy rules", () => {
    const { repository, engine, session } = setup();
    const audio = createTrack(repository, "Lead", "audio");
    let current = engine.attachTrack({
      sessionId: session.id,
      expectedHead: session.head,
      trackId: audio.id,
      role: "audio",
      recordArmed: true,
      editedBy: "steve",
    });
    let held = engine.validate({
      sessionId: current.id,
      expectedHead: current.head,
      validatedBy: "reviewer",
    });
    expect(held.status).toBe("held");
    expect(held.issues[0]?.code).toBe("master-required");
    expect(() =>
      engine.createSession({
        projectId: "project-1",
        songId: "song-2",
        name: "Public",
        privacy: "public",
        permittedUserIds: ["private-user"],
        createdBy: "steve",
      }),
    ).toThrow(/public sessions/i);

    const second = setup();
    const master = createTrack(second.repository, "Master", "bus");
    current = second.engine.attachTrack({
      sessionId: second.session.id,
      expectedHead: second.session.head,
      trackId: master.id,
      role: "master",
      editedBy: "steve",
    });
    second.repository.archiveTracks({
      trackIds: [master.id],
      archivedBy: "steve",
    });
    held = second.engine.validate({
      sessionId: current.id,
      expectedHead: current.head,
      validatedBy: "reviewer",
    });
    expect(held.issues.some((issue) => issue.code === "track-archived")).toBe(true);
  });

  it("provides repository-backed paging and session statistics for huge songs", () => {
    const { repository, engine, session } = setup();
    const created = repository.createTracks(
      Array.from({ length: 10_000 }, (_, index) => ({
        projectId: "project-1",
        songId: "song-1",
        title: `Track ${String(index).padStart(5, "0")}`,
        kind: index === 9_999 ? ("bus" as const) : ("audio" as const),
        order: index,
      })),
      "steve",
    );
    expect(created.accepted).toBe(true);
    let current = session;
    for (const track of created.tracks.slice(0, 999)) {
      current = engine.attachTrack({
        sessionId: current.id,
        expectedHead: current.head,
        trackId: track.id,
        role: "audio",
        visible: Number(track.id.match(/\d+$/)?.[0]) % 2 === 0,
        editedBy: "steve",
      });
    }
    current = engine.attachTrack({
      sessionId: current.id,
      expectedHead: current.head,
      trackId: created.tracks[9_999].id,
      role: "master",
      editedBy: "steve",
    });
    const first = engine.queryTracks(current.id, { limit: 100 });
    const second = engine.queryTracks(current.id, {
      limit: 100,
      cursor: first.nextCursor ?? undefined,
    });
    expect(first.tracks).toHaveLength(100);
    expect(first.total).toBe(1_000);
    expect(second.tracks[0]?.track.order).toBe(100);
    expect(repository.statistics("song-1").total).toBe(10_000);
    expect(engine.statistics(current.id).total).toBe(1_000);
  });

  it("archives and restores stable session, track, event, and sequence identities", () => {
    const { repository, engine, session } = setup();
    const master = createTrack(repository, "Master", "bus");
    let current = engine.attachTrack({
      sessionId: session.id,
      expectedHead: session.head,
      trackId: master.id,
      role: "master",
      editedBy: "steve",
    });
    current = engine.validate({
      sessionId: current.id,
      expectedHead: current.head,
      validatedBy: "reviewer",
    });
    current = engine.archive({
      sessionId: current.id,
      expectedHead: current.head,
      archivedBy: "steve",
    });
    const archive = engine.exportArchive();
    const restored = new TimelineMultiTrackSessionEngine(repository);
    restored.restoreArchive(archive);
    expect(restored.getSession(current.id)).toEqual(current);
    expect(restored.listEvents()).toEqual(engine.listEvents());
    expect(
      restored.getSession(current.id)?.trackBindings[0]?.trackId,
    ).toBe(master.id);
    const next = restored.createSession({
      projectId: "project-1",
      songId: "song-2",
      name: "Next",
      privacy: "public",
      createdBy: "steve",
    });
    expect(next.id).toBe("timeline-multi-track-session-2");
    expect(restored.listEvents().at(-1)?.id).toBe(
      "timeline-multi-track-session-event-5",
    );
    expect(() =>
      restored.restoreArchive({
        sessions: [...archive.sessions, ...archive.sessions],
        events: archive.events,
      }),
    ).toThrow(/duplicate session/i);
  });
});
