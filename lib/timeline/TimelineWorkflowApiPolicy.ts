import type { TimelineWorkspace } from "./TimelineTypes";

export type TimelineWorkflowApiAction =
  | "start"
  | "execute"
  | "approve"
  | "reject"
  | "apply"
  | "revert"
  | "cancel";

export type TimelineWorkflowApiPayload = {
  action: TimelineWorkflowApiAction;
  workflowId?: string;
  instruction?: string;
  workspace?: TimelineWorkspace;
  reason?: string;
  eventIds?: string[];
  trackIds?: string[];
};

const ACTIONS = new Set<TimelineWorkflowApiAction>([
  "start", "execute", "approve", "reject", "apply", "revert", "cancel",
]);

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function cleanIds(value: unknown, label: string): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`${label} must be an array of IDs.`);
  }
  const ids = Array.from(new Set(value.map(cleanString).filter(Boolean)));
  if (ids.length > 500) throw new Error(`${label} is limited to 500 IDs.`);
  return ids;
}

function validateWorkspace(value: unknown): TimelineWorkspace {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("A Timeline workspace is required.");
  }
  const workspace = value as Partial<TimelineWorkspace>;
  if (!cleanString(workspace.projectId)) {
    throw new Error("Timeline workspace project ID is required.");
  }
  if (!Array.isArray(workspace.events) || !Array.isArray(workspace.tracks)) {
    throw new Error("Timeline workspace events and tracks are required.");
  }
  if (workspace.events.length > 10_000) {
    throw new Error("Timeline API accepts at most 10,000 events per workspace.");
  }
  if (workspace.tracks.length > 1_000) {
    throw new Error("Timeline API accepts at most 1,000 tracks per workspace.");
  }
  return workspace as TimelineWorkspace;
}

export function parseTimelineWorkflowApiPayload(
  value: unknown
): TimelineWorkflowApiPayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Timeline workflow request must be a JSON object.");
  }
  const payload = value as Record<string, unknown>;
  const action = cleanString(payload.action) as TimelineWorkflowApiAction;
  if (!ACTIONS.has(action)) throw new Error("Timeline workflow action is invalid.");
  const workflowId = cleanString(payload.workflowId) || undefined;
  const instruction = cleanString(payload.instruction) || undefined;
  const reason = cleanString(payload.reason) || undefined;
  if (action === "start") {
    if (!instruction) throw new Error("Timeline AI instruction is required.");
    if (instruction.length > 4_000) {
      throw new Error("Timeline AI instruction is limited to 4,000 characters.");
    }
  } else if (!workflowId) {
    throw new Error("Timeline workflow ID is required.");
  }
  if (action === "reject" && !reason) {
    throw new Error("A rejection reason is required.");
  }
  const workspace =
    action === "start" || action === "apply"
      ? validateWorkspace(payload.workspace)
      : undefined;
  return {
    action,
    workflowId,
    instruction,
    reason,
    workspace,
    eventIds: cleanIds(payload.eventIds, "Event selection"),
    trackIds: cleanIds(payload.trackIds, "Track selection"),
  };
}

export function bearerToken(authorizationHeader: string | null): string {
  const match = authorizationHeader?.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim() ?? "";
  if (!token || token.length > 8_192) {
    throw new Error("A valid Supabase bearer token is required.");
  }
  return token;
}
