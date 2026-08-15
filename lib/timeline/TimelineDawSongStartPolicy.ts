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
