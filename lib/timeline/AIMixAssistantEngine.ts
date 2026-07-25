import { TimelineEffectRackEngine } from "./TimelineEffectRackEngine";
import { TimelineMixAutomationEngine } from "./TimelineMixAutomationEngine";
import { TimelineMixSessionEngine } from "./TimelineMixSessionEngine";
import type { TimelineId, TimelineUserId } from "./TimelineTypes";

export type AIMixProposalStatus =
  "held" | "accepted" | "rejected" | "stale" | "blocked";

export type AIMixAction =
  | {
      kind: "update-lane";
      laneId: TimelineId;
      patch: {
        gainDb?: number;
        pan?: number;
        muted?: boolean;
        soloed?: boolean;
      };
      reason: string;
    }
  | {
      kind: "update-bus";
      busId: TimelineId;
      patch: { gainDb?: number; muted?: boolean };
      reason: string;
    }
  | {
      kind: "update-effect";
      rackId: TimelineId;
      effectId: TimelineId;
      patch: {
        enabled?: boolean;
        wet?: number;
        parameters?: Record<string, number | boolean | string>;
      };
      reason: string;
    }
  | {
      kind: "add-automation-point";
      automationLaneId: TimelineId;
      timeSeconds: number;
      value: number;
      curve?: "step" | "linear" | "exponential" | "smooth";
      reason: string;
    };

export type AIMixAnalysisEvidence = {
  source: string;
  measuredAt: string;
  metrics: Record<string, number | string | boolean>;
};

export type AIMixProposal = {
  id: TimelineId;
  sessionId: TimelineId;
  summary: string;
  confidence: number;
  status: AIMixProposalStatus;
  actions: AIMixAction[];
  evidence: AIMixAnalysisEvidence[];
  baseMixHead: number;
  baseRackHeads: Record<TimelineId, number>;
  baseAutomationHeads: Record<TimelineId, number>;
  issues: string[];
  createdAt: string;
  createdBy: TimelineUserId;
  reviewedAt?: string;
  reviewedBy?: TimelineUserId;
  reviewReason?: string;
};

export type AIMixApplicationReceipt = {
  id: TimelineId;
  proposalId: TimelineId;
  sessionId: TimelineId;
  outcome: "applied" | "rejected" | "stale" | "blocked";
  appliedActionCount: number;
  beforeMixHead: number;
  afterMixHead: number;
  recordedAt: string;
  recordedBy: TimelineUserId;
  message: string;
};

export type AIMixAssistantArchive = {
  proposals: AIMixProposal[];
  receipts: AIMixApplicationReceipt[];
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

export class AIMixAssistantEngine {
  private readonly proposals = new Map<TimelineId, AIMixProposal>();
  private readonly receipts: AIMixApplicationReceipt[] = [];
  private proposalSequence = 0;
  private receiptSequence = 0;

  constructor(
    readonly mixes = new TimelineMixSessionEngine(),
    readonly effects = new TimelineEffectRackEngine(mixes),
    readonly automation = new TimelineMixAutomationEngine(mixes),
    private readonly now: () => Date = () => new Date(),
  ) {}

  propose(input: {
    sessionId: TimelineId;
    summary: string;
    confidence: number;
    actions: AIMixAction[];
    evidence?: AIMixAnalysisEvidence[];
    createdBy: TimelineUserId;
  }): AIMixProposal {
    const session = this.mixes.getSession(input.sessionId);
    if (!session) throw new Error("Mix session was not found.");
    if (session.status !== "editing") {
      throw new Error("AI can propose changes only for an editing mix.");
    }
    if (
      !Number.isFinite(input.confidence) ||
      input.confidence < 0 ||
      input.confidence > 1
    ) {
      throw new Error("AI mix confidence must be between 0 and 1.");
    }
    if (!input.actions.length)
      throw new Error("AI mix proposal has no actions.");
    const issues = this.validateActions(session.id, input.actions);
    const rackIds = new Set(
      input.actions
        .filter((action) => action.kind === "update-effect")
        .map((action) => action.rackId),
    );
    const automationLaneIds = new Set(
      input.actions
        .filter((action) => action.kind === "add-automation-point")
        .map((action) => action.automationLaneId),
    );
    const now = this.now().toISOString();
    const proposal: AIMixProposal = {
      id: `ai-mix-proposal-${++this.proposalSequence}`,
      sessionId: session.id,
      summary: input.summary.trim() || "AI mix recommendation",
      confidence: input.confidence,
      status: issues.length ? "blocked" : "held",
      actions: clone(input.actions),
      evidence: clone(input.evidence ?? []),
      baseMixHead: session.head,
      baseRackHeads: Object.fromEntries(
        [...rackIds].map((rackId) => [
          rackId,
          this.effects.getRack(rackId)!.head,
        ]),
      ),
      baseAutomationHeads: Object.fromEntries(
        [...automationLaneIds].map((laneId) => [
          laneId,
          this.automation.getLane(laneId)!.head,
        ]),
      ),
      issues,
      createdAt: now,
      createdBy: input.createdBy,
    };
    this.proposals.set(proposal.id, clone(proposal));
    if (proposal.status === "blocked") {
      this.record(
        proposal,
        "blocked",
        0,
        session.head,
        session.head,
        input.createdBy,
        issues.join(" "),
      );
    }
    return clone(proposal);
  }

  review(input: {
    proposalId: TimelineId;
    decision: "accept" | "reject";
    reviewedBy: TimelineUserId;
    reason?: string;
  }): { proposal: AIMixProposal; receipt: AIMixApplicationReceipt } {
    const proposal = this.requiredProposal(input.proposalId);
    if (proposal.status !== "held") {
      throw new Error(`AI mix proposal is already ${proposal.status}.`);
    }
    const session = this.mixes.getSession(proposal.sessionId);
    if (!session) throw new Error("Mix session was not found.");
    if (input.decision === "reject") {
      const rejected = this.updateProposal(proposal, {
        status: "rejected",
        reviewedAt: this.now().toISOString(),
        reviewedBy: input.reviewedBy,
        reviewReason: input.reason?.trim() || "Rejected by reviewer.",
      });
      return {
        proposal: rejected,
        receipt: this.record(
          rejected,
          "rejected",
          0,
          session.head,
          session.head,
          input.reviewedBy,
          rejected.reviewReason!,
        ),
      };
    }
    if (session.status !== "editing" || this.isStale(proposal, session.head)) {
      const stale = this.updateProposal(proposal, {
        status: "stale",
        reviewedAt: this.now().toISOString(),
        reviewedBy: input.reviewedBy,
        reviewReason: "The mix changed after this proposal was created.",
      });
      return {
        proposal: stale,
        receipt: this.record(
          stale,
          "stale",
          0,
          proposal.baseMixHead,
          session.head,
          input.reviewedBy,
          stale.reviewReason!,
        ),
      };
    }
    const beforeHead = session.head;
    const applied = this.applyActions(proposal, input.reviewedBy);
    const afterHead = this.mixes.getSession(proposal.sessionId)!.head;
    const accepted = this.updateProposal(proposal, {
      status: "accepted",
      reviewedAt: this.now().toISOString(),
      reviewedBy: input.reviewedBy,
      reviewReason: input.reason?.trim() || "Approved by reviewer.",
    });
    return {
      proposal: accepted,
      receipt: this.record(
        accepted,
        "applied",
        applied,
        beforeHead,
        afterHead,
        input.reviewedBy,
        `Applied ${applied} reviewed AI mix action(s).`,
      ),
    };
  }

  getProposal(proposalId: TimelineId): AIMixProposal | null {
    const proposal = this.proposals.get(proposalId);
    return proposal ? clone(proposal) : null;
  }

  listProposals(sessionId?: TimelineId): AIMixProposal[] {
    return [...this.proposals.values()]
      .filter((proposal) => !sessionId || proposal.sessionId === sessionId)
      .map(clone);
  }

  listReceipts(sessionId?: TimelineId): AIMixApplicationReceipt[] {
    return this.receipts
      .filter((receipt) => !sessionId || receipt.sessionId === sessionId)
      .map(clone);
  }

  exportArchive(): AIMixAssistantArchive {
    return {
      proposals: this.listProposals(),
      receipts: this.listReceipts(),
    };
  }

  restoreArchive(archive: AIMixAssistantArchive): void {
    this.assertUnique(archive.proposals, "AI mix proposal");
    this.assertUnique(archive.receipts, "AI mix receipt");
    archive.proposals.forEach((proposal) => {
      if (!this.mixes.getSession(proposal.sessionId)) {
        throw new Error(`AI mix proposal ${proposal.id} has no session.`);
      }
    });
    this.proposals.clear();
    this.receipts.length = 0;
    archive.proposals.forEach((proposal) =>
      this.proposals.set(proposal.id, clone(proposal)),
    );
    this.receipts.push(...archive.receipts.map(clone));
    const sequence = (id: string) => Number(id.match(/(\d+)$/)?.[1] ?? 0);
    this.proposalSequence = Math.max(
      0,
      ...archive.proposals.map((proposal) => sequence(proposal.id)),
    );
    this.receiptSequence = Math.max(
      0,
      ...archive.receipts.map((receipt) => sequence(receipt.id)),
    );
  }

  private validateActions(
    sessionId: TimelineId,
    actions: AIMixAction[],
  ): string[] {
    const session = this.mixes.getSession(sessionId)!;
    const issues: string[] = [];
    actions.forEach((action, index) => {
      const prefix = `Action ${index + 1}:`;
      if (!action.reason.trim()) issues.push(`${prefix} reason is required.`);
      if (action.kind === "update-lane") {
        if (!session.lanes.some((lane) => lane.id === action.laneId)) {
          issues.push(`${prefix} mix lane was not found.`);
        }
        if (
          action.patch.gainDb !== undefined &&
          (action.patch.gainDb < -120 || action.patch.gainDb > 24)
        ) {
          issues.push(`${prefix} lane gain is outside -120 to +24 dB.`);
        }
        if (
          action.patch.pan !== undefined &&
          (action.patch.pan < -1 || action.patch.pan > 1)
        ) {
          issues.push(`${prefix} lane pan is outside -1 to 1.`);
        }
      }
      if (action.kind === "update-bus") {
        if (!session.buses.some((bus) => bus.id === action.busId)) {
          issues.push(`${prefix} mix bus was not found.`);
        }
        if (
          action.patch.gainDb !== undefined &&
          (action.patch.gainDb < -120 || action.patch.gainDb > 24)
        ) {
          issues.push(`${prefix} bus gain is outside -120 to +24 dB.`);
        }
      }
      if (action.kind === "update-effect") {
        const rack = this.effects.getRack(action.rackId);
        const effect = rack?.effects.find(
          (item) => item.id === action.effectId,
        );
        if (!rack || rack.sessionId !== session.id || !effect) {
          issues.push(`${prefix} effect target was not found.`);
        } else {
          if (
            action.patch.wet !== undefined &&
            (action.patch.wet < 0 || action.patch.wet > 1)
          ) {
            issues.push(`${prefix} effect wet value is outside 0 to 1.`);
          }
          const definition = this.effects
            .listDefinitions()
            .find((item) => item.id === effect.definitionId);
          Object.keys(action.patch.parameters ?? {}).forEach((key) => {
            if (
              !definition?.parameters.some((parameter) => parameter.key === key)
            ) {
              issues.push(`${prefix} unknown effect parameter ${key}.`);
            }
          });
        }
      }
      if (action.kind === "add-automation-point") {
        const lane = this.automation.getLane(action.automationLaneId);
        if (!lane || lane.sessionId !== session.id) {
          issues.push(`${prefix} automation lane was not found.`);
        } else {
          if (!Number.isFinite(action.timeSeconds) || action.timeSeconds < 0) {
            issues.push(`${prefix} automation time is invalid.`);
          }
          if (action.value < lane.minimum || action.value > lane.maximum) {
            issues.push(`${prefix} automation value is outside its bounds.`);
          }
        }
      }
    });
    return issues;
  }

  private isStale(proposal: AIMixProposal, mixHead: number): boolean {
    if (proposal.baseMixHead !== mixHead) return true;
    if (
      Object.entries(proposal.baseRackHeads).some(
        ([id, head]) => this.effects.getRack(id)?.head !== head,
      )
    )
      return true;
    return Object.entries(proposal.baseAutomationHeads).some(
      ([id, head]) => this.automation.getLane(id)?.head !== head,
    );
  }

  private applyActions(
    proposal: AIMixProposal,
    reviewedBy: TimelineUserId,
  ): number {
    let mixHead = proposal.baseMixHead;
    const rackHeads = { ...proposal.baseRackHeads };
    const automationHeads = { ...proposal.baseAutomationHeads };
    proposal.actions.forEach((action) => {
      if (action.kind === "update-lane") {
        this.mixes.updateLane({
          sessionId: proposal.sessionId,
          expectedHead: mixHead++,
          laneId: action.laneId,
          patch: action.patch,
          editedBy: reviewedBy,
        });
      } else if (action.kind === "update-bus") {
        this.mixes.updateBus({
          sessionId: proposal.sessionId,
          expectedHead: mixHead++,
          busId: action.busId,
          patch: action.patch,
          editedBy: reviewedBy,
        });
      } else if (action.kind === "update-effect") {
        this.effects.updateEffect({
          rackId: action.rackId,
          expectedHead: rackHeads[action.rackId]++,
          effectId: action.effectId,
          patch: action.patch,
          editedBy: reviewedBy,
        });
      } else {
        this.automation.addPoint({
          laneId: action.automationLaneId,
          expectedHead: automationHeads[action.automationLaneId]++,
          timeSeconds: action.timeSeconds,
          value: action.value,
          curve: action.curve,
          editedBy: reviewedBy,
        });
      }
    });
    return proposal.actions.length;
  }

  private requiredProposal(proposalId: TimelineId): AIMixProposal {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) throw new Error("AI mix proposal was not found.");
    return clone(proposal);
  }

  private updateProposal(
    proposal: AIMixProposal,
    patch: Partial<AIMixProposal>,
  ): AIMixProposal {
    const next = { ...proposal, ...clone(patch), id: proposal.id };
    this.proposals.set(next.id, clone(next));
    return clone(next);
  }

  private record(
    proposal: AIMixProposal,
    outcome: AIMixApplicationReceipt["outcome"],
    count: number,
    before: number,
    after: number,
    recordedBy: TimelineUserId,
    message: string,
  ): AIMixApplicationReceipt {
    const receipt: AIMixApplicationReceipt = {
      id: `ai-mix-receipt-${++this.receiptSequence}`,
      proposalId: proposal.id,
      sessionId: proposal.sessionId,
      outcome,
      appliedActionCount: count,
      beforeMixHead: before,
      afterMixHead: after,
      recordedAt: this.now().toISOString(),
      recordedBy,
      message,
    };
    this.receipts.push(clone(receipt));
    return clone(receipt);
  }

  private assertUnique<T extends { id: TimelineId }>(
    values: T[],
    label: string,
  ): void {
    if (new Set(values.map((value) => value.id)).size !== values.length) {
      throw new Error(`Archive contains duplicate ${label} IDs.`);
    }
  }
}

export const aiMixAssistantEngine = new AIMixAssistantEngine();
