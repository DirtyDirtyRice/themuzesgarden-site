import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { TimelineValidationEngine } from "./TimelineValidationEngine";
import type {
  TimelineProjectId,
  TimelineUserId,
  TimelineWorkspace,
} from "./TimelineTypes";

export const TIMELINE_PROJECT_WORKSPACE_SCHEMA_VERSION = 1;

export type TimelineProjectWorkspaceRecord = {
  schemaVersion: typeof TIMELINE_PROJECT_WORKSPACE_SCHEMA_VERSION;
  projectId: TimelineProjectId;
  revision: number;
  workspace: TimelineWorkspace;
  createdAt: string;
  createdBy: TimelineUserId;
  updatedAt: string;
  updatedBy: TimelineUserId;
  previousHash: string | null;
  hash: string;
};

export type TimelineProjectWorkspaceSaveInput = {
  workspace: TimelineWorkspace;
  expectedRevision: number;
  updatedBy: TimelineUserId;
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, stableValue(item)])
    );
  }
  return value;
}

function recordHash(
  value: Omit<TimelineProjectWorkspaceRecord, "hash">
): string {
  return createHash("sha256")
    .update(JSON.stringify(stableValue(value)))
    .digest("hex");
}

function withoutHash(
  value: TimelineProjectWorkspaceRecord
): Omit<TimelineProjectWorkspaceRecord, "hash"> {
  const { hash: _hash, ...record } = value;
  return record;
}

function safeProjectFilename(projectId: TimelineProjectId): string {
  return createHash("sha256").update(projectId).digest("hex");
}

export function createEmptyTimelineWorkspace(
  projectId: TimelineProjectId,
  now = new Date()
): TimelineWorkspace {
  const cleanProjectId = projectId.trim();
  if (!cleanProjectId) throw new Error("Timeline project ID is required.");
  const trackId = `${cleanProjectId}-main-timeline`;
  return {
    projectId: cleanProjectId,
    tracks: [
      {
        id: trackId,
        title: "Main Timeline",
        color: "#38bdf8",
        visible: true,
        locked: false,
        muted: false,
        height: 96,
      },
    ],
    events: [],
    statistics: {
      totalEvents: 0,
      promptEvents: 0,
      lyricEvents: 0,
      markerEvents: 0,
      automationEvents: 0,
      relationshipEvents: 0,
      audioEvents: 0,
      videoEvents: 0,
      imageEvents: 0,
      aiEvents: 0,
    },
    selection: { selectedEventIds: [] },
    clipboard: {
      events: [],
      copiedAt: now.toISOString(),
      sourceTrackId: trackId,
    },
    viewport: {
      zoom: 1,
      scrollPosition: 0,
      visibleStart: 0,
      visibleEnd: 300,
      snapToGrid: true,
      showMilliseconds: false,
      showBars: true,
      showBeats: true,
    },
    history: [],
  };
}

export class TimelineProjectWorkspaceStore {
  private readonly writeChains = new Map<TimelineProjectId, Promise<void>>();
  private readonly validator = new TimelineValidationEngine();

  constructor(
    private readonly directory: string,
    private readonly now: () => Date = () => new Date()
  ) {
    if (!directory.trim()) {
      throw new Error("Timeline project workspace directory is required.");
    }
    this.directory = resolve(directory);
  }

  async load(
    projectId: TimelineProjectId
  ): Promise<TimelineProjectWorkspaceRecord | null> {
    const cleanProjectId = projectId.trim();
    if (!cleanProjectId) throw new Error("Timeline project ID is required.");
    try {
      const text = await readFile(this.pathFor(cleanProjectId), "utf8");
      const record = JSON.parse(text) as TimelineProjectWorkspaceRecord;
      this.assertRecord(record, cleanProjectId);
      return clone(record);
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        return null;
      }
      if (error instanceof SyntaxError) {
        throw new Error("Timeline project workspace contains invalid JSON.");
      }
      throw error;
    }
  }

  async ensure(
    projectId: TimelineProjectId,
    createdBy: TimelineUserId
  ): Promise<TimelineProjectWorkspaceRecord> {
    const existing = await this.load(projectId);
    if (existing) return existing;
    const workspace = createEmptyTimelineWorkspace(projectId, this.now());
    return this.create(workspace, createdBy);
  }

  async save(
    input: TimelineProjectWorkspaceSaveInput
  ): Promise<TimelineProjectWorkspaceRecord> {
    let saved: TimelineProjectWorkspaceRecord | null = null;
    await this.serialize(input.workspace.projectId, async () => {
      const current = await this.load(input.workspace.projectId);
      if (!current) {
        throw new Error("Timeline project workspace does not exist.");
      }
      if (current.revision !== input.expectedRevision) {
        throw new Error(
          `Timeline workspace revision conflict: expected ${input.expectedRevision}, current ${current.revision}.`
        );
      }
      this.assertWorkspace(input.workspace);
      const timestamp = this.now().toISOString();
      const base: Omit<TimelineProjectWorkspaceRecord, "hash"> = {
        schemaVersion: TIMELINE_PROJECT_WORKSPACE_SCHEMA_VERSION,
        projectId: current.projectId,
        revision: current.revision + 1,
        workspace: clone(input.workspace),
        createdAt: current.createdAt,
        createdBy: current.createdBy,
        updatedAt: timestamp,
        updatedBy: input.updatedBy,
        previousHash: current.hash,
      };
      saved = { ...base, hash: recordHash(base) };
      await this.write(saved);
    });
    if (!saved) throw new Error("Timeline project workspace was not saved.");
    return clone(saved);
  }

  private async create(
    workspace: TimelineWorkspace,
    createdBy: TimelineUserId
  ): Promise<TimelineProjectWorkspaceRecord> {
    let created: TimelineProjectWorkspaceRecord | null = null;
    await this.serialize(workspace.projectId, async () => {
      const existing = await this.load(workspace.projectId);
      if (existing) {
        created = existing;
        return;
      }
      this.assertWorkspace(workspace);
      const timestamp = this.now().toISOString();
      const base: Omit<TimelineProjectWorkspaceRecord, "hash"> = {
        schemaVersion: TIMELINE_PROJECT_WORKSPACE_SCHEMA_VERSION,
        projectId: workspace.projectId,
        revision: 1,
        workspace: clone(workspace),
        createdAt: timestamp,
        createdBy,
        updatedAt: timestamp,
        updatedBy: createdBy,
        previousHash: null,
      };
      created = { ...base, hash: recordHash(base) };
      await this.write(created);
    });
    if (!created) throw new Error("Timeline project workspace was not created.");
    return clone(created);
  }

  private assertWorkspace(workspace: TimelineWorkspace): void {
    const report = this.validator.validateWorkspace(workspace);
    if (!report.valid) {
      throw new Error(
        `Timeline workspace validation failed: ${report.detailedIssues
          .filter((issue) => issue.blocking)
          .map((issue) => issue.message)
          .join(" ")}`
      );
    }
  }

  private assertRecord(
    record: TimelineProjectWorkspaceRecord,
    projectId: TimelineProjectId
  ): void {
    if (record.schemaVersion !== TIMELINE_PROJECT_WORKSPACE_SCHEMA_VERSION) {
      throw new Error("Timeline project workspace schema is unsupported.");
    }
    if (record.projectId !== projectId || record.workspace.projectId !== projectId) {
      throw new Error("Timeline project workspace identity does not match its file.");
    }
    if (record.hash !== recordHash(withoutHash(record))) {
      throw new Error("Timeline project workspace integrity check failed.");
    }
    this.assertWorkspace(record.workspace);
  }

  private async write(record: TimelineProjectWorkspaceRecord): Promise<void> {
    await mkdir(this.directory, { recursive: true });
    const path = this.pathFor(record.projectId);
    const temporary = `${path}.${process.pid}.${randomUUID()}.tmp`;
    await writeFile(temporary, `${JSON.stringify(record, null, 2)}\n`, "utf8");
    await rename(temporary, path);
  }

  private pathFor(projectId: TimelineProjectId): string {
    return resolve(this.directory, `${safeProjectFilename(projectId)}.json`);
  }

  private async serialize(
    projectId: TimelineProjectId,
    operation: () => Promise<void>
  ): Promise<void> {
    const previous = this.writeChains.get(projectId) ?? Promise.resolve();
    const next = previous.then(operation, operation);
    this.writeChains.set(projectId, next);
    try {
      await next;
    } finally {
      if (this.writeChains.get(projectId) === next) {
        this.writeChains.delete(projectId);
      }
    }
  }
}

