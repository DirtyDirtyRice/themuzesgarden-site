import { describe, expect, it } from "vitest";

import { buildTimelineActivationAudit } from "../../lib/developer-workspace/timelineActivationAudit";
import type { TimelineEngineActivationSnapshot } from "../../lib/timeline/TimelineEngineActivationService";

const snapshot: TimelineEngineActivationSnapshot = {
  total: 2, authorized: 1, blocked: 1, consumed: 0, expired: 0, revoked: 0,
  latestDecisionAt: "2026-07-25T12:01:00.000Z",
  integrityStatus: "verified",
  archiveHash: "a".repeat(64),
  decisions: [
    {
      id: "activation-1", workflowId: "workflow-one", requestedBy: "private-user-one",
      status: "authorized", registryFingerprint: "fingerprint-1",
      readiness: {
        ready: true, registered: 61, healthy: 61, required: 61, startupOrder: [],
        errors: [], warnings: [], generatedAt: "2026-07-25T12:00:00.000Z",
      },
      reasons: ["Ready."], requestedAt: "2026-07-25T12:00:00.000Z",
      expiresAt: "2026-07-25T12:05:00.000Z",
    },
    {
      id: "activation-2", workflowId: "workflow-two", requestedBy: "private-user-two",
      status: "blocked", registryFingerprint: "fingerprint-2",
      readiness: {
        ready: false, registered: 61, healthy: 60, required: 61, startupOrder: [],
        errors: ["One engine failed."], warnings: [],
        generatedAt: "2026-07-25T12:01:00.000Z",
      },
      reasons: ["One engine failed."], requestedAt: "2026-07-25T12:01:00.000Z",
      expiresAt: "2026-07-25T12:06:00.000Z",
    },
  ],
};

describe("buildTimelineActivationAudit", () => {
  it("returns newest evidence first without exposing user identities", () => {
    const report = buildTimelineActivationAudit(snapshot);
    expect(report.entries.map((entry) => entry.id)).toEqual(["activation-2", "activation-1"]);
    expect(report.entries[0]).not.toHaveProperty("requestedBy");
    expect(report.entries[0]).not.toHaveProperty("consumedBy");
    expect(report.summary.total).toBe(2);
  });

  it("filters exact workflow and decision status", () => {
    const report = buildTimelineActivationAudit(snapshot, {
      workflowId: "workflow-one", status: "authorized",
    });
    expect(report.entries).toHaveLength(1);
    expect(report.entries[0]?.id).toBe("activation-1");
  });
});
