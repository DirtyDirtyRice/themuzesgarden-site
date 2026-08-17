export function createTimelineDawQuickSongStartName(title: unknown): string {
  const clean = typeof title === "string" ? title.trim().replace(/\s+/g, " ") : "";
  return `${clean || "New Song"} Session`;
}

export function validateTimelineDawQuickSongStart(input: {
  projectId: unknown;
  songId: unknown;
  sessionName: unknown;
  workspaceRevision: unknown;
}) {
  const projectId = typeof input.projectId === "string" ? input.projectId.trim() : "";
  const songId = typeof input.songId === "string" ? input.songId.trim() : "";
  const name = typeof input.sessionName === "string" ? input.sessionName.trim().replace(/\s+/g, " ") : "";
  const revision = Number(input.workspaceRevision);
  if (!projectId) return { ready: false as const, message: "Choose a project." };
  if (!songId) return { ready: false as const, message: "Choose a song linked to that project." };
  if (!name) return { ready: false as const, message: "Name the Studio session." };
  if (name.length > 120) return { ready: false as const, message: "Use a session name of 120 characters or fewer." };
  if (!Number.isInteger(revision) || revision < 0) return { ready: false as const, message: "Refresh Studios before starting this song." };
  return { ready: true as const, input: { projectId, songId, name, expectedWorkspaceRevision: revision } };
}
