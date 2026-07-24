import {
  TimelineTrackRevisionEngine,
  type TimelineTrackAIPromptProvenance,
  type TimelineTrackOperationKind,
  type TimelineTrackOperationValue,
  type TimelineTrackRevision,
  type TimelineTrackRevisionArchive,
  type TimelineTrackRevisionIssue,
} from "./TimelineTrackRevisionEngine";
import type {
  TimelineId,
  TimelineTrackId,
  TimelineUserId,
} from "./TimelineTypes";

export type TimelineHybridEditOperation = {
  kind: TimelineTrackOperationKind;
  description: string;
  parameters?: Record<string, TimelineTrackOperationValue>;
  enabled?: boolean;
};

export type TimelineHybridSession = {
  id: TimelineId;
  songId: TimelineId;
  name: string;
  status: "active" | "closed";
  openedAt: string;
  openedBy: TimelineUserId;
  closedAt?: string;
  closedBy?: TimelineUserId;
};

export type TimelineHybridAIProposal = {
  id: TimelineId;
  sessionId: TimelineId;
  trackId: TimelineTrackId;
  baseRevisionId: TimelineId | null;
  label: string;
  description: string;
  outputArtifactUri: string;
  outputFingerprint: string;
  prompt: TimelineTrackAIPromptProvenance;
  operations: TimelineHybridEditOperation[];
  status: "held" | "accepted" | "rejected" | "stale" | "blocked";
  proposedAt: string;
  proposedBy: TimelineUserId;
  reviewedAt?: string;
  reviewedBy?: TimelineUserId;
  resultingRevisionId?: TimelineId;
  issues: TimelineTrackRevisionIssue[];
};

export type TimelineHybridEditReceipt = {
  id: TimelineId;
  sessionId: TimelineId;
  trackId: TimelineTrackId;
  source: "human" | "ai";
  outcome: "activated" | "rejected" | "stale" | "blocked";
  beforeRevisionId: TimelineId | null;
  afterRevisionId: TimelineId | null;
  proposalId?: TimelineId;
  revisionId?: TimelineId;
  issues: TimelineTrackRevisionIssue[];
  recordedAt: string;
  recordedBy: TimelineUserId;
};

export type TimelineHybridEditingArchive = {
  revisions: TimelineTrackRevisionArchive;
  sessions: TimelineHybridSession[];
  proposals: TimelineHybridAIProposal[];
  receipts: TimelineHybridEditReceipt[];
};

type RevisionInput = {
  sessionId: TimelineId;
  trackId: TimelineTrackId;
  expectedActiveRevisionId: TimelineId | null;
  label: string;
  description?: string;
  outputArtifactUri: string;
  outputFingerprint: string;
  operations: TimelineHybridEditOperation[];
  editedBy: TimelineUserId;
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

export class TimelineHybridEditingEngine {
  private readonly sessions = new Map<TimelineId, TimelineHybridSession>();
  private readonly proposals = new Map<TimelineId, TimelineHybridAIProposal>();
  private readonly receipts: TimelineHybridEditReceipt[] = [];
  private sessionSequence = 0;
  private proposalSequence = 0;
  private receiptSequence = 0;

  constructor(
    readonly revisions = new TimelineTrackRevisionEngine(),
    private readonly now: () => Date = () => new Date(),
  ) {}

  openSession(input: {
    songId: TimelineId;
    name: string;
    openedBy: TimelineUserId;
  }): TimelineHybridSession {
    if (!input.songId.trim()) throw new Error("Song ID is required.");
    const session: TimelineHybridSession = {
      id: `timeline-hybrid-session-${++this.sessionSequence}`,
      songId: input.songId,
      name: input.name.trim() || "Hybrid editing session",
      status: "active",
      openedAt: this.now().toISOString(),
      openedBy: input.openedBy,
    };
    this.sessions.set(session.id, clone(session));
    return clone(session);
  }

  closeSession(input: {
    sessionId: TimelineId;
    closedBy: TimelineUserId;
  }): TimelineHybridSession {
    const session = this.requiredSession(input.sessionId);
    if (session.status === "closed") return session;
    const closed: TimelineHybridSession = {
      ...session,
      status: "closed",
      closedAt: this.now().toISOString(),
      closedBy: input.closedBy,
    };
    this.sessions.set(closed.id, clone(closed));
    return clone(closed);
  }

  applyHumanEdit(input: RevisionInput): TimelineHybridEditReceipt {
    this.requireActiveSession(input.sessionId);
    const before = this.activeRevisionId(input.trackId);
    if (before !== input.expectedActiveRevisionId) {
      return this.recordReceipt({
        sessionId: input.sessionId,
        trackId: input.trackId,
        source: "human",
        outcome: "stale",
        beforeRevisionId: before,
        afterRevisionId: before,
        issues: [],
        recordedBy: input.editedBy,
      });
    }
    const result = this.buildRevision({
      ...input,
      source: "manual-edit",
    });
    return this.recordReceipt({
      sessionId: input.sessionId,
      trackId: input.trackId,
      source: "human",
      outcome: result.revision ? "activated" : "blocked",
      beforeRevisionId: before,
      afterRevisionId: result.revision?.id ?? before,
      revisionId: result.revision?.id,
      issues: result.issues,
      recordedBy: input.editedBy,
    });
  }

  proposeAIEdit(input: {
    sessionId: TimelineId;
    trackId: TimelineTrackId;
    label: string;
    description?: string;
    outputArtifactUri: string;
    outputFingerprint: string;
    prompt: TimelineTrackAIPromptProvenance;
    operations: TimelineHybridEditOperation[];
    proposedBy: TimelineUserId;
  }): TimelineHybridAIProposal {
    this.requireActiveSession(input.sessionId);
    if (!this.revisions.tracks.getTrack(input.trackId)) {
      throw new Error(`Track ${input.trackId} was not found.`);
    }
    const proposal: TimelineHybridAIProposal = {
      id: `timeline-hybrid-proposal-${++this.proposalSequence}`,
      sessionId: input.sessionId,
      trackId: input.trackId,
      baseRevisionId: this.activeRevisionId(input.trackId),
      label: input.label.trim(),
      description: input.description?.trim() ?? "",
      outputArtifactUri: input.outputArtifactUri.trim(),
      outputFingerprint: input.outputFingerprint.trim(),
      prompt: clone(input.prompt),
      operations: clone(input.operations),
      status: "held",
      proposedAt: this.now().toISOString(),
      proposedBy: input.proposedBy,
      issues: [],
    };
    this.proposals.set(proposal.id, clone(proposal));
    return clone(proposal);
  }

  reviewAIEdit(input: {
    proposalId: TimelineId;
    decision: "accept" | "reject";
    reviewedBy: TimelineUserId;
  }): TimelineHybridEditReceipt {
    const proposal = this.requiredProposal(input.proposalId);
    this.requireActiveSession(proposal.sessionId);
    if (proposal.status !== "held") {
      throw new Error(
        `AI proposal ${proposal.id} is already ${proposal.status}.`,
      );
    }
    const active = this.activeRevisionId(proposal.trackId);
    if (input.decision === "reject") {
      this.updateProposal(proposal, {
        status: "rejected",
        reviewedAt: this.now().toISOString(),
        reviewedBy: input.reviewedBy,
      });
      return this.recordReceipt({
        sessionId: proposal.sessionId,
        trackId: proposal.trackId,
        source: "ai",
        outcome: "rejected",
        beforeRevisionId: active,
        afterRevisionId: active,
        proposalId: proposal.id,
        issues: [],
        recordedBy: input.reviewedBy,
      });
    }
    if (active !== proposal.baseRevisionId) {
      this.updateProposal(proposal, {
        status: "stale",
        reviewedAt: this.now().toISOString(),
        reviewedBy: input.reviewedBy,
      });
      return this.recordReceipt({
        sessionId: proposal.sessionId,
        trackId: proposal.trackId,
        source: "ai",
        outcome: "stale",
        beforeRevisionId: active,
        afterRevisionId: active,
        proposalId: proposal.id,
        issues: [],
        recordedBy: input.reviewedBy,
      });
    }
    const result = this.buildRevision({
      sessionId: proposal.sessionId,
      trackId: proposal.trackId,
      expectedActiveRevisionId: proposal.baseRevisionId,
      label: proposal.label,
      description: proposal.description,
      outputArtifactUri: proposal.outputArtifactUri,
      outputFingerprint: proposal.outputFingerprint,
      operations: proposal.operations,
      editedBy: input.reviewedBy,
      source: "ai-generation",
      prompt: proposal.prompt,
    });
    this.updateProposal(proposal, {
      status: result.revision ? "accepted" : "blocked",
      reviewedAt: this.now().toISOString(),
      reviewedBy: input.reviewedBy,
      resultingRevisionId: result.revision?.id,
      issues: result.issues,
    });
    return this.recordReceipt({
      sessionId: proposal.sessionId,
      trackId: proposal.trackId,
      source: "ai",
      outcome: result.revision ? "activated" : "blocked",
      beforeRevisionId: active,
      afterRevisionId: result.revision?.id ?? active,
      proposalId: proposal.id,
      revisionId: result.revision?.id,
      issues: result.issues,
      recordedBy: input.reviewedBy,
    });
  }

  getSession(sessionId: TimelineId): TimelineHybridSession | null {
    const session = this.sessions.get(sessionId);
    return session ? clone(session) : null;
  }

  listSessions(songId?: TimelineId): TimelineHybridSession[] {
    return Array.from(this.sessions.values())
      .filter((session) => !songId || session.songId === songId)
      .map(clone);
  }

  getProposal(proposalId: TimelineId): TimelineHybridAIProposal | null {
    const proposal = this.proposals.get(proposalId);
    return proposal ? clone(proposal) : null;
  }

  listProposals(sessionId?: TimelineId): TimelineHybridAIProposal[] {
    return Array.from(this.proposals.values())
      .filter((proposal) => !sessionId || proposal.sessionId === sessionId)
      .map(clone);
  }

  receiptHistory(sessionId?: TimelineId): TimelineHybridEditReceipt[] {
    return this.receipts
      .filter((receipt) => !sessionId || receipt.sessionId === sessionId)
      .map(clone);
  }

  exportArchive(): TimelineHybridEditingArchive {
    return {
      revisions: this.revisions.exportArchive(),
      sessions: this.listSessions(),
      proposals: this.listProposals(),
      receipts: this.receiptHistory(),
    };
  }

  restoreArchive(archive: TimelineHybridEditingArchive): void {
    const sessionIds = new Set<TimelineId>();
    const proposalIds = new Set<TimelineId>();
    const receiptIds = new Set<TimelineId>();
    archive.sessions.forEach((session) => {
      if (sessionIds.has(session.id))
        throw new Error(`Duplicate hybrid session ID ${session.id}.`);
      sessionIds.add(session.id);
    });
    archive.proposals.forEach((proposal) => {
      if (proposalIds.has(proposal.id))
        throw new Error(`Duplicate hybrid proposal ID ${proposal.id}.`);
      if (!sessionIds.has(proposal.sessionId)) {
        throw new Error(`Hybrid proposal ${proposal.id} has no session.`);
      }
      proposalIds.add(proposal.id);
    });
    archive.receipts.forEach((receipt) => {
      if (receiptIds.has(receipt.id))
        throw new Error(`Duplicate hybrid receipt ID ${receipt.id}.`);
      if (!sessionIds.has(receipt.sessionId)) {
        throw new Error(`Hybrid receipt ${receipt.id} has no session.`);
      }
      receiptIds.add(receipt.id);
    });
    this.revisions.restoreArchive(archive.revisions);
    this.sessions.clear();
    this.proposals.clear();
    this.receipts.splice(0);
    archive.sessions.forEach((session) =>
      this.sessions.set(session.id, clone(session)),
    );
    archive.proposals.forEach((proposal) =>
      this.proposals.set(proposal.id, clone(proposal)),
    );
    this.receipts.push(...archive.receipts.map(clone));
    this.sessionSequence = this.maxSequence(sessionIds);
    this.proposalSequence = this.maxSequence(proposalIds);
    this.receiptSequence = this.maxSequence(receiptIds);
  }

  private buildRevision(
    input: RevisionInput & {
      source: "manual-edit" | "ai-generation";
      prompt?: TimelineTrackAIPromptProvenance;
    },
  ): {
    revision: TimelineTrackRevision | null;
    issues: TimelineTrackRevisionIssue[];
  } {
    const draftResult = this.revisions.createDraft({
      trackId: input.trackId,
      parentRevisionId: input.expectedActiveRevisionId ?? undefined,
      branchName: input.source === "ai-generation" ? "ai-review" : "main",
      label: input.label,
      description: input.description,
      source: input.source,
      outputArtifactUri: input.outputArtifactUri,
      outputFingerprint: input.outputFingerprint,
      aiPrompt: input.prompt,
      createdBy: input.editedBy,
    });
    if (!draftResult.revision) {
      return { revision: null, issues: draftResult.issues };
    }
    for (const operation of input.operations) {
      const operationResult = this.revisions.addOperation({
        revisionId: draftResult.revision.id,
        kind: operation.kind,
        description: operation.description,
        parameters: operation.parameters,
        enabled: operation.enabled,
        createdBy: input.editedBy,
      });
      if (!operationResult.accepted) {
        return { revision: null, issues: operationResult.issues };
      }
    }
    const validation = this.revisions.validate({
      revisionId: draftResult.revision.id,
      validatedBy: input.editedBy,
    });
    if (!validation.accepted || !validation.revision) {
      return { revision: null, issues: validation.issues };
    }
    const activation = this.revisions.activate({
      revisionId: validation.revision.id,
      activatedBy: input.editedBy,
    });
    return {
      revision: activation.accepted ? activation.revision : null,
      issues: activation.issues,
    };
  }

  private activeRevisionId(trackId: TimelineTrackId): TimelineId | null {
    return this.revisions.getActiveRevision(trackId)?.id ?? null;
  }

  private requiredSession(sessionId: TimelineId): TimelineHybridSession {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Hybrid session ${sessionId} was not found.`);
    return clone(session);
  }

  private requireActiveSession(sessionId: TimelineId): TimelineHybridSession {
    const session = this.requiredSession(sessionId);
    if (session.status !== "active") {
      throw new Error(`Hybrid session ${sessionId} is closed.`);
    }
    return session;
  }

  private requiredProposal(proposalId: TimelineId): TimelineHybridAIProposal {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) throw new Error(`AI proposal ${proposalId} was not found.`);
    return clone(proposal);
  }

  private updateProposal(
    proposal: TimelineHybridAIProposal,
    patch: Partial<TimelineHybridAIProposal>,
  ): void {
    this.proposals.set(proposal.id, clone({ ...proposal, ...patch }));
  }

  private recordReceipt(
    input: Omit<TimelineHybridEditReceipt, "id" | "recordedAt">,
  ): TimelineHybridEditReceipt {
    const receipt: TimelineHybridEditReceipt = {
      ...clone(input),
      id: `timeline-hybrid-receipt-${++this.receiptSequence}`,
      recordedAt: this.now().toISOString(),
    };
    this.receipts.push(clone(receipt));
    return clone(receipt);
  }

  private maxSequence(ids: Set<TimelineId>): number {
    return Math.max(
      0,
      ...Array.from(ids).map((id) => Number(id.match(/(\d+)$/)?.[1] ?? 0)),
    );
  }
}

export const timelineHybridEditingEngine = new TimelineHybridEditingEngine();
