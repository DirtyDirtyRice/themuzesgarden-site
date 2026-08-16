import { describe, expect, it } from "vitest";
import { selectTimelineDawBetaEnrollmentToResume, timelineDawBetaEnrollmentProgress } from "../../lib/timeline/TimelineDawBetaEnrollmentResume";

const row = (overrides: Partial<Parameters<typeof timelineDawBetaEnrollmentProgress>[0]> = {}) => ({
  id: "enrollment-1",
  session_id: "session-1",
  project_id: "project-1",
  state: "active",
  acknowledgement_version: null,
  environment: null,
  created_at: "2026-08-15T12:00:00.000Z",
  ...overrides,
});

describe("musician beta enrollment resume", () => {
  it("resumes the newest active enrollment and ignores revoked rows", () => {
    expect(selectTimelineDawBetaEnrollmentToResume([
      row({ id: "older", created_at: "2026-08-14T12:00:00.000Z" }),
      row({ id: "revoked", state: "revoked", created_at: "2026-08-16T12:00:00.000Z" }),
      row({ id: "newer", created_at: "2026-08-15T12:00:00.000Z" }),
    ])?.id).toBe("newer");
  });

  it("reports saved acknowledgement and only a fully passing environment", () => {
    expect(timelineDawBetaEnrollmentProgress(row({ acknowledgement_version: "v1", environment: { browser: true, audio: true } }))).toEqual({ acknowledged: true, environmentReady: true });
    expect(timelineDawBetaEnrollmentProgress(row({ environment: { browser: true, audio: false } })).environmentReady).toBe(false);
  });
});
