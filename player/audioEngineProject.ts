import type { AnyTrack } from "./playerTypes";
import { fmtTime } from "./audioEngineHelpers";
import { logProjectActivity } from "../lib/projectActivity";

export function logProjectPlayIfPossible(args: {
  track: AnyTrack;
  onProjectPage: boolean;
  projectId: string;
  meta?: { sectionId?: string | null; startTime?: number };
}) {
  const { track, onProjectPage, projectId, meta } = args;

  if (!onProjectPage) return;

  const pid = String(projectId ?? "").trim();
  if (!pid) return;

  const detailParts: string[] = [];
  if (meta?.sectionId) detailParts.push(`section ${meta.sectionId}`);
  if (typeof meta?.startTime === "number" && Number.isFinite(meta.startTime)) {
    detailParts.push(`start ${fmtTime(meta.startTime)}`);
  }

  const detailSuffix = detailParts.length ? ` (${detailParts.join(" • ")})` : "";

  logProjectActivity(
    pid,
    "play",
    `Played track: ${track.title ?? "Untitled"}${detailSuffix}`,
    { trackId: String(track.id) }
  );
}