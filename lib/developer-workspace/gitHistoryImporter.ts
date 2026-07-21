import "server-only";

import { execFile } from "node:child_process";
import { createReadStream } from "node:fs";
import { createHash, randomUUID } from "node:crypto";
import { appendFile, mkdir, open, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import readline from "node:readline";
import { promisify } from "node:util";
import ts from "typescript";

import type { CodeEvent } from "./codeEventLedger";

const execute = promisify(execFile);
const DIRECTORY = "code-map-reports/event-ledger";
const STATE_FILE = "git-import-state.json";
const EVENTS_FILE = "git-events.jsonl";
const SOURCE_PATTERN = /\.(?:js|jsx|mjs|mts|ts|tsx)$/i;

type Commit = { hash: string; occurredAt: string; author: string; subject: string };
type HistoricSymbol = { key: string; name: string; kind: string; path: string; line: number; fingerprint: string };
type GitImportState = { version: 1; repositoryHead: string | null; processedCommits: string[]; files: Record<string, HistoricSymbol[]>; importedAt: string | null };
export type GitImportProgress = { running: boolean; totalCommits: number; processedCommits: number; currentCommit: string | null; eventCount: number; startedAt: string | null; completedAt: string | null; error: string | null };

function emptyProgress(): GitImportProgress {
  return { running: false, totalCommits: 0, processedCommits: 0, currentCommit: null, eventCount: 0, startedAt: null, completedAt: null, error: null };
}

const progressByRoot = new Map<string, GitImportProgress>();
let runningRoot: string | null = null;

function progressFor(root: string): GitImportProgress {
  const key = path.resolve(root).toLowerCase();
  let progress = progressByRoot.get(key);
  if (!progress) {
    progress = emptyProgress();
    progressByRoot.set(key, progress);
  }
  return progress;
}

async function git(root: string, args: string[], maxBuffer = 32 * 1024 * 1024): Promise<string> {
  const result = await execute("git", args, { cwd: root, windowsHide: true, maxBuffer, encoding: "utf8" });
  return result.stdout;
}

async function commits(root: string): Promise<Commit[]> {
  const output = await git(root, ["log", "--reverse", "--format=%H%x1f%aI%x1f%an%x1f%s%x1e"]);
  return output.split("\x1e").map((record) => record.trim()).filter(Boolean).map((record) => {
    const [hash, occurredAt, author, ...subject] = record.split("\x1f");
    return { hash, occurredAt, author, subject: subject.join("\x1f") };
  });
}

async function changedFiles(root: string, commit: string): Promise<Array<{ status: string; path: string; previousPath: string | null }>> {
  const output = await git(root, ["diff-tree", "--root", "--no-commit-id", "--name-status", "-r", "-M", commit]);
  return output.split(/\r?\n/).filter(Boolean).flatMap<{ status: string; path: string; previousPath: string | null }>((line) => {
    const parts = line.split("\t"), status = parts[0];
    if (status.startsWith("R") && parts[1] && parts[2]) return SOURCE_PATTERN.test(parts[2]) ? [{ status: "R", previousPath: parts[1], path: parts[2] }] : [];
    return parts[1] && SOURCE_PATTERN.test(parts[1]) ? [{ status: status[0], previousPath: null, path: parts[1] }] : [];
  });
}

async function committedSource(root: string, commit: string, file: string): Promise<string | null> {
  try { return await git(root, ["show", `${commit}:${file}`], 16 * 1024 * 1024); }
  catch { return null; }
}

function declarationKind(node: ts.Node): string | null {
  if (ts.isClassDeclaration(node)) return "class"; if (ts.isInterfaceDeclaration(node)) return "interface";
  if (ts.isTypeAliasDeclaration(node)) return "type"; if (ts.isEnumDeclaration(node)) return "enum";
  if (ts.isFunctionDeclaration(node)) return "function"; if (ts.isMethodDeclaration(node) || ts.isMethodSignature(node)) return "method";
  return null;
}

function parseSymbols(file: string, source: string): HistoricSymbol[] {
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const raw: Array<Omit<HistoricSymbol, "key"> & { container: string }> = [];
  function visit(node: ts.Node, container = ""): void {
    const kind = declarationKind(node);
    const named = node as ts.Node & { name?: ts.DeclarationName };
    if (kind && named.name) {
      const name = named.name.getText(sourceFile), position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
      raw.push({ name, kind, path: file, line: position.line + 1, fingerprint: createHash("sha256").update(node.getText(sourceFile)).digest("hex"), container });
    }
    if (ts.isVariableStatement(node) && ts.canHaveModifiers(node) && ts.getModifiers(node)?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)) {
      for (const declaration of node.declarationList.declarations) if (ts.isIdentifier(declaration.name)) { const position = sourceFile.getLineAndCharacterOfPosition(declaration.getStart(sourceFile)); raw.push({ name: declaration.name.text, kind: "constant", path: file, line: position.line + 1, fingerprint: createHash("sha256").update(declaration.getText(sourceFile)).digest("hex"), container }); }
    }
    const nextContainer = (ts.isClassDeclaration(node) || ts.isInterfaceDeclaration(node)) && named.name ? named.name.getText(sourceFile) : container;
    ts.forEachChild(node, (child) => visit(child, nextContainer));
  }
  visit(sourceFile);
  const counts = new Map<string, number>();
  return raw.map((item) => { const base = `${item.kind}:${item.container}:${item.name}`.toLowerCase(), occurrence = counts.get(base) ?? 0; counts.set(base, occurrence + 1); return { ...item, key: `${base}:${occurrence}` }; });
}

async function readState(file: string): Promise<GitImportState> {
  try { return JSON.parse(await readFile(file, "utf8")) as GitImportState; }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return { version: 1, repositoryHead: null, processedCommits: [], files: {}, importedAt: null }; throw error; }
}

function historyEvent(kind: CodeEvent["kind"], symbol: HistoricSymbol, previous: HistoricSymbol | null, commit: Commit, details: string): CodeEvent {
  return { id: randomUUID(), kind, occurredAt: commit.occurredAt, symbolKey: symbol.key, symbolName: symbol.name, symbolKind: symbol.kind as CodeEvent["symbolKind"], path: symbol.path, line: symbol.line, previousPath: previous?.path ?? null, previousLine: previous?.line ?? null, details, origin: "git", gitCommit: commit.hash, gitAuthor: commit.author, gitSubject: commit.subject };
}

function compare(previous: HistoricSymbol[], current: HistoricSymbol[], commit: Commit, movedFrom: string | null): CodeEvent[] {
  const events: CodeEvent[] = [], oldMap = new Map(previous.map((item) => [item.key, item])), newMap = new Map(current.map((item) => [item.key, item]));
  for (const symbol of current) {
    const prior = oldMap.get(symbol.key);
    if (movedFrom && prior) events.push(historyEvent("git-symbol-moved", symbol, prior, commit, `Symbol moved from ${movedFrom} in commit ${commit.hash.slice(0, 8)}.`));
    else if (!prior) events.push(historyEvent(movedFrom ? "git-symbol-moved" : "git-symbol-created", symbol, movedFrom ? previous.find((item) => item.name === symbol.name && item.kind === symbol.kind) ?? null : null, commit, movedFrom ? `Symbol moved from ${movedFrom} in commit ${commit.hash.slice(0, 8)}.` : `Symbol created in commit ${commit.hash.slice(0, 8)}.`));
    else if (prior.fingerprint !== symbol.fingerprint || prior.line !== symbol.line) events.push(historyEvent("git-symbol-changed", symbol, prior, commit, `Symbol changed in commit ${commit.hash.slice(0, 8)}.`));
  }
  for (const symbol of previous) if (!newMap.has(symbol.key) && !movedFrom) events.push(historyEvent("git-symbol-removed", symbol, symbol, commit, `Symbol removed in commit ${commit.hash.slice(0, 8)}.`));
  return events;
}

async function saveState(file: string, state: GitImportState): Promise<void> {
  const temporary = `${file}.${randomUUID()}.tmp`; await writeFile(temporary, JSON.stringify(state), "utf8"); await rename(temporary, file);
}

export function gitImportProgress(root = process.cwd()): GitImportProgress {
  return { ...progressFor(root) };
}

export async function importGitHistory(root = process.cwd(), restart = false): Promise<GitImportProgress> {
  root = path.resolve(root);
  if (runningRoot && runningRoot !== root.toLowerCase()) throw new Error("Git history import is already running for another project.");
  const progress = progressFor(root);
  if (progress.running) throw new Error("Git history import is already running for this project.");
  runningRoot = root.toLowerCase();
  progress.running = true; progress.startedAt = new Date().toISOString(); progress.completedAt = null; progress.error = null; progress.eventCount = 0;
  try {
    const directory = path.resolve(root, DIRECTORY); await mkdir(directory, { recursive: true });
    const stateFile = path.join(directory, STATE_FILE), eventsFile = path.join(directory, EVENTS_FILE);
    if (restart) await writeFile(eventsFile, "", "utf8");
    const state = restart ? { version: 1 as const, repositoryHead: null, processedCommits: [], files: {}, importedAt: null } : await readState(stateFile);
    const allCommits = await commits(root), processed = new Set(state.processedCommits);
    progress.totalCommits = allCommits.length; progress.processedCommits = processed.size;
    for (const commit of allCommits) {
      if (processed.has(commit.hash)) continue;
      progress.currentCommit = commit.hash;
      const events: CodeEvent[] = [];
      for (const change of await changedFiles(root, commit.hash)) {
        const previousPath = change.previousPath ?? change.path;
        const prior = state.files[previousPath] ?? [];
        if (change.status === "D") { for (const symbol of prior) events.push(historyEvent("git-symbol-removed", symbol, symbol, commit, `Symbol removed in commit ${commit.hash.slice(0, 8)}.`)); delete state.files[change.path]; continue; }
        const source = await committedSource(root, commit.hash, change.path); if (source === null) continue;
        const current = parseSymbols(change.path, source);
        events.push(...compare(prior, current, commit, change.status === "R" ? previousPath : null));
        if (change.status === "R") delete state.files[previousPath];
        state.files[change.path] = current;
      }
      if (events.length) await appendFile(eventsFile, events.map((item) => JSON.stringify(item)).join("\n") + "\n", "utf8");
      progress.eventCount += events.length; processed.add(commit.hash); state.processedCommits = [...processed]; state.repositoryHead = commit.hash; state.importedAt = new Date().toISOString();
      progress.processedCommits = processed.size;
      if (processed.size % 10 === 0) await saveState(stateFile, state);
    }
    await saveState(stateFile, state); progress.completedAt = new Date().toISOString(); progress.currentCommit = null;
  } catch (error) { progress.error = error instanceof Error ? error.message : "Git history import failed."; throw error; }
  finally {
    progress.running = false;
    if (runningRoot === root.toLowerCase()) runningRoot = null;
  }
  return gitImportProgress(root);
}

export async function readRecentGitEvents(limit = 500, root = process.cwd()): Promise<CodeEvent[]> {
  if (!Number.isInteger(limit) || limit < 1 || limit > 2_000) throw new Error("Git event limit must be between 1 and 2,000.");
  let handle;
  try {
    handle = await open(path.resolve(root, DIRECTORY, EVENTS_FILE), "r");
    const stats = await handle.stat(); let position = stats.size, content = "", lineCount = 0;
    while (position > 0 && lineCount <= limit) { const size = Math.min(64 * 1_024, position); position -= size; const buffer = Buffer.allocUnsafe(size); await handle.read(buffer, 0, size, position); content = buffer.toString("utf8") + content; lineCount = content.split("\n").length - 1; }
    return content.split(/\r?\n/).filter(Boolean).slice(-limit).reverse().map((line) => JSON.parse(line) as CodeEvent);
  } catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return []; throw error; } finally { await handle?.close(); }
}
export async function searchGitEvents(query: string, limit = 500, root = process.cwd()): Promise<CodeEvent[]> {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return readRecentGitEvents(limit, root);
  if (!Number.isInteger(limit) || limit < 1 || limit > 2_000) throw new Error("Git search limit must be between 1 and 2,000.");
  const matches: CodeEvent[] = [];
  const file = path.resolve(root, DIRECTORY, EVENTS_FILE);
  try {
    const lines = readline.createInterface({ input: createReadStream(file, { encoding: "utf8" }), crlfDelay: Infinity });
    for await (const line of lines) {
      if (!line.toLowerCase().includes(normalized)) continue;
      matches.push(JSON.parse(line) as CodeEvent);
    }
    return matches.sort((left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime()).slice(0, limit);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}