import { describe, expect, it } from "vitest";

import { TimelineReleaseMonitoringEngine } from "../../lib/timeline/TimelineReleaseMonitoringEngine";
import type { TimelineSoundIngredient } from "../../lib/timeline/TimelineSoundRecipeEngine";

function setup() {
  const engine = new TimelineReleaseMonitoringEngine();
  const ingredient: TimelineSoundIngredient = {
    id: "ingredient-1",
    name: "Original recording",
    kind: "user-recording",
    percentage: 100,
    sourceDescription: "Studio session",
    owner: "member-1",
    rightsStatus: "owned",
    contentFingerprint: "sha256-source",
    createdAt: "2026-07-24T00:00:00.000Z",
    createdBy: "member-1",
  };
  const record = engine.publishing.rights.registerIngredient({
    projectId: "project-1",
    ingredient,
    registeredBy: "member-1",
  });
  for (const kind of [
    "ownership",
    "source-recording",
    "fingerprint-verification",
  ] as const) {
    engine.publishing.rights.addEvidence({
      recordId: record.id,
      kind,
      reference: `${kind}-proof`,
      issuer: "reviewer",
      fingerprint:
        kind === "fingerprint-verification"
          ? ingredient.contentFingerprint
          : undefined,
      addedBy: "reviewer-1",
    });
  }
  engine.publishing.rights.review({
    recordId: record.id,
    reviewedBy: "reviewer-1",
  });
  engine.publishing.restoreArchive({
    packages: [
      {
        id: "timeline-release-package-1",
        projectId: "project-1",
        masteringJobId: "master-1",
        masterFingerprint: "sha256-master",
        rightsRecordIds: [record.id],
        metadata: {
          title: "Garden Song",
          primaryArtist: "The Muzes",
          writers: ["Writer"],
          releaseDate: "2026-08-21",
          language: "en",
          explicit: false,
          copyrightLine: "© 2026",
          productionLine: "℗ 2026",
        },
        artwork: {
          uri: "image://cover",
          fingerprint: "sha256-cover",
          width: 3000,
          height: 3000,
          mimeType: "image/png",
        },
        destinations: [
          {
            id: "timeline-release-destination-1",
            kind: "garden",
            name: "Garden",
            territories: ["WORLDWIDE"],
            status: "published",
            externalReleaseId: "garden-1",
          },
          {
            id: "timeline-release-destination-2",
            kind: "dsp",
            name: "DSP",
            territories: ["US"],
            status: "published",
            externalReleaseId: "dsp-1",
          },
        ],
        status: "published",
        issues: [],
        createdAt: "2026-07-24T00:00:00.000Z",
        createdBy: "member-1",
      },
    ],
    receipts: [],
  });
  const monitor = engine.createMonitor({
    packageId: "timeline-release-package-1",
    createdBy: "member-1",
  });
  const healthy = [
    {
      destinationId: "timeline-release-destination-1",
      available: true,
      externalReleaseId: "garden-1",
      masterFingerprint: "sha256-master",
      checkedAt: "2026-07-25T00:00:00.000Z",
    },
    {
      destinationId: "timeline-release-destination-2",
      available: true,
      externalReleaseId: "dsp-1",
      masterFingerprint: "sha256-master",
      checkedAt: "2026-07-25T00:00:00.000Z",
    },
  ];
  return { engine, monitor, record, healthy };
}

describe("TimelineReleaseMonitoringEngine", () => {
  it("records a healthy audit without creating incidents", () => {
    const { engine, monitor, healthy } = setup();
    const result = engine.audit({
      monitorId: monitor.id,
      observations: healthy,
      checkedBy: "monitor-worker",
    });
    expect(result.monitor.status).toBe("active");
    expect(result.incidents).toEqual([]);
    expect(engine.listReceipts(monitor.id).at(-1)?.action).toBe("audit-passed");
  });

  it("detects availability, identity, and missing destination evidence", () => {
    const { engine, monitor, healthy } = setup();
    const result = engine.audit({
      monitorId: monitor.id,
      observations: [
        {
          ...healthy[0],
          available: false,
          masterFingerprint: "sha256-wrong",
        },
      ],
      checkedBy: "monitor-worker",
    });
    expect(result.monitor.status).toBe("attention");
    expect(result.incidents.map((incident) => incident.kind).sort()).toEqual([
      "availability",
      "destination",
      "identity",
    ]);
  });

  it("detects post-release rights revocation and performs an approved recall", () => {
    const { engine, monitor, record, healthy } = setup();
    engine.publishing.rights.revoke({
      recordId: record.id,
      revokedBy: "member-1",
      reason: "Permission withdrawn.",
    });
    const audit = engine.audit({
      monitorId: monitor.id,
      observations: healthy,
      checkedBy: "monitor-worker",
    });
    const incident = audit.incidents.find((item) => item.kind === "rights")!;
    const recall = engine.createRecall({
      monitorId: monitor.id,
      incidentId: incident.id,
      reason: "Rights are no longer valid.",
      createdBy: "member-1",
    });
    expect(recall.status).toBe("held");
    let active = engine.approveRecall({
      recallId: recall.id,
      approvedBy: "member-2",
    });
    for (const destination of active.destinations) {
      active = engine.recordTakedown({
        recallId: recall.id,
        destinationId: destination.destinationId,
        outcome: "removed",
        confirmationId: `removed-${destination.destinationId}`,
        recordedBy: "publisher-worker",
      });
    }
    expect(active.status).toBe("completed");
    expect(engine.getMonitor(monitor.id)?.status).toBe("recalled");
  });

  it("requires critical evidence, human approval, and takedown confirmation", () => {
    const { engine, monitor, healthy } = setup();
    const audit = engine.audit({
      monitorId: monitor.id,
      observations: [healthy[0]],
      checkedBy: "monitor-worker",
    });
    const warning = audit.incidents.find(
      (incident) => incident.severity === "warning",
    )!;
    expect(() =>
      engine.createRecall({
        monitorId: monitor.id,
        incidentId: warning.id,
        reason: "Missing check",
        createdBy: "member-1",
      }),
    ).toThrow("critical incident");
    const critical = audit.incidents.find(
      (incident) => incident.severity === "critical",
    );
    expect(critical).toBeUndefined();
    const resolved = engine.resolveIncident({
      incidentId: warning.id,
      resolvedBy: "member-1",
      resolution: "Destination check restored.",
    });
    expect(resolved.status).toBe("resolved");
  });

  it("restores monitor evidence and continues stable identities", () => {
    const { engine, monitor, healthy } = setup();
    engine.audit({
      monitorId: monitor.id,
      observations: healthy,
      checkedBy: "monitor-worker",
    });
    const restored = new TimelineReleaseMonitoringEngine(engine.publishing);
    restored.restoreArchive(engine.exportArchive());
    expect(restored.getMonitor(monitor.id)?.status).toBe("active");
    expect(restored.listReceipts()[0].id).toBe(
      "timeline-release-monitoring-receipt-1",
    );
  });
});
