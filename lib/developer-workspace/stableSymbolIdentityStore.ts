import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import type { StableSymbolRecord } from "./stableSymbolIdentity";

export type StableSymbolRegistry = {
  version: 1;
  generatedAt: string;
  records: Record<string, StableSymbolRecord>;
};

type LegacySymbolSnapshot = {
  key: string;
  fingerprint: string;
  name: string;
  kind: StableSymbolRecord["kind"];
  path: string;
  line: number;
  column: number;
  exported: boolean;
  containerName: string | null;
  lastObservedAt: string;
};

type LegacyLedgerSnapshot = {
  version: 1;
  generatedAt: string;
  symbols: Record<string, LegacySymbolSnapshot>;
};

const directoryName = "code-map-reports/event-ledger";
const registryFileName = "stable-symbol-registry.json";
const legacySnapshotFileName = "symbol-snapshot.json";

function stableLegacyId(key: string): string {
  return `symbol-${createHash("sha256").update(`legacy:${key}`).digest("hex").slice(0, 32)}`;
}

function migrateLegacy(snapshot: LegacyLedgerSnapshot): StableSymbolRegistry {
  const records: Record<string, StableSymbolRecord> = {};
  for (const legacy of Object.values(snapshot.symbols)) {
    const stableId = stableLegacyId(legacy.key);
    records[stableId] = {
      stableId,
      locatorKey: legacy.key,
      name: legacy.name,
      kind: legacy.kind,
      path: legacy.path,
      line: legacy.line,
      column: legacy.column,
      endLine: legacy.line,
      exported: legacy.exported,
      containerName: legacy.containerName,
      declarationHash: `legacy:${legacy.fingerprint}`,
      shapeHash: `legacy:${legacy.fingerprint}`,
      firstObservedAt: legacy.lastObservedAt,
      lastObservedAt: legacy.lastObservedAt,
      present: true,
      removedAt: null,
      nameHistory: [legacy.name],
      pathHistory: [legacy.path],
    };
  }
  return { version: 1, generatedAt: snapshot.generatedAt, records };
}

export async function readStableSymbolRegistry(root = process.cwd()): Promise<StableSymbolRegistry> {
  const directory = path.resolve(root, directoryName);
  try {
    return JSON.parse(await readFile(path.join(directory, registryFileName), "utf8")) as StableSymbolRegistry;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  try {
    const legacy = JSON.parse(
      await readFile(path.join(directory, legacySnapshotFileName), "utf8")
    ) as LegacyLedgerSnapshot;
    return migrateLegacy(legacy);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    return { version: 1, generatedAt: new Date(0).toISOString(), records: {} };
  }
}

export async function writeStableSymbolRegistry(
  records: Record<string, StableSymbolRecord>,
  generatedAt: string,
  root = process.cwd()
): Promise<void> {
  const directory = path.resolve(root, directoryName);
  await mkdir(directory, { recursive: true });
  const target = path.join(directory, registryFileName);
  const temporary = `${target}.${randomUUID()}.tmp`;
  const registry: StableSymbolRegistry = { version: 1, generatedAt, records };
  await writeFile(temporary, JSON.stringify(registry, null, 2), "utf8");
  await rename(temporary, target);
}
