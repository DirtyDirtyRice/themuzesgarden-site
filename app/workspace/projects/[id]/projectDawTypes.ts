export type DawSessionState = "draft" | "ready" | "active" | "suspended" | "closed";

export type DawStage = {
  order: number;
  engineId: string;
  name: string;
  domain: string;
  dependencies: string[];
  ready: boolean;
  blockingReasons: string[];
};

export type DawSession = {
  id: string;
  projectId: string;
  songId: string;
  name: string;
  state: DawSessionState;
  revision: number;
  readiness: {
    ready: boolean;
    completed: number;
    required: number;
    stages: DawStage[];
    errors: string[];
  };
  updatedAt: string;
};

export type DawSnapshot = {
  workspaceRevision: number;
  sessions: DawSession[];
};

export type DawSessionAction = "validate" | "activate" | "suspend" | "resume" | "close";

export const dawActionsByState: Record<DawSessionState, DawSessionAction[]> = {
  draft: ["validate"],
  ready: ["activate", "close"],
  active: ["suspend", "close"],
  suspended: ["resume", "close"],
  closed: [],
};
