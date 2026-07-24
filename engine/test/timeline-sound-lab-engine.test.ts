import { describe, expect, it } from "vitest";
import { TimelineSoundLabEngine } from "../../lib/timeline/TimelineSoundLabEngine";
import type { TimelineSoundIngredient } from "../../lib/timeline/TimelineSoundRecipeEngine";

function ingredient(
  name: string,
  percentage: number,
  overrides: Partial<
    Omit<TimelineSoundIngredient, "id" | "createdAt" | "createdBy">
  > = {},
) {
  return {
    name,
    kind: "user-recording" as const,
    percentage,
    sourceDescription: `${name} source session`,
    owner: "member-1",
    rightsStatus: "owned" as const,
    contentFingerprint: `sha256-${name}`,
    ...overrides,
  };
}

function createLabWithIngredient(percentage = 100) {
  const lab = new TimelineSoundLabEngine();
  const session = lab.createSession({
    projectId: "project-1",
    name: "Lead guitar sound",
    createdBy: "member-1",
  });
  const added = lab.addIngredient({
    sessionId: session.id,
    ingredient: ingredient("Analog guitar", percentage),
    addedBy: "member-1",
  });
  return {
    lab,
    session: added.session!,
    recipe: added.recipe!,
    recordId: added.rightsRecordId!,
  };
}

function clearRights(
  lab: TimelineSoundLabEngine,
  recordId: string,
  fingerprint: string,
) {
  lab.rights.addEvidence({
    recordId,
    kind: "ownership",
    reference: "ownership-1",
    issuer: "member-1",
    addedBy: "member-1",
  });
  lab.rights.addEvidence({
    recordId,
    kind: "source-recording",
    reference: "session-take-12",
    issuer: "studio-1",
    addedBy: "member-1",
  });
  lab.rights.addEvidence({
    recordId,
    kind: "fingerprint-verification",
    reference: "fingerprint-check-1",
    issuer: "sound-lab",
    fingerprint,
    addedBy: "member-1",
  });
  return lab.rights.review({
    recordId,
    reviewedBy: "reviewer-1",
    note: "All evidence verified.",
  });
}

describe("TimelineSoundLabEngine", () => {
  it("holds release when the recipe does not total exactly 100%", () => {
    const { lab, session } = createLabWithIngredient(60);
    const release = lab.prepareRelease({
      sessionId: session.id,
      versionLabel: "Incomplete release",
      requestedBy: "member-1",
    });

    expect(release.accepted).toBe(false);
    expect(release.session?.state).toBe("held");
    expect(release.issues[0].code).toBe("recipe-held");
    expect(
      release.issues[0].recipeIssues?.map((issue) => issue.code),
    ).toContain("percentage-total");
    expect(release.version).toBeNull();
  });

  it("automatically registers provenance and holds unreviewed rights", () => {
    const { lab, session, recipe, recordId } = createLabWithIngredient();
    const record = lab.rights.getRecord(recordId);
    const release = lab.prepareRelease({
      sessionId: session.id,
      versionLabel: "Uncleared release",
      requestedBy: "member-1",
    });

    expect(record?.ingredientId).toBe(recipe.ingredients[0].id);
    expect(record?.state).toBe("held");
    expect(release.accepted).toBe(false);
    expect(release.issues[0].code).toBe("rights-held");
    expect(release.rightsReport?.accepted).toBe(false);
    expect(release.version).toBeNull();
  });

  it("releases only after recipe, rights, version, and activation gates pass", () => {
    const { lab, session, recipe, recordId } = createLabWithIngredient();
    expect(
      clearRights(lab, recordId, recipe.ingredients[0].contentFingerprint!)
        .accepted,
    ).toBe(true);
    const release = lab.prepareRelease({
      sessionId: session.id,
      versionLabel: "Approved guitar v1",
      versionTags: ["approved", "release"],
      requestedBy: "member-1",
    });
    const eventKinds = release.session?.events.map((event) => event.kind);

    expect(release.accepted).toBe(true);
    expect(release.session?.state).toBe("active");
    expect(release.session?.releaseCount).toBe(1);
    expect(release.session?.activeVersionId).toBe(release.version?.id);
    expect(release.recipe?.state).toBe("active");
    expect(release.version?.versionNumber).toBe(1);
    expect(release.rightsReport?.accepted).toBe(true);
    expect(eventKinds).toEqual([
      "session-created",
      "ingredient-added",
      "release-requested",
      "recipe-validated",
      "rights-cleared",
      "version-created",
      "recipe-activated",
    ]);
  });

  it("preserves clearance but holds activation when version evidence is incomplete", () => {
    const { lab, session, recipe, recordId } = createLabWithIngredient();
    clearRights(lab, recordId, recipe.ingredients[0].contentFingerprint!);
    const refused = lab.prepareRelease({
      sessionId: session.id,
      versionLabel: " ",
      requestedBy: "member-1",
    });

    expect(refused.accepted).toBe(false);
    expect(refused.session?.state).toBe("held");
    expect(refused.issues[0].code).toBe("version-held");
    expect(
      refused.issues[0].versionIssues?.map((issue) => issue.code),
    ).toContain("version-label-required");
    expect(lab.recipes.getRecipe(session.recipeId)?.state).toBe("validated");
  });

  it("restores the complete active lab and continues unique event IDs", () => {
    const { lab, session, recipe, recordId } = createLabWithIngredient();
    clearRights(lab, recordId, recipe.ingredients[0].contentFingerprint!);
    const released = lab.prepareRelease({
      sessionId: session.id,
      versionLabel: "Before restart",
      requestedBy: "member-1",
    });
    const lastEventId = released.session!.events.at(-1)!.id;
    const restarted = new TimelineSoundLabEngine();
    restarted.restoreArchive(lab.exportArchive());
    const restored = restarted.getSession(session.id)!;
    const archived = restarted.archiveSession({
      sessionId: session.id,
      archivedBy: "member-1",
    })!;
    const blocked = restarted.addIngredient({
      sessionId: session.id,
      ingredient: ingredient("Late addition", 10),
      addedBy: "member-1",
    });

    expect(restored.state).toBe("active");
    expect(restarted.recipes.getRecipe(session.recipeId)?.state).toBe("active");
    expect(restarted.rights.getRecord(recordId)?.state).toBe("cleared");
    expect(restarted.versions.getVersion(released.version!.id)?.id).toBe(
      released.version!.id,
    );
    expect(archived.events.at(-1)?.id).not.toBe(lastEventId);
    expect(archived.state).toBe("archived");
    expect(blocked.accepted).toBe(false);
    expect(blocked.issues[0].code).toBe("session-archived");
  });
});
