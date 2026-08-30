export type TimelineDawPhysicalActionCheckpoint = {
  instruction: string;
  status: "paused-for-human" | "ready-to-resume";
  physicalActionConfirmed: boolean;
  verification: "not-verified" | "signal-detected" | "connection-confirmed" | "hardware-indicator-confirmed";
  verificationNote: string;
  resumeAllowed: boolean;
  automaticHardwareActionAllowed: false;
  persistenceAllowed: false;
};

export function createTimelineDawPhysicalActionCheckpoint(instructionInput: unknown): TimelineDawPhysicalActionCheckpoint {
  const instruction = String(instructionInput ?? "").replace(/\s+/g, " ").trim();
  if (instruction.length < 8) throw new Error("Describe one exact physical action before pausing.");
  if (instruction.length > 240) throw new Error("Keep the physical action to 240 characters or fewer.");
  return { instruction, status: "paused-for-human", physicalActionConfirmed: false, verification: "not-verified", verificationNote: "", resumeAllowed: false, automaticHardwareActionAllowed: false, persistenceAllowed: false };
}

export function verifyTimelineDawPhysicalActionCheckpoint(input: {
  checkpoint: TimelineDawPhysicalActionCheckpoint;
  physicalActionConfirmed: unknown;
  verification: unknown;
  verificationNote: unknown;
}): TimelineDawPhysicalActionCheckpoint {
  if (input.checkpoint.status !== "paused-for-human") return input.checkpoint;
  if (input.physicalActionConfirmed !== true) throw new Error("Confirm that you completed the exact physical action.");
  const verification = String(input.verification) as TimelineDawPhysicalActionCheckpoint["verification"];
  if (!["signal-detected", "connection-confirmed", "hardware-indicator-confirmed"].includes(verification)) throw new Error("Choose how the physical action was verified.");
  const verificationNote = String(input.verificationNote ?? "").replace(/\s+/g, " ").trim();
  if (verificationNote.length < 4) throw new Error("Add a short verification note before resuming.");
  if (verificationNote.length > 240) throw new Error("Keep the verification note to 240 characters or fewer.");
  return { ...input.checkpoint, status: "ready-to-resume", physicalActionConfirmed: true, verification, verificationNote, resumeAllowed: true };
}
