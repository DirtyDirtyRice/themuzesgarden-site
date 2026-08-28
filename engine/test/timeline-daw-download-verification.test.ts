import { describe, expect, it } from "vitest";
import { verifyTimelineDawDownloadedArtifact } from "../../lib/timeline/TimelineDawDownloadVerification";

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
});
