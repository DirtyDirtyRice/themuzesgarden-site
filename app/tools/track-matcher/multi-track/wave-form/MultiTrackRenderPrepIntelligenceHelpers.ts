import type {
  MultiTrackRenderPrepFormat,
  MultiTrackRenderPrepItem,
  MultiTrackRenderPrepLane,
  MultiTrackRenderPrepReadinessStatus,
  MultiTrackRenderPrepRisk,
  MultiTrackRenderPrepSource,
  MultiTrackRenderPrepTarget,
  MultiTrackRenderPrepWorkspaceState,
} from "./MultiTrackRenderPrepIntelligenceTypes";

export function getMultiTrackRenderPrepStatusLabel(
  status: MultiTrackRenderPrepReadinessStatus,
): string {
  if (status === "ready") return "Ready";
  if (status === "needs-review") return "Needs Review";
  if (status === "blocked") return "Blocked";
  return "Future";
}

export function getMultiTrackRenderPrepStatusClass(
  status: MultiTrackRenderPrepReadinessStatus,
): string {
  if (status === "ready") return "border-white/40 bg-white/10 text-white";
  if (status === "needs-review") return "border-white/30 bg-black text-white/80";
  if (status === "blocked") return "border-white/20 bg-black text-white/70";
  return "border-white/10 bg-black text-white/60";
}

export function getMultiTrackRenderPrepTargetLabel(
  target: MultiTrackRenderPrepTarget,
): string {
  if (target === "wav-export") return "WAV Export";
  if (target === "mp3-export") return "MP3 Export";
  if (target === "stem-bounce") return "Stem Bounce";
  if (target === "hybrid-preview") return "Hybrid Preview";
  if (target === "suno-reference") return "Suno Reference";
  if (target === "metadata-package") return "Metadata Package";
  if (target === "project-package") return "Project Package";
  return "Future Render";
}

export function getMultiTrackRenderPrepSourceLabel(
  source: MultiTrackRenderPrepSource,
): string {
  if (source === "track-a") return "Track A";
  if (source === "track-b") return "Track B";
  if (source === "stem-plan") return "Stem Plan";
  if (source === "hybrid-builder") return "Hybrid Builder";
  if (source === "compatibility") return "Compatibility";
  if (source === "arrangement") return "Arrangement";
  if (source === "section") return "Section";
  if (source === "lineage") return "Lineage";
  if (source === "confidence") return "Confidence";
  if (source === "manual-review") return "Manual Review";
  return "Future AI";
}

export function getMultiTrackRenderPrepFormatLabel(
  format: MultiTrackRenderPrepFormat,
): string {
  if (format === "wav") return "WAV";
  if (format === "mp3") return "MP3";
  if (format === "aiff") return "AIFF";
  if (format === "flac") return "FLAC";
  if (format === "json") return "JSON";
  if (format === "text") return "Text";
  return "Future";
}

export function getMultiTrackRenderPrepRiskLabel(
  risk: MultiTrackRenderPrepRisk,
): string {
  if (risk === "missing-track") return "Missing Track";
  if (risk === "missing-stem") return "Missing Stem";
  if (risk === "missing-format") return "Missing Format";
  if (risk === "missing-confidence") return "Missing Confidence";
  if (risk === "missing-metadata") return "Missing Metadata";
  if (risk === "unverified-hybrid-plan") return "Unverified Hybrid Plan";
  if (risk === "manual-review-required") return "Manual Review Required";
  return "Future Only";
}

export function getMultiTrackRenderPrepItemById(
  items: MultiTrackRenderPrepItem[],
  itemId: string,
): MultiTrackRenderPrepItem | undefined {
  return items.find((item) => item.id === itemId);
}

export function getMultiTrackRenderPrepLaneItems(
  lane: MultiTrackRenderPrepLane,
  items: MultiTrackRenderPrepItem[],
): MultiTrackRenderPrepItem[] {
  return lane.itemIds
    .map((itemId) => getMultiTrackRenderPrepItemById(items, itemId))
    .filter((item): item is MultiTrackRenderPrepItem => Boolean(item));
}

export function getMultiTrackRenderPrepRiskSummary(
  risks: MultiTrackRenderPrepRisk[],
): string {
  if (risks.length === 0) return "No risks listed.";
  return risks.map(getMultiTrackRenderPrepRiskLabel).join(", ");
}

export function getMultiTrackRenderPrepReadyItemCount(
  items: MultiTrackRenderPrepItem[],
): number {
  return items.filter((item) => item.readinessStatus === "ready").length;
}

export function getMultiTrackRenderPrepReviewItemCount(
  items: MultiTrackRenderPrepItem[],
): number {
  return items.filter((item) => item.readinessStatus === "needs-review").length;
}

export function getMultiTrackRenderPrepFutureItemCount(
  items: MultiTrackRenderPrepItem[],
): number {
  return items.filter((item) => item.readinessStatus === "future").length;
}

export function getMultiTrackRenderPrepWavItemCount(
  items: MultiTrackRenderPrepItem[],
): number {
  return items.filter((item) => item.format === "wav").length;
}

export function getMultiTrackRenderPrepWorkspaceSummary(
  workspace: MultiTrackRenderPrepWorkspaceState,
): string {
  const readyItems = getMultiTrackRenderPrepReadyItemCount(workspace.items);
  const reviewItems = getMultiTrackRenderPrepReviewItemCount(workspace.items);
  const futureItems = getMultiTrackRenderPrepFutureItemCount(workspace.items);
  const wavItems = getMultiTrackRenderPrepWavItemCount(workspace.items);

  return `${readyItems} ready items, ${reviewItems} review items, ${futureItems} future items, and ${wavItems} WAV-first paths.`;
}