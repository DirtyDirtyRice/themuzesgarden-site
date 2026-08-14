import { createHash } from "node:crypto";

export const TIMELINE_DAW_SESSION_CAPABILITIES = [
  "session:read",
  "workflow:read",
  "feedback:create",
  "feedback:respond",
  "transport:read",
] as const;

export type TimelineDawSessionCapability = (typeof TIMELINE_DAW_SESSION_CAPABILITIES)[number];
export type TimelineDawSessionRole = "owner" | "beta-collaborator";

export type TimelineDawSessionAccessDecision = {
  allowed: boolean;
  actorId: string;
  ownerId: string;
  sessionId: string;
  enrollmentId: string | null;
  role: TimelineDawSessionRole;
  capability: TimelineDawSessionCapability;
  reason: string;
  receiptId: string;
  receiptChecksum: string;
  observedAt: string;
};

export function parseTimelineDawSessionCapability(value: unknown): TimelineDawSessionCapability {
  if (typeof value !== "string" || !TIMELINE_DAW_SESSION_CAPABILITIES.includes(value as TimelineDawSessionCapability)) {
    throw new Error("DAW session capability is invalid.");
  }
  return value as TimelineDawSessionCapability;
}

export function createTimelineDawSessionAccessChecksum(value: Omit<TimelineDawSessionAccessDecision, "receiptChecksum">): string {
  const canonical = [
    value.receiptId, value.actorId, value.ownerId, value.sessionId, value.enrollmentId ?? "",
    value.role, value.capability, value.allowed ? "true" : "false", value.reason, value.observedAt,
  ].join("|");
  return `sha256:${createHash("sha256").update(canonical).digest("hex")}`;
}

export function verifyTimelineDawSessionAccessDecision(value: TimelineDawSessionAccessDecision): TimelineDawSessionAccessDecision {
  const { receiptChecksum, ...payload } = value;
  if (receiptChecksum !== createTimelineDawSessionAccessChecksum(payload)) {
    throw new Error("DAW session access receipt integrity verification failed.");
  }
  if (!value.allowed) throw new Error(value.reason || "DAW session access was denied.");
  return value;
}
