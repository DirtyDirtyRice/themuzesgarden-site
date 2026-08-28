export type TimelineDawDownloadVerification = {
  verified: boolean;
  byteLength: number;
  actualChecksum: string;
  expectedChecksum: string;
};

export async function verifyTimelineDawDownloadedArtifact(
  bytes: Uint8Array,
  expectedChecksum: string,
): Promise<TimelineDawDownloadVerification> {
  const normalizedExpected = expectedChecksum.trim().toLowerCase();
  if (!/^sha256:[a-f0-9]{64}$/.test(normalizedExpected)) {
    throw new Error("Saved render checksum is invalid.");
  }
  const digest = await crypto.subtle.digest("SHA-256", bytes.slice().buffer);
  const actualChecksum = `sha256:${Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, "0")).join("")}`;
  return {
    verified: actualChecksum === normalizedExpected,
    byteLength: bytes.byteLength,
    actualChecksum,
    expectedChecksum: normalizedExpected,
  };
}
