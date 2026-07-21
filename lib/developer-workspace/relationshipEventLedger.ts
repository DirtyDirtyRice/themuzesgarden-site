import "server-only";

import { randomUUID } from "node:crypto";
import { appendFile, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import type { CodeEvent } from "./codeEventLedger";
import type { CodeRelationship, RelationshipIndex } from "./relationshipIndex";

type RelationshipSnapshot = { version: 1; generatedAt: string; relationships: Record<string, CodeRelationship> };
export type RelationshipLedgerUpdate = { generatedAt: string; events: CodeEvent[]; trackedRelationships: number };
const DIRECTORY = "code-map-reports/event-ledger";
const SNAPSHOT = "relationship-snapshot.json";
const EVENTS = "events.jsonl";

async function previous(file: string): Promise<RelationshipSnapshot> {
  try { return JSON.parse(await readFile(file, "utf8")) as RelationshipSnapshot; }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return { version: 1, generatedAt: new Date(0).toISOString(), relationships: {} }; throw error; }
}

function event(relationship: CodeRelationship, added: boolean, occurredAt: string): CodeEvent {
  const kind = `${relationship.kind}-${added ? "added" : "removed"}` as CodeEvent["kind"];
  return {
    id: randomUUID(), kind, occurredAt, symbolKey: relationship.key, symbolName: relationship.symbolName,
    symbolKind: "relationship", path: relationship.sourcePath, line: relationship.sourceLine,
    previousPath: added ? null : relationship.sourcePath, previousLine: added ? null : relationship.sourceLine,
    details: `${relationship.kind} ${added ? "added" : "removed"}: ${relationship.sourcePath}:${relationship.sourceLine} → ${relationship.targetPath}:${relationship.targetLine}.`,
  };
}

export async function updateRelationshipEventLedger(index: RelationshipIndex, root = process.cwd()): Promise<RelationshipLedgerUpdate> {
  const directory = path.resolve(root, DIRECTORY);
  await mkdir(directory, { recursive: true });
  const snapshotFile = path.join(directory, SNAPSHOT), eventFile = path.join(directory, EVENTS);
  const prior = await previous(snapshotFile), occurredAt = new Date().toISOString();
  const current: Record<string, CodeRelationship> = {}, events: CodeEvent[] = [];
  for (const relationship of index.relationships) { current[relationship.key] = relationship; if (!prior.relationships[relationship.key]) events.push(event(relationship, true, occurredAt)); }
  for (const relationship of Object.values(prior.relationships)) { if (!current[relationship.key]) events.push(event(relationship, false, occurredAt)); }
  if (events.length) await appendFile(eventFile, events.map((item) => JSON.stringify(item)).join("\n") + "\n", "utf8");
  const temporary = `${snapshotFile}.${randomUUID()}.tmp`;
  await writeFile(temporary, JSON.stringify({ version: 1, generatedAt: occurredAt, relationships: current }, null, 2), "utf8");
  await rename(temporary, snapshotFile);
  return { generatedAt: occurredAt, events, trackedRelationships: Object.keys(current).length };
}
