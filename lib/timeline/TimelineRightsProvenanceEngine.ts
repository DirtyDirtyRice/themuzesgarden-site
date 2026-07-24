import type {
  TimelineSoundIngredient,
  TimelineSoundIngredientKind,
  TimelineSoundRecipe,
  TimelineSoundRightsStatus,
} from "./TimelineSoundRecipeEngine";
import type {
  TimelineId,
  TimelineProjectId,
  TimelineUserId,
} from "./TimelineTypes";

export type TimelineRightsEvidenceKind =
  | "ownership"
  | "license"
  | "consent"
  | "clearance"
  | "model-terms"
  | "source-recording"
  | "fingerprint-verification";

export type TimelineRightsEvidence = {
  id: TimelineId;
  recordId: TimelineId;
  kind: TimelineRightsEvidenceKind;
  reference: string;
  issuer: string;
  description: string;
  effectiveAt: string;
  expiresAt?: string;
  documentUri?: string;
  fingerprint?: string;
  addedAt: string;
  addedBy: TimelineUserId;
};

export type TimelineRightsRestriction = {
  id: TimelineId;
  territory?: string;
  usage: string;
  description: string;
  prohibitsActivation: boolean;
  addedAt: string;
  addedBy: TimelineUserId;
};

export type TimelineRightsRecordState =
  "held" | "cleared" | "expired" | "restricted" | "revoked";

export type TimelineRightsIssueCode =
  | "record-not-found"
  | "owner-required"
  | "source-required"
  | "fingerprint-required"
  | "fingerprint-mismatch"
  | "rights-not-clearable"
  | "evidence-required"
  | "evidence-expired"
  | "named-artist-reference"
  | "activation-restricted"
  | "record-revoked";

export type TimelineRightsIssue = {
  code: TimelineRightsIssueCode;
  message: string;
  recordId?: TimelineId;
  ingredientId?: TimelineId;
  evidenceId?: TimelineId;
  restrictionId?: TimelineId;
};

export type TimelineRightsReview = {
  id: TimelineId;
  recordId: TimelineId;
  accepted: boolean;
  state: TimelineRightsRecordState;
  issues: TimelineRightsIssue[];
  reviewedAt: string;
  reviewedBy: TimelineUserId;
  note: string;
};

export type TimelineRightsRecord = {
  id: TimelineId;
  projectId: TimelineProjectId;
  ingredientId: TimelineId;
  ingredientName: string;
  ingredientKind: TimelineSoundIngredientKind;
  sourceDescription: string;
  owner: string;
  rightsStatus: TimelineSoundRightsStatus;
  contentFingerprint: string;
  namedArtistReference?: string;
  state: TimelineRightsRecordState;
  evidence: TimelineRightsEvidence[];
  restrictions: TimelineRightsRestriction[];
  reviews: TimelineRightsReview[];
  createdAt: string;
  createdBy: TimelineUserId;
  updatedAt: string;
  updatedBy: TimelineUserId;
};

export type TimelineRightsResult = {
  accepted: boolean;
  record: TimelineRightsRecord | null;
  issues: TimelineRightsIssue[];
};

export type TimelineRecipeRightsIngredientReport = {
  ingredientId: TimelineId;
  recordId: TimelineId | null;
  accepted: boolean;
  issues: TimelineRightsIssue[];
};

export type TimelineRecipeRightsReport = {
  recipeId: TimelineId;
  accepted: boolean;
  checkedAt: string;
  ingredients: TimelineRecipeRightsIngredientReport[];
  issues: TimelineRightsIssue[];
};

export type TimelineRightsArchive = {
  records: TimelineRightsRecord[];
};

const CLEARABLE_RIGHTS = new Set<TimelineSoundRightsStatus>([
  "owned",
  "licensed",
  "cleared",
]);

function clone<T>(value: T): T {
  return structuredClone(value);
}

function requiredEvidenceKinds(
  record: TimelineRightsRecord,
): TimelineRightsEvidenceKind[] {
  const kinds: TimelineRightsEvidenceKind[] = ["fingerprint-verification"];
  if (record.rightsStatus === "owned") kinds.push("ownership");
  if (record.rightsStatus === "licensed") kinds.push("license");
  if (record.rightsStatus === "cleared") kinds.push("clearance");
  if (
    record.ingredientKind === "user-recording" ||
    record.ingredientKind === "room-capture"
  ) {
    kinds.push("source-recording");
  }
  if (record.ingredientKind === "ai-generated") kinds.push("model-terms");
  return kinds;
}

export class TimelineRightsProvenanceEngine {
  private readonly records = new Map<TimelineId, TimelineRightsRecord>();
  private readonly ingredientRecords = new Map<TimelineId, TimelineId>();
  private recordSequence = 0;
  private evidenceSequence = 0;
  private restrictionSequence = 0;
  private reviewSequence = 0;

  constructor(private readonly now: () => Date = () => new Date()) {}

  registerIngredient(input: {
    projectId: TimelineProjectId;
    ingredient: TimelineSoundIngredient;
    registeredBy: TimelineUserId;
  }): TimelineRightsRecord {
    const existingId = this.ingredientRecords.get(input.ingredient.id);
    if (existingId) {
      const existing = this.records.get(existingId);
      if (existing) return clone(existing);
    }
    const now = this.now().toISOString();
    const record: TimelineRightsRecord = {
      id: `timeline-rights-record-${++this.recordSequence}`,
      projectId: input.projectId,
      ingredientId: input.ingredient.id,
      ingredientName: input.ingredient.name.trim(),
      ingredientKind: input.ingredient.kind,
      sourceDescription: input.ingredient.sourceDescription.trim(),
      owner: input.ingredient.owner.trim(),
      rightsStatus: input.ingredient.rightsStatus,
      contentFingerprint: input.ingredient.contentFingerprint?.trim() ?? "",
      namedArtistReference: input.ingredient.namedArtistReference?.trim(),
      state: "held",
      evidence: [],
      restrictions: [],
      reviews: [],
      createdAt: now,
      createdBy: input.registeredBy,
      updatedAt: now,
      updatedBy: input.registeredBy,
    };
    this.records.set(record.id, clone(record));
    this.ingredientRecords.set(record.ingredientId, record.id);
    return clone(record);
  }

  synchronizeIngredient(input: {
    recordId: TimelineId;
    ingredient: TimelineSoundIngredient;
    updatedBy: TimelineUserId;
  }): TimelineRightsResult {
    const record = this.records.get(input.recordId);
    if (!record) return this.notFound(input.recordId);
    if (record.ingredientId !== input.ingredient.id) {
      return {
        accepted: false,
        record: clone(record),
        issues: [
          {
            code: "fingerprint-mismatch",
            recordId: record.id,
            ingredientId: input.ingredient.id,
            message: "The evidence record belongs to a different ingredient.",
          },
        ],
      };
    }
    const next: TimelineRightsRecord = {
      ...clone(record),
      ingredientName: input.ingredient.name.trim(),
      ingredientKind: input.ingredient.kind,
      sourceDescription: input.ingredient.sourceDescription.trim(),
      owner: input.ingredient.owner.trim(),
      rightsStatus: input.ingredient.rightsStatus,
      contentFingerprint: input.ingredient.contentFingerprint?.trim() ?? "",
      namedArtistReference: input.ingredient.namedArtistReference?.trim(),
      state: "held",
      updatedAt: this.now().toISOString(),
      updatedBy: input.updatedBy,
    };
    this.records.set(next.id, clone(next));
    return { accepted: true, record: clone(next), issues: [] };
  }

  addEvidence(input: {
    recordId: TimelineId;
    kind: TimelineRightsEvidenceKind;
    reference: string;
    issuer: string;
    description?: string;
    effectiveAt?: string;
    expiresAt?: string;
    documentUri?: string;
    fingerprint?: string;
    addedBy: TimelineUserId;
  }): TimelineRightsResult {
    const record = this.records.get(input.recordId);
    if (!record) return this.notFound(input.recordId);
    const now = this.now().toISOString();
    const evidence: TimelineRightsEvidence = {
      id: `timeline-rights-evidence-${++this.evidenceSequence}`,
      recordId: record.id,
      kind: input.kind,
      reference: input.reference.trim(),
      issuer: input.issuer.trim(),
      description: input.description?.trim() ?? "",
      effectiveAt: input.effectiveAt ?? now,
      expiresAt: input.expiresAt,
      documentUri: input.documentUri?.trim(),
      fingerprint: input.fingerprint?.trim(),
      addedAt: now,
      addedBy: input.addedBy,
    };
    const next = this.invalidate(record, input.addedBy);
    next.evidence.push(evidence);
    this.records.set(next.id, clone(next));
    return { accepted: true, record: clone(next), issues: [] };
  }

  addRestriction(input: {
    recordId: TimelineId;
    territory?: string;
    usage: string;
    description: string;
    prohibitsActivation: boolean;
    addedBy: TimelineUserId;
  }): TimelineRightsResult {
    const record = this.records.get(input.recordId);
    if (!record) return this.notFound(input.recordId);
    const now = this.now().toISOString();
    const restriction: TimelineRightsRestriction = {
      id: `timeline-rights-restriction-${++this.restrictionSequence}`,
      territory: input.territory?.trim(),
      usage: input.usage.trim(),
      description: input.description.trim(),
      prohibitsActivation: input.prohibitsActivation,
      addedAt: now,
      addedBy: input.addedBy,
    };
    const next = this.invalidate(record, input.addedBy);
    next.restrictions.push(restriction);
    this.records.set(next.id, clone(next));
    return { accepted: true, record: clone(next), issues: [] };
  }

  review(input: {
    recordId: TimelineId;
    reviewedBy: TimelineUserId;
    note?: string;
  }): TimelineRightsResult {
    const record = this.records.get(input.recordId);
    if (!record) return this.notFound(input.recordId);
    const issues = this.inspect(record);
    const accepted = issues.length === 0;
    const state = this.deriveState(record, issues);
    const now = this.now().toISOString();
    const review: TimelineRightsReview = {
      id: `timeline-rights-review-${++this.reviewSequence}`,
      recordId: record.id,
      accepted,
      state,
      issues: clone(issues),
      reviewedAt: now,
      reviewedBy: input.reviewedBy,
      note: input.note?.trim() ?? "",
    };
    const next: TimelineRightsRecord = {
      ...clone(record),
      state,
      reviews: [...record.reviews, review],
      updatedAt: now,
      updatedBy: input.reviewedBy,
    };
    this.records.set(next.id, clone(next));
    return { accepted, record: clone(next), issues };
  }

  revoke(input: {
    recordId: TimelineId;
    revokedBy: TimelineUserId;
    reason: string;
  }): TimelineRightsResult {
    const record = this.records.get(input.recordId);
    if (!record) return this.notFound(input.recordId);
    const now = this.now().toISOString();
    const issue: TimelineRightsIssue = {
      code: "record-revoked",
      recordId: record.id,
      ingredientId: record.ingredientId,
      message: input.reason.trim() || "Rights clearance was revoked.",
    };
    const review: TimelineRightsReview = {
      id: `timeline-rights-review-${++this.reviewSequence}`,
      recordId: record.id,
      accepted: false,
      state: "revoked",
      issues: [issue],
      reviewedAt: now,
      reviewedBy: input.revokedBy,
      note: issue.message,
    };
    const next: TimelineRightsRecord = {
      ...clone(record),
      state: "revoked",
      reviews: [...record.reviews, review],
      updatedAt: now,
      updatedBy: input.revokedBy,
    };
    this.records.set(next.id, clone(next));
    return { accepted: true, record: clone(next), issues: [] };
  }

  inspect(record: TimelineRightsRecord): TimelineRightsIssue[] {
    const issues: TimelineRightsIssue[] = [];
    const issue = (
      code: TimelineRightsIssueCode,
      message: string,
      detail: Partial<TimelineRightsIssue> = {},
    ) =>
      issues.push({
        code,
        message,
        recordId: record.id,
        ingredientId: record.ingredientId,
        ...detail,
      });
    if (record.state === "revoked") {
      issue("record-revoked", "Rights clearance has been revoked.");
      return issues;
    }
    if (!record.owner.trim()) {
      issue("owner-required", "A verified source owner is required.");
    }
    if (!record.sourceDescription.trim()) {
      issue(
        "source-required",
        "A reproducible source description is required.",
      );
    }
    if (!record.contentFingerprint.trim()) {
      issue(
        "fingerprint-required",
        "A source content fingerprint is required.",
      );
    }
    if (!CLEARABLE_RIGHTS.has(record.rightsStatus)) {
      issue(
        "rights-not-clearable",
        `${record.rightsStatus} rights cannot be activated.`,
      );
    }
    if (record.namedArtistReference?.trim()) {
      issue(
        "named-artist-reference",
        "Named-artist imitation references cannot be cleared for activation.",
      );
    }
    requiredEvidenceKinds(record).forEach((kind) => {
      const matching = record.evidence.filter(
        (evidence) =>
          evidence.kind === kind &&
          evidence.reference.trim() &&
          evidence.issuer.trim() &&
          Date.parse(evidence.effectiveAt) <= this.now().getTime(),
      );
      if (matching.length === 0) {
        issue("evidence-required", `${kind} evidence is required.`);
      }
    });
    record.evidence.forEach((evidence) => {
      if (
        evidence.expiresAt &&
        Date.parse(evidence.expiresAt) <= this.now().getTime()
      ) {
        issue(
          "evidence-expired",
          `${evidence.kind} evidence expired at ${evidence.expiresAt}.`,
          { evidenceId: evidence.id },
        );
      }
      if (
        evidence.kind === "fingerprint-verification" &&
        evidence.fingerprint !== record.contentFingerprint
      ) {
        issue(
          "fingerprint-mismatch",
          "Fingerprint evidence does not match the registered source.",
          { evidenceId: evidence.id },
        );
      }
    });
    record.restrictions
      .filter((restriction) => restriction.prohibitsActivation)
      .forEach((restriction) =>
        issue(
          "activation-restricted",
          restriction.description || `${restriction.usage} use is restricted.`,
          { restrictionId: restriction.id },
        ),
      );
    return issues;
  }

  verifyRecipe(recipe: TimelineSoundRecipe): TimelineRecipeRightsReport {
    const ingredients = recipe.ingredients.map((ingredient) => {
      const recordId = this.ingredientRecords.get(ingredient.id) ?? null;
      const record = recordId ? this.records.get(recordId) : null;
      let issues: TimelineRightsIssue[];
      if (!record) {
        issues = [
          {
            code: "record-not-found",
            ingredientId: ingredient.id,
            message: `${ingredient.name} has no rights and provenance record.`,
          },
        ];
      } else {
        issues = this.inspect(record);
        if (record.contentFingerprint !== ingredient.contentFingerprint) {
          issues.push({
            code: "fingerprint-mismatch",
            recordId: record.id,
            ingredientId: ingredient.id,
            message:
              "The recipe ingredient fingerprint differs from its evidence record.",
          });
        }
        if (record.state !== "cleared" && issues.length === 0) {
          issues.push({
            code: "evidence-required",
            recordId: record.id,
            ingredientId: ingredient.id,
            message: "The evidence record requires a successful human review.",
          });
        }
      }
      return {
        ingredientId: ingredient.id,
        recordId,
        accepted: Boolean(record?.state === "cleared" && issues.length === 0),
        issues,
      };
    });
    const issues = ingredients.flatMap((ingredient) => ingredient.issues);
    return {
      recipeId: recipe.id,
      accepted: ingredients.length > 0 && issues.length === 0,
      checkedAt: this.now().toISOString(),
      ingredients,
      issues,
    };
  }

  getRecord(recordId: TimelineId): TimelineRightsRecord | null {
    const record = this.records.get(recordId);
    return record ? clone(record) : null;
  }

  getIngredientRecord(ingredientId: TimelineId): TimelineRightsRecord | null {
    const recordId = this.ingredientRecords.get(ingredientId);
    return recordId ? this.getRecord(recordId) : null;
  }

  listRecords(projectId?: TimelineProjectId): TimelineRightsRecord[] {
    return Array.from(this.records.values())
      .filter((record) => !projectId || record.projectId === projectId)
      .map(clone);
  }

  exportArchive(): TimelineRightsArchive {
    return { records: this.listRecords() };
  }

  restoreArchive(archive: TimelineRightsArchive): void {
    this.records.clear();
    this.ingredientRecords.clear();
    this.recordSequence = 0;
    this.evidenceSequence = 0;
    this.restrictionSequence = 0;
    this.reviewSequence = 0;
    archive.records.forEach((record) => {
      if (this.ingredientRecords.has(record.ingredientId)) {
        throw new Error(
          `Duplicate rights record for ingredient ${record.ingredientId}.`,
        );
      }
      this.records.set(record.id, clone(record));
      this.ingredientRecords.set(record.ingredientId, record.id);
      this.recordSequence = Math.max(
        this.recordSequence,
        this.idSequence(record.id),
      );
      record.evidence.forEach((evidence) => {
        this.evidenceSequence = Math.max(
          this.evidenceSequence,
          this.idSequence(evidence.id),
        );
      });
      record.restrictions.forEach((restriction) => {
        this.restrictionSequence = Math.max(
          this.restrictionSequence,
          this.idSequence(restriction.id),
        );
      });
      record.reviews.forEach((review) => {
        this.reviewSequence = Math.max(
          this.reviewSequence,
          this.idSequence(review.id),
        );
      });
    });
  }

  private deriveState(
    record: TimelineRightsRecord,
    issues: TimelineRightsIssue[],
  ): TimelineRightsRecordState {
    if (record.state === "revoked") return "revoked";
    if (issues.some((issue) => issue.code === "evidence-expired")) {
      return "expired";
    }
    if (
      issues.some(
        (issue) =>
          issue.code === "activation-restricted" ||
          issue.code === "named-artist-reference" ||
          issue.code === "rights-not-clearable",
      )
    ) {
      return "restricted";
    }
    return issues.length === 0 ? "cleared" : "held";
  }

  private invalidate(
    record: TimelineRightsRecord,
    updatedBy: TimelineUserId,
  ): TimelineRightsRecord {
    return {
      ...clone(record),
      state: record.state === "revoked" ? "revoked" : "held",
      updatedAt: this.now().toISOString(),
      updatedBy,
    };
  }

  private notFound(recordId: TimelineId): TimelineRightsResult {
    return {
      accepted: false,
      record: null,
      issues: [
        {
          code: "record-not-found",
          recordId,
          message: `Rights record ${recordId} was not found.`,
        },
      ],
    };
  }

  private idSequence(id: TimelineId): number {
    return Number(id.match(/(\d+)$/)?.[1] ?? 0);
  }
}

export const timelineRightsProvenanceEngine =
  new TimelineRightsProvenanceEngine();
