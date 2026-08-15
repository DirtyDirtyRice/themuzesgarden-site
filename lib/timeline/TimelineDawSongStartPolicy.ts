export type TimelineDawResumeSession = {
  id: string;
  projectId: string;
  projectTitle: string;
  name: string;
  songId: string;
  state: "draft" | "ready" | "active" | "suspended" | "closed";
  updatedAt: string;
  readinessReady: boolean;
};

export function createTimelineDawSongStartView(sessions: TimelineDawResumeSession[]) {
  const recent = [...sessions]
    .filter((session) => session.state !== "closed")
    .sort((left, right) => {
      const timeDifference = Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
      return timeDifference || left.name.localeCompare(right.name) || left.id.localeCompare(right.id);
    });
  const recommended = recent.find((session) => session.state === "active") ?? recent[0] ?? null;
  return {
    recommended,
    open: recent,
    recent: recent.slice(0, 6),
    openCount: recent.length,
    resumeLabel: recommended
      ? recommended.state === "suspended"
        ? "Resume session"
        : "Continue in Studio"
      : null,
    message: recommended
      ? `Continue ${recommended.name} where you left off.`
      : "Start a song or import music to create your first protected session.",
  };
}

export function filterTimelineDawOpenSessions(
  sessions: TimelineDawResumeSession[],
  query: string,
  limit = 6,
) {
  const open = sessions.filter((session) => session.state !== "closed");
  const normalized = query.trim().toLocaleLowerCase().slice(0, 100);
  const matches = normalized
    ? open.filter((session) => session.name.toLocaleLowerCase().includes(normalized) || session.songId.toLocaleLowerCase().includes(normalized) || session.projectTitle.toLocaleLowerCase().includes(normalized))
    : open;
  return {
    totalOpenCount: open.length,
    matchingCount: matches.length,
    sessions: matches.slice(0, Math.max(1, Math.min(6, Math.floor(limit)))),
  };
}

export function timelineDawResumePositionLabel(position: { tick: number; ppq: number } | null | undefined) {
  if (!position || !Number.isSafeInteger(position.tick) || position.tick < 0 || !Number.isSafeInteger(position.ppq) || position.ppq <= 0) {
    return "Playhead will open at song start.";
  }
  const beat = Math.floor(position.tick / position.ppq);
  const bar = Math.floor(beat / 4) + 1;
  const beatInBar = (beat % 4) + 1;
  return position.tick === 0
    ? "Playhead saved at song start."
    : `Playhead saved at bar ${bar}, beat ${beatInBar}.`;
}

export function createTimelineDawRecentSessionHealth(
  session: Pick<TimelineDawResumeSession, "state" | "readinessReady">,
  position: { tick: number; ppq: number } | null | undefined,
) {
  const transportReady = Boolean(position && Number.isSafeInteger(position.tick) && position.tick >= 0 && Number.isSafeInteger(position.ppq) && position.ppq > 0);
  if (!session.readinessReady) return {
    state: "held" as const,
    label: "Engine checks needed",
    nextAction: "Open Studio and run Validate before recording or playback.",
    transportReady,
  };
  if (!transportReady) return {
    state: "setup" as const,
    label: "Transport setup needed",
    nextAction: "Open Studio once to initialize the durable transport.",
    transportReady,
  };
  return {
    state: "ready" as const,
    label: session.state === "suspended" ? "Ready to resume" : "Ready to continue",
    nextAction: timelineDawResumePositionLabel(position),
    transportReady,
  };
}

export function timelineDawReadinessRepairAction(session: Pick<TimelineDawResumeSession, "state" | "readinessReady">) {
  if (session.readinessReady) return null;
  return session.state === "draft"
    ? { action: "validate" as const, label: "Run engine validation" }
    : { action: "enter-studio" as const, label: "Review engine blockers" };
}

export function timelineDawTransportInitializationAction(
  session: Pick<TimelineDawResumeSession, "state" | "readinessReady">,
  position: { tick: number; ppq: number } | null | undefined,
) {
  const health = createTimelineDawRecentSessionHealth(session, position);
  return health.state === "setup"
    ? { action: "initialize-transport" as const, label: "Initialize transport" }
    : null;
}

export function timelineDawSessionActivationAction(
  session: Pick<TimelineDawResumeSession, "state" | "readinessReady">,
  position: { tick: number; ppq: number } | null | undefined,
) {
  const health = createTimelineDawRecentSessionHealth(session, position);
  return session.state === "ready" && health.state === "ready"
    ? { action: "activate" as const, label: "Activate session" }
    : null;
}

export function timelineDawSuspendedSessionResumeAction(
  session: Pick<TimelineDawResumeSession, "state" | "readinessReady">,
  position: { tick: number; ppq: number } | null | undefined,
) {
  const health = createTimelineDawRecentSessionHealth(session, position);
  return session.state === "suspended" && health.state === "ready"
    ? { action: "resume" as const, label: "Resume session" }
    : null;
}

export function createTimelineDawRecentSessionPrimaryAction(
  session: Pick<TimelineDawResumeSession, "state" | "readinessReady">,
  position: { tick: number; ppq: number } | null | undefined,
) {
  if (session.state === "closed") return null;
  const readiness = timelineDawReadinessRepairAction(session);
  if (readiness?.action === "validate") return readiness;
  const transport = timelineDawTransportInitializationAction(session, position);
  if (transport) return transport;
  const activation = timelineDawSessionActivationAction(session, position);
  if (activation) return activation;
  const resume = timelineDawSuspendedSessionResumeAction(session, position);
  if (resume) return resume;
  return { action: "enter-studio" as const, label: readiness?.label ?? "Enter Studio" };
}

export function createTimelineDawClosedSessionArchive(sessions: TimelineDawResumeSession[]) {
  const closed = sessions
    .filter((session) => session.state === "closed")
    .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt) || left.name.localeCompare(right.name) || left.id.localeCompare(right.id));
  return { count: closed.length, sessions: closed };
}

export function filterTimelineDawClosedSessionArchive(
  archive: ReturnType<typeof createTimelineDawClosedSessionArchive>,
  query: string,
  limit = 50,
) {
  const normalized = query.trim().toLocaleLowerCase().slice(0, 100);
  const matches = normalized
    ? archive.sessions.filter((session) => session.name.toLocaleLowerCase().includes(normalized) || session.songId.toLocaleLowerCase().includes(normalized))
    : archive.sessions;
  return {
    totalCount: archive.count,
    matchingCount: matches.length,
    sessions: matches.slice(0, Math.max(1, Math.min(100, Math.floor(limit)))),
  };
}
