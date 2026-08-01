import { describe, expect, it } from "vitest";
import { assessTimelineDawDevices } from "../../lib/timeline/TimelineDawDeviceDiagnostics";

describe("TimelineDawDeviceDiagnostics", () => {
  it("reports a ready low-latency audio interface", () => {
    expect(assessTimelineDawDevices({
      supported: true,
      secureContext: true,
      permission: "granted",
      inputDevices: 2,
      outputDevices: 2,
      labeledDevices: 4,
      sampleRate: 48_000,
      baseLatencyMs: 5,
      outputLatencyMs: 7,
    })).toMatchObject({
      status: "ready",
      roundTripEstimateMs: 12,
      issues: [],
    });
  });

  it("holds unavailable input, denied permission, insecure contexts, and high latency", () => {
    const report = assessTimelineDawDevices({
      supported: true,
      secureContext: false,
      permission: "denied",
      inputDevices: 0,
      outputDevices: 1,
      labeledDevices: 0,
      sampleRate: 48_000,
      baseLatencyMs: 25,
      outputLatencyMs: 30,
    });
    expect(report.status).toBe("held");
    expect(report.roundTripEstimateMs).toBe(55);
    expect(report.issues.join(" ")).toMatch(/secure|permission|input|latency/i);
    expect(report.recommendations.join(" ")).toMatch(/site settings|interface|buffer/i);
  });

  it("guides permission testing without falsely holding an available device", () => {
    const report = assessTimelineDawDevices({
      supported: true,
      secureContext: true,
      permission: "unknown",
      inputDevices: 1,
      outputDevices: 1,
      labeledDevices: 0,
      sampleRate: 44_100,
      baseLatencyMs: null,
      outputLatencyMs: null,
    });
    expect(report.status).toBe("ready");
    expect(report.recommendations[0]).toMatch(/microphone test/i);
  });
});
