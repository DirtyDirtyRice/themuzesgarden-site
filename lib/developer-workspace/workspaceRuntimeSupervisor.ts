import "server-only";

import { startLiveCodeWatcher, watcherStatus } from "./liveCodeWatcher";

export type WorkspaceRuntimeSupervisorStatus = {
  running: boolean;
  startSource: "instrumentation" | "api" | null;
  startedAt: string | null;
  lastAttemptAt: string | null;
  lastHealthyAt: string | null;
  startAttempts: number;
  error: string | null;
};

type SupervisorState = WorkspaceRuntimeSupervisorStatus & {
  root: string;
  timer: NodeJS.Timeout | null;
  checking: boolean;
};

const globalKey = "__developerWorkspaceRuntimeSupervisor";
const globalStore = globalThis as typeof globalThis & { [globalKey]?: SupervisorState };
const HEALTH_INTERVAL_MS = 15_000;

function state(): SupervisorState {
  globalStore[globalKey] ??= {
    running: false,
    startSource: null,
    startedAt: null,
    lastAttemptAt: null,
    lastHealthyAt: null,
    startAttempts: 0,
    error: null,
    root: process.cwd(),
    timer: null,
    checking: false,
  };
  return globalStore[globalKey];
}

async function ensureWatcher(): Promise<void> {
  const supervisor = state();
  if (!supervisor.running || supervisor.checking) return;
  supervisor.checking = true;
  supervisor.lastAttemptAt = new Date().toISOString();
  try {
    const before = watcherStatus();
    const current = before.running && before.root === supervisor.root ? before : startLiveCodeWatcher(supervisor.root);
    if (!current.running) throw new Error(current.error ?? "The live watcher did not start.");
    if (!before.running) supervisor.startAttempts += 1;
    supervisor.lastHealthyAt = new Date().toISOString();
    supervisor.error = null;
  } catch (error) {
    supervisor.startAttempts += 1;
    supervisor.error = error instanceof Error ? error.message : "Watcher recovery failed.";
  } finally {
    supervisor.checking = false;
  }
}

export function startWorkspaceRuntimeSupervisor(
  root = process.cwd(),
  source: "instrumentation" | "api" = "api"
): WorkspaceRuntimeSupervisorStatus {
  const supervisor = state();
  supervisor.root = root;
  if (!supervisor.running) {
    supervisor.running = true;
    supervisor.startSource = source;
    supervisor.startedAt = new Date().toISOString();
    supervisor.timer = setInterval(() => void ensureWatcher(), HEALTH_INTERVAL_MS);
    supervisor.timer.unref();
  }
  void ensureWatcher();
  return workspaceRuntimeSupervisorStatus();
}

export function stopWorkspaceRuntimeSupervisor(): WorkspaceRuntimeSupervisorStatus {
  const supervisor = state();
  if (supervisor.timer) clearInterval(supervisor.timer);
  supervisor.timer = null;
  supervisor.running = false;
  return workspaceRuntimeSupervisorStatus();
}

export function workspaceRuntimeSupervisorStatus(): WorkspaceRuntimeSupervisorStatus {
  const { running, startSource, startedAt, lastAttemptAt, lastHealthyAt, startAttempts, error } = state();
  return { running, startSource, startedAt, lastAttemptAt, lastHealthyAt, startAttempts, error };
}
