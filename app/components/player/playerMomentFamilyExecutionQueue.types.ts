import type { FamilyPlanningResult } from "./playerMomentFamilyPlanning.types";

export type FamilyExecutionState =
  | "execute-now"
  | "protected"
  | "queued"
  | "blocked"
  | "deferred";

export type FamilyExecutionBlockReason =
  | "insufficient-readiness"
  | "proof-too-thin"
  | "protected-signature"
  | "waiting-turn"
  | "deferred-by-plan"
  | "archive-lane";

export type FamilyExecutionReason =
  | "highest-plan-priority"
  | "ready-for-execution"
  | "signature-protected"
  | "queue-position-earned"
  | "blocked-by-readiness"
  | "deferred-intentionally"
  | "archive-lane-confirmed"
  | "timing-window-open"
  | "reuse-prep-approved"
  | "top-execution-candidate";

export type FamilyExecutionQueueItem = {
  familyId: string;
  queueScore: number;
  executionReadinessScore: number;
  executionPriorityScore: number;
  protectionLockScore: number;
  blockageScore: number;
  executionState: FamilyExecutionState;
  blockReason: FamilyExecutionBlockReason | null;
  queuePosition: number | null;
  strongestReason: FamilyExecutionReason | null;
  reasons: FamilyExecutionReason[];
};

export type FamilyExecutionQueueResult = {
  familyCount: number;
  queueScore: number;
  executionReadinessScore: number;
  executionPriorityScore: number;
  protectionLockScore: number;
  blockageScore: number;
  strongestReason: FamilyExecutionReason | null;
  reasons: FamilyExecutionReason[];
  planningResult: FamilyPlanningResult | null;
  executeNowFamilyIds: string[];
  protectedFamilyIds: string[];
  queuedFamilyIds: string[];
  blockedFamilyIds: string[];
  deferredFamilyIds: string[];
  items: FamilyExecutionQueueItem[];
};

export type BuildFamilyExecutionQueueParams = {
  planningResult?: FamilyPlanningResult | null;
};