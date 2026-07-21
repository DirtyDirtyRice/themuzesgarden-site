import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { open } from "node:fs/promises";
import path from "node:path";
import readline from "node:readline";

import { updateStableCodeEventLedger } from "./stableCodeEventLedger";
import type { ProjectSymbol, SymbolIndex } from "./symbolIndex";

export type CodeEventKind = "symbol-observed" | "symbol-changed" | "symbol-moved" | "symbol-renamed" | "symbol-restored" | "symbol-removed" | "import-added" | "import-removed" | "export-added" | "export-removed" | "reference-added" | "reference-removed" | "git-symbol-created" | "git-symbol-changed" | "git-symbol-moved" | "git-symbol-removed" | "build-error-observed" | "build-error-resolved";
export type CodeEvent = {
  id: string;
  kind: CodeEventKind;
  occurredAt: string;
  symbolKey: string;
  symbolName: string;
  symbolKind: ProjectSymbol["kind"] | "relationship" | "diagnostic";
  path: string;
  line: number;
  previousPath: string | null;
  previousLine: number | null;
  details: string;
  origin?: "live" | "git";
  gitCommit?: string;
  gitAuthor?: string;
  gitSubject?: string;
};

export type LedgerUpdate = {
  generatedAt: string;
  events: CodeEvent[];
  observedSymbols: number;
  totalTrackedSymbols: number;
};

const LEDGER_DIRECTORY = "code-map-reports/event-ledger";
const EVENTS_FILE = "events.jsonl";

export async function updateCodeEventLedger(index: SymbolIndex, root = process.cwd()): Promise<LedgerUpdate> {
  return updateStableCodeEventLedger(index, root);
}

export async function readRecentCodeEvents(limit = 200, root = process.cwd()): Promise<CodeEvent[]> {
  if (!Number.isInteger(limit) || limit < 1 || limit > 2_000) throw new Error("Event limit must be between 1 and 2,000.");
  const filePath = path.resolve(root, LEDGER_DIRECTORY, EVENTS_FILE);
  let handle;
  try {
    handle = await open(filePath, "r");
    const stats = await handle.stat();
    const chunkSize = 64 * 1_024;
    let position = stats.size;
    let content = "";
    let lineCount = 0;
    while (position > 0 && lineCount <= limit) {
      const size = Math.min(chunkSize, position);
      position -= size;
      const buffer = Buffer.allocUnsafe(size);
      await handle.read(buffer, 0, size, position);
      content = buffer.toString("utf8") + content;
      lineCount = content.split("\n").length - 1;
    }
    return content.split(/\r?\n/).filter(Boolean).slice(-limit).reverse().map((line) => JSON.parse(line) as CodeEvent);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  } finally {
    await handle?.close();
  }
}
export async function searchCodeEvents(query: string, limit = 500, root = process.cwd()): Promise<CodeEvent[]> {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return readRecentCodeEvents(limit, root);
  if (!Number.isInteger(limit) || limit < 1 || limit > 2_000) throw new Error("Code event search limit must be between 1 and 2,000.");
  const matches: CodeEvent[] = [];
  const file = path.resolve(root, LEDGER_DIRECTORY, EVENTS_FILE);
  try {
    const lines = readline.createInterface({ input: createReadStream(file, { encoding: "utf8" }), crlfDelay: Infinity });
    for await (const line of lines) {
      if (line.toLowerCase().includes(normalized)) matches.push(JSON.parse(line) as CodeEvent);
    }
    return matches.sort((left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime()).slice(0, limit);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}