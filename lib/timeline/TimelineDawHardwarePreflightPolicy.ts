export type TimelineDawHardwareClockSource = "internal" | "external-word-clock" | "digital-input";
export type TimelineDawHardwareSyncMode = "free-run" | "word-clock" | "adat" | "spdif";
export type TimelineDawHardwareSampleRate = 44_100 | 48_000 | 88_200 | 96_000 | 192_000;

export type TimelineDawHardwarePreflightCheck = {
  id: "gain" | "clock" | "sample-rate" | "synchronization";
  status: "pass" | "hold";
  message: string;
};

export type TimelineDawHardwarePreflight = {
  status: "ready" | "held";
  checks: readonly TimelineDawHardwarePreflightCheck[];
  captureAllowed: boolean;
  automaticCaptureAllowed: false;
  persistenceAllowed: false;
};

const SAMPLE_RATES: readonly TimelineDawHardwareSampleRate[] = [44_100, 48_000, 88_200, 96_000, 192_000];

export function assessTimelineDawHardwarePreflight(input: {
  gainPeakDbfs: unknown;
  clockSource: unknown;
  clockLocked: unknown;
  interfaceSampleRate: unknown;
  sessionSampleRate: unknown;
  synchronization: unknown;
  synchronizationConfirmed: unknown;
}): TimelineDawHardwarePreflight {
  const gainPeakDbfs = Number(input.gainPeakDbfs);
  if (!Number.isFinite(gainPeakDbfs) || gainPeakDbfs > 0 || gainPeakDbfs < -120) throw new Error("Enter a measured peak between −120 and 0 dBFS.");
  const clockSource = String(input.clockSource) as TimelineDawHardwareClockSource;
  if (!["internal", "external-word-clock", "digital-input"].includes(clockSource)) throw new Error("Choose a supported clock source.");
  const interfaceSampleRate = Number(input.interfaceSampleRate) as TimelineDawHardwareSampleRate;
  const sessionSampleRate = Number(input.sessionSampleRate) as TimelineDawHardwareSampleRate;
  if (!SAMPLE_RATES.includes(interfaceSampleRate) || !SAMPLE_RATES.includes(sessionSampleRate)) throw new Error("Choose supported interface and session sample rates.");
  const synchronization = String(input.synchronization) as TimelineDawHardwareSyncMode;
  if (!["free-run", "word-clock", "adat", "spdif"].includes(synchronization)) throw new Error("Choose a supported synchronization mode.");

  const requiredSync: Record<TimelineDawHardwareClockSource, readonly TimelineDawHardwareSyncMode[]> = {
    internal: ["free-run"],
    "external-word-clock": ["word-clock"],
    "digital-input": ["adat", "spdif"],
  };
  const checks: TimelineDawHardwarePreflightCheck[] = [
    gainPeakDbfs >= -18 && gainPeakDbfs <= -6
      ? { id: "gain", status: "pass", message: `Peak ${gainPeakDbfs.toFixed(1)} dBFS is inside the −18 to −6 dBFS target.` }
      : { id: "gain", status: "hold", message: gainPeakDbfs > -6 ? "Peak is too high. Lower analog input gain before continuing." : "Peak is too low. Raise analog input gain slowly and measure again." },
    input.clockLocked === true
      ? { id: "clock", status: "pass", message: `${clockSource.replaceAll("-", " ")} clock is reported locked.` }
      : { id: "clock", status: "hold", message: "Clock lock has not been confirmed. Do not capture yet." },
    interfaceSampleRate === sessionSampleRate
      ? { id: "sample-rate", status: "pass", message: `Interface and session both use ${(sessionSampleRate / 1000).toFixed(1)} kHz.` }
      : { id: "sample-rate", status: "hold", message: "Interface and session sample rates do not match." },
    requiredSync[clockSource].includes(synchronization) && input.synchronizationConfirmed === true
      ? { id: "synchronization", status: "pass", message: `${synchronization.replaceAll("-", " ")} synchronization is compatible and human-confirmed.` }
      : { id: "synchronization", status: "hold", message: `Use ${requiredSync[clockSource].join(" or ").replaceAll("-", " ")} synchronization and confirm it on the hardware.` },
  ];
  const captureAllowed = checks.every((check) => check.status === "pass");
  return { status: captureAllowed ? "ready" : "held", checks, captureAllowed, automaticCaptureAllowed: false, persistenceAllowed: false };
}
