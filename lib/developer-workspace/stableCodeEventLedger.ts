import "server-only";

import { randomUUID } from "node:crypto";
import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

import type { CodeEvent, CodeEventKind, LedgerUpdate } from "./codeEventLedger";
import { reconcileStableSymbols, type StableSymbolMatch, type StableSymbolRecord } from "./stableSymbolIdentity";
import { readStableSymbolRegistry, writeStableSymbolRegistry } from "./stableSymbolIdentityStore";
import type { SymbolIndex } from "./symbolIndex";

const ledgerDirectory = "code-map-reports/event-ledger";
const eventsFileName = "events.jsonl";

function event(
  kind: CodeEventKind,
  current: StableSymbolRecord,
  previous: StableSymbolRecord | null,
  occurredAt: string,
  details: string
): CodeEvent {
  return {
    id: randomUUID(),
    kind,
    occurredAt,
    symbolKey: current.stableId,
    symbolName: current.name,
    symbolKind: current.kind,
    path: current.path,
    line: current.line,
    previousPath: previous?.path ?? null,
    previousLine: previous?.line ?? null,
    details,
  };
}

function changeEvents(match: StableSymbolMatch, occurredAt: string): CodeEvent[] {
  const { record: current, previous, reason } = match;
  if (!previous) {
    return [
      event(
        "symbol-observed",
        current,
        null,
        occurredAt,
        `Stable symbol first observed; identity ${current.stableId}.`
      ),
    ];
  }

  const events: CodeEvent[] = [];
  if (!previous.present) {
    events.push(
      event(
        "symbol-restored",
        current,
        previous,
        occurredAt,
        `Symbol restored with stable identity ${current.stableId}; matched by ${reason}.`
      )
    );
  }
  if (previous.path !== current.path) {
    events.push(
      event(
        "symbol-moved",
        current,
        previous,
        occurredAt,
        `Symbol moved from ${previous.path}:${previous.line} to ${current.path}:${current.line}; matched by ${reason}.`
      )
    );
  }
  if (previous.name !== current.name) {
    events.push(
      event(
        "symbol-renamed",
        current,
        previous,
        occurredAt,
        `Symbol renamed from ${previous.name} to ${current.name}; stable identity ${current.stableId}.`
      )
    );
  }

  const sourceChanged =
    !previous.declarationHash.startsWith("legacy:") &&
    previous.declarationHash !== current.declarationHash;
  const locationChanged = previous.path === current.path && previous.line !== current.line;
  const metadataChanged =
    previous.exported !== current.exported ||
    previous.containerName !== current.containerName;
  if (sourceChanged || locationChanged || metadataChanged) {
    const reasons = [
      sourceChanged ? "declaration source" : "",
      locationChanged ? `line ${previous.line} → ${current.line}` : "",
      metadataChanged ? "export or container metadata" : "",
    ].filter(Boolean);
    events.push(
      event(
        "symbol-changed",
        current,
        previous,
        occurredAt,
        `Stable symbol changed: ${reasons.join(", ")}; matched by ${reason}.`
      )
    );
  }
  return events;
}

export async function updateStableCodeEventLedger(
  index: SymbolIndex,
  root = process.cwd()
): Promise<LedgerUpdate> {
  const occurredAt = new Date().toISOString();
  const previous = await readStableSymbolRegistry(root);
  const reconciliation = reconcileStableSymbols(previous.records, index.symbols, occurredAt);
  const events = reconciliation.matches.flatMap((match) => changeEvents(match, occurredAt));

  for (const removed of reconciliation.removed) {
    events.push(
      event(
        "symbol-removed",
        removed,
        removed,
        occurredAt,
        `Symbol removed while retaining stable identity ${removed.stableId}.`
      )
    );
  }

  const directory = path.resolve(root, ledgerDirectory);
  await mkdir(directory, { recursive: true });
  if (events.length) {
    await appendFile(
      path.join(directory, eventsFileName),
      `${events.map((item) => JSON.stringify(item)).join("\n")}\n`,
      "utf8"
    );
  }
  await writeStableSymbolRegistry(reconciliation.records, occurredAt, root);

  return {
    generatedAt: occurredAt,
    events,
    observedSymbols: index.symbolCount,
    totalTrackedSymbols: Object.keys(reconciliation.records).length,
  };
}
