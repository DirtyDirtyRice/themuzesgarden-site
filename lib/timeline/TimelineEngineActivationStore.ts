import "server-only";

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { createHash } from "node:crypto";

import type { TimelineEngineActivationArchive } from "./TimelineEngineActivationGate";

export type TimelineEngineActivationDocument = {
  schemaVersion: 1;
  savedAt: string;
  archive: TimelineEngineActivationArchive;
  integrity?: {
    algorithm: "sha256";
    archiveHash: string;
  };
};

export function hashTimelineEngineActivationArchive(
  archive: TimelineEngineActivationArchive,
): string {
  return createHash("sha256").update(JSON.stringify(archive)).digest("hex");
}

export interface TimelineEngineActivationStore {
  readonly kind: "atomic-file" | "supabase";
  load(): Promise<TimelineEngineActivationDocument | null>;
  save(document: TimelineEngineActivationDocument): Promise<void>;
}

export class TimelineEngineActivationFileStore implements TimelineEngineActivationStore {
  readonly kind = "atomic-file" as const;

  constructor(private readonly filePath: string) {
    if (!filePath.trim()) throw new Error("Engine activation ledger path is required.");
  }

  async load(): Promise<TimelineEngineActivationDocument | null> {
    try {
      return JSON.parse(await readFile(this.filePath, "utf8")) as TimelineEngineActivationDocument;
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "ENOENT"
      ) return null;
      if (error instanceof SyntaxError) {
        throw new Error("Engine activation ledger contains invalid JSON.");
      }
      throw error;
    }
  }

  async save(document: TimelineEngineActivationDocument): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    const temporary = `${this.filePath}.${process.pid}.${Date.now()}.tmp`;
    await writeFile(temporary, `${JSON.stringify(document, null, 2)}\n`, "utf8");
    await rename(temporary, this.filePath);
  }
}
