export const TIMELINE_DAW_OWNER_DOWNLOAD_VERIFIED_EVENT = "the-muzes-garden:timeline-daw-owner-download-verified";
export const TIMELINE_DAW_OWNER_EDIT_PERFORMED_EVENT = "the-muzes-garden:timeline-daw-owner-edit-performed";

export type TimelineDawOwnerDownloadVerifiedDetail = {
  sessionId: string;
  jobId: string;
  checksum: string;
  verifiedAt: string;
};

export function createTimelineDawOwnerDownloadVerifiedDetail(input: TimelineDawOwnerDownloadVerifiedDetail) {
  const sessionId = clean(input.sessionId, "Session ID");
  const jobId = clean(input.jobId, "Render job ID");
  const checksum = input.checksum.trim().toLowerCase();
  if (!/^sha256:[a-f0-9]{64}$/.test(checksum)) throw new Error("Verified download checksum is invalid.");
  const verifiedAt = new Date(input.verifiedAt).toISOString();
  return { sessionId, jobId, checksum, verifiedAt } satisfies TimelineDawOwnerDownloadVerifiedDetail;
}

function clean(value: string, label: string) {
  const normalized = value.trim();
  if (!normalized || normalized.length > 200) throw new Error(`${label} is invalid.`);
  return normalized;
}
