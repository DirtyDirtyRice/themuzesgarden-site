import "server-only";

import { watch, type FSWatcher } from "node:fs";
import path from "node:path";

import { updateCodeEventLedger, type LedgerUpdate } from "./codeEventLedger";
import { buildSymbolIndex } from "./symbolIndex";
import { buildRelationshipIndex } from "./relationshipIndex";
import { updateRelationshipEventLedger } from "./relationshipEventLedger";

export type LiveWatcherStatus = {
  root: string | null;
  running: boolean;
  startedAt: string | null;
  lastChangeAt: string | null;
  lastIndexedAt: string | null;
  pendingFiles: string[];
  lastEventCount: number;
  error: string | null;
};

const IGNORED_SEGMENTS = new Set([".git", ".next", ".vercel", "node_modules", "code-map-reports"]);
const WATCHED_EXTENSIONS = new Set([".js", ".jsx", ".mjs", ".mts", ".ts", ".tsx"]);
const DEBOUNCE_MS = 1_200;

type WatcherState = LiveWatcherStatus & { watcher: FSWatcher | null; timer: NodeJS.Timeout | null; updating: boolean; rerun: boolean };
const globalKey = "__developerWorkspaceLiveWatcher";
const globalStore = globalThis as typeof globalThis & { [globalKey]?: WatcherState };

function state(): WatcherState {
  globalStore[globalKey] ??= { root: null, running: false, startedAt: null, lastChangeAt: null, lastIndexedAt: null, pendingFiles: [], lastEventCount: 0, error: null, watcher: null, timer: null, updating: false, rerun: false };
  return globalStore[globalKey];
}

function allowed(relativePath: string): boolean {
  const segments = relativePath.split(/[\\/]+/).filter(Boolean);
  return !segments.some((segment) => IGNORED_SEGMENTS.has(segment)) && WATCHED_EXTENSIONS.has(path.extname(relativePath).toLowerCase());
}

async function flush(root: string): Promise<void> {
  const current = state();
  if (current.updating) { current.rerun = true; return; }
  current.updating = true;
  current.rerun = false;
  try {
    const [symbolIndex, relationshipIndex] = await Promise.all([buildSymbolIndex({ root }), buildRelationshipIndex(root)]);
    const result: LedgerUpdate = await updateCodeEventLedger(symbolIndex, root);
    const relationshipResult = await updateRelationshipEventLedger(relationshipIndex, root);
    current.lastIndexedAt = relationshipResult.generatedAt;
    current.lastEventCount = result.events.length + relationshipResult.events.length;
    current.pendingFiles = [];
    current.error = null;
  } catch (error) {
    current.error = error instanceof Error ? error.message : "Live ledger update failed.";
  } finally {
    current.updating = false;
    if (current.rerun) schedule(root);
  }
}

function schedule(root: string): void {
  const current = state();
  if (current.timer) clearTimeout(current.timer);
  current.timer = setTimeout(() => { current.timer = null; void flush(root); }, DEBOUNCE_MS);
}

export function startLiveCodeWatcher(root = process.cwd()): LiveWatcherStatus {
  const current = state();
  const resolvedRoot = path.resolve(root);
  if (current.running && current.root === resolvedRoot) return watcherStatus();
  if (current.running) stopLiveCodeWatcher();
  current.watcher = watch(resolvedRoot, { recursive: true }, (_event, filename) => {
    if (!filename) return;
    const relative = filename.toString().split(path.sep).join("/");
    if (!allowed(relative)) return;
    current.lastChangeAt = new Date().toISOString();
    if (!current.pendingFiles.includes(relative)) current.pendingFiles = [...current.pendingFiles, relative].slice(-100);
    schedule(resolvedRoot);
  });
  current.watcher.on("error", (error) => {
    current.error = error.message;
    current.running = false;
    current.watcher?.close();
    current.watcher = null;
  });
  current.root = resolvedRoot;
  current.running = true;
  current.startedAt = new Date().toISOString();
  current.error = null;
  return watcherStatus();
}

export function stopLiveCodeWatcher(): LiveWatcherStatus {
  const current = state();
  current.watcher?.close();
  if (current.timer) clearTimeout(current.timer);
  current.watcher = null;
  current.timer = null;
  current.running = false;
  current.root = null;
  current.pendingFiles = [];
  return watcherStatus();
}

export function watcherStatus(): LiveWatcherStatus {
  const { root, running, startedAt, lastChangeAt, lastIndexedAt, pendingFiles, lastEventCount, error } = state();
  return { root, running, startedAt, lastChangeAt, lastIndexedAt, pendingFiles, lastEventCount, error };
}
