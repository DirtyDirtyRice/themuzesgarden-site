export type TimelineDawRenderExecutionCommand = {
  action: "execute-wav";
  sessionId: string;
  jobId: string;
  expectedWorkspaceRevision: number;
};

const allowed = new Set(["action", "sessionId", "jobId", "expectedWorkspaceRevision"]);

export function parseTimelineDawRenderExecutionCommand(raw: unknown): TimelineDawRenderExecutionCommand {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("DAW render execution command must be an object.");
  }
  const value = raw as Record<string, unknown>;
  const extra = Object.keys(value).find((key) => !allowed.has(key));
  if (extra) throw new Error(`DAW render execution contains unsupported field: ${extra}.`);
  if (value.action !== "execute-wav") throw new Error("DAW render execution action is invalid.");
  const sessionId = typeof value.sessionId === "string" ? value.sessionId.trim() : "";
  const jobId = typeof value.jobId === "string" ? value.jobId.trim() : "";
  if (!sessionId || !jobId) throw new Error("Render execution requires sessionId and jobId.");
  if (
    typeof value.expectedWorkspaceRevision !== "number"
    || !Number.isSafeInteger(value.expectedWorkspaceRevision)
    || value.expectedWorkspaceRevision < 0
  ) {
    throw new Error("expectedWorkspaceRevision must be a non-negative safe integer.");
  }
  return {
    action: "execute-wav",
    sessionId,
    jobId,
    expectedWorkspaceRevision: value.expectedWorkspaceRevision,
  };
}
