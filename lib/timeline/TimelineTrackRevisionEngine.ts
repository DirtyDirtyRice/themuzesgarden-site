import {
  TimelineSongTrackRepositoryEngine,
  type TimelineSongTrackArchive,
} from "./TimelineSongTrackRepositoryEngine";
import type {
  TimelineId,
  TimelineTrackId,
  TimelineUserId,
} from "./TimelineTypes";

export type TimelineTrackRevisionSource =
  | "manual-edit"
  | "ai-generation"
  | "recording"
  | "processing"
  | "import"
  | "restoration";

export type TimelineTrackRevisionState =
  "draft" | "validated" | "active" | "superseded" | "trash";

export type TimelineTrackOperationKind =
  | "trim"
  | "gain"
  | "fade"
  | "pan"
  | "equalizer"
  | "compressor"
  | "effect"
  | "splice"
  | "prompt"
  | "annotation";

export type TimelineTrackOperationValue =
  | string
  | number
  | boolean
  | null
  | TimelineTrackOperationValue[]
  | { [key: string]: TimelineTrackOperationValue };

export type TimelineTrackOperation = {
  id: TimelineId;
  kind: TimelineTrackOperationKind;
  description: string;
  enabled: boolean;
  parameters: Record<string, TimelineTrackOperationValue>;
  createdAt: string;
  createdBy: TimelineUserId;
};

export type TimelineTrackAIPromptProvenance = {
  prompt: string;
  provider: string;
  model: string;
  requestId: string;
  seed?: string;
  generatedAt: string;
};

export type TimelineTrackRevision = {
  id: TimelineId;
  trackId: TimelineTrackId;
  parentRevisionId: TimelineId | null;
  branchName: string;
  revisionNumber: number;
  label: string;
  description: string;
  source: TimelineTrackRevisionSource;
  state: TimelineTrackRevisionState;
  inputArtifactUri?: string;
  inputFingerprint?: string;
  outputArtifactUri?: string;
  outputFingerprint?: string;
  aiPrompt?: TimelineTrackAIPromptProvenance;
  operations: TimelineTrackOperation[];
  checksum?: string;
  createdAt: string;
  createdBy: TimelineUserId;
  updatedAt: string;
  updatedBy: TimelineUserId;
  validatedAt?: string;
  validatedBy?: TimelineUserId;
  activatedAt?: string;
  activatedBy?: TimelineUserId;
  deletedAt?: string;
  deletedBy?: TimelineUserId;
};

export type TimelineTrackRevisionIssue = {
  code:
    | "track-not-found"
    | "track-in-trash"
    | "revision-not-found"
    | "parent-track-mismatch"
    | "revision-immutable"
    | "label-required"
    | "output-artifact-required"
    | "output-fingerprint-required"
    | "operation-required"
    | "ai-prompt-required"
    | "ai-provider-required"
    | "ai-model-required"
    | "ai-request-required"
    | "revision-not-validated"
    | "active-revision-trash"
    | "checksum-mismatch";
  message: string;
  revisionId?: TimelineId;
  trackId?: TimelineTrackId;
};

export type TimelineTrackRevisionResult = {
  accepted: boolean;
  revision: TimelineTrackRevision | null;
  issues: TimelineTrackRevisionIssue[];
};

export type TimelineTrackRevisionChange = {
  field: string;
  before: unknown;
  after: unknown;
};

export type TimelineTrackRevisionComparison = {
  fromRevisionId: TimelineId;
  toRevisionId: TimelineId;
  changes: TimelineTrackRevisionChange[];
  operationsAdded: TimelineTrackOperation[];
  operationsRemoved: TimelineTrackOperation[];
  operationsChanged: Array<{
    operationId: TimelineId;
    before: TimelineTrackOperation;
    after: TimelineTrackOperation;
  }>;
  operationsUnchanged: number;
};

export type TimelineTrackRevisionArchive = {
  tracks: TimelineSongTrackArchive;
  revisions: TimelineTrackRevision[];
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

function stable(value: unknown): string {
  if (value === undefined) return "undefined";
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([key, entry]) => `${JSON.stringify(key)}:${stable(entry)}`)
    .join(",")}}`;
}

function checksum(value: unknown): string {
  const text = stable(value);
  let result = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    result ^= text.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return (result >>> 0).toString(16).padStart(8, "0");
}

function contentPayload(revision: TimelineTrackRevision): unknown {
  return {
    trackId: revision.trackId,
    parentRevisionId: revision.parentRevisionId,
    branchName: revision.branchName,
    revisionNumber: revision.revisionNumber,
    label: revision.label,
    description: revision.description,
    source: revision.source,
    inputArtifactUri: revision.inputArtifactUri,
    inputFingerprint: revision.inputFingerprint,
    outputArtifactUri: revision.outputArtifactUri,
    outputFingerprint: revision.outputFingerprint,
    aiPrompt: revision.aiPrompt,
    operations: revision.operations,
  };
}

export class TimelineTrackRevisionEngine {
  private readonly revisions = new Map<TimelineId, TimelineTrackRevision>();
  private readonly trackRevisionIds = new Map<TimelineTrackId, TimelineId[]>();
  private readonly activeRevisionIds = new Map<TimelineTrackId, TimelineId>();
  private revisionSequence = 0;
  private operationSequence = 0;

  constructor(
    readonly tracks = new TimelineSongTrackRepositoryEngine(),
    private readonly now: () => Date = () => new Date(),
  ) {}

  createDraft(input: {
    trackId: TimelineTrackId;
    parentRevisionId?: TimelineId;
    branchName?: string;
    label: string;
    description?: string;
    source: TimelineTrackRevisionSource;
    inputArtifactUri?: string;
    inputFingerprint?: string;
    outputArtifactUri?: string;
    outputFingerprint?: string;
    aiPrompt?: TimelineTrackAIPromptProvenance;
    createdBy: TimelineUserId;
  }): TimelineTrackRevisionResult {
    const track = this.tracks.getTrack(input.trackId);
    if (!track)
      return this.issue("track-not-found", "Track was not found.", input);
    if (track.state === "trash") {
      return this.issue(
        "track-in-trash",
        "Revisions cannot be added while the track is in trash.",
        input,
      );
    }
    const parentId =
      input.parentRevisionId ??
      this.activeRevisionIds.get(input.trackId) ??
      null;
    const parent = parentId ? this.revisions.get(parentId) : null;
    if (parentId && !parent) {
      return this.issue(
        "revision-not-found",
        `Parent revision ${parentId} was not found.`,
        input,
      );
    }
    if (parent && parent.trackId !== input.trackId) {
      return this.issue(
        "parent-track-mismatch",
        "Parent and child revisions must belong to the same track.",
        input,
      );
    }
    const history = this.trackRevisionIds.get(input.trackId) ?? [];
    const now = this.now().toISOString();
    const revision: TimelineTrackRevision = {
      id: `timeline-track-revision-${++this.revisionSequence}`,
      trackId: input.trackId,
      parentRevisionId: parentId,
      branchName: input.branchName?.trim() || parent?.branchName || "main",
      revisionNumber: history.length + 1,
      label: input.label.trim(),
      description: input.description?.trim() ?? "",
      source: input.source,
      state: "draft",
      inputArtifactUri: input.inputArtifactUri?.trim(),
      inputFingerprint: input.inputFingerprint?.trim(),
      outputArtifactUri: input.outputArtifactUri?.trim(),
      outputFingerprint: input.outputFingerprint?.trim(),
      aiPrompt: input.aiPrompt ? clone(input.aiPrompt) : undefined,
      operations: parent ? clone(parent.operations) : [],
      createdAt: now,
      createdBy: input.createdBy,
      updatedAt: now,
      updatedBy: input.createdBy,
    };
    this.revisions.set(revision.id, clone(revision));
    this.trackRevisionIds.set(input.trackId, [...history, revision.id]);
    return { accepted: true, revision: clone(revision), issues: [] };
  }

  addOperation(input: {
    revisionId: TimelineId;
    kind: TimelineTrackOperationKind;
    description: string;
    parameters?: Record<string, TimelineTrackOperationValue>;
    enabled?: boolean;
    createdBy: TimelineUserId;
  }): TimelineTrackRevisionResult {
    const revision = this.revisions.get(input.revisionId);
    if (!revision) return this.revisionNotFound(input.revisionId);
    if (revision.state !== "draft") return this.immutable(revision);
    const now = this.now().toISOString();
    const operation: TimelineTrackOperation = {
      id: `timeline-track-operation-${++this.operationSequence}`,
      kind: input.kind,
      description: input.description.trim(),
      enabled: input.enabled ?? true,
      parameters: clone(input.parameters ?? {}),
      createdAt: now,
      createdBy: input.createdBy,
    };
    const next: TimelineTrackRevision = {
      ...clone(revision),
      operations: [...revision.operations, operation],
      updatedAt: now,
      updatedBy: input.createdBy,
    };
    this.revisions.set(next.id, clone(next));
    return { accepted: true, revision: clone(next), issues: [] };
  }

  updateDraft(input: {
    revisionId: TimelineId;
    patch: Partial<
      Pick<
        TimelineTrackRevision,
        | "label"
        | "description"
        | "inputArtifactUri"
        | "inputFingerprint"
        | "outputArtifactUri"
        | "outputFingerprint"
        | "aiPrompt"
      >
    >;
    updatedBy: TimelineUserId;
  }): TimelineTrackRevisionResult {
    const revision = this.revisions.get(input.revisionId);
    if (!revision) return this.revisionNotFound(input.revisionId);
    if (revision.state !== "draft") return this.immutable(revision);
    const next: TimelineTrackRevision = {
      ...clone(revision),
      ...clone(input.patch),
      label:
        input.patch.label === undefined
          ? revision.label
          : input.patch.label.trim(),
      description:
        input.patch.description === undefined
          ? revision.description
          : input.patch.description.trim(),
      updatedAt: this.now().toISOString(),
      updatedBy: input.updatedBy,
    };
    this.revisions.set(next.id, clone(next));
    return { accepted: true, revision: clone(next), issues: [] };
  }

  validate(input: {
    revisionId: TimelineId;
    validatedBy: TimelineUserId;
  }): TimelineTrackRevisionResult {
    const revision = this.revisions.get(input.revisionId);
    if (!revision) return this.revisionNotFound(input.revisionId);
    if (revision.state !== "draft") return this.immutable(revision);
    const issues = this.inspect(revision);
    if (issues.length) {
      return { accepted: false, revision: clone(revision), issues };
    }
    const now = this.now().toISOString();
    const next: TimelineTrackRevision = {
      ...clone(revision),
      state: "validated",
      checksum: checksum(contentPayload(revision)),
      updatedAt: now,
      updatedBy: input.validatedBy,
      validatedAt: now,
      validatedBy: input.validatedBy,
    };
    this.revisions.set(next.id, clone(next));
    return { accepted: true, revision: clone(next), issues: [] };
  }

  activate(input: {
    revisionId: TimelineId;
    activatedBy: TimelineUserId;
  }): TimelineTrackRevisionResult {
    const revision = this.revisions.get(input.revisionId);
    if (!revision) return this.revisionNotFound(input.revisionId);
    if (
      revision.state !== "validated" ||
      !revision.checksum ||
      checksum(contentPayload(revision)) !== revision.checksum
    ) {
      return {
        accepted: false,
        revision: clone(revision),
        issues: [
          {
            code:
              revision.checksum &&
              checksum(contentPayload(revision)) !== revision.checksum
                ? "checksum-mismatch"
                : "revision-not-validated",
            revisionId: revision.id,
            trackId: revision.trackId,
            message: "Only an unchanged, validated revision can become active.",
          },
        ],
      };
    }
    const now = this.now().toISOString();
    const previousId = this.activeRevisionIds.get(revision.trackId);
    if (previousId && previousId !== revision.id) {
      const previous = this.revisions.get(previousId);
      if (previous) {
        this.revisions.set(previous.id, {
          ...clone(previous),
          state: "superseded",
          updatedAt: now,
          updatedBy: input.activatedBy,
        });
      }
    }
    const next: TimelineTrackRevision = {
      ...clone(revision),
      state: "active",
      updatedAt: now,
      updatedBy: input.activatedBy,
      activatedAt: now,
      activatedBy: input.activatedBy,
    };
    this.revisions.set(next.id, clone(next));
    this.activeRevisionIds.set(next.trackId, next.id);
    return { accepted: true, revision: clone(next), issues: [] };
  }

  moveToTrash(input: {
    revisionId: TimelineId;
    deletedBy: TimelineUserId;
  }): TimelineTrackRevisionResult {
    const revision = this.revisions.get(input.revisionId);
    if (!revision) return this.revisionNotFound(input.revisionId);
    if (revision.state === "active") {
      return {
        accepted: false,
        revision: clone(revision),
        issues: [
          {
            code: "active-revision-trash",
            revisionId: revision.id,
            trackId: revision.trackId,
            message:
              "Activate a replacement revision before moving the active revision to trash.",
          },
        ],
      };
    }
    const now = this.now().toISOString();
    const next: TimelineTrackRevision = {
      ...clone(revision),
      state: "trash",
      updatedAt: now,
      updatedBy: input.deletedBy,
      deletedAt: now,
      deletedBy: input.deletedBy,
    };
    this.revisions.set(next.id, clone(next));
    return { accepted: true, revision: clone(next), issues: [] };
  }

  restoreFromTrash(input: {
    revisionId: TimelineId;
    restoredBy: TimelineUserId;
  }): TimelineTrackRevisionResult {
    const revision = this.revisions.get(input.revisionId);
    if (!revision) return this.revisionNotFound(input.revisionId);
    if (revision.state !== "trash") return this.immutable(revision);
    const next: TimelineTrackRevision = {
      ...clone(revision),
      state: "draft",
      checksum: undefined,
      validatedAt: undefined,
      validatedBy: undefined,
      activatedAt: undefined,
      activatedBy: undefined,
      deletedAt: undefined,
      deletedBy: undefined,
      updatedAt: this.now().toISOString(),
      updatedBy: input.restoredBy,
      source: "restoration",
    };
    this.revisions.set(next.id, clone(next));
    return { accepted: true, revision: clone(next), issues: [] };
  }

  inspect(revision: TimelineTrackRevision): TimelineTrackRevisionIssue[] {
    const issues: TimelineTrackRevisionIssue[] = [];
    const issue = (code: TimelineTrackRevisionIssue["code"], message: string) =>
      issues.push({
        code,
        message,
        revisionId: revision.id,
        trackId: revision.trackId,
      });
    if (!revision.label.trim())
      issue("label-required", "Revision label is required.");
    if (!revision.outputArtifactUri?.trim()) {
      issue(
        "output-artifact-required",
        "Rendered output artifact is required.",
      );
    }
    if (!revision.outputFingerprint?.trim()) {
      issue(
        "output-fingerprint-required",
        "Rendered output fingerprint is required.",
      );
    }
    if (
      revision.operations.length === 0 &&
      !["recording", "import"].includes(revision.source)
    ) {
      issue(
        "operation-required",
        "At least one edit or processing operation is required.",
      );
    }
    if (revision.source === "ai-generation") {
      if (!revision.aiPrompt?.prompt.trim()) {
        issue("ai-prompt-required", "AI revision requires its exact prompt.");
      }
      if (!revision.aiPrompt?.provider.trim()) {
        issue("ai-provider-required", "AI revision requires its provider.");
      }
      if (!revision.aiPrompt?.model.trim()) {
        issue("ai-model-required", "AI revision requires its model.");
      }
      if (!revision.aiPrompt?.requestId.trim()) {
        issue("ai-request-required", "AI revision requires its request ID.");
      }
    }
    return issues;
  }

  compare(
    fromRevisionId: TimelineId,
    toRevisionId: TimelineId,
  ): TimelineTrackRevisionComparison {
    const from = this.requireRevision(fromRevisionId);
    const to = this.requireRevision(toRevisionId);
    const fields = [
      "label",
      "description",
      "source",
      "inputArtifactUri",
      "inputFingerprint",
      "outputArtifactUri",
      "outputFingerprint",
      "aiPrompt",
      "branchName",
    ] as const;
    const changes = fields
      .filter((field) => stable(from[field]) !== stable(to[field]))
      .map((field) => ({
        field,
        before: clone(from[field]),
        after: clone(to[field]),
      }));
    const first = new Map(
      from.operations.map((operation) => [operation.id, operation]),
    );
    const second = new Map(
      to.operations.map((operation) => [operation.id, operation]),
    );
    const operationIds = new Set([...first.keys(), ...second.keys()]);
    const operationsAdded: TimelineTrackOperation[] = [];
    const operationsRemoved: TimelineTrackOperation[] = [];
    const operationsChanged: TimelineTrackRevisionComparison["operationsChanged"] =
      [];
    let operationsUnchanged = 0;
    operationIds.forEach((operationId) => {
      const before = first.get(operationId);
      const after = second.get(operationId);
      if (!before && after) operationsAdded.push(clone(after));
      else if (before && !after) operationsRemoved.push(clone(before));
      else if (before && after && stable(before) !== stable(after)) {
        operationsChanged.push({
          operationId,
          before: clone(before),
          after: clone(after),
        });
      } else if (before && after) operationsUnchanged += 1;
    });
    return {
      fromRevisionId,
      toRevisionId,
      changes,
      operationsAdded,
      operationsRemoved,
      operationsChanged,
      operationsUnchanged,
    };
  }

  getRevision(revisionId: TimelineId): TimelineTrackRevision | null {
    const revision = this.revisions.get(revisionId);
    return revision ? clone(revision) : null;
  }

  getActiveRevision(trackId: TimelineTrackId): TimelineTrackRevision | null {
    const id = this.activeRevisionIds.get(trackId);
    return id ? this.getRevision(id) : null;
  }

  listRevisions(
    trackId: TimelineTrackId,
    includeTrash = false,
  ): TimelineTrackRevision[] {
    return (this.trackRevisionIds.get(trackId) ?? [])
      .map((id) => this.revisions.get(id))
      .filter(
        (revision): revision is TimelineTrackRevision =>
          Boolean(revision) && (includeTrash || revision?.state !== "trash"),
      )
      .map(clone);
  }

  exportArchive(): TimelineTrackRevisionArchive {
    return {
      tracks: this.tracks.exportArchive(),
      revisions: Array.from(this.revisions.values()).map(clone),
    };
  }

  restoreArchive(archive: TimelineTrackRevisionArchive): void {
    this.tracks.restoreArchive(archive.tracks);
    this.revisions.clear();
    this.trackRevisionIds.clear();
    this.activeRevisionIds.clear();
    this.revisionSequence = 0;
    this.operationSequence = 0;
    archive.revisions.forEach((revision) => {
      if (!this.tracks.getTrack(revision.trackId)) {
        throw new Error(`Revision ${revision.id} references a missing track.`);
      }
      if (
        revision.checksum &&
        checksum(contentPayload(revision)) !== revision.checksum
      ) {
        throw new Error(
          `Revision ${revision.id} failed checksum verification.`,
        );
      }
      this.revisions.set(revision.id, clone(revision));
      const history = this.trackRevisionIds.get(revision.trackId) ?? [];
      this.trackRevisionIds.set(revision.trackId, [...history, revision.id]);
      if (revision.state === "active") {
        if (this.activeRevisionIds.has(revision.trackId)) {
          throw new Error(
            `Track ${revision.trackId} has multiple active revisions.`,
          );
        }
        this.activeRevisionIds.set(revision.trackId, revision.id);
      }
      this.revisionSequence = Math.max(
        this.revisionSequence,
        this.idSequence(revision.id),
      );
      revision.operations.forEach((operation) => {
        this.operationSequence = Math.max(
          this.operationSequence,
          this.idSequence(operation.id),
        );
      });
    });
  }

  private requireRevision(revisionId: TimelineId): TimelineTrackRevision {
    const revision = this.revisions.get(revisionId);
    if (!revision) throw new Error(`Revision ${revisionId} was not found.`);
    return revision;
  }

  private revisionNotFound(
    revisionId: TimelineId,
  ): TimelineTrackRevisionResult {
    return {
      accepted: false,
      revision: null,
      issues: [
        {
          code: "revision-not-found",
          revisionId,
          message: `Revision ${revisionId} was not found.`,
        },
      ],
    };
  }

  private immutable(
    revision: TimelineTrackRevision,
  ): TimelineTrackRevisionResult {
    return {
      accepted: false,
      revision: clone(revision),
      issues: [
        {
          code: "revision-immutable",
          revisionId: revision.id,
          trackId: revision.trackId,
          message:
            "Validated revision content is immutable; create a child revision instead.",
        },
      ],
    };
  }

  private issue(
    code: TimelineTrackRevisionIssue["code"],
    message: string,
    input: { trackId: TimelineTrackId },
  ): TimelineTrackRevisionResult {
    return {
      accepted: false,
      revision: null,
      issues: [{ code, message, trackId: input.trackId }],
    };
  }

  private idSequence(id: TimelineId): number {
    return Number(id.match(/(\d+)$/)?.[1] ?? 0);
  }
}

export const timelineTrackRevisionEngine = new TimelineTrackRevisionEngine();
