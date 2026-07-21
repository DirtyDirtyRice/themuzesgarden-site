import "server-only";

import { randomUUID } from "node:crypto";
import { appendFile, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import type { CodeRootIndex, IndexedCodeRoot } from "./codeRootIndex";

export type CodeRootEventKind =
  | "root-observed"
  | "root-restored"
  | "root-moved"
  | "root-renamed"
  | "root-boundary-shifted"
  | "root-content-changed"
  | "root-removed";

export type StableCodeRootRecord = {
  id: string;
  title: string;
  path: string;
  markerLine: number;
  startLine: number;
  endLine: number;
  lineCount: number;
  contentHash: string;
  symbolNames: string[];
  firstObservedAt: string;
  lastObservedAt: string;
  present: boolean;
  removedAt: string | null;
  revisionCount: number;
  titleHistory: string[];
  pathHistory: string[];
};

export type CodeRootEvent = {
  eventId: string;
  rootId: string;
  kind: CodeRootEventKind;
  occurredAt: string;
  title: string;
  path: string;
  markerLine: number;
  previousPath: string | null;
  previousMarkerLine: number | null;
  previousTitle: string | null;
  details: string;
};

export type CodeRootRegistry = {
  version: 1;
  generatedAt: string;
  records: Record<string, StableCodeRootRecord>;
};

export type CodeRootLedgerUpdate = {
  generatedAt: string;
  observedRoots: number;
  trackedRoots: number;
  events: CodeRootEvent[];
  records: StableCodeRootRecord[];
};

const reportDirectory = "code-map-reports/code-roots";
const registryFile = "root-registry.json";
const eventsFile = "root-events.jsonl";
const lockKey = "__developerWorkspaceCodeRootLedgerLocks";
const globalLocks = globalThis as typeof globalThis & { [lockKey]?: Map<string, Promise<void>> };
globalLocks[lockKey] ??= new Map<string, Promise<void>>();

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function recordFromRoot(
  root: IndexedCodeRoot,
  observedAt: string,
  previous?: StableCodeRootRecord
): StableCodeRootRecord {
  const contentChanged = Boolean(previous && previous.contentHash !== root.contentHash);
  return {
    id: root.id,
    title: root.title,
    path: root.path,
    markerLine: root.markerLine,
    startLine: root.startLine,
    endLine: root.endLine,
    lineCount: root.lineCount,
    contentHash: root.contentHash,
    symbolNames: unique(root.symbols.map((symbol) => symbol.name)),
    firstObservedAt: previous?.firstObservedAt ?? observedAt,
    lastObservedAt: observedAt,
    present: true,
    removedAt: null,
    revisionCount: (previous?.revisionCount ?? 0) + (contentChanged ? 1 : 0),
    titleHistory: unique([...(previous?.titleHistory ?? []), root.title]),
    pathHistory: unique([...(previous?.pathHistory ?? []), root.path]),
  };
}

function rootEvent(
  kind: CodeRootEventKind,
  current: StableCodeRootRecord,
  previous: StableCodeRootRecord | null,
  occurredAt: string,
  details: string
): CodeRootEvent {
  return {
    eventId: randomUUID(),
    rootId: current.id,
    kind,
    occurredAt,
    title: current.title,
    path: current.path,
    markerLine: current.markerLine,
    previousPath: previous?.path ?? null,
    previousMarkerLine: previous?.markerLine ?? null,
    previousTitle: previous?.title ?? null,
    details,
  };
}

function eventsForCurrent(
  current: StableCodeRootRecord,
  previous: StableCodeRootRecord | null,
  occurredAt: string
): CodeRootEvent[] {
  if (!previous) {
    return [rootEvent("root-observed", current, null, occurredAt, `Code root ${current.id} was first observed.`)];
  }
  const events: CodeRootEvent[] = [];
  if (!previous.present) {
    events.push(rootEvent("root-restored", current, previous, occurredAt, `Code root ${current.id} was restored with its original stable identity.`));
  }
  if (previous.path !== current.path) {
    events.push(rootEvent("root-moved", current, previous, occurredAt, `Code root moved from ${previous.path}:${previous.markerLine} to ${current.path}:${current.markerLine}.`));
  }
  if (previous.title !== current.title) {
    events.push(rootEvent("root-renamed", current, previous, occurredAt, `Code root title changed from "${previous.title}" to "${current.title}".`));
  }
  if (previous.path === current.path && (previous.markerLine !== current.markerLine || previous.endLine !== current.endLine)) {
    events.push(rootEvent("root-boundary-shifted", current, previous, occurredAt, `Code root boundary shifted from lines ${previous.markerLine}-${previous.endLine} to ${current.markerLine}-${current.endLine}.`));
  }
  if (previous.contentHash !== current.contentHash) {
    events.push(rootEvent("root-content-changed", current, previous, occurredAt, `Code root content changed; revision ${current.revisionCount}.`));
  }
  return events;
}

async function withRootLock<T>(root: string, work: () => Promise<T>): Promise<T> {
  const locks = globalLocks[lockKey]!;
  const key = path.resolve(root);
  const previous = locks.get(key) ?? Promise.resolve();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  const queued = previous.then(() => gate);
  locks.set(key, queued);
  await previous;
  try {
    return await work();
  } finally {
    release();
    if (locks.get(key) === queued) locks.delete(key);
  }
}

export async function readCodeRootRegistry(root = process.cwd()): Promise<CodeRootRegistry> {
  try {
    return JSON.parse(await readFile(path.resolve(root, reportDirectory, registryFile), "utf8")) as CodeRootRegistry;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { version: 1, generatedAt: new Date(0).toISOString(), records: {} };
    }
    throw error;
  }
}

async function writeRegistry(registry: CodeRootRegistry, root: string): Promise<void> {
  const directory = path.resolve(root, reportDirectory);
  await mkdir(directory, { recursive: true });
  const target = path.join(directory, registryFile);
  const temporary = `${target}.${randomUUID()}.tmp`;
  await writeFile(temporary, JSON.stringify(registry, null, 2), "utf8");
  await rename(temporary, target);
}

export async function readCodeRootEvents(limit = 200, root = process.cwd()): Promise<CodeRootEvent[]> {
  if (!Number.isInteger(limit) || limit < 1 || limit > 2_000) throw new Error("Code root event limit must be between 1 and 2,000.");
  try {
    const content = await readFile(path.resolve(root, reportDirectory, eventsFile), "utf8");
    return content.split(/\r?\n/).filter(Boolean).slice(-limit).reverse().map((line) => JSON.parse(line) as CodeRootEvent);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

export async function updateCodeRootLedger(
  index: CodeRootIndex,
  root = index.root
): Promise<CodeRootLedgerUpdate> {
  const canonicalRoot = path.resolve(root);
  if (path.resolve(index.root) !== canonicalRoot) throw new Error("Code Root Index and ledger roots do not match.");
  const blockingIssues = index.issues.filter((issue) => issue.severity === "error");
  if (blockingIssues.length) throw new Error(`Code root ledger cannot update while ${blockingIssues.length} root signature error(s) remain.`);

  return withRootLock(canonicalRoot, async () => {
    const occurredAt = new Date().toISOString();
    const previousRegistry = await readCodeRootRegistry(canonicalRoot);
    const records = { ...previousRegistry.records };
    const observed = new Set<string>();
    const events: CodeRootEvent[] = [];

    for (const indexedRoot of index.roots) {
      const previous = records[indexedRoot.id] ?? null;
      const current = recordFromRoot(indexedRoot, occurredAt, previous ?? undefined);
      records[current.id] = current;
      observed.add(current.id);
      events.push(...eventsForCurrent(current, previous, occurredAt));
    }

    for (const previous of Object.values(previousRegistry.records)) {
      if (observed.has(previous.id) || !previous.present) continue;
      const removed: StableCodeRootRecord = { ...previous, present: false, removedAt: occurredAt, lastObservedAt: occurredAt };
      records[removed.id] = removed;
      events.push(rootEvent("root-removed", removed, previous, occurredAt, `Code root ${removed.id} is no longer present; its identity remains reserved for restoration.`));
    }

    const registry: CodeRootRegistry = { version: 1, generatedAt: occurredAt, records };
    const directory = path.resolve(canonicalRoot, reportDirectory);
    await mkdir(directory, { recursive: true });
    if (events.length) await appendFile(path.join(directory, eventsFile), `${events.map((event) => JSON.stringify(event)).join("\n")}\n`, "utf8");
    await writeRegistry(registry, canonicalRoot);
    return {
      generatedAt: occurredAt,
      observedRoots: index.rootCount,
      trackedRoots: Object.keys(records).length,
      events,
      records: Object.values(records).sort((left, right) => left.path.localeCompare(right.path) || left.markerLine - right.markerLine),
    };
  });
}
