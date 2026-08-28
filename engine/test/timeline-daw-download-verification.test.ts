import { describe, expect, it } from "vitest";
import { createTimelineDawDownloadVerificationReceipt, parseTimelineDawDownloadVerificationReceipt, verifyTimelineDawDownloadedArtifact, verifyTimelineDawDownloadVerificationReceipt } from "../../lib/timeline/TimelineDawDownloadVerification";

describe("DAW downloaded artifact verification", () => {
  it("verifies the local file against the saved render fingerprint", async () => {
    const result = await verifyTimelineDawDownloadedArtifact(
      new TextEncoder().encode("hello"),
      "sha256:2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
    );
    expect(result).toMatchObject({ verified: true, byteLength: 5 });
  });

  it("reports a mismatch without changing the selected bytes", async () => {
    const bytes = new TextEncoder().encode("hello");
    const before = bytes.slice();
    const result = await verifyTimelineDawDownloadedArtifact(bytes, `sha256:${"0".repeat(64)}`);
    expect(result.verified).toBe(false);
    expect(bytes).toEqual(before);
  });

  it("rejects malformed saved fingerprints", async () => {
    await expect(verifyTimelineDawDownloadedArtifact(new Uint8Array([1]), "sha256:bad"))
      .rejects.toThrow(/checksum is invalid/i);
  });

  it("creates a portable privacy-safe verification receipt", async () => {
    const receipt = await createTimelineDawDownloadVerificationReceipt({
      sessionId: "session-1",
      jobId: "job-1",
      target: "stem",
      fileName: "song-stems.zip",
      byteLength: 1024,
      checksum: `sha256:${"a".repeat(64)}`,
      verifiedAt: "2026-08-28T16:00:00.000Z",
    });
    expect(receipt).toMatchObject({ containsAudio: false, byteLength: 1024, target: "stem" });
    expect(receipt.receiptChecksum).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(await verifyTimelineDawDownloadVerificationReceipt(receipt)).toBe(true);
    expect(JSON.stringify(receipt)).not.toMatch(/signedUrl|storagePath|audioBytes/);
  });

  it("detects edited receipt evidence", async () => {
    const receipt = await createTimelineDawDownloadVerificationReceipt({ sessionId: "session-1", jobId: "job-1", target: "mix", fileName: "mix.wav", byteLength: 2048, checksum: `sha256:${"b".repeat(64)}`, verifiedAt: "2026-08-28T16:00:00.000Z" });
    expect(await verifyTimelineDawDownloadVerificationReceipt({ ...receipt, byteLength: 2049 })).toBe(false);
    expect(await verifyTimelineDawDownloadVerificationReceipt({ ...receipt, fileName: "edited.wav" })).toBe(false);
  });

  it("reopens a valid receipt only inside its DAW session", async () => {
    const receipt = await createTimelineDawDownloadVerificationReceipt({ sessionId: "session-1", jobId: "job-1", target: "mix", fileName: "mix.wav", byteLength: 2048, checksum: `sha256:${"c".repeat(64)}`, verifiedAt: "2026-08-28T16:00:00.000Z" });
    await expect(parseTimelineDawDownloadVerificationReceipt(JSON.stringify(receipt), "session-1")).resolves.toEqual(receipt);
    await expect(parseTimelineDawDownloadVerificationReceipt(JSON.stringify(receipt), "session-2")).rejects.toThrow(/another DAW session/i);
  });

  it("rejects malformed, extended, and checksum-invalid receipt files", async () => {
    await expect(parseTimelineDawDownloadVerificationReceipt("not-json", "session-1")).rejects.toThrow(/valid JSON/i);
    const receipt = await createTimelineDawDownloadVerificationReceipt({ sessionId: "session-1", jobId: "job-1", target: "stem", fileName: "stems.zip", byteLength: 4096, checksum: `sha256:${"d".repeat(64)}`, verifiedAt: "2026-08-28T16:00:00.000Z" });
    await expect(parseTimelineDawDownloadVerificationReceipt(JSON.stringify({ ...receipt, signedUrl: "private" }), "session-1")).rejects.toThrow(/unsupported field/i);
    await expect(parseTimelineDawDownloadVerificationReceipt(JSON.stringify({ ...receipt, jobId: "edited" }), "session-1")).rejects.toThrow(/checksum/i);
  });
});
