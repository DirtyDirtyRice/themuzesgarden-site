export const TIMELINE_DAW_LOCAL_ACTIVITY_EVENT = "muzes:daw-local-activity";

export type TimelineDawLocalActivity = {
  sessionId: string;
  recording: boolean;
  uploading: boolean;
};

export function createTimelineDawSafeExitView(input: {
  workspaceRevision: number;
  recording: boolean;
  uploading: boolean;
}) {
  const blocker = input.recording
    ? "Stop the active recording before leaving Studio."
    : input.uploading
      ? "Wait for the recorded take to finish saving before leaving Studio."
      : null;
  return {
    canExit: blocker === null,
    blocker,
    saveMessage: `Durable workspace revision ${Math.max(0, Math.floor(input.workspaceRevision))} is saved.`,
  };
}
