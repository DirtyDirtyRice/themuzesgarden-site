import { describe, expect, it } from "vitest";

import { TimelineSoundRecipeEngine } from "../../lib/timeline/TimelineSoundRecipeEngine";

function ingredient(
  name: string,
  percentage: number,
  overrides: Record<string, unknown> = {},
) {
  return {
    name,
    kind: "user-recording" as const,
    percentage,
    sourceDescription: `${name} source recording`,
    owner: "member-1",
    rightsStatus: "owned" as const,
    contentFingerprint: `sha256-${name}`,
    ...overrides,
  };
}

describe("TimelineSoundRecipeEngine", () => {
  it("holds an incomplete mix until cleared ingredients total exactly 100%", () => {
    const engine = new TimelineSoundRecipeEngine();
    const recipe = engine.createRecipe({
      projectId: "project-1",
      name: "Hybrid guitar",
      createdBy: "member-1",
    });
    const first = engine.addIngredient({
      recipeId: recipe.id,
      ingredient: ingredient("Analog guitar", 60),
      addedBy: "member-1",
    });
    const incomplete = engine.validateRecipe({
      recipeId: recipe.id,
      validatedBy: "member-1",
    });
    engine.addIngredient({
      recipeId: recipe.id,
      ingredient: ingredient("Generated texture", 40, {
        kind: "ai-generated",
        generatedModel: "licensed-model",
      }),
      addedBy: "member-1",
    });
    const validated = engine.validateRecipe({
      recipeId: recipe.id,
      validatedBy: "member-1",
    });
    const activated = engine.activateRecipe({
      recipeId: recipe.id,
      activatedBy: "member-1",
    });

    expect(first.recipe?.state).toBe("incomplete");
    expect(incomplete.accepted).toBe(false);
    expect(incomplete.issues.map((issue) => issue.code)).toContain(
      "percentage-total",
    );
    expect(validated.accepted).toBe(true);
    expect(validated.recipe?.validation?.totalPercentage).toBe(100);
    expect(activated.accepted).toBe(true);
    expect(activated.recipe?.state).toBe("active");
  });

  it("blocks unknown rights, missing provenance, and named-artist references", () => {
    const engine = new TimelineSoundRecipeEngine();
    const recipe = engine.createRecipe({
      projectId: "project-1",
      name: "Unsafe imitation",
      createdBy: "member-1",
    });
    engine.addIngredient({
      recipeId: recipe.id,
      ingredient: ingredient("Reference sound", 100, {
        rightsStatus: "unknown",
        contentFingerprint: "",
        namedArtistReference: "Imitate a named guitarist",
      }),
      addedBy: "member-1",
    });
    const validation = engine.validateRecipe({
      recipeId: recipe.id,
      validatedBy: "member-1",
    });
    const codes = validation.issues.map((issue) => issue.code);

    expect(validation.accepted).toBe(false);
    expect(codes).toEqual(
      expect.arrayContaining([
        "rights-not-cleared",
        "fingerprint-required",
        "named-artist-reference",
      ]),
    );
    expect(
      engine.activateRecipe({
        recipeId: recipe.id,
        activatedBy: "member-1",
      }).accepted,
    ).toBe(false);
  });

  it("requires license evidence for licensed ingredients", () => {
    const engine = new TimelineSoundRecipeEngine();
    const recipe = engine.createRecipe({
      projectId: "project-1",
      name: "Licensed room",
      createdBy: "member-1",
    });
    const added = engine.addIngredient({
      recipeId: recipe.id,
      ingredient: ingredient("Room capture", 100, {
        kind: "room-capture",
        rightsStatus: "licensed",
      }),
      addedBy: "member-1",
    });
    const refused = engine.validateRecipe({
      recipeId: recipe.id,
      validatedBy: "member-1",
    });
    engine.updateIngredient({
      recipeId: recipe.id,
      ingredientId: added.recipe!.ingredients[0].id,
      patch: { licenseReference: "license-2026-001" },
      updatedBy: "member-1",
    });
    const accepted = engine.validateRecipe({
      recipeId: recipe.id,
      validatedBy: "member-1",
    });

    expect(refused.issues.map((issue) => issue.code)).toContain(
      "license-required",
    );
    expect(accepted.accepted).toBe(true);
  });

  it("restores recipe identity and ingredients after restart", () => {
    const engine = new TimelineSoundRecipeEngine();
    const recipe = engine.createRecipe({
      projectId: "project-1",
      name: "Persistent recipe",
      createdBy: "member-1",
    });
    engine.addIngredient({
      recipeId: recipe.id,
      ingredient: ingredient("Owned synth", 100, { kind: "synthesized" }),
      addedBy: "member-1",
    });
    const originalValidation = engine.validateRecipe({
      recipeId: recipe.id,
      validatedBy: "member-1",
    })?.recipe?.validation;
    const restarted = new TimelineSoundRecipeEngine();
    restarted.restoreRecipes(engine.exportRecipes());
    const restored = restarted.getRecipe(recipe.id);
    restarted.updateIngredient({
      recipeId: recipe.id,
      ingredientId: restored!.ingredients[0].id,
      patch: { sourceDescription: "Restored synth source" },
      updatedBy: "member-1",
    });
    const restartedValidation = restarted.validateRecipe({
      recipeId: recipe.id,
      validatedBy: "member-1",
    })?.recipe?.validation;

    expect(restored?.id).toBe(recipe.id);
    expect(restored?.ingredients).toHaveLength(1);
    expect(restored?.ingredients[0].name).toBe("Owned synth");
    expect(restartedValidation?.id).not.toBe(originalValidation?.id);
  });
});
