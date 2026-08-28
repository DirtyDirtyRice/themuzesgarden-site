export type TimelineDawDownloadVerification = {
  verified: boolean;
  byteLength: number;
  actualChecksum: string;
  expectedChecksum: string;
};

export type TimelineDawDownloadVerificationReceipt = {
  schema: "the-muzes-garden/daw-download-verification/v1";
  sessionId: string;
  jobId: string;
  target: "mix" | "stem" | "selection";
  fileName: string;
  byteLength: number;
  checksum: string;
  verifiedAt: string;
  containsAudio: false;
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

export function createTimelineDawDownloadVerificationReceipt(input: {
  sessionId: string;
  jobId: string;
  target: "mix" | "stem" | "selection";
  fileName: string;
  byteLength: number;
  checksum: string;
  verifiedAt: string;
}): TimelineDawDownloadVerificationReceipt {
  const sessionId = clean(input.sessionId, "Session ID", 200);
  const jobId = clean(input.jobId, "Render job ID", 200);
  const fileName = clean(input.fileName, "Downloaded filename", 240);
  const checksum = input.checksum.trim().toLowerCase();
  if (!/^sha256:[a-f0-9]{64}$/.test(checksum)) throw new Error("Verified render checksum is invalid.");
  if (!Number.isSafeInteger(input.byteLength) || input.byteLength < 1) throw new Error("Verified download size is invalid.");
  const verifiedAt = new Date(input.verifiedAt).toISOString();
  return { schema: "the-muzes-garden/daw-download-verification/v1", sessionId, jobId, target: input.target, fileName, byteLength: input.byteLength, checksum, verifiedAt, containsAudio: false };
}

function clean(value: string, label: string, maximum: number) {
  const normalized = value.trim();
  if (!normalized || normalized.length > maximum) throw new Error(`${label} is invalid.`);
  return normalized;
}
