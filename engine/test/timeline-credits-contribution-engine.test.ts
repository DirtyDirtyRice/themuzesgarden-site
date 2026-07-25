import { describe, expect, it } from "vitest";

import { TimelineCreditsContributionEngine } from "../../lib/timeline/TimelineCreditsContributionEngine";

function setup() {
  const engine = new TimelineCreditsContributionEngine();
  const contributor = engine.createContributor({
    projectId: "song-1",
    userId: "writer-1",
    legalName: "Alex Writer",
    displayName: "Alex",
    contactReference: "member:writer-1",
    identifiers: { ipi: "123456789" },
    createdBy: "producer-1",
  });
  const contribution = engine.createContribution({
    projectId: "song-1",
    contributorId: contributor.id,
    role: "writer",
    roleDetail: "Lyrics and chorus melody",
    artifactIds: ["lyrics-v3", "chorus-midi-v2"],
    description: "Wrote final chorus and revised verse two.",
    createdBy: "producer-1",
  });
  engine.addEvidence({
    contributionId: contribution.id,
    kind: "session",
    reference: "session:2026-07-25:14",
    fingerprint: "sha256-session-14",
    addedBy: "producer-1",
  });
  return { engine, contributor, contribution };
}

describe("TimelineCreditsContributionEngine", () => {
  it("holds unproven contributions before confirmation", () => {
    const engine = new TimelineCreditsContributionEngine();
    const contributor = engine.createContributor({
      projectId: "song-1",
      userId: "writer-1",
      legalName: "Alex Writer",
      contactReference: "member:writer-1",
      createdBy: "producer-1",
    });
    const contribution = engine.createContribution({
      projectId: "song-1",
      contributorId: contributor.id,
      role: "writer",
      artifactIds: ["lyrics-v1"],
      description: "Draft lyric",
      createdBy: "producer-1",
    });
    expect(() =>
      engine.requestConfirmation({
        contributionId: contribution.id,
        requestedBy: "producer-1",
      }),
    ).toThrow("evidence");
    expect(() =>
      engine.finalizeManifest({
        projectId: "song-1",
        finalizedBy: "producer-1",
      }),
    ).toThrow("held");
  });

  it("requires confirmation from the named contributor", () => {
    const { engine, contribution } = setup();
    engine.requestConfirmation({
      contributionId: contribution.id,
      requestedBy: "producer-1",
    });
    expect(() =>
      engine.confirmContribution({
        contributionId: contribution.id,
        confirmedBy: "producer-1",
      }),
    ).toThrow("named contributor");
    expect(
      engine.confirmContribution({
        contributionId: contribution.id,
        confirmedBy: "writer-1",
      }).status,
    ).toBe("confirmed");
  });

  it("resets confirmation whenever credited work is amended", () => {
    const { engine, contribution } = setup();
    engine.requestConfirmation({
      contributionId: contribution.id,
      requestedBy: "producer-1",
    });
    engine.confirmContribution({
      contributionId: contribution.id,
      confirmedBy: "writer-1",
    });
    const amended = engine.amendContribution({
      contributionId: contribution.id,
      artifactIds: ["lyrics-v4", "chorus-midi-v2"],
      description: "Revised final lyric after mix notes.",
      amendedBy: "producer-1",
    });
    expect(amended.revision).toBe(2);
    expect(amended.status).toBe("draft");
    expect(amended.confirmedAt).toBeUndefined();
  });

  it("holds disputed claims and finalizes only the resolved credit", () => {
    const { engine, contribution } = setup();
    engine.requestConfirmation({
      contributionId: contribution.id,
      requestedBy: "producer-1",
    });
    engine.confirmContribution({
      contributionId: contribution.id,
      confirmedBy: "writer-1",
    });
    const second = engine.createContributor({
      projectId: "song-1",
      userId: "writer-2",
      legalName: "Blake Writer",
      contactReference: "member:writer-2",
      createdBy: "producer-1",
    });
    const competing = engine.createContribution({
      projectId: "song-1",
      contributorId: second.id,
      role: "writer",
      artifactIds: ["lyrics-v3"],
      description: "Competing chorus claim.",
      createdBy: "producer-1",
    });
    const dispute = engine.openDispute({
      projectId: "song-1",
      contributionIds: [contribution.id, competing.id],
      reason: "Both contributors claim the same chorus.",
      openedBy: "producer-1",
    });
    expect(() =>
      engine.finalizeManifest({
        projectId: "song-1",
        finalizedBy: "producer-1",
      }),
    ).toThrow("not confirmed");
    engine.resolveDispute({
      disputeId: dispute.id,
      confirmedContributionIds: [contribution.id],
      resolution: "Session evidence confirms Alex wrote the chorus.",
      resolvedBy: "reviewer-1",
    });
    const manifest = engine.finalizeManifest({
      projectId: "song-1",
      finalizedBy: "producer-1",
    });
    expect(manifest.lines).toHaveLength(1);
    expect(manifest.lines[0].displayName).toBe("Alex");
    expect(manifest.lines[0].evidenceFingerprints).toEqual([
      "sha256-session-14",
    ]);
  });

  it("restores credit evidence and continues stable ledger identities", () => {
    const { engine, contribution } = setup();
    engine.requestConfirmation({
      contributionId: contribution.id,
      requestedBy: "producer-1",
    });
    const restored = new TimelineCreditsContributionEngine();
    restored.restoreArchive(engine.exportArchive());
    expect(restored.getContribution(contribution.id)?.status).toBe(
      "awaiting-confirmation",
    );
    expect(restored.listReceipts("song-1")[0].id).toBe(
      "timeline-credit-receipt-1",
    );
    const next = restored.createContributor({
      projectId: "song-1",
      userId: "artist-1",
      legalName: "Casey Artist",
      contactReference: "member:artist-1",
      createdBy: "producer-1",
    });
    expect(next.id).toBe("timeline-credit-contributor-2");
  });
});
