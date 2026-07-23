import type { TimelineAIProposal } from "./TimelineAIEngine";
import {
  TimelineEventLifecycleEngine,
  type TimelineEventDraft,
  type TimelineEventDraftPatch,
} from "./TimelineEventLifecycleEngine";
import type {
  TimelineId,
  TimelineUserId,
  TimelineWorkspace,
} from "./TimelineTypes";

export type TimelineAIEventIntakeIssue = {
  code:
    | "unsupported-proposal"
    | "wrong-project"
    | "target-not-allowed"
    | "invalid-payload-field";
  message: string;
  field?: string;
};

export type TimelineAIEventIntakeResult = {
  handled: boolean;
  acceptedForReview: boolean;
  proposalId: TimelineId;
  draft: TimelineEventDraft | null;
  issues: TimelineAIEventIntakeIssue[];
};

const ALLOWED_PAYLOAD_FIELDS = new Set([
  "type",
  "trackId",
  "title",
  "content",
  "summary",
  "notes",
  "seconds",
  "visibility",
  "priority",
  "tags",
  "description",
  "color",
]);

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export class TimelineAIEventIntakeEngine {
  constructor(
    private readonly lifecycle = new TimelineEventLifecycleEngine(),
  ) {}

  intake(input: {
    proposal: TimelineAIProposal;
    workspace: TimelineWorkspace;
    reviewedBy: TimelineUserId;
    model?: string;
    provider?: string;
  }): TimelineAIEventIntakeResult {
    const { proposal, workspace } = input;
    if (proposal.kind !== "create-event") {
      return {
        handled: false,
        acceptedForReview: false,
        proposalId: proposal.id,
        draft: null,
        issues: [
          {
            code: "unsupported-proposal",
            message: `Proposal kind ${proposal.kind} is not an AI event creation request.`,
          },
        ],
      };
    }

    const issues: TimelineAIEventIntakeIssue[] = [];
    if (proposal.projectId !== workspace.projectId) {
      issues.push({
        code: "wrong-project",
        message: "AI proposal belongs to another Timeline project.",
      });
    }
    if (proposal.targetId) {
      issues.push({
        code: "target-not-allowed",
        message:
          "New event proposals cannot target an existing event. Use a safe edit proposal instead.",
      });
    }
    for (const field of Object.keys(proposal.payload)) {
      if (!ALLOWED_PAYLOAD_FIELDS.has(field)) {
        issues.push({
          code: "invalid-payload-field",
          field,
          message: `AI event field ${field} is not accepted by the event intake contract.`,
        });
      }
    }
    if (issues.length) {
      return {
        handled: true,
        acceptedForReview: false,
        proposalId: proposal.id,
        draft: null,
        issues,
      };
    }

    const payload = proposal.payload;
    const seconds =
      typeof payload.seconds === "number" && Number.isFinite(payload.seconds)
        ? payload.seconds
        : 0;
    const patch: TimelineEventDraftPatch = {
      type: (text(payload.type) ||
        "__missing_ai_event_type__") as TimelineEventDraftPatch["type"],
      trackId: text(payload.trackId),
      title: text(payload.title),
      content: text(payload.content),
      summary: text(payload.summary) || undefined,
      notes: text(payload.notes) || undefined,
      seconds,
      visibility: (text(payload.visibility) ||
        "project") as TimelineEventDraftPatch["visibility"],
      priority: (text(payload.priority) ||
        "normal") as TimelineEventDraftPatch["priority"],
      tags: stringArray(payload.tags),
      description: text(payload.description),
      color: text(payload.color) || "#a78bfa",
    };
    const draft = this.lifecycle.createDraft({
      workspace,
      createdBy: input.reviewedBy,
      patch,
      source: "ai",
      aiModel: input.model,
      aiProvider: input.provider,
    });
    const validation = this.lifecycle.validateDraft({
      draftId: draft.id,
      workspace,
      validatedBy: input.reviewedBy,
    });
    return {
      handled: true,
      acceptedForReview: validation.accepted,
      proposalId: proposal.id,
      draft: validation.draft,
      issues: [],
    };
  }

  getLifecycleEngine(): TimelineEventLifecycleEngine {
    return this.lifecycle;
  }
}
