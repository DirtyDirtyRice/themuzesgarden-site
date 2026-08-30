export type TimelineDawHardwareSetupStep = {
  id: string;
  instruction: string;
  requiresHumanConfirmation: true;
  automaticActionAllowed: false;
};

export type TimelineDawHardwareSetupGuide = {
  sourceLabel: string;
  interfaceLabel: string;
  inputChannel: number;
  cableType: "xlr" | "trs" | "ts";
  route: "direct" | "patch-bay";
  steps: readonly TimelineDawHardwareSetupStep[];
  currentStepIndex: number;
  status: "waiting-for-human-action" | "physical-setup-complete-pending-signal-verification";
  persistenceAllowed: false;
};

function label(value: unknown, field: string) {
  const normalized = typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
  if (normalized.length < 2 || normalized.length > 120) throw new Error(`${field} must be 2 to 120 characters.`);
  return normalized;
}

export function createTimelineDawHardwareSetupGuide(input: { sourceLabel: unknown; interfaceLabel: unknown; inputChannel: unknown; cableType: unknown; route: unknown }): TimelineDawHardwareSetupGuide {
  const sourceLabel = label(input.sourceLabel, "Source name");
  const interfaceLabel = label(input.interfaceLabel, "Interface name");
  const inputChannel = Number(input.inputChannel);
  if (!Number.isSafeInteger(inputChannel) || inputChannel < 1 || inputChannel > 128) throw new Error("Interface input must be a whole channel number from 1 to 128.");
  const cableType = String(input.cableType).toLocaleLowerCase();
  if (!["xlr", "trs", "ts"].includes(cableType)) throw new Error("Choose XLR, TRS, or TS as the cable type.");
  const route = String(input.route).toLocaleLowerCase();
  if (route !== "direct" && route !== "patch-bay") throw new Error("Choose a direct or patch-bay route.");
  const steps: TimelineDawHardwareSetupStep[] = [
    { id: "lower-input-gain", instruction: `Turn ${interfaceLabel} input ${inputChannel} gain fully down.`, requiresHumanConfirmation: true, automaticActionAllowed: false },
    ...(route === "patch-bay" ? [
      { id: "source-to-patch", instruction: `Connect ${sourceLabel} to the intended patch-bay input using the ${cableType.toUpperCase()} cable.`, requiresHumanConfirmation: true as const, automaticActionAllowed: false as const },
      { id: "patch-to-interface", instruction: `Patch that signal to ${interfaceLabel} input ${inputChannel}.`, requiresHumanConfirmation: true as const, automaticActionAllowed: false as const },
    ] : [
      { id: "source-to-interface", instruction: `Connect ${sourceLabel} directly to ${interfaceLabel} input ${inputChannel} using the ${cableType.toUpperCase()} cable.`, requiresHumanConfirmation: true as const, automaticActionAllowed: false as const },
    ]),
    { id: "connect-interface", instruction: `Confirm ${interfaceLabel} is connected to this computer and recognized by Chrome.`, requiresHumanConfirmation: true, automaticActionAllowed: false },
    { id: "select-input", instruction: `Select ${interfaceLabel} input ${inputChannel} in the DAW recording input menu.`, requiresHumanConfirmation: true, automaticActionAllowed: false },
  ];
  return { sourceLabel, interfaceLabel, inputChannel, cableType: cableType as TimelineDawHardwareSetupGuide["cableType"], route: route as TimelineDawHardwareSetupGuide["route"], steps, currentStepIndex: 0, status: "waiting-for-human-action", persistenceAllowed: false };
}

export function advanceTimelineDawHardwareSetupGuide(guide: TimelineDawHardwareSetupGuide, humanConfirmed: boolean): TimelineDawHardwareSetupGuide {
  if (!humanConfirmed) throw new Error("Confirm that the current physical step is complete before continuing.");
  if (guide.status !== "waiting-for-human-action") return guide;
  const currentStepIndex = Math.min(guide.steps.length, guide.currentStepIndex + 1);
  return { ...guide, currentStepIndex, status: currentStepIndex >= guide.steps.length ? "physical-setup-complete-pending-signal-verification" : "waiting-for-human-action" };
}
