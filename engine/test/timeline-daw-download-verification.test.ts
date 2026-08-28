import { describe, expect, it } from "vitest";
import { anchorTimelineDawDownloadVerificationReceipt, createTimelineDawDownloadVerificationReceipt, parseTimelineDawDownloadVerificationReceipt, verifyTimelineDawDownloadedArtifact, verifyTimelineDawDownloadVerificationReceipt, verifyTimelineDawReceiptArtifact } from "../../lib/timeline/TimelineDawDownloadVerification";
import type { TimelineOfflineRenderJob } from "../../lib/timeline/TimelineOfflineRenderAndExportEngine";

const completedJob = (checksum: string, target: "mix" | "stem" = "mix"): TimelineOfflineRenderJob => ({ id: "job-1", projectId: "project-1", name: "Mix", target, sourceIds: ["source-1"], startSample: 0, endSample: 5, sampleRate: 48_000, bitDepth: 24, channels: 2, format: "wav", normalizePeakDb: null, dither: false, state: "completed", issues: [], renderedFrames: 5, totalFrames: 5, checksum, outputUri: "supabase://private/render.wav", head: 4, createdBy: "owner-1", updatedBy: "worker-1" });

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

  it("rechecks the actual download against a valid saved receipt", async () => {
    const bytes = new TextEncoder().encode("hello");
    const receipt = await createTimelineDawDownloadVerificationReceipt({ sessionId: "session-1", jobId: "job-1", target: "mix", fileName: "mix.wav", byteLength: 5, checksum: "sha256:2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824", verifiedAt: "2026-08-28T16:00:00.000Z" });
    await expect(verifyTimelineDawReceiptArtifact(bytes, receipt)).resolves.toMatchObject({ verified: true, byteLength: 5, expectedByteLength: 5 });
  });

  it("rejects a file whose bytes or size do not match the saved receipt", async () => {
    const receipt = await createTimelineDawDownloadVerificationReceipt({ sessionId: "session-1", jobId: "job-1", target: "stem", fileName: "stems.zip", byteLength: 5, checksum: "sha256:2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824", verifiedAt: "2026-08-28T16:00:00.000Z" });
    await expect(verifyTimelineDawReceiptArtifact(new TextEncoder().encode("hello!"), receipt)).resolves.toMatchObject({ verified: false, byteLength: 6, expectedByteLength: 5 });
  });

  it("anchors a receipt to its completed saved render", async () => {
    const checksum = `sha256:${"e".repeat(64)}`;
    const receipt = await createTimelineDawDownloadVerificationReceipt({ sessionId: "session-1", jobId: "job-1", target: "mix", fileName: "mix.wav", byteLength: 5, checksum, verifiedAt: "2026-08-28T16:00:00.000Z" });
    await expect(anchorTimelineDawDownloadVerificationReceipt(receipt, [completedJob(checksum)])).resolves.toMatchObject({ id: "job-1", state: "completed", checksum });
  });

  it("rejects receipts for missing or unfinished saved renders", async () => {
    const checksum = `sha256:${"e".repeat(64)}`;
    const receipt = await createTimelineDawDownloadVerificationReceipt({ sessionId: "session-1", jobId: "job-1", target: "mix", fileName: "mix.wav", byteLength: 5, checksum, verifiedAt: "2026-08-28T16:00:00.000Z" });
    await expect(anchorTimelineDawDownloadVerificationReceipt(receipt, [])).rejects.toThrow(/saved render/i);
    await expect(anchorTimelineDawDownloadVerificationReceipt(receipt, [{ ...completedJob(checksum), state: "validated" }])).rejects.toThrow(/not completed/i);
  });

  it("rejects receipt evidence that disagrees with the durable render", async () => {
    const checksum = `sha256:${"e".repeat(64)}`;
    const receipt = await createTimelineDawDownloadVerificationReceipt({ sessionId: "session-1", jobId: "job-1", target: "mix", fileName: "mix.wav", byteLength: 5, checksum, verifiedAt: "2026-08-28T16:00:00.000Z" });
    await expect(anchorTimelineDawDownloadVerificationReceipt(receipt, [completedJob(`sha256:${"f".repeat(64)}`)])).rejects.toThrow(/saved render evidence/i);
    await expect(anchorTimelineDawDownloadVerificationReceipt(receipt, [completedJob(checksum, "stem")])).rejects.toThrow(/saved render evidence/i);
  });
});
