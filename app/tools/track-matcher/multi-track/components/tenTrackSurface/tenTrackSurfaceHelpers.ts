import type {
  TenTrackSlot,
  TrackColorLabel,
  TrackSourceType,
  TrackVerdict,
} from "./tenTrackSurfaceTypes";

export function getVerdictLabel(verdict: TrackVerdict) {
  if (verdict === "keeper") return "KEEPER";
  if (verdict === "reject") return "REJECT";
  if (verdict === "review") return "REVIEW";
  return "UNDECIDED";
}

export function getLoadedState(slot: TenTrackSlot) {
  return (
    slot.title.trim().length > 0 ||
    slot.versionName.trim().length > 0 ||
    slot.audioFileName.trim().length > 0
  );
}

export function getAverageScore(slots: TenTrackSlot[], key: keyof TenTrackSlot) {
  const loadedSlots = slots.filter(getLoadedState);

  if (loadedSlots.length === 0) return 0;

  const total = loadedSlots.reduce((sum, slot) => {
    const value = slot[key];
    return typeof value === "number" ? sum + value : sum;
  }, 0);

  return Math.round(total / loadedSlots.length);
}

export function getScoreLabel(score: number) {
  if (score >= 85) return "ELITE";
  if (score >= 70) return "HIGH";
  if (score >= 50) return "MEDIUM";
  if (score >= 30) return "LOW";
  return "WEAK";
}

export function getColorLabelText(colorLabel: TrackColorLabel) {
  if (colorLabel === "blue") return "BLUE";
  if (colorLabel === "green") return "GREEN";
  if (colorLabel === "yellow") return "YELLOW";
  if (colorLabel === "orange") return "ORANGE";
  if (colorLabel === "purple") return "PURPLE";
  if (colorLabel === "red") return "RED";
  if (colorLabel === "pink") return "PINK";
  return "WHITE";
}

export function getSourceTypeLabel(sourceType: TrackSourceType) {
  if (sourceType === "library") return "Library";
  if (sourceType === "upload") return "Upload";
  if (sourceType === "track-a") return "Track A";
  if (sourceType === "track-b") return "Track B";
  if (sourceType === "suno") return "Suno";
  if (sourceType === "stem") return "Stem";
  if (sourceType === "manual") return "Manual";
  return "Empty";
}

export function clampScore(value: number) {
  if (Number.isNaN(value)) return 0;
  return Math.min(100, Math.max(0, value));
}