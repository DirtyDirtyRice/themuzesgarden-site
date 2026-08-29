export type TimelineDawArmedInputRoute = {
  id: string;
  trackName: string;
  inputId: string;
  inputLabel: string;
};

export type TimelineDawMultiTrackRecordingPlanResult = {
  ready: boolean;
  routes: TimelineDawArmedInputRoute[];
  errors: string[];
};

export type TimelineDawMultiInputReadinessResult = {
  ready: boolean;
  maximumStartSkewMs: number;
  errors: string[];
};

export function synchronizeTimelineDawCapturedChannels<T extends { trackName: string; channels: Float32Array[] }>(captures: T[]): Array<T & { frameCount: number }> {
  if (captures.length < 2) throw new Error("At least two input captures are required.");
  if (captures.some((capture) => !capture.channels.length || !capture.channels[0]?.length)) throw new Error("Every input capture must contain audio.");
  const frameCount = Math.min(...captures.map((capture) => capture.channels[0].length));
  return captures.map((capture) => {
    if (capture.channels.some((channel) => channel.length < frameCount)) throw new Error(`${capture.trackName} contains mismatched channel lengths.`);
    return { ...capture, channels: capture.channels.map((channel) => channel.slice(0, frameCount)), frameCount };
  });
}

export function createTimelineDawArmedInputRoute(input: TimelineDawArmedInputRoute): TimelineDawArmedInputRoute {
  return {
    id: input.id.trim(),
    trackName: input.trackName.trim(),
    inputId: input.inputId.trim(),
    inputLabel: input.inputLabel.trim() || "Audio input",
  };
}

export function assessTimelineDawMultiTrackRecordingPlan(input: {
  routes: TimelineDawArmedInputRoute[];
  availableInputIds: string[];
  maximumRoutes?: number;
}): TimelineDawMultiTrackRecordingPlanResult {
  const maximumRoutes = Math.max(1, Math.floor(input.maximumRoutes ?? 16));
  const available = new Set(input.availableInputIds.filter(Boolean));
  const errors: string[] = [];

  if (!input.routes.length) errors.push("Arm at least one recording track.");
  if (input.routes.length > maximumRoutes) errors.push(`A maximum of ${maximumRoutes} recording tracks can be armed at once.`);

  const trackNames = new Set<string>();
  const inputIds = new Set<string>();
  for (const route of input.routes) {
    const normalizedTrackName = route.trackName.trim().toLocaleLowerCase();
    if (!normalizedTrackName) errors.push("Every armed route needs a track name.");
    else if (trackNames.has(normalizedTrackName)) errors.push(`Track name “${route.trackName.trim()}” is armed more than once.`);
    else trackNames.add(normalizedTrackName);

    if (!route.inputId.trim()) errors.push(`Choose an input for ${route.trackName.trim() || "the unnamed track"}.`);
    else if (!available.has(route.inputId)) errors.push(`${route.inputLabel} is no longer connected.`);
    else if (inputIds.has(route.inputId)) errors.push(`${route.inputLabel} is already routed to another armed track.`);
    else inputIds.add(route.inputId);
  }

  return { ready: errors.length === 0, routes: input.routes, errors: [...new Set(errors)] };
}

export function assessTimelineDawMultiInputReadiness(input: {
  measurements: Array<{ trackName: string; peakDbfs: number; startedAtMs: number }>;
  expectedRouteCount: number;
  maximumStartSkewMs?: number;
}): TimelineDawMultiInputReadinessResult {
  const errors: string[] = [];
  if (input.measurements.length !== input.expectedRouteCount) errors.push("Not every armed input opened successfully.");
  for (const measurement of input.measurements) {
    if (!Number.isFinite(measurement.peakDbfs) || measurement.peakDbfs < -60) errors.push(`${measurement.trackName} did not receive a usable signal.`);
  }
  const starts = input.measurements.map((measurement) => measurement.startedAtMs).filter(Number.isFinite);
  const maximumStartSkewMs = starts.length > 1 ? Math.max(...starts) - Math.min(...starts) : 0;
  const allowedSkew = Math.max(1, input.maximumStartSkewMs ?? 50);
  if (maximumStartSkewMs > allowedSkew) errors.push(`Inputs opened ${maximumStartSkewMs.toFixed(1)} ms apart; the safe limit is ${allowedSkew} ms.`);
  return { ready: errors.length === 0, maximumStartSkewMs, errors: [...new Set(errors)] };
}
