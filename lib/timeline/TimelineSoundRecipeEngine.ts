import type {
  TimelineId,
  TimelineProjectId,
  TimelineUserId,
} from "./TimelineTypes";

export type TimelineSoundIngredientKind =
  | "user-recording"
  | "licensed-recording"
  | "ai-generated"
  | "synthesized"
  | "sample"
  | "effect-chain"
  | "room-capture";

export type TimelineSoundRightsStatus =
  "owned" | "licensed" | "cleared" | "pending" | "unknown" | "restricted";

export type TimelineSoundRecipeState =
  "draft" | "incomplete" | "validated" | "active" | "archived";

export type TimelineSoundIngredient = {
  id: TimelineId;
  name: string;
  kind: TimelineSoundIngredientKind;
  percentage: number;
  sourceDescription: string;
  sourceUri?: string;
  owner: string;
  rightsStatus: TimelineSoundRightsStatus;
  licenseReference?: string;
  consentReference?: string;
  contentFingerprint?: string;
  generatedModel?: string;
  namedArtistReference?: string;
  createdAt: string;
  createdBy: TimelineUserId;
};

export type TimelineSoundRecipeIssue = {
  code:
    | "recipe-not-found"
    | "recipe-not-validated"
    | "name-required"
    | "ingredient-required"
    | "percentage-invalid"
    | "percentage-total"
    | "source-required"
    | "owner-required"
    | "rights-not-cleared"
    | "license-required"
    | "fingerprint-required"
    | "named-artist-reference";
  message: string;
  ingredientId?: TimelineId;
};

export type TimelineSoundRecipeValidation = {
  id: TimelineId;
  recipeId: TimelineId;
  accepted: boolean;
  totalPercentage: number;
  issues: TimelineSoundRecipeIssue[];
  validatedAt: string;
  validatedBy: TimelineUserId;
};

export type TimelineSoundRecipeTransition = {
  id: TimelineId;
  from: TimelineSoundRecipeState | null;
  to: TimelineSoundRecipeState;
  at: string;
  by: TimelineUserId;
  reason: string;
};

export type TimelineSoundRecipe = {
  id: TimelineId;
  projectId: TimelineProjectId;
  name: string;
  description: string;
  state: TimelineSoundRecipeState;
  ingredients: TimelineSoundIngredient[];
  createdAt: string;
  createdBy: TimelineUserId;
  updatedAt: string;
  updatedBy: TimelineUserId;
  validation?: TimelineSoundRecipeValidation;
  transitions: TimelineSoundRecipeTransition[];
};

export type TimelineSoundRecipeResult = {
  accepted: boolean;
  recipe: TimelineSoundRecipe | null;
  issues: TimelineSoundRecipeIssue[];
};

const CLEARED_RIGHTS = new Set<TimelineSoundRightsStatus>([
  "owned",
  "licensed",
  "cleared",
]);

function clone<T>(value: T): T {
  return structuredClone(value);
}

function normalizedPercentage(value: number): number {
  return Math.round(value * 100) / 100;
}

export class TimelineSoundRecipeEngine {
  private readonly recipes = new Map<TimelineId, TimelineSoundRecipe>();
  private sequence = 0;
  private ingredientSequence = 0;
  private validationSequence = 0;
  private transitionSequence = 0;

  constructor(private readonly now: () => Date = () => new Date()) {}

  createRecipe(input: {
    projectId: TimelineProjectId;
    name: string;
    description?: string;
    createdBy: TimelineUserId;
  }): TimelineSoundRecipe {
    const now = this.now().toISOString();
    const id = `timeline-sound-recipe-${++this.sequence}`;
    const state: TimelineSoundRecipeState = input.name.trim()
      ? "draft"
      : "incomplete";
    const recipe: TimelineSoundRecipe = {
      id,
      projectId: input.projectId,
      name: input.name.trim(),
      description: input.description?.trim() ?? "",
      state,
      ingredients: [],
      createdAt: now,
      createdBy: input.createdBy,
      updatedAt: now,
      updatedBy: input.createdBy,
      transitions: [
        this.transition(null, state, input.createdBy, "Sound recipe created."),
      ],
    };
    this.recipes.set(id, clone(recipe));
    return clone(recipe);
  }

  addIngredient(input: {
    recipeId: TimelineId;
    ingredient: Omit<TimelineSoundIngredient, "id" | "createdAt" | "createdBy">;
    addedBy: TimelineUserId;
  }): TimelineSoundRecipeResult {
    const recipe = this.recipes.get(input.recipeId);
    if (!recipe) return this.notFound();
    const now = this.now().toISOString();
    const ingredient: TimelineSoundIngredient = {
      ...clone(input.ingredient),
      id: `timeline-sound-ingredient-${++this.ingredientSequence}`,
      name: input.ingredient.name.trim(),
      percentage: normalizedPercentage(input.ingredient.percentage),
      sourceDescription: input.ingredient.sourceDescription.trim(),
      owner: input.ingredient.owner.trim(),
      createdAt: now,
      createdBy: input.addedBy,
    };
    const next = this.invalidate(recipe, input.addedBy, "Ingredient added.");
    next.ingredients.push(ingredient);
    this.recipes.set(next.id, clone(next));
    return { accepted: true, recipe: clone(next), issues: [] };
  }

  updateIngredient(input: {
    recipeId: TimelineId;
    ingredientId: TimelineId;
    patch: Partial<
      Omit<TimelineSoundIngredient, "id" | "createdAt" | "createdBy">
    >;
    updatedBy: TimelineUserId;
  }): TimelineSoundRecipeResult {
    const recipe = this.recipes.get(input.recipeId);
    if (!recipe) return this.notFound();
    const index = recipe.ingredients.findIndex(
      (ingredient) => ingredient.id === input.ingredientId,
    );
    if (index < 0) {
      return {
        accepted: false,
        recipe: clone(recipe),
        issues: [
          {
            code: "ingredient-required",
            ingredientId: input.ingredientId,
            message: "Sound ingredient was not found.",
          },
        ],
      };
    }
    const next = this.invalidate(
      recipe,
      input.updatedBy,
      "Ingredient updated.",
    );
    next.ingredients[index] = {
      ...next.ingredients[index],
      ...clone(input.patch),
      percentage:
        input.patch.percentage === undefined
          ? next.ingredients[index].percentage
          : normalizedPercentage(input.patch.percentage),
    };
    this.recipes.set(next.id, clone(next));
    return { accepted: true, recipe: clone(next), issues: [] };
  }

  removeIngredient(input: {
    recipeId: TimelineId;
    ingredientId: TimelineId;
    removedBy: TimelineUserId;
  }): TimelineSoundRecipeResult {
    const recipe = this.recipes.get(input.recipeId);
    if (!recipe) return this.notFound();
    if (
      !recipe.ingredients.some(
        (ingredient) => ingredient.id === input.ingredientId,
      )
    ) {
      return {
        accepted: false,
        recipe: clone(recipe),
        issues: [
          {
            code: "ingredient-required",
            ingredientId: input.ingredientId,
            message: "Sound ingredient was not found.",
          },
        ],
      };
    }
    const next = this.invalidate(
      recipe,
      input.removedBy,
      "Ingredient removed.",
    );
    next.ingredients = next.ingredients.filter(
      (ingredient) => ingredient.id !== input.ingredientId,
    );
    this.recipes.set(next.id, clone(next));
    return { accepted: true, recipe: clone(next), issues: [] };
  }

  validateRecipe(input: {
    recipeId: TimelineId;
    validatedBy: TimelineUserId;
  }): TimelineSoundRecipeResult {
    const recipe = this.recipes.get(input.recipeId);
    if (!recipe) return this.notFound();
    const issues = this.inspect(recipe);
    const accepted = issues.length === 0;
    const now = this.now().toISOString();
    const totalPercentage = normalizedPercentage(
      recipe.ingredients.reduce(
        (sum, ingredient) => sum + ingredient.percentage,
        0,
      ),
    );
    const state: TimelineSoundRecipeState = accepted
      ? "validated"
      : "incomplete";
    const next: TimelineSoundRecipe = {
      ...recipe,
      state,
      updatedAt: now,
      updatedBy: input.validatedBy,
      validation: {
        id: `timeline-sound-validation-${++this.validationSequence}`,
        recipeId: recipe.id,
        accepted,
        totalPercentage,
        issues: clone(issues),
        validatedAt: now,
        validatedBy: input.validatedBy,
      },
      transitions: [
        ...recipe.transitions,
        this.transition(
          recipe.state,
          state,
          input.validatedBy,
          accepted
            ? "Every sound ingredient and the 100% mix passed validation."
            : "Sound recipe remains held until every issue is corrected.",
        ),
      ],
    };
    this.recipes.set(next.id, clone(next));
    return { accepted, recipe: clone(next), issues };
  }

  activateRecipe(input: {
    recipeId: TimelineId;
    activatedBy: TimelineUserId;
  }): TimelineSoundRecipeResult {
    const recipe = this.recipes.get(input.recipeId);
    if (!recipe) return this.notFound();
    if (recipe.state !== "validated" || !recipe.validation?.accepted) {
      return {
        accepted: false,
        recipe: clone(recipe),
        issues: [
          {
            code: "recipe-not-validated",
            message:
              "Only a validated 100% rights-cleared sound recipe can become active.",
          },
        ],
      };
    }
    const now = this.now().toISOString();
    const next: TimelineSoundRecipe = {
      ...recipe,
      state: "active",
      updatedAt: now,
      updatedBy: input.activatedBy,
      transitions: [
        ...recipe.transitions,
        this.transition(
          "validated",
          "active",
          input.activatedBy,
          "Validated sound recipe activated.",
        ),
      ],
    };
    this.recipes.set(next.id, clone(next));
    return { accepted: true, recipe: clone(next), issues: [] };
  }

  inspect(recipe: TimelineSoundRecipe): TimelineSoundRecipeIssue[] {
    const issues: TimelineSoundRecipeIssue[] = [];
    if (!recipe.name.trim()) {
      issues.push({
        code: "name-required",
        message: "Sound recipe name is required.",
      });
    }
    if (!recipe.ingredients.length) {
      issues.push({
        code: "ingredient-required",
        message: "At least one sound ingredient is required.",
      });
    }
    const total = normalizedPercentage(
      recipe.ingredients.reduce(
        (sum, ingredient) => sum + ingredient.percentage,
        0,
      ),
    );
    if (total !== 100) {
      issues.push({
        code: "percentage-total",
        message: `Sound ingredients total ${total}%; the recipe must equal exactly 100%.`,
      });
    }
    recipe.ingredients.forEach((ingredient) => {
      const issue = (code: TimelineSoundRecipeIssue["code"], message: string) =>
        issues.push({ code, message, ingredientId: ingredient.id });
      if (
        !Number.isFinite(ingredient.percentage) ||
        ingredient.percentage <= 0 ||
        ingredient.percentage > 100
      ) {
        issue(
          "percentage-invalid",
          `${ingredient.name || ingredient.id} requires a percentage greater than 0 and no more than 100.`,
        );
      }
      if (!ingredient.sourceDescription.trim()) {
        issue(
          "source-required",
          `${ingredient.name || ingredient.id} requires a source description.`,
        );
      }
      if (!ingredient.owner.trim()) {
        issue(
          "owner-required",
          `${ingredient.name || ingredient.id} requires a known owner.`,
        );
      }
      if (!CLEARED_RIGHTS.has(ingredient.rightsStatus)) {
        issue(
          "rights-not-cleared",
          `${ingredient.name || ingredient.id} has ${ingredient.rightsStatus} rights and must remain held.`,
        );
      }
      if (
        ingredient.rightsStatus === "licensed" &&
        !ingredient.licenseReference?.trim()
      ) {
        issue(
          "license-required",
          `${ingredient.name || ingredient.id} requires a license reference.`,
        );
      }
      if (!ingredient.contentFingerprint?.trim()) {
        issue(
          "fingerprint-required",
          `${ingredient.name || ingredient.id} requires a content fingerprint for provenance.`,
        );
      }
      if (ingredient.namedArtistReference?.trim()) {
        issue(
          "named-artist-reference",
          `${ingredient.name || ingredient.id} contains a named-artist imitation reference and cannot be activated.`,
        );
      }
    });
    return issues;
  }

  getRecipe(recipeId: TimelineId): TimelineSoundRecipe | null {
    const recipe = this.recipes.get(recipeId);
    return recipe ? clone(recipe) : null;
  }

  listRecipes(projectId?: TimelineProjectId): TimelineSoundRecipe[] {
    return Array.from(this.recipes.values())
      .filter((recipe) => !projectId || recipe.projectId === projectId)
      .map(clone);
  }

  exportRecipes(): TimelineSoundRecipe[] {
    return this.listRecipes();
  }

  restoreRecipes(recipes: TimelineSoundRecipe[]): void {
    this.recipes.clear();
    recipes.forEach((recipe) => {
      this.recipes.set(recipe.id, clone(recipe));
      this.sequence = Math.max(
        this.sequence,
        Number(recipe.id.match(/(\d+)$/)?.[1] ?? 0),
      );
      recipe.ingredients.forEach((ingredient) => {
        this.ingredientSequence = Math.max(
          this.ingredientSequence,
          Number(ingredient.id.match(/(\d+)$/)?.[1] ?? 0),
        );
      });
      if (recipe.validation) {
        this.validationSequence = Math.max(
          this.validationSequence,
          Number(recipe.validation.id.match(/(\d+)$/)?.[1] ?? 0),
        );
      }
      recipe.transitions.forEach((transition) => {
        this.transitionSequence = Math.max(
          this.transitionSequence,
          Number(transition.id.match(/(\d+)$/)?.[1] ?? 0),
        );
      });
    });
  }

  private invalidate(
    recipe: TimelineSoundRecipe,
    updatedBy: TimelineUserId,
    reason: string,
  ): TimelineSoundRecipe {
    const now = this.now().toISOString();
    return {
      ...clone(recipe),
      state: "incomplete",
      validation: undefined,
      updatedAt: now,
      updatedBy,
      transitions: [
        ...recipe.transitions,
        this.transition(recipe.state, "incomplete", updatedBy, reason),
      ],
    };
  }

  private transition(
    from: TimelineSoundRecipeState | null,
    to: TimelineSoundRecipeState,
    by: TimelineUserId,
    reason: string,
  ): TimelineSoundRecipeTransition {
    return {
      id: `timeline-sound-transition-${++this.transitionSequence}`,
      from,
      to,
      at: this.now().toISOString(),
      by,
      reason,
    };
  }

  private notFound(): TimelineSoundRecipeResult {
    return {
      accepted: false,
      recipe: null,
      issues: [
        {
          code: "recipe-not-found",
          message: "Sound recipe was not found.",
        },
      ],
    };
  }
}

export const timelineSoundRecipeEngine = new TimelineSoundRecipeEngine();
