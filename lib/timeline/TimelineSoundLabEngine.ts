import {
  TimelineRightsProvenanceEngine,
  type TimelineRecipeRightsReport,
  type TimelineRightsArchive,
  type TimelineRightsIssue,
} from "./TimelineRightsProvenanceEngine";
import {
  TimelineSoundRecipeEngine,
  type TimelineSoundIngredient,
  type TimelineSoundRecipe,
  type TimelineSoundRecipeIssue,
} from "./TimelineSoundRecipeEngine";
import {
  TimelineSoundRecipeVersionEngine,
  type TimelineSoundRecipeVersion,
  type TimelineSoundRecipeVersionArchive,
  type TimelineSoundRecipeVersionIssue,
} from "./TimelineSoundRecipeVersionEngine";
import type {
  TimelineId,
  TimelineProjectId,
  TimelineUserId,
} from "./TimelineTypes";

export type TimelineSoundLabState =
  | "draft"
  | "held"
  | "rights-cleared"
  | "validated"
  | "versioned"
  | "active"
  | "archived";

export type TimelineSoundLabEventKind =
  | "session-created"
  | "ingredient-added"
  | "release-requested"
  | "recipe-held"
  | "rights-held"
  | "rights-cleared"
  | "recipe-validated"
  | "version-created"
  | "recipe-activated"
  | "session-archived";

export type TimelineSoundLabEvent = {
  id: TimelineId;
  sessionId: TimelineId;
  kind: TimelineSoundLabEventKind;
  from: TimelineSoundLabState | null;
  to: TimelineSoundLabState;
  message: string;
  at: string;
  by: TimelineUserId;
  recipeId: TimelineId;
  versionId?: TimelineId;
};

export type TimelineSoundLabSession = {
  id: TimelineId;
  projectId: TimelineProjectId;
  recipeId: TimelineId;
  name: string;
  state: TimelineSoundLabState;
  activeVersionId: TimelineId | null;
  releaseCount: number;
  createdAt: string;
  createdBy: TimelineUserId;
  updatedAt: string;
  updatedBy: TimelineUserId;
  events: TimelineSoundLabEvent[];
};

export type TimelineSoundLabIssue = {
  code:
    | "session-not-found"
    | "session-archived"
    | "recipe-not-found"
    | "recipe-held"
    | "rights-held"
    | "version-held"
    | "activation-held";
  message: string;
  recipeIssues?: TimelineSoundRecipeIssue[];
  rightsIssues?: TimelineRightsIssue[];
  versionIssues?: TimelineSoundRecipeVersionIssue[];
};

export type TimelineSoundLabReleaseResult = {
  accepted: boolean;
  session: TimelineSoundLabSession | null;
  recipe: TimelineSoundRecipe | null;
  version: TimelineSoundRecipeVersion | null;
  rightsReport: TimelineRecipeRightsReport | null;
  issues: TimelineSoundLabIssue[];
};

export type TimelineSoundLabIngredientResult = {
  accepted: boolean;
  session: TimelineSoundLabSession | null;
  recipe: TimelineSoundRecipe | null;
  rightsRecordId: TimelineId | null;
  issues: TimelineSoundLabIssue[];
};

export type TimelineSoundLabArchive = {
  sessions: TimelineSoundLabSession[];
  recipes: TimelineSoundRecipe[];
  rights: TimelineRightsArchive;
  versions: TimelineSoundRecipeVersionArchive;
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

export class TimelineSoundLabEngine {
  private readonly sessions = new Map<TimelineId, TimelineSoundLabSession>();
  private sessionSequence = 0;
  private eventSequence = 0;

  constructor(
    readonly recipes = new TimelineSoundRecipeEngine(),
    readonly rights = new TimelineRightsProvenanceEngine(),
    readonly versions = new TimelineSoundRecipeVersionEngine(),
    private readonly now: () => Date = () => new Date(),
  ) {}

  createSession(input: {
    projectId: TimelineProjectId;
    name: string;
    description?: string;
    createdBy: TimelineUserId;
  }): TimelineSoundLabSession {
    const recipe = this.recipes.createRecipe({
      projectId: input.projectId,
      name: input.name,
      description: input.description,
      createdBy: input.createdBy,
    });
    const now = this.now().toISOString();
    const id = `timeline-sound-lab-session-${++this.sessionSequence}`;
    const state: TimelineSoundLabState =
      recipe.state === "draft" ? "draft" : "held";
    const session: TimelineSoundLabSession = {
      id,
      projectId: input.projectId,
      recipeId: recipe.id,
      name: input.name.trim(),
      state,
      activeVersionId: null,
      releaseCount: 0,
      createdAt: now,
      createdBy: input.createdBy,
      updatedAt: now,
      updatedBy: input.createdBy,
      events: [],
    };
    session.events.push(
      this.event(
        session,
        "session-created",
        null,
        state,
        input.createdBy,
        "Sound Lab session and draft recipe created.",
      ),
    );
    this.sessions.set(id, clone(session));
    return clone(session);
  }

  addIngredient(input: {
    sessionId: TimelineId;
    ingredient: Omit<TimelineSoundIngredient, "id" | "createdAt" | "createdBy">;
    addedBy: TimelineUserId;
  }): TimelineSoundLabIngredientResult {
    const session = this.sessions.get(input.sessionId);
    if (!session) return this.ingredientNotFound();
    if (session.state === "archived") return this.ingredientArchived(session);
    const added = this.recipes.addIngredient({
      recipeId: session.recipeId,
      ingredient: input.ingredient,
      addedBy: input.addedBy,
    });
    if (!added.accepted || !added.recipe) {
      return {
        accepted: false,
        session: clone(session),
        recipe: added.recipe,
        rightsRecordId: null,
        issues: [
          {
            code: "recipe-held",
            message: "The ingredient could not be added to the recipe.",
            recipeIssues: added.issues,
          },
        ],
      };
    }
    const ingredient = added.recipe.ingredients.at(-1)!;
    const record = this.rights.registerIngredient({
      projectId: session.projectId,
      ingredient,
      registeredBy: input.addedBy,
    });
    const next = this.transition(
      session,
      "ingredient-added",
      "held",
      input.addedBy,
      `${ingredient.name} was added and placed in rights review.`,
    );
    this.sessions.set(next.id, clone(next));
    return {
      accepted: true,
      session: clone(next),
      recipe: clone(added.recipe),
      rightsRecordId: record.id,
      issues: [],
    };
  }

  prepareRelease(input: {
    sessionId: TimelineId;
    versionLabel: string;
    versionDescription?: string;
    versionTags?: string[];
    requestedBy: TimelineUserId;
  }): TimelineSoundLabReleaseResult {
    const session = this.sessions.get(input.sessionId);
    if (!session) return this.releaseNotFound();
    if (session.state === "archived") return this.releaseArchived(session);
    let current = this.transition(
      session,
      "release-requested",
      session.state,
      input.requestedBy,
      "Sound Lab release validation requested.",
    );
    this.sessions.set(current.id, clone(current));

    const validation = this.recipes.validateRecipe({
      recipeId: session.recipeId,
      validatedBy: input.requestedBy,
    });
    if (!validation.accepted || !validation.recipe) {
      current = this.transition(
        current,
        "recipe-held",
        "held",
        input.requestedBy,
        "Recipe math or ingredient validation failed.",
      );
      this.sessions.set(current.id, clone(current));
      return {
        accepted: false,
        session: clone(current),
        recipe: validation.recipe,
        version: null,
        rightsReport: null,
        issues: [
          {
            code: validation.recipe ? "recipe-held" : "recipe-not-found",
            message: validation.recipe
              ? "The recipe remains held until every recipe issue is corrected."
              : "The Sound Lab recipe was not found.",
            recipeIssues: validation.issues,
          },
        ],
      };
    }
    current = this.transition(
      current,
      "recipe-validated",
      "validated",
      input.requestedBy,
      "Recipe ingredients total exactly 100% and passed validation.",
    );

    const rightsReport = this.rights.verifyRecipe(validation.recipe);
    if (!rightsReport.accepted) {
      current = this.transition(
        current,
        "rights-held",
        "held",
        input.requestedBy,
        "Rights or provenance evidence is incomplete.",
      );
      this.sessions.set(current.id, clone(current));
      return {
        accepted: false,
        session: clone(current),
        recipe: clone(validation.recipe),
        version: null,
        rightsReport: clone(rightsReport),
        issues: [
          {
            code: "rights-held",
            message:
              "The recipe remains held until every ingredient has current, reviewed provenance.",
            rightsIssues: rightsReport.issues,
          },
        ],
      };
    }
    current = this.transition(
      current,
      "rights-cleared",
      "rights-cleared",
      input.requestedBy,
      "Every ingredient passed rights and provenance review.",
    );

    const versioned = this.versions.createVersion({
      recipe: validation.recipe,
      label: input.versionLabel,
      description: input.versionDescription,
      tags: input.versionTags,
      createdBy: input.requestedBy,
    });
    if (!versioned.accepted || !versioned.version) {
      current = this.transition(
        current,
        "recipe-held",
        "held",
        input.requestedBy,
        "A release version could not be created.",
      );
      this.sessions.set(current.id, clone(current));
      return {
        accepted: false,
        session: clone(current),
        recipe: clone(validation.recipe),
        version: null,
        rightsReport: clone(rightsReport),
        issues: [
          {
            code: "version-held",
            message: "The release remains held until versioning succeeds.",
            versionIssues: versioned.issues,
          },
        ],
      };
    }
    current = this.transition(
      current,
      "version-created",
      "versioned",
      input.requestedBy,
      `Release version ${versioned.version.versionNumber} was preserved.`,
      versioned.version.id,
    );

    const activated = this.recipes.activateRecipe({
      recipeId: session.recipeId,
      activatedBy: input.requestedBy,
    });
    if (!activated.accepted || !activated.recipe) {
      current = this.transition(
        current,
        "recipe-held",
        "versioned",
        input.requestedBy,
        "The preserved version could not be activated.",
        versioned.version.id,
      );
      this.sessions.set(current.id, clone(current));
      return {
        accepted: false,
        session: clone(current),
        recipe: activated.recipe,
        version: clone(versioned.version),
        rightsReport: clone(rightsReport),
        issues: [
          {
            code: "activation-held",
            message: "The version is preserved, but activation remains held.",
            recipeIssues: activated.issues,
          },
        ],
      };
    }
    current = {
      ...this.transition(
        current,
        "recipe-activated",
        "active",
        input.requestedBy,
        "Validated, rights-cleared, versioned recipe activated.",
        versioned.version.id,
      ),
      activeVersionId: versioned.version.id,
      releaseCount: current.releaseCount + 1,
    };
    this.sessions.set(current.id, clone(current));
    return {
      accepted: true,
      session: clone(current),
      recipe: clone(activated.recipe),
      version: clone(versioned.version),
      rightsReport: clone(rightsReport),
      issues: [],
    };
  }

  archiveSession(input: {
    sessionId: TimelineId;
    archivedBy: TimelineUserId;
  }): TimelineSoundLabSession | null {
    const session = this.sessions.get(input.sessionId);
    if (!session) return null;
    const next = this.transition(
      session,
      "session-archived",
      "archived",
      input.archivedBy,
      "Sound Lab session archived without deleting its history.",
    );
    this.sessions.set(next.id, clone(next));
    return clone(next);
  }

  getSession(sessionId: TimelineId): TimelineSoundLabSession | null {
    const session = this.sessions.get(sessionId);
    return session ? clone(session) : null;
  }

  listSessions(projectId?: TimelineProjectId): TimelineSoundLabSession[] {
    return Array.from(this.sessions.values())
      .filter((session) => !projectId || session.projectId === projectId)
      .map(clone);
  }

  exportArchive(): TimelineSoundLabArchive {
    return {
      sessions: this.listSessions(),
      recipes: this.recipes.exportRecipes(),
      rights: this.rights.exportArchive(),
      versions: this.versions.exportArchive(),
    };
  }

  restoreArchive(archive: TimelineSoundLabArchive): void {
    this.recipes.restoreRecipes(archive.recipes);
    this.rights.restoreArchive(archive.rights);
    this.versions.restoreArchive(archive.versions);
    this.sessions.clear();
    this.sessionSequence = 0;
    this.eventSequence = 0;
    archive.sessions.forEach((session) => {
      this.sessions.set(session.id, clone(session));
      this.sessionSequence = Math.max(
        this.sessionSequence,
        this.idSequence(session.id),
      );
      session.events.forEach((event) => {
        this.eventSequence = Math.max(
          this.eventSequence,
          this.idSequence(event.id),
        );
      });
    });
  }

  private transition(
    session: TimelineSoundLabSession,
    kind: TimelineSoundLabEventKind,
    to: TimelineSoundLabState,
    by: TimelineUserId,
    message: string,
    versionId?: TimelineId,
  ): TimelineSoundLabSession {
    const now = this.now().toISOString();
    return {
      ...clone(session),
      state: to,
      updatedAt: now,
      updatedBy: by,
      events: [
        ...session.events,
        this.event(session, kind, session.state, to, by, message, versionId),
      ],
    };
  }

  private event(
    session: Pick<TimelineSoundLabSession, "id" | "recipeId">,
    kind: TimelineSoundLabEventKind,
    from: TimelineSoundLabState | null,
    to: TimelineSoundLabState,
    by: TimelineUserId,
    message: string,
    versionId?: TimelineId,
  ): TimelineSoundLabEvent {
    return {
      id: `timeline-sound-lab-event-${++this.eventSequence}`,
      sessionId: session.id,
      kind,
      from,
      to,
      message,
      at: this.now().toISOString(),
      by,
      recipeId: session.recipeId,
      versionId,
    };
  }

  private releaseNotFound(): TimelineSoundLabReleaseResult {
    return {
      accepted: false,
      session: null,
      recipe: null,
      version: null,
      rightsReport: null,
      issues: [
        {
          code: "session-not-found",
          message: "Sound Lab session was not found.",
        },
      ],
    };
  }

  private releaseArchived(
    session: TimelineSoundLabSession,
  ): TimelineSoundLabReleaseResult {
    return {
      accepted: false,
      session: clone(session),
      recipe: this.recipes.getRecipe(session.recipeId),
      version: null,
      rightsReport: null,
      issues: [
        {
          code: "session-archived",
          message: "Archived Sound Lab sessions cannot create releases.",
        },
      ],
    };
  }

  private ingredientNotFound(): TimelineSoundLabIngredientResult {
    return {
      accepted: false,
      session: null,
      recipe: null,
      rightsRecordId: null,
      issues: [
        {
          code: "session-not-found",
          message: "Sound Lab session was not found.",
        },
      ],
    };
  }

  private ingredientArchived(
    session: TimelineSoundLabSession,
  ): TimelineSoundLabIngredientResult {
    return {
      accepted: false,
      session: clone(session),
      recipe: this.recipes.getRecipe(session.recipeId),
      rightsRecordId: null,
      issues: [
        {
          code: "session-archived",
          message: "Archived Sound Lab sessions cannot accept ingredients.",
        },
      ],
    };
  }

  private idSequence(id: TimelineId): number {
    return Number(id.match(/(\d+)$/)?.[1] ?? 0);
  }
}

export const timelineSoundLabEngine = new TimelineSoundLabEngine();
