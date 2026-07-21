import "server-only";

import { randomUUID } from "node:crypto";

import { runProductionBuild, runTypeCheck, type BuildCheckKind, type BuildCheckResult } from "./buildDiagnostics";
import { appendVerificationHistory, readVerificationHistory } from "./verificationHistoryStore";
import { startLiveCodeWatcher, stopLiveCodeWatcher, watcherStatus } from "./liveCodeWatcher";

export type VerificationSource = "build-workspace" | "safe-patch" | "automatic";
export type VerificationJobStatus = "queued" | "running" | "passed" | "failed" | "timed-out";
export type VerificationJob = {
  id: string;
  kind: BuildCheckKind;
  source: VerificationSource;
  projectId?: string;
  root?: string;
  status: VerificationJobStatus;
  queuedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  result: BuildCheckResult | null;
};

type InternalJob = VerificationJob & {
  resolve: (value: VerificationJob) => void;
  reject: (reason: unknown) => void;
};

type CoordinatorState = {
  queue: InternalJob[];
  active: InternalJob | null;
  history: VerificationJob[];
  processing: boolean;
  historyLoaded: Promise<void> | null;
};

const globalKey = "__developerWorkspaceVerificationCoordinator";
const store = globalThis as typeof globalThis & { [globalKey]?: CoordinatorState };

function state(): CoordinatorState {
  store[globalKey] ??= { queue: [], active: null, history: [], processing: false, historyLoaded: null };
  return store[globalKey];
}

async function loadHistory(): Promise<void> {
  const coordinator = state();
  coordinator.historyLoaded ??= readVerificationHistory().then((history) => {
    coordinator.history = history;
  });
  await coordinator.historyLoaded;
}

function publicJob(job: InternalJob): VerificationJob {
  const { resolve: _resolve, reject: _reject, ...value } = job;
  return value;
}

async function processQueue(): Promise<void> {
  const coordinator = state();
  if (coordinator.processing) return;
  coordinator.processing = true;
  try {
    await loadHistory();
    while (coordinator.queue.length) {
      const job = coordinator.queue.shift()!;
      coordinator.active = job;
      job.status = "running";
      job.startedAt = new Date().toISOString();
      const watcherBefore = watcherStatus();
      if (watcherBefore.running) stopLiveCodeWatcher();
      try {
        const result = job.kind === "typecheck" ? await runTypeCheck(job.root) : await runProductionBuild(job.root);
        job.result = result;
        job.status = result.status;
        job.completedAt = new Date().toISOString();
        const completed = publicJob(job);
        coordinator.history = [completed, ...coordinator.history].slice(0, 100);
        await appendVerificationHistory(completed);
        job.resolve(completed);
      } catch (error) {
        job.completedAt = new Date().toISOString();
        job.status = "failed";
        const completed = publicJob(job);
        coordinator.history = [completed, ...coordinator.history].slice(0, 100);
        await appendVerificationHistory(completed).catch(() => undefined);
        job.reject(error);
      } finally {
        if (watcherBefore.running && watcherBefore.root) startLiveCodeWatcher(watcherBefore.root);
        coordinator.active = null;
      }
    }
  } finally {
    coordinator.processing = false;
  }
}

export function enqueueVerification(
  kind: BuildCheckKind,
  source: VerificationSource,
  project: { projectId?: string; root?: string } = {}
): Promise<VerificationJob> {
  return new Promise((resolve, reject) => {
    const job: InternalJob = {
      id: randomUUID(), kind, source, projectId: project.projectId, root: project.root, status: "queued", queuedAt: new Date().toISOString(),
      startedAt: null, completedAt: null, result: null, resolve, reject,
    };
    state().queue.push(job);
    void processQueue();
  });
}

export async function verificationCoordinatorStatus(
  project: { projectId?: string; root?: string } = {}
): Promise<{
  active: VerificationJob | null;
  queued: VerificationJob[];
  history: VerificationJob[];
}> {
  const coordinator = state();
  const matchesProject = (job: VerificationJob): boolean => !project.projectId || job.projectId === project.projectId;
  const active = coordinator.active ? publicJob(coordinator.active) : null;
  const memoryHistory = coordinator.history.filter(matchesProject);
  const storedHistory = project.root
    ? await readVerificationHistory(100, project.root)
    : (await loadHistory(), coordinator.history);
  const historyById = new Map<string, VerificationJob>();
  for (const job of [...memoryHistory, ...storedHistory.filter(matchesProject)]) historyById.set(job.id, job);
  const history = [...historyById.values()]
    .sort((left, right) => right.queuedAt.localeCompare(left.queuedAt))
    .slice(0, 100);
  return {
    active: active && matchesProject(active) ? active : null,
    queued: coordinator.queue.map(publicJob).filter(matchesProject),
    history,
  };
}
