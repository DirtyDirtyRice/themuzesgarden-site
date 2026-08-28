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
