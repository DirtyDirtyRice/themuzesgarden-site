type DawSessionState = "draft" | "ready" | "active" | "suspended" | "closed";
type DawSessionAction = "validate" | "activate" | "suspend" | "resume" | "close";

export const TIMELINE_DAW_MUSICIAN_SESSION_STATE: Record<DawSessionState, { label: string; explanation: string }> = {
  draft: { label: "Setup needed", explanation: "Check the Studio setup once before recording or editing." },
  ready: { label: "Ready to open", explanation: "The Studio passed its checks. Open it for music work." },
  active: { label: "Ready for music", explanation: "Playback, recording, tracks, mixing, recovery, and export are available." },
  suspended: { label: "Paused safely", explanation: "Saved work is protected. Resume when you want to continue." },
  closed: { label: "Closed permanently", explanation: "This session cannot be reopened through the current Studio lifecycle." },
};

export const TIMELINE_DAW_MUSICIAN_ACTION: Record<DawSessionAction, { label: string; explanation: string; danger: boolean }> = {
  validate: { label: "Check Studio Setup", explanation: "Confirm that the session engines are prepared.", danger: false },
  activate: { label: "Open Music Tools", explanation: "Make this session active for recording and editing.", danger: false },
  suspend: { label: "Pause Session Safely", explanation: "Protect saved work and pause this session until later.", danger: false },
  resume: { label: "Continue This Session", explanation: "Return the paused session to music work.", danger: false },
  close: { label: "Close Session Permanently", explanation: "Remove it from active and recent sessions. It cannot currently be reopened.", danger: true },
};
