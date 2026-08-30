export type TimelineDawHardwareRequirement = "audio-interface" | "input-source" | "correct-cable" | "monitoring-output";
export type TimelineDawHardwareTask = "analog-capture" | "analog-monitoring" | "analog-round-trip";

export type TimelineDawHardwareFallbackPlan = {
  task: TimelineDawHardwareTask;
  status: "digital-work-available" | "fully-deferred";
  missing: readonly TimelineDawHardwareRequirement[];
  digitalWorkAllowed: boolean;
  digitalFallback: string | null;
  deferredInstructions: readonly string[];
  completionClaimAllowed: false;
  automaticSubstitutionAllowed: false;
  persistenceAllowed: false;
};

const TASK_LABELS: Record<TimelineDawHardwareTask, string> = {
  "analog-capture": "analog capture",
  "analog-monitoring": "analog monitoring",
  "analog-round-trip": "analog round-trip measurement",
};

export function createTimelineDawHardwareFallbackPlan(input: { task: unknown; missing: unknown; allowDigitalFallback: unknown }): TimelineDawHardwareFallbackPlan {
  const task = String(input.task) as TimelineDawHardwareTask;
  if (!Object.hasOwn(TASK_LABELS, task)) throw new Error("Choose the analog task that cannot continue.");
  if (!Array.isArray(input.missing)) throw new Error("Choose at least one missing hardware requirement.");
  const allowed: TimelineDawHardwareRequirement[] = ["audio-interface", "input-source", "correct-cable", "monitoring-output"];
  const missing = [...new Set(input.missing.map(String))] as TimelineDawHardwareRequirement[];
  if (!missing.length || missing.some((item) => !allowed.includes(item))) throw new Error("Choose at least one valid missing hardware requirement.");
  const digitalWorkAllowed = input.allowDigitalFallback === true;
  const digitalFallback = digitalWorkAllowed
    ? task === "analog-capture"
      ? "Continue arranging, MIDI editing, lyric planning, or private digital drafts; import the real analog performance later."
      : task === "analog-monitoring"
        ? "Continue with a private digital audition through an available safe output; approve analog monitoring later."
        : "Continue digital editing without analog latency compensation; measure and apply the offset only after a real loopback exists."
    : null;
  return {
    task,
    status: digitalWorkAllowed ? "digital-work-available" : "fully-deferred",
    missing,
    digitalWorkAllowed,
    digitalFallback,
    deferredInstructions: [
      `Keep ${TASK_LABELS[task]} marked NOT COMPLETED.`,
      `Obtain or connect: ${missing.map((item) => item.replaceAll("-", " ")).join(", ")}.`,
      "Return to Studio hardware inventory and detect the connected devices.",
      "Repeat the safety gate and four-part signal preflight before resuming.",
      ...(task === "analog-round-trip" ? ["Verify the physical loopback, take at least three measurements, and approve the measured offset."] : []),
    ],
    completionClaimAllowed: false,
    automaticSubstitutionAllowed: false,
    persistenceAllowed: false,
  };
}
