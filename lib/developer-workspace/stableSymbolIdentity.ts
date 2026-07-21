import { randomUUID } from "node:crypto";

import type { ProjectSymbol } from "./symbolIndex";

export type StableSymbolMatchReason =
  | "new"
  | "same-locator"
  | "same-declaration"
  | "same-shape"
  | "unique-semantic-name"
  | "same-position";

export type StableSymbolRecord = {
  stableId: string;
  locatorKey: string;
  name: string;
  kind: ProjectSymbol["kind"];
  path: string;
  line: number;
  column: number;
  endLine: number;
  exported: boolean;
  containerName: string | null;
  declarationHash: string;
  shapeHash: string;
  firstObservedAt: string;
  lastObservedAt: string;
  present: boolean;
  removedAt: string | null;
  nameHistory: string[];
  pathHistory: string[];
};

export type StableSymbolMatch = {
  symbol: ProjectSymbol;
  record: StableSymbolRecord;
  previous: StableSymbolRecord | null;
  reason: StableSymbolMatchReason;
};

export type StableSymbolReconciliation = {
  records: Record<string, StableSymbolRecord>;
  matches: StableSymbolMatch[];
  removed: StableSymbolRecord[];
};

type CurrentCandidate = { symbol: ProjectSymbol; locatorKey: string };

function normalized(value: string | null): string {
  return (value ?? "").trim().toLowerCase();
}

function semanticKey(value: Pick<StableSymbolRecord, "kind" | "containerName" | "name">): string {
  return [value.kind, normalized(value.containerName), normalized(value.name)].join(":");
}

function currentCandidates(symbols: ProjectSymbol[]): CurrentCandidate[] {
  const occurrences = new Map<string, number>();
  return symbols.map((symbol) => {
    const base = [symbol.path, symbol.kind, normalized(symbol.containerName), normalized(symbol.name)].join(":");
    const occurrence = occurrences.get(base) ?? 0;
    occurrences.set(base, occurrence + 1);
    return { symbol, locatorKey: `${base}:${occurrence}` };
  });
}

function only<T>(values: T[]): T | null {
  return values.length === 1 ? values[0] : null;
}

function matchPrevious(
  candidate: CurrentCandidate,
  available: StableSymbolRecord[]
): { record: StableSymbolRecord; reason: Exclude<StableSymbolMatchReason, "new"> } | null {
  const { symbol, locatorKey } = candidate;
  const sameLocator = only(available.filter((record) => record.locatorKey === locatorKey));
  if (sameLocator) return { record: sameLocator, reason: "same-locator" };

  const sameDeclaration = only(
    available.filter(
      (record) => record.kind === symbol.kind && record.declarationHash === symbol.declarationHash
    )
  );
  if (sameDeclaration) return { record: sameDeclaration, reason: "same-declaration" };

  const sameShape = only(
    available.filter((record) => record.kind === symbol.kind && record.shapeHash === symbol.shapeHash)
  );
  if (sameShape) return { record: sameShape, reason: "same-shape" };

  const currentSemanticKey = semanticKey(symbol);
  const sameSemanticName = only(
    available.filter((record) => semanticKey(record) === currentSemanticKey)
  );
  if (sameSemanticName) return { record: sameSemanticName, reason: "unique-semantic-name" };

  const positional = available
    .filter(
      (record) =>
        record.path === symbol.path &&
        record.kind === symbol.kind &&
        normalized(record.containerName) === normalized(symbol.containerName)
    )
    .map((record) => ({ record, distance: Math.abs(record.line - symbol.line) }))
    .filter((item) => item.distance <= 4)
    .sort((left, right) => left.distance - right.distance || left.record.stableId.localeCompare(right.record.stableId));
  if (positional.length === 1 || (positional[0] && positional[1] && positional[0].distance + 1 < positional[1].distance)) {
    return { record: positional[0].record, reason: "same-position" };
  }
  return null;
}

function updatedRecord(
  previous: StableSymbolRecord,
  candidate: CurrentCandidate,
  observedAt: string
): StableSymbolRecord {
  const { symbol, locatorKey } = candidate;
  return {
    ...previous,
    locatorKey,
    name: symbol.name,
    kind: symbol.kind,
    path: symbol.path,
    line: symbol.line,
    column: symbol.column,
    endLine: symbol.endLine,
    exported: symbol.exported,
    containerName: symbol.containerName,
    declarationHash: symbol.declarationHash,
    shapeHash: symbol.shapeHash,
    lastObservedAt: observedAt,
    present: true,
    removedAt: null,
    nameHistory: [...new Set([...previous.nameHistory, symbol.name])],
    pathHistory: [...new Set([...previous.pathHistory, symbol.path])],
  };
}

function newRecord(
  candidate: CurrentCandidate,
  observedAt: string,
  createId: () => string
): StableSymbolRecord {
  const { symbol, locatorKey } = candidate;
  return {
    stableId: createId(),
    locatorKey,
    name: symbol.name,
    kind: symbol.kind,
    path: symbol.path,
    line: symbol.line,
    column: symbol.column,
    endLine: symbol.endLine,
    exported: symbol.exported,
    containerName: symbol.containerName,
    declarationHash: symbol.declarationHash,
    shapeHash: symbol.shapeHash,
    firstObservedAt: observedAt,
    lastObservedAt: observedAt,
    present: true,
    removedAt: null,
    nameHistory: [symbol.name],
    pathHistory: [symbol.path],
  };
}

export function reconcileStableSymbols(
  previousRecords: Record<string, StableSymbolRecord>,
  symbols: ProjectSymbol[],
  observedAt: string,
  createId: () => string = randomUUID
): StableSymbolReconciliation {
  const records = { ...previousRecords };
  const available = new Map(Object.values(previousRecords).map((record) => [record.stableId, record]));
  const matches: StableSymbolMatch[] = [];

  for (const candidate of currentCandidates(symbols)) {
    const priorMatch = matchPrevious(candidate, [...available.values()]);
    const previous = priorMatch?.record ?? null;
    const record = previous
      ? updatedRecord(previous, candidate, observedAt)
      : newRecord(candidate, observedAt, createId);
    records[record.stableId] = record;
    available.delete(record.stableId);
    matches.push({
      symbol: candidate.symbol,
      record,
      previous,
      reason: priorMatch?.reason ?? "new",
    });
  }

  const removed: StableSymbolRecord[] = [];
  for (const previous of available.values()) {
    if (!previous.present) continue;
    const record = { ...previous, present: false, removedAt: observedAt };
    records[record.stableId] = record;
    removed.push(record);
  }

  return { records, matches, removed };
}
