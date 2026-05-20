import type { TrackMatcherProPitchRuntimeState } from "../trackMatcherProPitchDspRuntime";
import type {
  ControllerReadinessStatus,
  SyncStatus,
} from "./trackMatcherControllerTypes";

export function formatSignedSeconds(value: number) {
  const cleanValue = Number.isFinite(value) ? value : 0;
  const prefix = cleanValue > 0 ? "+" : "";

  return `${prefix}${cleanValue.toFixed(3)}s`;
}

export function formatSignedNumber(value: number) {
  const cleanValue = Number.isFinite(value) ? value : 0;
  const prefix = cleanValue > 0 ? "+" : "";

  return `${prefix}${cleanValue.toFixed(3)}`;
}

export function getSyncStatusLabel(status: SyncStatus) {
  if (status === "locked") return "Locked";
  if (status === "adjusting") return "Adjusting";
  if (status === "drifting") return "Drifting";

  return "Idle";
}

export function getSyncStatusDetail(status: SyncStatus) {
  if (status === "locked") return "Track B is staying close to Track A.";
  if (status === "adjusting")
    return "Track B is being softly corrected toward Track A.";
  if (status === "drifting")
    return "Track B is far enough away that sync is correcting harder.";

  return "Turn on Auto Sync and play both tracks to read live sync movement.";
}

export function getSyncStatusClasses(status: SyncStatus) {
  if (status === "locked")
    return "border-emerald-300/30 bg-emerald-300/10 text-emerald-100";
  if (status === "adjusting")
    return "border-yellow-300/30 bg-yellow-300/10 text-yellow-100";
  if (status === "drifting")
    return "border-rose-300/30 bg-rose-300/10 text-rose-100";

  return "border-white/10 bg-white/5 text-white/70";
}

export function getRuntimeStatusLabel(
  status: TrackMatcherProPitchRuntimeState["status"],
) {
  if (status === "ready") return "Ready";
  if (status === "loading") return "Loading";
  if (status === "unsupported") return "Unsupported";
  if (status === "failed") return "Failed";

  return "Idle";
}

export function getRuntimeStatusDetail(
  status: TrackMatcherProPitchRuntimeState["status"],
) {
  if (status === "ready") {
    return "Decoded and ready for Pro Pitch DSP.";
  }

  if (status === "loading") {
    return "Preparing the decoded audio buffer for pitch-stable playback.";
  }

  if (status === "unsupported") {
    return "This browser or file cannot use the Pro Pitch DSP path yet.";
  }

  if (status === "failed") {
    return "DSP preparation failed. Browser playback remains available.";
  }

  return "Load a file to prepare Pro Pitch DSP.";
}

export function getDeckFileLabel(trackName: string) {
  const cleanName = trackName.trim();

  if (!cleanName) {
    return "No file loaded";
  }

  return cleanName;
}

export function getReadinessStatus({
  fileLoaded,
  runtimeStatus,
  canUseProPitch,
}: {
  fileLoaded: boolean;
  runtimeStatus: TrackMatcherProPitchRuntimeState["status"];
  canUseProPitch: boolean;
}): ControllerReadinessStatus {
  if (!fileLoaded) return "empty";
  if (runtimeStatus === "loading") return "loading";
  if (runtimeStatus === "failed") return "failed";
  if (runtimeStatus === "unsupported") return "browser-only";
  if (canUseProPitch) return "pro-pitch-ready";

  return "browser-only";
}

export function getReadinessLabel(status: ControllerReadinessStatus) {
  if (status === "pro-pitch-ready") return "Pro Pitch Ready";
  if (status === "browser-only") return "Browser Fallback";
  if (status === "loading") return "Preparing DSP";
  if (status === "failed") return "DSP Failed";

  return "Waiting for File";
}

export function getReadinessClasses(status: ControllerReadinessStatus) {
  if (status === "pro-pitch-ready") {
    return "border-emerald-300/25 bg-emerald-300/10 text-emerald-100";
  }

  if (status === "loading") {
    return "border-sky-300/25 bg-sky-300/10 text-sky-100";
  }

  if (status === "failed") {
    return "border-rose-300/25 bg-rose-300/10 text-rose-100";
  }

  if (status === "browser-only") {
    return "border-yellow-300/25 bg-yellow-300/10 text-yellow-100";
  }

  return "border-white/10 bg-white/5 text-white/60";
}
