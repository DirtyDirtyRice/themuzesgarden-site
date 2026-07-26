import type { TimelineDawWorkspaceCommand } from "./TimelineDawWorkspaceService";

const commands = new Set(["open", "validate", "activate", "suspend", "resume", "close"]);
const text = (value: unknown) => typeof value === "string" && value.trim() ? value.trim() : null;
const revision = (value: unknown) =>
  typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : null;

export function parseTimelineDawWorkspaceCommand(raw: unknown): TimelineDawWorkspaceCommand {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("DAW workspace command must be an object.");
  const value = raw as Record<string, unknown>;
  if (typeof value.action !== "string" || !commands.has(value.action)) throw new Error("DAW workspace action is invalid.");
  const expectedWorkspaceRevision = revision(value.expectedWorkspaceRevision);
  if (expectedWorkspaceRevision === null) throw new Error("expectedWorkspaceRevision must be a non-negative integer.");
  if (value.action === "open") {
    const projectId = text(value.projectId), songId = text(value.songId), name = text(value.name);
    if (!projectId || !songId || !name) throw new Error("Open requires projectId, songId, and name.");
    return { action: "open", projectId, songId, name, expectedWorkspaceRevision };
  }
  const sessionId = text(value.sessionId);
  const expectedSessionRevision = revision(value.expectedSessionRevision);
  if (!sessionId || expectedSessionRevision === null) {
    throw new Error("Session commands require sessionId and expectedSessionRevision.");
  }
  return {
    action: value.action as "validate" | "activate" | "suspend" | "resume" | "close",
    sessionId, expectedSessionRevision, expectedWorkspaceRevision,
  };
}
