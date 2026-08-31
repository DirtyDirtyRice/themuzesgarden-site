export const TIMELINE_DAW_CHROME_MIDI_QA_CHECKS = [
  "midi-access-permission", "physical-device-identity", "note-on-off", "velocity-and-channel", "clock-and-input-timing", "controller-events", "piano-roll-edit-and-quantize", "instrument-preview", "preset-automation-recall", "disconnect-reconnect", "session-reopen", "midi-export-reimport",
] as const;
export type TimelineDawChromeMidiQaCheck = (typeof TIMELINE_DAW_CHROME_MIDI_QA_CHECKS)[number];
export const TIMELINE_DAW_CHROME_MIDI_QA_LABELS: Record<TimelineDawChromeMidiQaCheck, string> = {
  "midi-access-permission": "Chrome grants Web MIDI access without an unexpected warning",
  "physical-device-identity": "The intended physical MIDI controller is identified by name",
  "note-on-off": "Real note-on and note-off messages produce and release the intended notes",
  "velocity-and-channel": "Velocity and MIDI-channel routing respond correctly",
  "clock-and-input-timing": "Recorded input and transport timing stay inside the production tolerance",
  "controller-events": "Sustain, modulation, pitch bend, and assigned controls respond correctly",
  "piano-roll-edit-and-quantize": "Captured notes edit, quantize, undo, and redo correctly",
  "instrument-preview": "The selected qualified instrument previews without stuck or missing voices",
  "preset-automation-recall": "Preset, program, controller, and automation state survive reopen",
  "disconnect-reconnect": "Disconnecting and reconnecting the physical controller recovers safely",
  "session-reopen": "Saved MIDI clips and routing survive a Chrome refresh and session reopen",
  "midi-export-reimport": "Exported MIDI reimports with the approved notes, timing, channels, and events",
};

export function identifyTimelineDawGoogleChrome(userAgent: string) {
  const value = userAgent.trim();
  if (!value || /Edg\//i.test(value) || /OPR\//i.test(value) || /SamsungBrowser\//i.test(value)) return null;
  const match = value.match(/(?:Chrome|CriOS)\/([0-9]+(?:\.[0-9.]+)?)/i);
  return match ? { browser: "Google Chrome" as const, version: match[1] } : null;
}

export function assessTimelineDawChromeMidiProductionQa(input: {
  userAgent: string;
  deviceName: string;
  evidence: Partial<Record<TimelineDawChromeMidiQaCheck, "pass" | "issue">>;
}) {
  const chrome = identifyTimelineDawGoogleChrome(input.userAgent);
  const deviceName = input.deviceName.trim();
  const passedChecks = TIMELINE_DAW_CHROME_MIDI_QA_CHECKS.filter((check) => input.evidence[check] === "pass");
  const issues = TIMELINE_DAW_CHROME_MIDI_QA_CHECKS.filter((check) => input.evidence[check] === "issue");
  const remainingChecks = TIMELINE_DAW_CHROME_MIDI_QA_CHECKS.filter((check) => input.evidence[check] !== "pass");
  const identityComplete = Boolean(chrome && deviceName);
  const productionEvidenceComplete = identityComplete && issues.length === 0 && remainingChecks.length === 0;
  const status = !chrome ? "chrome-required" as const : !deviceName ? "hardware-required" as const : issues.length ? "needs-review" as const : productionEvidenceComplete ? "passed" as const : "in-progress" as const;
  return { status, chrome, deviceName: deviceName || null, evidence: { ...input.evidence }, passedChecks, issues, remainingChecks, productionEvidenceComplete, realHardwareEvidenceComplete: productionEvidenceComplete, sourceMidiPreserved: true as const };
}
