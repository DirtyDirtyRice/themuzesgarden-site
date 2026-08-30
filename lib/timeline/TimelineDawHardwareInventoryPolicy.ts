export type TimelineDawDetectedHardwareDevice = {
  deviceId: string;
  groupId: string;
  kind: "audioinput" | "audiooutput";
  label: string;
};

export type TimelineDawHardwareInventoryItem = TimelineDawDetectedHardwareDevice & {
  displayName: string;
  role: "input" | "output";
  connection: "browser-detected";
};

export type TimelineDawHardwareInventory = {
  status: "detected" | "labels-hidden" | "held-no-devices";
  items: readonly TimelineDawHardwareInventoryItem[];
  inputCount: number;
  outputCount: number;
  hiddenLabelCount: number;
  physicalConnectionsVerified: false;
  persistenceAllowed: false;
  warnings: readonly string[];
};

export function createTimelineDawHardwareInventory(devices: readonly TimelineDawDetectedHardwareDevice[]): TimelineDawHardwareInventory {
  const usable = devices.filter((device) => device.kind === "audioinput" || device.kind === "audiooutput");
  const seen = new Set<string>();
  const items = usable.flatMap((device, index) => {
    const key = `${device.kind}:${device.deviceId}`;
    if (seen.has(key)) return [];
    seen.add(key);
    const label = device.label.trim().replace(/\s+/g, " ").slice(0, 200);
    return [{ ...device, label, displayName: label || `${device.kind === "audioinput" ? "Audio input" : "Audio output"} ${index + 1}`, role: device.kind === "audioinput" ? "input" as const : "output" as const, connection: "browser-detected" as const }];
  });
  const inputCount = items.filter((item) => item.role === "input").length;
  const outputCount = items.filter((item) => item.role === "output").length;
  const hiddenLabelCount = items.filter((item) => !item.label).length;
  const status = items.length === 0 ? "held-no-devices" : hiddenLabelCount === items.length ? "labels-hidden" : "detected";
  return {
    status, items, inputCount, outputCount, hiddenLabelCount,
    physicalConnectionsVerified: false,
    persistenceAllowed: false,
    warnings: [
      ...(items.length === 0 ? ["No browser audio devices were detected."] : []),
      ...(hiddenLabelCount ? ["Some device names are hidden until browser microphone permission is granted."] : []),
      "Browser detection cannot verify cables, patch bays, phantom power, speakers, or analog signal flow.",
    ],
  };
}
