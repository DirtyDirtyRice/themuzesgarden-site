import { describe, expect, it } from "vitest";
import {
  TimelineSoundRecipeEngine,
  type TimelineSoundIngredient,
} from "../../lib/timeline/TimelineSoundRecipeEngine";
import { TimelineSoundRecipeVersionEngine } from "../../lib/timeline/TimelineSoundRecipeVersionEngine";

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
    sourceDescription: `${name} reproducible source`,
    owner: "member-1",
    rightsStatus: "owned" as const,
    contentFingerprint: `fingerprint-${name}`,
    ...overrides,
  };
}

function validatedRecipe() {
  const recipes = new TimelineSoundRecipeEngine();
  const recipe = recipes.createRecipe({
    projectId: "project-1",
    name: "Lead guitar recipe",
    createdBy: "member-1",
  });
  recipes.addIngredient({
    recipeId: recipe.id,
    ingredient: ingredient("Analog guitar", 60),
    addedBy: "member-1",
  });
  recipes.addIngredient({
    recipeId: recipe.id,
    ingredient: ingredient("Room texture", 40, {
      kind: "ai-generated",
      generatedModel: "licensed-model",
    }),
    addedBy: "member-1",
  });
  return {
    recipes,
    recipe: recipes.validateRecipe({
      recipeId: recipe.id,
      validatedBy: "member-1",
    }).recipe!,
  };
}

describe("TimelineSoundRecipeVersionEngine", () => {
  it("holds incomplete recipes and versions only accepted recipes", () => {
    const recipes = new TimelineSoundRecipeEngine();
    const incomplete = recipes.createRecipe({
      projectId: "project-1",
      name: "Incomplete recipe",
      createdBy: "member-1",
    });
    const versions = new TimelineSoundRecipeVersionEngine();
    const refused = versions.createVersion({
      recipe: incomplete,
      label: "Should not save",
      createdBy: "member-1",
    });
    const { recipe } = validatedRecipe();
    const accepted = versions.createVersion({
      recipe,
      label: "Approved foundation",
      tags: ["approved", "approved", " guitar "],
      createdBy: "member-1",
    });

    expect(refused.accepted).toBe(false);
    expect(refused.issues.map((issue) => issue.code)).toContain(
      "recipe-not-validated",
    );
    expect(accepted.accepted).toBe(true);
    expect(accepted.version?.versionNumber).toBe(1);
    expect(accepted.version?.tags).toEqual(["approved", "guitar"]);
  });

  it("refuses duplicate versions and compares ingredient changes", () => {
    const { recipes, recipe } = validatedRecipe();
    const versions = new TimelineSoundRecipeVersionEngine();
    const first = versions.createVersion({
      recipe,
      label: "Version one",
      createdBy: "member-1",
    }).version!;
    const duplicate = versions.createVersion({
      recipe,
      label: "Duplicate",
      createdBy: "member-1",
    });
    recipes.updateIngredient({
      recipeId: recipe.id,
      ingredientId: recipe.ingredients[0].id,
      patch: { percentage: 50 },
      updatedBy: "member-1",
    });
    recipes.updateIngredient({
      recipeId: recipe.id,
      ingredientId: recipe.ingredients[1].id,
      patch: { percentage: 50 },
      updatedBy: "member-1",
    });
    const changedRecipe = recipes.validateRecipe({
      recipeId: recipe.id,
      validatedBy: "member-1",
    }).recipe!;
    const second = versions.createVersion({
      recipe: changedRecipe,
      label: "Balanced version",
      createdBy: "member-1",
    }).version!;
    const comparison = versions.compare(first.id, second.id);

    expect(duplicate.issues.map((issue) => issue.code)).toContain(
      "version-unchanged",
    );
    expect(comparison.ingredientsChanged).toBe(2);
    expect(comparison.ingredientsAdded).toBe(0);
    expect(comparison.percentageDelta).toBe(0);
    expect(
      comparison.changes
        .filter((change) => change.kind === "ingredient-changed")
        .every((change) => change.fields.includes("percentage")),
    ).toBe(true);
  });

  it("restores an earlier recipe without altering the newer version", () => {
    const { recipes, recipe } = validatedRecipe();
    const versions = new TimelineSoundRecipeVersionEngine();
    const first = versions.createVersion({
      recipe,
      label: "Original balance",
      createdBy: "member-1",
    }).version!;
    recipes.updateIngredient({
      recipeId: recipe.id,
      ingredientId: recipe.ingredients[0].id,
      patch: { sourceDescription: "Updated analog recording" },
      updatedBy: "member-1",
    });
    const changed = recipes.validateRecipe({
      recipeId: recipe.id,
      validatedBy: "member-1",
    }).recipe!;
    const second = versions.createVersion({
      recipe: changed,
      label: "Updated source",
      createdBy: "member-1",
    }).version!;
    const restored = versions.restore(first.id);

    expect(restored.accepted).toBe(true);
    expect(restored.version?.recipe.ingredients[0].sourceDescription).toBe(
      "Analog guitar reproducible source",
    );
    expect(
      versions.getVersion(second.id)?.recipe.ingredients[0].sourceDescription,
    ).toBe("Updated analog recording");
    expect(
      versions.getAncestry(second.id).map((version) => version.id),
    ).toEqual([second.id, first.id]);
  });

  it("preserves version identity and sequencing across restart", () => {
    const { recipes, recipe } = validatedRecipe();
    const beforeRestart = new TimelineSoundRecipeVersionEngine();
    const first = beforeRestart.createVersion({
      recipe,
      label: "Before restart",
      createdBy: "member-1",
    }).version!;
    const afterRestart = new TimelineSoundRecipeVersionEngine();
    afterRestart.restoreArchive(beforeRestart.exportArchive());
    recipes.updateIngredient({
      recipeId: recipe.id,
      ingredientId: recipe.ingredients[0].id,
      patch: { sourceDescription: "Post-restart source" },
      updatedBy: "member-1",
    });
    const updated = recipes.validateRecipe({
      recipeId: recipe.id,
      validatedBy: "member-1",
    }).recipe!;
    const second = afterRestart.createVersion({
      recipe: updated,
      label: "After restart",
      createdBy: "member-1",
    }).version!;

    expect(afterRestart.getVersion(first.id)?.id).toBe(first.id);
    expect(second.id).not.toBe(first.id);
    expect(second.versionNumber).toBe(2);
    expect(second.parentVersionId).toBe(first.id);
  });
});
