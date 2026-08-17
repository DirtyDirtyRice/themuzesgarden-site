export type TimelineDawSavedTakeListLoadState = "loading" | "ready" | "failed";

export function timelineDawSavedTakeListStatus(input: {
  state: TimelineDawSavedTakeListLoadState;
  takeCount: number;
}): { summary: string; guidance: string | null } {
  if (input.state === "loading") {
    return {
      summary: input.takeCount ? `Refreshing ${input.takeCount} saved take${input.takeCount === 1 ? "" : "s"}…` : "Loading saved takes…",
      guidance: input.takeCount ? "The visible recordings remain available while the list refreshes." : null,
    };
  }
  if (input.state === "failed") {
    return {
      summary: input.takeCount ? `${input.takeCount} previously loaded take${input.takeCount === 1 ? "" : "s"} still shown` : "Saved takes could not be confirmed",
      guidance: "Do not assume recordings are missing. Restore the connection if needed, then choose Reload Saved Takes.",
    };
  }
  return {
    summary: input.takeCount ? `${input.takeCount} saved take${input.takeCount === 1 ? "" : "s"}` : "No saved takes yet",
    guidance: input.takeCount ? null : "Record and save a take to begin building this session's performance list.",
  };
}
