import type { TimelineId, TimelineUserId } from "./TimelineTypes";

export type TimelineCollaborationProposalStatus =
  | "draft"
  | "in-review"
  | "changes-requested"
  | "approved"
  | "rejected"
  | "withdrawn"
  | "applied";

export type TimelineCollaborationReviewDecision =
  | "approved"
  | "changes-requested"
  | "rejected";

export type TimelineCollaborationReviewer = {
  userId: TimelineUserId;
  name: string;
  required: boolean;
};

export type TimelineCollaborationRevision = {
  id: TimelineId;
  proposalId: TimelineId;
  revision: number;
  summary: string;
  artifactIds: TimelineId[];
  fingerprint: string;
  createdAt: string;
  createdBy: TimelineUserId;
};

export type TimelineCollaborationDecision = {
  id: TimelineId;
  proposalId: TimelineId;
  revision: number;
  reviewerId: TimelineUserId;
  decision: TimelineCollaborationReviewDecision;
  note: string;
  decidedAt: string;
};

export type TimelineCollaborationComment = {
  id: TimelineId;
  proposalId: TimelineId;
  revision: number;
  authorId: TimelineUserId;
  body: string;
  parentCommentId: TimelineId | null;
  resolvedAt?: string;
  resolvedBy?: TimelineUserId;
  createdAt: string;
};

export type TimelineCollaborationProposal = {
  id: TimelineId;
  workspaceId: TimelineId;
  title: string;
  authorId: TimelineUserId;
  reviewers: TimelineCollaborationReviewer[];
  status: TimelineCollaborationProposalStatus;
  currentRevision: number;
  revisionIds: TimelineId[];
  decisionIds: TimelineId[];
  commentIds: TimelineId[];
  createdAt: string;
  submittedAt?: string;
  approvedAt?: string;
  appliedAt?: string;
  appliedBy?: TimelineUserId;
  withdrawnAt?: string;
  withdrawnBy?: TimelineUserId;
};

export type TimelineCollaborationReceipt = {
  id: TimelineId;
  proposalId: TimelineId;
  action:
    | "proposal-created"
    | "revision-added"
    | "review-submitted"
    | "decision-recorded"
    | "comment-added"
    | "comment-resolved"
    | "proposal-applied"
    | "proposal-withdrawn";
  message: string;
  recordedAt: string;
  recordedBy: TimelineUserId;
};

export type TimelineCollaborationApprovalArchive = {
  proposals: TimelineCollaborationProposal[];
  revisions: TimelineCollaborationRevision[];
  decisions: TimelineCollaborationDecision[];
  comments: TimelineCollaborationComment[];
  receipts: TimelineCollaborationReceipt[];
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

function requiredText(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`${label} is required.`);
  }
  return normalized;
}

function uniqueIds(ids: TimelineId[]): TimelineId[] {
  return [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
}

export class TimelineCollaborationApprovalEngine {
  private readonly proposals = new Map<
    TimelineId,
    TimelineCollaborationProposal
  >();
  private readonly revisions = new Map<
    TimelineId,
    TimelineCollaborationRevision
  >();
  private readonly decisions = new Map<
    TimelineId,
    TimelineCollaborationDecision
  >();
  private readonly comments = new Map<
    TimelineId,
    TimelineCollaborationComment
  >();
  private readonly receipts: TimelineCollaborationReceipt[] = [];
  private proposalSequence = 0;
  private revisionSequence = 0;
  private decisionSequence = 0;
  private commentSequence = 0;
  private receiptSequence = 0;

  constructor(private readonly now: () => Date = () => new Date()) {}

  createProposal(input: {
    workspaceId: TimelineId;
    title: string;
    summary: string;
    artifactIds: TimelineId[];
    fingerprint: string;
    authorId: TimelineUserId;
    reviewers: TimelineCollaborationReviewer[];
  }): TimelineCollaborationProposal {
    const authorId = requiredText(input.authorId, "Proposal author");
    const reviewerIds = new Set<TimelineUserId>();
    const reviewers = input.reviewers.map((reviewer) => {
      const userId = requiredText(reviewer.userId, "Reviewer ID");
      if (userId === authorId) {
        throw new Error("Proposal authors cannot approve their own work.");
      }
      if (reviewerIds.has(userId)) {
        throw new Error("Each proposal reviewer must be unique.");
      }
      reviewerIds.add(userId);
      return {
        userId,
        name: requiredText(reviewer.name, "Reviewer name"),
        required: reviewer.required,
      };
    });
    if (!reviewers.some((reviewer) => reviewer.required)) {
      throw new Error("A proposal requires at least one required reviewer.");
    }

    const proposalId = `timeline-collaboration-proposal-${++this.proposalSequence}`;
    const revision = this.makeRevision({
      proposalId,
      revision: 1,
      summary: input.summary,
      artifactIds: input.artifactIds,
      fingerprint: input.fingerprint,
      createdBy: authorId,
    });
    const proposal: TimelineCollaborationProposal = {
      id: proposalId,
      workspaceId: requiredText(input.workspaceId, "Workspace ID"),
      title: requiredText(input.title, "Proposal title"),
      authorId,
      reviewers,
      status: "draft",
      currentRevision: 1,
      revisionIds: [revision.id],
      decisionIds: [],
      commentIds: [],
      createdAt: this.now().toISOString(),
    };
    this.proposals.set(proposal.id, clone(proposal));
    this.record(
      proposal.id,
      "proposal-created",
      "Collaboration proposal created as a draft.",
      authorId,
    );
    return clone(proposal);
  }

  addRevision(input: {
    proposalId: TimelineId;
    summary: string;
    artifactIds: TimelineId[];
    fingerprint: string;
    createdBy: TimelineUserId;
  }): TimelineCollaborationProposal {
    const proposal = this.requiredProposal(input.proposalId);
    if (
      proposal.status === "applied" ||
      proposal.status === "withdrawn" ||
      proposal.status === "rejected"
    ) {
      throw new Error("This proposal no longer accepts revisions.");
    }
    if (input.createdBy !== proposal.authorId) {
      throw new Error("Only the proposal author can add a revision.");
    }
    const revision = this.makeRevision({
      proposalId: proposal.id,
      revision: proposal.currentRevision + 1,
      summary: input.summary,
      artifactIds: input.artifactIds,
      fingerprint: input.fingerprint,
      createdBy: input.createdBy,
    });
    const updated = this.saveProposal({
      ...proposal,
      status: "draft",
      currentRevision: revision.revision,
      revisionIds: [...proposal.revisionIds, revision.id],
      submittedAt: undefined,
      approvedAt: undefined,
    });
    this.record(
      proposal.id,
      "revision-added",
      `Revision ${revision.revision} added; earlier approvals no longer apply.`,
      input.createdBy,
    );
    return updated;
  }

  submitForReview(input: {
    proposalId: TimelineId;
    submittedBy: TimelineUserId;
  }): TimelineCollaborationProposal {
    const proposal = this.requiredProposal(input.proposalId);
    if (proposal.authorId !== input.submittedBy) {
      throw new Error("Only the proposal author can submit it for review.");
    }
    if (proposal.status !== "draft" && proposal.status !== "changes-requested") {
      throw new Error("Only draft or revised proposals can enter review.");
    }
    const updated = this.saveProposal({
      ...proposal,
      status: "in-review",
      submittedAt: this.now().toISOString(),
      approvedAt: undefined,
    });
    this.record(
      proposal.id,
      "review-submitted",
      `Revision ${proposal.currentRevision} submitted for human review.`,
      input.submittedBy,
    );
    return updated;
  }

  decide(input: {
    proposalId: TimelineId;
    reviewerId: TimelineUserId;
    decision: TimelineCollaborationReviewDecision;
    note: string;
  }): TimelineCollaborationProposal {
    const proposal = this.requiredProposal(input.proposalId);
    if (proposal.status !== "in-review") {
      throw new Error("Decisions require a proposal currently in review.");
    }
    const reviewer = proposal.reviewers.find(
      (candidate) => candidate.userId === input.reviewerId,
    );
    if (!reviewer) {
      throw new Error("Only an assigned reviewer can record a decision.");
    }
    const note = input.note.trim();
    if (input.decision !== "approved" && !note) {
      throw new Error("Changes requested or rejection requires an explanation.");
    }
    if (
      this.currentDecisions(proposal).some(
        (decision) => decision.reviewerId === input.reviewerId,
      )
    ) {
      throw new Error("This reviewer already decided the current revision.");
    }

    const decision: TimelineCollaborationDecision = {
      id: `timeline-collaboration-decision-${++this.decisionSequence}`,
      proposalId: proposal.id,
      revision: proposal.currentRevision,
      reviewerId: input.reviewerId,
      decision: input.decision,
      note,
      decidedAt: this.now().toISOString(),
    };
    this.decisions.set(decision.id, clone(decision));

    let status: TimelineCollaborationProposalStatus = proposal.status;
    let approvedAt = proposal.approvedAt;
    if (input.decision === "rejected") {
      status = "rejected";
    } else if (input.decision === "changes-requested") {
      status = "changes-requested";
    } else {
      const decisions = [...this.currentDecisions(proposal), decision];
      const allRequiredApproved = proposal.reviewers
        .filter((candidate) => candidate.required)
        .every((candidate) =>
          decisions.some(
            (current) =>
              current.reviewerId === candidate.userId &&
              current.decision === "approved",
          ),
        );
      if (allRequiredApproved) {
        status = "approved";
        approvedAt = this.now().toISOString();
      }
    }

    const updated = this.saveProposal({
      ...proposal,
      status,
      approvedAt,
      decisionIds: [...proposal.decisionIds, decision.id],
    });
    this.record(
      proposal.id,
      "decision-recorded",
      `${reviewer.name} recorded ${input.decision} for revision ${proposal.currentRevision}.`,
      input.reviewerId,
    );
    return updated;
  }

  addComment(input: {
    proposalId: TimelineId;
    authorId: TimelineUserId;
    body: string;
    parentCommentId?: TimelineId;
  }): TimelineCollaborationComment {
    const proposal = this.requiredProposal(input.proposalId);
    this.assertParticipant(proposal, input.authorId);
    const parentId = input.parentCommentId ?? null;
    if (parentId) {
      const parent = this.comments.get(parentId);
      if (!parent || parent.proposalId !== proposal.id) {
        throw new Error("Comment reply parent does not belong to this proposal.");
      }
    }
    const comment: TimelineCollaborationComment = {
      id: `timeline-collaboration-comment-${++this.commentSequence}`,
      proposalId: proposal.id,
      revision: proposal.currentRevision,
      authorId: input.authorId,
      body: requiredText(input.body, "Comment"),
      parentCommentId: parentId,
      createdAt: this.now().toISOString(),
    };
    this.comments.set(comment.id, clone(comment));
    this.saveProposal({
      ...proposal,
      commentIds: [...proposal.commentIds, comment.id],
    });
    this.record(
      proposal.id,
      "comment-added",
      `Comment added to revision ${proposal.currentRevision}.`,
      input.authorId,
    );
    return clone(comment);
  }

  resolveComment(input: {
    commentId: TimelineId;
    resolvedBy: TimelineUserId;
  }): TimelineCollaborationComment {
    const comment = this.comments.get(input.commentId);
    if (!comment) {
      throw new Error(`Unknown collaboration comment: ${input.commentId}`);
    }
    const proposal = this.requiredProposal(comment.proposalId);
    this.assertParticipant(proposal, input.resolvedBy);
    if (comment.resolvedAt) {
      throw new Error("Comment is already resolved.");
    }
    const resolved: TimelineCollaborationComment = {
      ...comment,
      resolvedAt: this.now().toISOString(),
      resolvedBy: input.resolvedBy,
    };
    this.comments.set(resolved.id, clone(resolved));
    this.record(
      proposal.id,
      "comment-resolved",
      `Comment ${comment.id} resolved.`,
      input.resolvedBy,
    );
    return clone(resolved);
  }

  applyApprovedProposal(input: {
    proposalId: TimelineId;
    appliedBy: TimelineUserId;
  }): TimelineCollaborationProposal {
    const proposal = this.requiredProposal(input.proposalId);
    if (proposal.status !== "approved") {
      throw new Error("Only a fully approved proposal can be applied.");
    }
    if (this.unresolvedComments(proposal.id).length) {
      throw new Error("Resolve all collaboration comments before applying.");
    }
    const updated = this.saveProposal({
      ...proposal,
      status: "applied",
      appliedAt: this.now().toISOString(),
      appliedBy: input.appliedBy,
    });
    this.record(
      proposal.id,
      "proposal-applied",
      `Approved revision ${proposal.currentRevision} applied.`,
      input.appliedBy,
    );
    return updated;
  }

  withdrawProposal(input: {
    proposalId: TimelineId;
    withdrawnBy: TimelineUserId;
  }): TimelineCollaborationProposal {
    const proposal = this.requiredProposal(input.proposalId);
    if (proposal.authorId !== input.withdrawnBy) {
      throw new Error("Only the proposal author can withdraw it.");
    }
    if (proposal.status === "applied" || proposal.status === "withdrawn") {
      throw new Error("This proposal cannot be withdrawn.");
    }
    const updated = this.saveProposal({
      ...proposal,
      status: "withdrawn",
      withdrawnAt: this.now().toISOString(),
      withdrawnBy: input.withdrawnBy,
    });
    this.record(
      proposal.id,
      "proposal-withdrawn",
      "Proposal withdrawn by its author.",
      input.withdrawnBy,
    );
    return updated;
  }

  getProposal(id: TimelineId): TimelineCollaborationProposal | null {
    const proposal = this.proposals.get(id);
    return proposal ? clone(proposal) : null;
  }

  listProposals(workspaceId?: TimelineId): TimelineCollaborationProposal[] {
    return [...this.proposals.values()]
      .filter((proposal) => !workspaceId || proposal.workspaceId === workspaceId)
      .map(clone);
  }

  listRevisions(proposalId: TimelineId): TimelineCollaborationRevision[] {
    return [...this.revisions.values()]
      .filter((revision) => revision.proposalId === proposalId)
      .sort((left, right) => left.revision - right.revision)
      .map(clone);
  }

  listDecisions(proposalId: TimelineId): TimelineCollaborationDecision[] {
    return [...this.decisions.values()]
      .filter((decision) => decision.proposalId === proposalId)
      .map(clone);
  }

  listComments(proposalId: TimelineId): TimelineCollaborationComment[] {
    return [...this.comments.values()]
      .filter((comment) => comment.proposalId === proposalId)
      .map(clone);
  }

  unresolvedComments(proposalId: TimelineId): TimelineCollaborationComment[] {
    return this.listComments(proposalId).filter((comment) => !comment.resolvedAt);
  }

  listReceipts(
    proposalId?: TimelineId,
  ): TimelineCollaborationReceipt[] {
    return this.receipts
      .filter((receipt) => !proposalId || receipt.proposalId === proposalId)
      .map(clone);
  }

  exportArchive(): TimelineCollaborationApprovalArchive {
    return {
      proposals: this.listProposals(),
      revisions: [...this.revisions.values()].map(clone),
      decisions: [...this.decisions.values()].map(clone),
      comments: [...this.comments.values()].map(clone),
      receipts: this.receipts.map(clone),
    };
  }

  restoreArchive(archive: TimelineCollaborationApprovalArchive): void {
    this.proposals.clear();
    this.revisions.clear();
    this.decisions.clear();
    this.comments.clear();
    this.receipts.length = 0;
    archive.proposals.forEach((item) => this.proposals.set(item.id, clone(item)));
    archive.revisions.forEach((item) => this.revisions.set(item.id, clone(item)));
    archive.decisions.forEach((item) => this.decisions.set(item.id, clone(item)));
    archive.comments.forEach((item) => this.comments.set(item.id, clone(item)));
    this.receipts.push(...archive.receipts.map(clone));
    this.proposalSequence = this.highestSequence(
      archive.proposals.map((item) => item.id),
    );
    this.revisionSequence = this.highestSequence(
      archive.revisions.map((item) => item.id),
    );
    this.decisionSequence = this.highestSequence(
      archive.decisions.map((item) => item.id),
    );
    this.commentSequence = this.highestSequence(
      archive.comments.map((item) => item.id),
    );
    this.receiptSequence = this.highestSequence(
      archive.receipts.map((item) => item.id),
    );
  }

  private makeRevision(input: {
    proposalId: TimelineId;
    revision: number;
    summary: string;
    artifactIds: TimelineId[];
    fingerprint: string;
    createdBy: TimelineUserId;
  }): TimelineCollaborationRevision {
    const artifactIds = uniqueIds(input.artifactIds);
    if (!artifactIds.length) {
      throw new Error("A collaboration revision requires at least one artifact.");
    }
    const revision: TimelineCollaborationRevision = {
      id: `timeline-collaboration-revision-${++this.revisionSequence}`,
      proposalId: input.proposalId,
      revision: input.revision,
      summary: requiredText(input.summary, "Revision summary"),
      artifactIds,
      fingerprint: requiredText(input.fingerprint, "Revision fingerprint"),
      createdAt: this.now().toISOString(),
      createdBy: input.createdBy,
    };
    this.revisions.set(revision.id, clone(revision));
    return revision;
  }

  private currentDecisions(
    proposal: TimelineCollaborationProposal,
  ): TimelineCollaborationDecision[] {
    return proposal.decisionIds
      .map((id) => this.decisions.get(id))
      .filter(
        (decision): decision is TimelineCollaborationDecision =>
          Boolean(decision) && decision?.revision === proposal.currentRevision,
      );
  }

  private assertParticipant(
    proposal: TimelineCollaborationProposal,
    userId: TimelineUserId,
  ): void {
    if (
      proposal.authorId !== userId &&
      !proposal.reviewers.some((reviewer) => reviewer.userId === userId)
    ) {
      throw new Error("Only proposal participants can collaborate here.");
    }
  }

  private requiredProposal(id: TimelineId): TimelineCollaborationProposal {
    const proposal = this.proposals.get(id);
    if (!proposal) {
      throw new Error(`Unknown collaboration proposal: ${id}`);
    }
    return clone(proposal);
  }

  private saveProposal(
    proposal: TimelineCollaborationProposal,
  ): TimelineCollaborationProposal {
    this.proposals.set(proposal.id, clone(proposal));
    return clone(proposal);
  }

  private record(
    proposalId: TimelineId,
    action: TimelineCollaborationReceipt["action"],
    message: string,
    recordedBy: TimelineUserId,
  ): void {
    this.receipts.push({
      id: `timeline-collaboration-receipt-${++this.receiptSequence}`,
      proposalId,
      action,
      message,
      recordedAt: this.now().toISOString(),
      recordedBy,
    });
  }

  private highestSequence(ids: string[]): number {
    return ids.reduce((highest, id) => {
      const sequence = Number(id.match(/(\d+)$/)?.[1] ?? 0);
      return Math.max(highest, sequence);
    }, 0);
  }
}
