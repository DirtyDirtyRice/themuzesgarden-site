import { describe, expect, it } from "vitest";

import { TimelineCollaborationApprovalEngine } from "../../lib/timeline/TimelineCollaborationApprovalEngine";

function proposal(engine = new TimelineCollaborationApprovalEngine()) {
  const created = engine.createProposal({
    workspaceId: "song-1",
    title: "Approve final vocal comp",
    summary: "Initial vocal comp candidate",
    artifactIds: ["vocal-comp-1"],
    fingerprint: "sha256-revision-1",
    authorId: "author-1",
    reviewers: [
      { userId: "producer-1", name: "Producer", required: true },
      { userId: "artist-1", name: "Artist", required: true },
      { userId: "engineer-1", name: "Engineer", required: false },
    ],
  });
  return { engine, created };
}

describe("TimelineCollaborationApprovalEngine", () => {
  it("requires independent assigned human reviewers", () => {
    const engine = new TimelineCollaborationApprovalEngine();
    expect(() =>
      engine.createProposal({
        workspaceId: "song-1",
        title: "Self approval",
        summary: "Unsafe review",
        artifactIds: ["artifact-1"],
        fingerprint: "sha256-1",
        authorId: "author-1",
        reviewers: [
          { userId: "author-1", name: "Author", required: true },
        ],
      }),
    ).toThrow("cannot approve their own");
  });

  it("requires every mandatory approval before activation", () => {
    const { engine, created } = proposal();
    engine.submitForReview({
      proposalId: created.id,
      submittedBy: "author-1",
    });
    expect(
      engine.decide({
        proposalId: created.id,
        reviewerId: "producer-1",
        decision: "approved",
        note: "Balance is ready.",
      }).status,
    ).toBe("in-review");
    expect(() =>
      engine.applyApprovedProposal({
        proposalId: created.id,
        appliedBy: "author-1",
      }),
    ).toThrow("fully approved");
    expect(
      engine.decide({
        proposalId: created.id,
        reviewerId: "artist-1",
        decision: "approved",
        note: "Performance approved.",
      }).status,
    ).toBe("approved");
    expect(
      engine.applyApprovedProposal({
        proposalId: created.id,
        appliedBy: "author-1",
      }).status,
    ).toBe("applied");
  });

  it("holds requested changes and invalidates old approvals on revision", () => {
    const { engine, created } = proposal();
    engine.submitForReview({
      proposalId: created.id,
      submittedBy: "author-1",
    });
    expect(
      engine.decide({
        proposalId: created.id,
        reviewerId: "producer-1",
        decision: "changes-requested",
        note: "Repair the breath at bar 18.",
      }).status,
    ).toBe("changes-requested");
    const revised = engine.addRevision({
      proposalId: created.id,
      summary: "Breath edit repaired",
      artifactIds: ["vocal-comp-2"],
      fingerprint: "sha256-revision-2",
      createdBy: "author-1",
    });
    expect(revised.currentRevision).toBe(2);
    expect(revised.status).toBe("draft");
    engine.submitForReview({
      proposalId: created.id,
      submittedBy: "author-1",
    });
    engine.decide({
      proposalId: created.id,
      reviewerId: "producer-1",
      decision: "approved",
      note: "Repair confirmed.",
    });
    expect(engine.getProposal(created.id)?.status).toBe("in-review");
  });

  it("blocks applying approved work until collaboration comments resolve", () => {
    const { engine, created } = proposal();
    const comment = engine.addComment({
      proposalId: created.id,
      authorId: "artist-1",
      body: "Confirm the final lyric pronunciation.",
    });
    engine.submitForReview({
      proposalId: created.id,
      submittedBy: "author-1",
    });
    engine.decide({
      proposalId: created.id,
      reviewerId: "producer-1",
      decision: "approved",
      note: "",
    });
    engine.decide({
      proposalId: created.id,
      reviewerId: "artist-1",
      decision: "approved",
      note: "",
    });
    expect(() =>
      engine.applyApprovedProposal({
        proposalId: created.id,
        appliedBy: "author-1",
      }),
    ).toThrow("Resolve all");
    engine.resolveComment({
      commentId: comment.id,
      resolvedBy: "artist-1",
    });
    expect(
      engine.applyApprovedProposal({
        proposalId: created.id,
        appliedBy: "author-1",
      }).status,
    ).toBe("applied");
  });

  it("restores immutable evidence and continues stable identities", () => {
    const { engine, created } = proposal();
    engine.submitForReview({
      proposalId: created.id,
      submittedBy: "author-1",
    });
    engine.decide({
      proposalId: created.id,
      reviewerId: "producer-1",
      decision: "approved",
      note: "Ready",
    });
    const restored = new TimelineCollaborationApprovalEngine();
    restored.restoreArchive(engine.exportArchive());
    expect(restored.listDecisions(created.id)[0].revision).toBe(1);
    expect(restored.listReceipts(created.id)[0].id).toBe(
      "timeline-collaboration-receipt-1",
    );
    expect(
      restored.createProposal({
        workspaceId: "song-2",
        title: "Second proposal",
        summary: "Next change",
        artifactIds: ["artifact-2"],
        fingerprint: "sha256-2",
        authorId: "author-2",
        reviewers: [
          { userId: "reviewer-2", name: "Reviewer", required: true },
        ],
      }).id,
    ).toBe("timeline-collaboration-proposal-2");
  });
});
