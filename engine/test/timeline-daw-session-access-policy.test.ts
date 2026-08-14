import { describe, expect, it } from "vitest";
import {
  createTimelineDawSessionAccessChecksum,
  parseTimelineDawSessionCapability,
  verifyTimelineDawSessionAccessDecision,
  type TimelineDawSessionAccessDecision,
} from "../../lib/timeline/TimelineDawSessionAccessPolicy";

const decision = (): TimelineDawSessionAccessDecision => {
  const payload = {
    allowed: true,
    actorId: "tester-1",
    ownerId: "owner-1",
    sessionId: "session-1",
    enrollmentId: "enrollment-1",
    role: "beta-collaborator" as const,
    capability: "session:read" as const,
    reason: "Released beta collaborator.",
    receiptId: "receipt-1",
    observedAt: "2026-08-14T20:30:00.000Z",
  };
  return { ...payload, receiptChecksum: createTimelineDawSessionAccessChecksum(payload) };
};

describe("TimelineDawSessionAccessPolicy", () => {
  it("accepts only explicit capabilities", () => {
    expect(parseTimelineDawSessionCapability("feedback:create")).toBe("feedback:create");
    expect(() => parseTimelineDawSessionCapability("session:admin")).toThrow(/invalid/);
  });

  it("verifies checksum-protected allowed decisions", () => {
    expect(verifyTimelineDawSessionAccessDecision(decision()).role).toBe("beta-collaborator");
  });

  it("rejects altered and denied decisions", () => {
    expect(() => verifyTimelineDawSessionAccessDecision({ ...decision(), sessionId: "changed" })).toThrow(/integrity/);
    const denied = decision();
    const payload = { ...denied, allowed: false, reason: "Enrollment revoked." };
    const withoutChecksum = Object.fromEntries(Object.entries(payload).filter(([key]) => key !== "receiptChecksum")) as Omit<TimelineDawSessionAccessDecision, "receiptChecksum">;
    expect(() => verifyTimelineDawSessionAccessDecision({ ...withoutChecksum, receiptChecksum: createTimelineDawSessionAccessChecksum(withoutChecksum) })).toThrow(/revoked/);
  });
});
