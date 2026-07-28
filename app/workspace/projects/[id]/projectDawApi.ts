import { requireProjectSupabase } from "./projectSupabase";
import type { DawSession, DawSessionAction, DawSnapshot } from "./projectDawTypes";
import type {
  TimelineOfflineRenderJob,
  TimelineRenderFormat,
  TimelineRenderTarget,
} from "../../../../lib/timeline/TimelineOfflineRenderAndExportEngine";
import type {
  TimelineTransportEvent,
  TimelineTransportSynchronization,
} from "../../../../lib/timeline/TimelineTransportAndSynchronizationEngine";

async function accessToken(): Promise<string> {
  const { data, error } = await requireProjectSupabase().auth.getSession();
  if (error) throw error;
  const token = data.session?.access_token;
  if (!token) throw new Error("Your member session expired. Sign in again to use Studio.");
  return token;
}

export class ProjectDawApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "ProjectDawApiError";
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const token = await accessToken();
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ProjectDawApiError(body.error || "Studio request failed.", response.status);
  }
  return body as T;
}

export function loadDawSnapshot(projectId: string): Promise<DawSnapshot> {
  return request(`/api/timeline/daw-workspaces?projectId=${encodeURIComponent(projectId)}`);
}

export async function openDawSession(input: {
  projectId: string;
  songId: string;
  name: string;
  expectedWorkspaceRevision: number;
}) {
  return request<{ receipt: { workspaceRevision: number; session: DawSession } }>(
    "/api/timeline/daw-workspaces",
    { method: "POST", body: JSON.stringify({ action: "open", ...input }) },
  );
}

export async function changeDawSession(input: {
  action: DawSessionAction;
  sessionId: string;
  expectedSessionRevision: number;
  expectedWorkspaceRevision: number;
}) {
  return request<{ receipt: { workspaceRevision: number; session: DawSession } }>(
    "/api/timeline/daw-workspaces",
    { method: "POST", body: JSON.stringify(input) },
  );
}

export type DawTransportSnapshot = {
  workspaceRevision: number;
  session: DawSession;
  transport: TimelineTransportSynchronization | null;
  events: TimelineTransportEvent[];
};

export function loadDawTransport(sessionId: string): Promise<DawTransportSnapshot> {
  return request(`/api/timeline/daw-transports?sessionId=${encodeURIComponent(sessionId)}`);
}

export function changeDawTransport(input: {
  action:
    | "initialize"
    | "play"
    | "pause"
    | "stop"
    | "locate"
    | "set-loop"
    | "set-count-in"
    | "complete-count-in"
    | "set-metronome"
    | "set-cue"
    | "set-stop-return"
    | "set-scrub-snap";
  sessionId: string;
  expectedWorkspaceRevision: number;
  expectedTransportHead?: number;
  returnToTick?: number;
  tick?: number;
  enabled?: boolean;
  startTick?: number;
  endTick?: number;
  bars?: number;
  cueTick?: number | null;
  returnToCue?: boolean;
  snap?: "free" | "beat" | "bar";
}): Promise<{ receipt: DawTransportSnapshot }> {
  return request("/api/timeline/daw-transports", {
    method: "POST",
    keepalive: true,
    body: JSON.stringify(input),
  });
}

export type DawRenderSnapshot = {
  workspaceRevision: number;
  jobs: TimelineOfflineRenderJob[];
};

export function loadDawRenders(sessionId: string): Promise<DawRenderSnapshot> {
  return request(`/api/timeline/daw-renders?sessionId=${encodeURIComponent(sessionId)}`);
}

export function prepareDawRender(input: {
  sessionId: string;
  expectedWorkspaceRevision: number;
  name: string;
  target: TimelineRenderTarget;
  sourceIds: string[];
  startSample: number;
  endSample: number;
  sampleRate: number;
  bitDepth: 16 | 24 | 32;
  channels: number;
  format: TimelineRenderFormat;
  normalizePeakDb?: number | null;
  dither?: boolean;
}): Promise<{ receipt: { workspaceRevision: number; job: TimelineOfflineRenderJob } }> {
  return request("/api/timeline/daw-renders", {
    method: "POST",
    body: JSON.stringify({ action: "prepare", ...input }),
  });
}
