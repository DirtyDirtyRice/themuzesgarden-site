import { describe, expect, it } from "vitest";
import {
  TimelineRightsProvenanceEngine,
  type TimelineRightsEvidenceKind,
} from "../../lib/timeline/TimelineRightsProvenanceEngine";
import {
  TimelineSoundRecipeEngine,
  type TimelineSoundIngredient,
  type TimelineSoundRightsStatus,
} from "../../lib/timeline/TimelineSoundRecipeEngine";

function createRecipe(
  rightsStatus: TimelineSoundRightsStatus = "owned",
  overrides: Partial<
    Omit<TimelineSoundIngredient, "id" | "createdAt" | "createdBy">
  > = {},
) {
  const recipes = new TimelineSoundRecipeEngine();
  const created = recipes.createRecipe({
    projectId: "project-1",
    name: "Rights-tested recipe",
    createdBy: "member-1",
  });
  const added = recipes.addIngredient({
    recipeId: created.id,
    ingredient: {
      name: "Original guitar",
      kind: "user-recording",
      percentage: 100,
      sourceDescription: "Session recording take 12",
      owner: "member-1",
      rightsStatus,
      contentFingerprint: "sha256-original-guitar",
      licenseReference:
        rightsStatus === "licensed" ? "license-reference-1" : undefined,
      ...overrides,
    },
    addedBy: "member-1",
  }).recipe!;
  const recipe = recipes.validateRecipe({
    recipeId: created.id,
    validatedBy: "member-1",
  }).recipe!;
  return { recipes, recipe, ingredient: added.ingredients[0] };
}

function addEvidence(
  engine: TimelineRightsProvenanceEngine,
  recordId: string,
  kind: TimelineRightsEvidenceKind,
  options: { expiresAt?: string; fingerprint?: string } = {},
) {
  return engine.addEvidence({
    recordId,
    kind,
    reference: `${kind}-reference`,
    issuer: "Verified issuer",
    expiresAt: options.expiresAt,
    fingerprint: options.fingerprint,
    addedBy: "reviewer-1",
  });
}

function fullyEvidenceOwnedIngredient(
  engine: TimelineRightsProvenanceEngine,
  ingredient: TimelineSoundIngredient,
) {
  const record = engine.registerIngredient({
    projectId: "project-1",
    ingredient,
    registeredBy: "member-1",
  });
  addEvidence(engine, record.id, "ownership");
  addEvidence(engine, record.id, "source-recording");
  addEvidence(engine, record.id, "fingerprint-verification", {
    fingerprint: ingredient.contentFingerprint,
  });
  return record.id;
}

describe("TimelineRightsProvenanceEngine", () => {
  it("holds an ingredient until ownership and fingerprint proof are reviewed", () => {
    const { recipe, ingredient } = createRecipe();
    const engine = new TimelineRightsProvenanceEngine();
    const record = engine.registerIngredient({
      projectId: recipe.projectId,
      ingredient,
      registeredBy: "member-1",
    });
    const held = engine.review({
      recordId: record.id,
      reviewedBy: "reviewer-1",
    });
    addEvidence(engine, record.id, "ownership");
    addEvidence(engine, record.id, "source-recording");
    addEvidence(engine, record.id, "fingerprint-verification", {
      fingerprint: ingredient.contentFingerprint,
    });
    const cleared = engine.review({
      recordId: record.id,
      reviewedBy: "reviewer-1",
      note: "Source and ownership verified.",
    });

    expect(held.accepted).toBe(false);
    expect(held.issues.map((issue) => issue.code)).toContain(
      "evidence-required",
    );
    expect(cleared.accepted).toBe(true);
    expect(cleared.record?.state).toBe("cleared");
    expect(engine.verifyRecipe(recipe).accepted).toBe(true);
  });

  it("rejects expired licenses and marks their record expired", () => {
    const now = new Date("2026-07-23T12:00:00.000Z");
    const { ingredient } = createRecipe("licensed");
    const engine = new TimelineRightsProvenanceEngine(() => now);
    const record = engine.registerIngredient({
      projectId: "project-1",
      ingredient,
      registeredBy: "member-1",
    });
    addEvidence(engine, record.id, "license", {
      expiresAt: "2026-07-22T12:00:00.000Z",
    });
    addEvidence(engine, record.id, "fingerprint-verification", {
      fingerprint: ingredient.contentFingerprint,
    });
    const review = engine.review({
      recordId: record.id,
      reviewedBy: "reviewer-1",
    });

    expect(review.accepted).toBe(false);
    expect(review.record?.state).toBe("expired");
    expect(review.issues.map((issue) => issue.code)).toContain(
      "evidence-expired",
    );
  });

  it("detects fingerprint tampering between a recipe and its evidence record", () => {
    const { recipe, ingredient } = createRecipe();
    const engine = new TimelineRightsProvenanceEngine();
    const recordId = fullyEvidenceOwnedIngredient(engine, ingredient);
    engine.review({ recordId, reviewedBy: "reviewer-1" });
    const tampered = structuredClone(recipe);
    tampered.ingredients[0].contentFingerprint = "sha256-different-audio";
    const report = engine.verifyRecipe(tampered);

    expect(report.accepted).toBe(false);
    expect(report.issues.map((issue) => issue.code)).toContain(
      "fingerprint-mismatch",
    );
  });

  it("supports explicit restrictions and permanent clearance revocation", () => {
    const { ingredient } = createRecipe();
    const engine = new TimelineRightsProvenanceEngine();
    const recordId = fullyEvidenceOwnedIngredient(engine, ingredient);
    engine.addRestriction({
      recordId,
      usage: "commercial-release",
      description: "Owner permits private demos only.",
      prohibitsActivation: true,
      addedBy: "member-1",
    });
    const restricted = engine.review({
      recordId,
      reviewedBy: "reviewer-1",
    });
    const revoked = engine.revoke({
      recordId,
      revokedBy: "member-1",
      reason: "Owner withdrew permission.",
    });
    const afterRevocation = engine.review({
      recordId,
      reviewedBy: "reviewer-1",
    });

    expect(restricted.record?.state).toBe("restricted");
    expect(restricted.issues.map((issue) => issue.code)).toContain(
      "activation-restricted",
    );
    expect(revoked.record?.state).toBe("revoked");
    expect(afterRevocation.accepted).toBe(false);
    expect(afterRevocation.issues.map((issue) => issue.code)).toContain(
      "record-revoked",
    );
  });

  it("restores evidence and continues unique ledger IDs after restart", () => {
    const { ingredient } = createRecipe();
    const beforeRestart = new TimelineRightsProvenanceEngine();
    const recordId = fullyEvidenceOwnedIngredient(beforeRestart, ingredient);
    const firstReview = beforeRestart.review({
      recordId,
      reviewedBy: "reviewer-1",
    }).record!.reviews[0];
    const afterRestart = new TimelineRightsProvenanceEngine();
    afterRestart.restoreArchive(beforeRestart.exportArchive());
    const newEvidence = addEvidence(
      afterRestart,
      recordId,
      "source-recording",
    ).record!.evidence.at(-1)!;
    const secondReview = afterRestart
      .review({
        recordId,
        reviewedBy: "reviewer-2",
      })
      .record!.reviews.at(-1)!;

    expect(afterRestart.getIngredientRecord(ingredient.id)?.id).toBe(recordId);
    expect(newEvidence.id).toBe("timeline-rights-evidence-4");
    expect(secondReview.id).not.toBe(firstReview.id);
    expect(secondReview.id).toBe("timeline-rights-review-2");
  });
});
