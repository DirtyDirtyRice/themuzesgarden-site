import { describe, expect, it } from "vitest";
import { createTimelineDawSongStartView } from "../../lib/timeline/TimelineDawSongStartPolicy";

const session = (overrides: Partial<Parameters<typeof createTimelineDawSongStartView>[0][number]> = {}) => ({
  id: "session-1", projectId: "project-1", projectTitle: "Album", name: "Morning Mix", songId: "song-1",
  state: "ready" as const, updatedAt: "2026-08-15T08:00:00.000Z", readinessReady: true, ...overrides,
});

describe("DAW song start policy", () => {
  it("prefers the active session even when another session is newer", () => {
    const view = createTimelineDawSongStartView([
      session({ id: "newer", name: "Newer", updatedAt: "2026-08-15T10:00:00.000Z" }),
      session({ id: "active", name: "Working Mix", state: "active", updatedAt: "2026-08-15T09:00:00.000Z" }),
    ]);
    expect(view.recommended?.id).toBe("active");
    expect(view.message).toContain("Working Mix");
    expect(view.resumeLabel).toBe("Continue in Studio");
  });

  it("excludes closed sessions and limits the recent list", () => {
    const sessions = Array.from({ length: 8 }, (_, index) => session({ id: `session-${index}`, updatedAt: `2026-08-15T0${index}:00:00.000Z` }));
    sessions.push(session({ id: "closed", state: "closed" }));
    const view = createTimelineDawSongStartView(sessions);
    expect(view.openCount).toBe(8);
    expect(view.recent).toHaveLength(6);
    expect(view.recent.some((item) => item.id === "closed")).toBe(false);
  });

  it("provides a clear empty-state instruction", () => {
    const view = createTimelineDawSongStartView([]);
    expect(view.message).toContain("Start a song");
    expect(view.resumeLabel).toBeNull();
  });

  it("labels a suspended session as an explicit resume", () => {
    const view = createTimelineDawSongStartView([session({ state: "suspended" })]);
    expect(view.resumeLabel).toBe("Resume session");
  });
});
