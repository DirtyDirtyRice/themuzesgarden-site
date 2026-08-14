import { describe, expect, it } from "vitest";
import { createTimelineDawBetaLaunchChecksum, evaluateTimelineDawBetaTesterActivity, parseTimelineDawBetaLaunchReason, transitionTimelineDawBetaLaunch } from "../../lib/timeline/TimelineDawBetaLaunchPolicy";
const telemetry = { portalEntries: 1, allowedAuthorizations: 1, auditionCompleted: false, workflowPercent: 50, feedbackEvents: 0, testerCompleted: false, lastActivityAt: "2026-08-10T00:00:00.000Z" };
describe("DAW beta launch policy", () => {
  it("guards launch lifecycle transitions", () => { expect(transitionTimelineDawBetaLaunch("active", "pause")).toBe("paused"); expect(transitionTimelineDawBetaLaunch("paused", "resume")).toBe("active"); expect(transitionTimelineDawBetaLaunch("active", "close")).toBe("closed"); expect(() => transitionTimelineDawBetaLaunch("closed", "resume")).toThrow(); });
  it("detects stalled testers from privacy-safe activity", () => expect(evaluateTimelineDawBetaTesterActivity({ telemetry, launchedAt: "2026-08-01T00:00:00.000Z", now: "2026-08-14T00:00:00.000Z" })).toMatchObject({ stalled: true, complete: false }));
  it("prioritizes the next real beta action", () => expect(evaluateTimelineDawBetaTesterActivity({ telemetry: { ...telemetry, lastActivityAt: "2026-08-14T00:00:00.000Z" }, launchedAt: "2026-08-14T00:00:00.000Z", now: "2026-08-14T01:00:00.000Z" }).nextAction).toContain("audition"));
  it("validates reasons and deterministic checksums", () => { expect(parseTimelineDawBetaLaunchReason("First certified cohort.")).toBe("First certified cohort."); expect(() => parseTimelineDawBetaLaunchReason("no")).toThrow(); expect(createTimelineDawBetaLaunchChecksum({ launch: "one" })).toMatch(/^sha256:[a-f0-9]{64}$/); });
});
