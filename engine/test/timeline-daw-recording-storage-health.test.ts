import { describe, expect, it } from "vitest";
import { assessTimelineDawRecordingStorage } from "../../lib/timeline/TimelineDawRecordingStorageHealth";

describe("recording storage health", () => {
  it("uses conservative stereo Float32 recovery estimates", () => {
    const report = assessTimelineDawRecordingStorage({ supported: true, persisted: true, quotaBytes: 1_000_000_000, usageBytes: 0, maxTakeMinutes: 10 });
    expect(report.estimatedTakeBytes).toBe(48_000 * 2 * 4 * 60 * 10);
    expect(report.status).toBe("ready");
  });
  it("recommends a bounded smaller duration when capacity is low", () => {
    const report = assessTimelineDawRecordingStorage({ supported: true, persisted: false, quotaBytes: 50_000_000, usageBytes: 20_000_000, maxTakeMinutes: 30 });
    expect(report.status).toBe("warning");
    expect(report.safeMinutes).toBeGreaterThanOrEqual(0);
    expect(report.recommendation).toMatch(/minutes|full/i);
  });
  it("keeps recording advisory when the browser cannot estimate storage", () => {
    expect(assessTimelineDawRecordingStorage({ supported: false, persisted: false, quotaBytes: null, usageBytes: null, maxTakeMinutes: 5 })).toMatchObject({ status: "unknown", safeMinutes: null });
  });
});
