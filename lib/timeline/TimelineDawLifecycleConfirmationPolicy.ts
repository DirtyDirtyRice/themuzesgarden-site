export type TimelineDawConfirmedLifecycleAction = "suspend" | "close";

export function createTimelineDawLifecycleConfirmation(action: TimelineDawConfirmedLifecycleAction, sessionName: string) {
  const name = sessionName.trim() || "this session";
  return action === "suspend"
    ? {
        title: `Suspend ${name}?`,
        message: "This pauses the session lifecycle until you explicitly resume it. Saved audio, edits, transport, and source artifacts are not deleted.",
        confirmLabel: "Suspend session",
      }
    : {
        title: `Permanently close ${name}?`,
        message: "The session will leave all recent and resume lists and cannot be reopened through the current lifecycle. Saved audio and source artifacts are not deleted.",
        confirmLabel: "Close session permanently",
      };
}
