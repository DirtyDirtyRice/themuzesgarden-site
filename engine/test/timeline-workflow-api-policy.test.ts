import { describe, expect, it } from "vitest";
import {
  bearerToken,
  parseTimelineWorkflowApiPayload,
} from "../../lib/timeline/TimelineWorkflowApiPolicy";
import { TIMELINE_WORKSPACE } from "../../lib/timeline/TimelineSeed";

describe("TimelineWorkflowApiPolicy", () => {
  it("accepts bounded starts while discarding client identity and secrets", () => {
    const payload = parseTimelineWorkflowApiPayload({
      action: "start",
      instruction: "Review the opening.",
      projectId: TIMELINE_WORKSPACE.projectId,
      eventIds: [TIMELINE_WORKSPACE.events[0].id],
      createdBy: "impersonated-user",
      model: "client-model",
      apiKey: "client-key",
    });
    expect(payload.action).toBe("start");
    expect(payload).not.toHaveProperty("createdBy");
    expect(payload).not.toHaveProperty("model");
    expect(payload).not.toHaveProperty("apiKey");
  });

  it("requires project identity for starts and workflow identity later", () => {
    expect(() =>
      parseTimelineWorkflowApiPayload({ action: "start", instruction: "Review" })
    ).toThrow("project ID");
    expect(
      parseTimelineWorkflowApiPayload({
        action: "approve",
        workflowId: "workflow-1",
      }).workspace
    ).toBeUndefined();
  });

  it("rejects oversized instructions and selections", () => {
    expect(() =>
      parseTimelineWorkflowApiPayload({
        action: "start",
        instruction: "x".repeat(4_001),
        projectId: TIMELINE_WORKSPACE.projectId,
      })
    ).toThrow("4,000");
    expect(() =>
      parseTimelineWorkflowApiPayload({
        action: "start",
        instruction: "Review",
        projectId: TIMELINE_WORKSPACE.projectId,
        eventIds: Array.from({ length: 501 }, (_, index) => `event-${index}`),
      })
    ).toThrow("500");
  });

  it("requires a correctly formed bearer token", () => {
    expect(bearerToken("Bearer signed-token")).toBe("signed-token");
    expect(() => bearerToken(null)).toThrow("bearer token");
    expect(() => bearerToken("Basic credentials")).toThrow("bearer token");
  });
});
