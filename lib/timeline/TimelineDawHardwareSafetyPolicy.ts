export type TimelineDawHardwareSourceType = "dynamic-microphone" | "condenser-microphone" | "ribbon-microphone" | "instrument" | "line-level";

export type TimelineDawHardwareSafetyAssessment = {
  sourceType: TimelineDawHardwareSourceType;
  phantomPower: "off" | "requested";
  status: "safe-to-test-signal" | "blocked";
  blockers: readonly string[];
  warnings: readonly string[];
  requiredConfirmations: readonly ["input-gain-down", "monitor-level-down", "cable-connected-before-power-change"];
  automaticPowerChangeAllowed: false;
  persistenceAllowed: false;
};

export function assessTimelineDawHardwareSafety(input: { sourceType: unknown; phantomPower: unknown; inputGainDown: unknown; monitorLevelDown: unknown; cableConnectedBeforePowerChange: unknown }): TimelineDawHardwareSafetyAssessment {
  const sourceType = String(input.sourceType).toLocaleLowerCase();
  if (!["dynamic-microphone", "condenser-microphone", "ribbon-microphone", "instrument", "line-level"].includes(sourceType)) throw new Error("Choose a supported microphone, instrument, or line-level source.");
  const phantomPower = String(input.phantomPower).toLocaleLowerCase();
  if (phantomPower !== "off" && phantomPower !== "requested") throw new Error("Choose phantom power off or requested.");
  const blockers = [
    ...(input.inputGainDown === true ? [] : ["Turn the selected input gain fully down."]),
    ...(input.monitorLevelDown === true ? [] : ["Turn headphone and monitor output levels down."]),
    ...(input.cableConnectedBeforePowerChange === true ? [] : ["Connect and confirm the cable before any phantom-power change."]),
    ...(sourceType === "ribbon-microphone" && phantomPower === "requested" ? ["Phantom power is blocked for this ribbon-microphone workflow."] : []),
    ...((sourceType === "instrument" || sourceType === "line-level" || sourceType === "dynamic-microphone") && phantomPower === "requested" ? ["Phantom power is not required for the selected source type."] : []),
    ...(sourceType === "condenser-microphone" && phantomPower === "off" ? ["This condenser-microphone workflow requires a separately confirmed phantom-power step."] : []),
  ];
  return {
    sourceType: sourceType as TimelineDawHardwareSourceType,
    phantomPower: phantomPower as TimelineDawHardwareSafetyAssessment["phantomPower"],
    status: blockers.length ? "blocked" : "safe-to-test-signal",
    blockers,
    warnings: ["Never connect or disconnect a microphone while phantom power is on.", "Raise input gain and monitoring levels slowly only after the signal path is verified."],
    requiredConfirmations: ["input-gain-down", "monitor-level-down", "cable-connected-before-power-change"],
    automaticPowerChangeAllowed: false,
    persistenceAllowed: false,
  };
}
