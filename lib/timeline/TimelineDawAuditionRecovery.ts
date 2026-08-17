export const TIMELINE_DAW_AUDITION_AUTO_REFRESH_LIMIT = 1;

export function decideTimelineDawAuditionRecovery(input: {
  automaticRefreshAttempts: number;
  online: boolean;
}): { refresh: boolean; guidance: string } {
  if (!input.online) {
    return { refresh: false, guidance: "Playback could not reconnect while the browser is offline. Restore the connection, then choose Refresh Audition." };
  }
  if (input.automaticRefreshAttempts >= TIMELINE_DAW_AUDITION_AUTO_REFRESH_LIMIT) {
    return { refresh: false, guidance: "Playback still failed after refreshing the private audition link. Choose Refresh Audition to try again." };
  }
  return { refresh: true, guidance: "The private audition link expired or failed. Refreshing it once and retrying playback." };
}
