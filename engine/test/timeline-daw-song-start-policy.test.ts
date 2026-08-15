import { describe, expect, it } from "vitest";
import { createTimelineDawClosedSessionArchive, createTimelineDawRecentSessionHealth, createTimelineDawRecentSessionPrimaryAction, createTimelineDawSongStartView, timelineDawReadinessRepairAction, timelineDawResumePositionLabel, timelineDawSessionActivationAction, timelineDawSuspendedSessionResumeAction, timelineDawTransportInitializationAction } from "../../lib/timeline/TimelineDawSongStartPolicy";

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

  it("turns a durable transport tick into musician-readable resume context", () => {
    expect(timelineDawResumePositionLabel({ tick: 5 * 960, ppq: 960 })).toBe("Playhead saved at bar 2, beat 2.");
    expect(timelineDawResumePositionLabel({ tick: 0, ppq: 960 })).toBe("Playhead saved at song start.");
    expect(timelineDawResumePositionLabel(undefined)).toBe("Playhead will open at song start.");
  });

  it("gives every recent session one readiness-based next action", () => {
    expect(createTimelineDawRecentSessionHealth(session({ readinessReady: false }), { tick: 0, ppq: 960 })).toMatchObject({ state: "held", transportReady: true });
    expect(createTimelineDawRecentSessionHealth(session(), undefined)).toMatchObject({ state: "setup", transportReady: false });
    expect(createTimelineDawRecentSessionHealth(session({ state: "suspended" }), { tick: 960, ppq: 960 })).toMatchObject({ state: "ready", label: "Ready to resume" });
  });

  it("offers direct validation only to an eligible held draft", () => {
    expect(timelineDawReadinessRepairAction(session({ state: "draft", readinessReady: false }))).toEqual({ action: "validate", label: "Run engine validation" });
    expect(timelineDawReadinessRepairAction(session({ state: "suspended", readinessReady: false }))).toEqual({ action: "enter-studio", label: "Review engine blockers" });
    expect(timelineDawReadinessRepairAction(session({ readinessReady: true }))).toBeNull();
  });

  it("offers transport initialization only to an engine-ready session without transport", () => {
    expect(timelineDawTransportInitializationAction(session({ readinessReady: true }), undefined)).toEqual({ action: "initialize-transport", label: "Initialize transport" });
    expect(timelineDawTransportInitializationAction(session({ readinessReady: false }), undefined)).toBeNull();
    expect(timelineDawTransportInitializationAction(session(), { tick: 0, ppq: 960 })).toBeNull();
  });

  it("offers activation only to a fully ready session with durable transport", () => {
    const position = { tick: 0, ppq: 960 };
    expect(timelineDawSessionActivationAction(session({ state: "ready", readinessReady: true }), position)).toEqual({ action: "activate", label: "Activate session" });
    expect(timelineDawSessionActivationAction(session({ state: "draft", readinessReady: true }), position)).toBeNull();
    expect(timelineDawSessionActivationAction(session({ state: "ready", readinessReady: false }), position)).toBeNull();
    expect(timelineDawSessionActivationAction(session({ state: "ready", readinessReady: true }), undefined)).toBeNull();
  });

  it("offers resume only to a readiness-valid suspended session with transport", () => {
    const position = { tick: 960, ppq: 960 };
    expect(timelineDawSuspendedSessionResumeAction(session({ state: "suspended", readinessReady: true }), position)).toEqual({ action: "resume", label: "Resume session" });
    expect(timelineDawSuspendedSessionResumeAction(session({ state: "active" }), position)).toBeNull();
    expect(timelineDawSuspendedSessionResumeAction(session({ state: "suspended", readinessReady: false }), position)).toBeNull();
    expect(timelineDawSuspendedSessionResumeAction(session({ state: "suspended" }), undefined)).toBeNull();
  });

  it("selects exactly one primary action for every open session state", () => {
    const position = { tick: 0, ppq: 960 };
    expect(createTimelineDawRecentSessionPrimaryAction(session({ state: "draft", readinessReady: false }), undefined)?.action).toBe("validate");
    expect(createTimelineDawRecentSessionPrimaryAction(session({ state: "ready" }), undefined)?.action).toBe("initialize-transport");
    expect(createTimelineDawRecentSessionPrimaryAction(session({ state: "ready" }), position)?.action).toBe("activate");
    expect(createTimelineDawRecentSessionPrimaryAction(session({ state: "suspended" }), position)?.action).toBe("resume");
    expect(createTimelineDawRecentSessionPrimaryAction(session({ state: "active" }), position)?.action).toBe("enter-studio");
    expect(createTimelineDawRecentSessionPrimaryAction(session({ state: "closed" }), position)).toBeNull();
  });

  it("keeps closed sessions in a separate newest-first read-only archive", () => {
    const archive = createTimelineDawClosedSessionArchive([
      session({ id: "open", state: "active" }),
      session({ id: "older", name: "Older", state: "closed", updatedAt: "2026-08-14T08:00:00.000Z" }),
      session({ id: "newer", name: "Newer", state: "closed", updatedAt: "2026-08-15T08:00:00.000Z" }),
    ]);
    expect(archive.count).toBe(2);
    expect(archive.sessions.map((item) => item.id)).toEqual(["newer", "older"]);
  });
});
