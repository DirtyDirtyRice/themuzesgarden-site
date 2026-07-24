import type {
  TimelineSoundIngredient,
  TimelineSoundRecipe,
} from "./TimelineSoundRecipeEngine";
import type {
  TimelineId,
  TimelineProjectId,
  TimelineUserId,
} from "./TimelineTypes";

export type TimelineSoundRecipeVersion = {
  id: TimelineId;
  recipeId: TimelineId;
  projectId: TimelineProjectId;
  parentVersionId: TimelineId | null;
  versionNumber: number;
  label: string;
  description: string;
  tags: string[];
  recipe: TimelineSoundRecipe;
  checksum: string;
  createdAt: string;
  createdBy: TimelineUserId;
};

export type TimelineSoundRecipeVersionChangeKind =
  | "recipe-changed"
  | "ingredient-added"
  | "ingredient-removed"
  | "ingredient-changed";

export type TimelineSoundRecipeVersionChange = {
  kind: TimelineSoundRecipeVersionChangeKind;
  ingredientId?: TimelineId;
  fields: string[];
  before: TimelineSoundRecipe | TimelineSoundIngredient | null;
  after: TimelineSoundRecipe | TimelineSoundIngredient | null;
};

export type TimelineSoundRecipeVersionComparison = {
  fromVersionId: TimelineId;
  toVersionId: TimelineId;
  changes: TimelineSoundRecipeVersionChange[];
  recipeFieldsChanged: string[];
  ingredientsAdded: number;
  ingredientsRemoved: number;
  ingredientsChanged: number;
  ingredientsUnchanged: number;
  percentageDelta: number;
};

export type TimelineSoundRecipeVersionIssue = {
  code:
    | "recipe-not-validated"
    | "version-label-required"
    | "version-unchanged"
    | "version-not-found"
    | "version-corrupt";
  message: string;
};

export type TimelineSoundRecipeVersionResult = {
  accepted: boolean;
  version: TimelineSoundRecipeVersion | null;
  issues: TimelineSoundRecipeVersionIssue[];
};

export type TimelineSoundRecipeVersionArchive = {
  versions: TimelineSoundRecipeVersion[];
};

const RECIPE_COMPARISON_FIELDS = [
  "name",
  "description",
  "state",
  "validation",
] as const satisfies readonly (keyof TimelineSoundRecipe)[];

const INGREDIENT_COMPARISON_FIELDS = [
  "name",
  "kind",
  "percentage",
  "sourceDescription",
  "sourceUri",
  "owner",
  "rightsStatus",
  "licenseReference",
  "consentReference",
  "contentFingerprint",
  "generatedModel",
  "namedArtistReference",
] as const satisfies readonly (keyof TimelineSoundIngredient)[];

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

function changedFields<T extends object>(
  before: T,
  after: T,
  fields: readonly (keyof T)[],
): string[] {
  return fields
    .filter((field) => stable(before[field]) !== stable(after[field]))
    .map(String);
}

function totalPercentage(recipe: TimelineSoundRecipe): number {
  return (
    Math.round(
      recipe.ingredients.reduce(
        (total, ingredient) => total + ingredient.percentage,
        0,
      ) * 100,
    ) / 100
  );
}

export class TimelineSoundRecipeVersionEngine {
  private readonly versions = new Map<TimelineId, TimelineSoundRecipeVersion>();
  private readonly recipeVersions = new Map<TimelineId, TimelineId[]>();
  private sequence = 0;

  constructor(private readonly now: () => Date = () => new Date()) {}

  createVersion(input: {
    recipe: TimelineSoundRecipe;
    label: string;
    description?: string;
    tags?: string[];
    createdBy: TimelineUserId;
  }): TimelineSoundRecipeVersionResult {
    const issues: TimelineSoundRecipeVersionIssue[] = [];
    if (
      !input.recipe.validation?.accepted ||
      !["validated", "active"].includes(input.recipe.state)
    ) {
      issues.push({
        code: "recipe-not-validated",
        message:
          "Only an accepted, validated sound recipe can become a version.",
      });
    }
    if (!input.label.trim()) {
      issues.push({
        code: "version-label-required",
        message: "A sound recipe version requires a label.",
      });
    }
    const history = this.recipeVersions.get(input.recipe.id) ?? [];
    const parentVersionId = history.at(-1) ?? null;
    const parent = parentVersionId ? this.versions.get(parentVersionId) : null;
    const recipeChecksum = checksum(input.recipe);
    if (parent?.checksum === recipeChecksum) {
      issues.push({
        code: "version-unchanged",
        message: "The recipe has not changed since its latest version.",
      });
    }
    if (issues.length > 0) {
      return { accepted: false, version: null, issues };
    }

    const versionNumber = history.length + 1;
    const version: TimelineSoundRecipeVersion = {
      id: `timeline-sound-recipe-version-${++this.sequence}`,
      recipeId: input.recipe.id,
      projectId: input.recipe.projectId,
      parentVersionId,
      versionNumber,
      label: input.label.trim(),
      description: input.description?.trim() ?? "",
      tags: Array.from(
        new Set((input.tags ?? []).map((tag) => tag.trim()).filter(Boolean)),
      ).sort(),
      recipe: clone(input.recipe),
      checksum: recipeChecksum,
      createdAt: this.now().toISOString(),
      createdBy: input.createdBy,
    };
    this.versions.set(version.id, clone(version));
    this.recipeVersions.set(input.recipe.id, [...history, version.id]);
    return { accepted: true, version: clone(version), issues: [] };
  }

  getVersion(versionId: TimelineId): TimelineSoundRecipeVersion | null {
    const version = this.versions.get(versionId);
    return version ? clone(version) : null;
  }

  listVersions(recipeId?: TimelineId): TimelineSoundRecipeVersion[] {
    if (recipeId) {
      return (this.recipeVersions.get(recipeId) ?? [])
        .map((id) => this.versions.get(id))
        .filter((version): version is TimelineSoundRecipeVersion =>
          Boolean(version),
        )
        .map(clone);
    }
    return Array.from(this.versions.values())
      .sort(
        (first, second) =>
          first.createdAt.localeCompare(second.createdAt) ||
          first.id.localeCompare(second.id),
      )
      .map(clone);
  }

  restore(versionId: TimelineId): TimelineSoundRecipeVersionResult {
    const version = this.versions.get(versionId);
    if (!version) {
      return {
        accepted: false,
        version: null,
        issues: [
          {
            code: "version-not-found",
            message: `Sound recipe version ${versionId} was not found.`,
          },
        ],
      };
    }
    if (checksum(version.recipe) !== version.checksum) {
      return {
        accepted: false,
        version: null,
        issues: [
          {
            code: "version-corrupt",
            message: `Sound recipe version ${versionId} failed checksum verification.`,
          },
        ],
      };
    }
    return { accepted: true, version: clone(version), issues: [] };
  }

  compare(
    fromVersionId: TimelineId,
    toVersionId: TimelineId,
  ): TimelineSoundRecipeVersionComparison {
    const from = this.requireVersion(fromVersionId);
    const to = this.requireVersion(toVersionId);
    const changes: TimelineSoundRecipeVersionChange[] = [];
    const recipeFieldsChanged = changedFields(
      from.recipe,
      to.recipe,
      RECIPE_COMPARISON_FIELDS,
    );
    if (recipeFieldsChanged.length > 0) {
      changes.push({
        kind: "recipe-changed",
        fields: recipeFieldsChanged,
        before: clone(from.recipe),
        after: clone(to.recipe),
      });
    }

    const beforeIngredients = new Map(
      from.recipe.ingredients.map((ingredient) => [ingredient.id, ingredient]),
    );
    const afterIngredients = new Map(
      to.recipe.ingredients.map((ingredient) => [ingredient.id, ingredient]),
    );
    const ingredientIds = new Set([
      ...beforeIngredients.keys(),
      ...afterIngredients.keys(),
    ]);
    let ingredientsUnchanged = 0;
    ingredientIds.forEach((ingredientId) => {
      const before = beforeIngredients.get(ingredientId) ?? null;
      const after = afterIngredients.get(ingredientId) ?? null;
      if (!before && after) {
        changes.push({
          kind: "ingredient-added",
          ingredientId,
          fields: [...INGREDIENT_COMPARISON_FIELDS],
          before: null,
          after: clone(after),
        });
        return;
      }
      if (before && !after) {
        changes.push({
          kind: "ingredient-removed",
          ingredientId,
          fields: [...INGREDIENT_COMPARISON_FIELDS],
          before: clone(before),
          after: null,
        });
        return;
      }
      if (before && after) {
        const fields = changedFields(
          before,
          after,
          INGREDIENT_COMPARISON_FIELDS,
        );
        if (fields.length > 0) {
          changes.push({
            kind: "ingredient-changed",
            ingredientId,
            fields,
            before: clone(before),
            after: clone(after),
          });
        } else {
          ingredientsUnchanged += 1;
        }
      }
    });

    return {
      fromVersionId,
      toVersionId,
      changes,
      recipeFieldsChanged,
      ingredientsAdded: changes.filter(
        (change) => change.kind === "ingredient-added",
      ).length,
      ingredientsRemoved: changes.filter(
        (change) => change.kind === "ingredient-removed",
      ).length,
      ingredientsChanged: changes.filter(
        (change) => change.kind === "ingredient-changed",
      ).length,
      ingredientsUnchanged,
      percentageDelta:
        Math.round(
          (totalPercentage(to.recipe) - totalPercentage(from.recipe)) * 100,
        ) / 100,
    };
  }

  getAncestry(versionId: TimelineId): TimelineSoundRecipeVersion[] {
    const ancestry: TimelineSoundRecipeVersion[] = [];
    const visited = new Set<TimelineId>();
    let current: TimelineSoundRecipeVersion | undefined =
      this.versions.get(versionId);
    while (current && !visited.has(current.id)) {
      visited.add(current.id);
      ancestry.push(clone(current));
      current = current.parentVersionId
        ? this.versions.get(current.parentVersionId)
        : undefined;
    }
    return ancestry;
  }

  exportArchive(): TimelineSoundRecipeVersionArchive {
    return { versions: this.listVersions() };
  }

  restoreArchive(archive: TimelineSoundRecipeVersionArchive): void {
    this.versions.clear();
    this.recipeVersions.clear();
    this.sequence = 0;
    archive.versions
      .slice()
      .sort(
        (first, second) =>
          first.versionNumber - second.versionNumber ||
          first.createdAt.localeCompare(second.createdAt),
      )
      .forEach((version) => {
        if (checksum(version.recipe) !== version.checksum) {
          throw new Error(
            `Sound recipe version ${version.id} failed checksum verification.`,
          );
        }
        this.versions.set(version.id, clone(version));
        const history = this.recipeVersions.get(version.recipeId) ?? [];
        this.recipeVersions.set(version.recipeId, [...history, version.id]);
        this.sequence = Math.max(
          this.sequence,
          Number(version.id.match(/(\d+)$/)?.[1] ?? 0),
        );
      });
  }

  private requireVersion(versionId: TimelineId): TimelineSoundRecipeVersion {
    const restored = this.restore(versionId);
    if (!restored.accepted || !restored.version) {
      throw new Error(restored.issues[0]?.message ?? "Version is unavailable.");
    }
    return restored.version;
  }
}

export const timelineSoundRecipeVersionEngine =
  new TimelineSoundRecipeVersionEngine();
