export type TimelineDawRecordingStorageHealth = {
  supported: boolean;
  persisted: boolean;
  availableBytes: number | null;
  estimatedTakeBytes: number;
  safeMinutes: number | null;
  status: "ready" | "warning" | "unknown";
  recommendation: string;
};

export function assessTimelineDawRecordingStorage(input: {
  supported: boolean; persisted: boolean; quotaBytes: number | null; usageBytes: number | null;
  maxTakeMinutes: number; sampleRate?: number; channelCount?: number;
}): TimelineDawRecordingStorageHealth {
  const sampleRate = Math.max(8_000, Math.min(192_000, Math.round(input.sampleRate ?? 48_000)));
  const channelCount = Math.max(1, Math.min(2, Math.round(input.channelCount ?? 2)));
  const minutes = Math.max(1, Math.min(30, Math.round(input.maxTakeMinutes)));
  const bytesPerMinute = sampleRate * channelCount * 4 * 60;
  const estimatedTakeBytes = bytesPerMinute * minutes;
  if (!input.supported || input.quotaBytes === null || input.usageBytes === null) return { supported: input.supported, persisted: input.persisted, availableBytes: null, estimatedTakeBytes, safeMinutes: null, status: "unknown", recommendation: "Browser storage capacity could not be estimated. Download recovery WAVs before leaving Studio." };
  const availableBytes = Math.max(0, input.quotaBytes - input.usageBytes);
  const safeMinutes = Math.max(0, Math.floor((availableBytes * 0.8) / bytesPerMinute));
  if (safeMinutes < minutes) return { supported: true, persisted: input.persisted, availableBytes, estimatedTakeBytes, safeMinutes, status: "warning", recommendation: safeMinutes > 0 ? `Choose ${Math.min(30, safeMinutes)} minutes or less for reliable local recovery.` : "Browser storage is nearly full. Download or clear local files before a long take." };
  return { supported: true, persisted: input.persisted, availableBytes, estimatedTakeBytes, safeMinutes, status: "ready", recommendation: input.persisted ? "Persistent recovery storage is active." : "Capacity is sufficient; request persistent storage to reduce automatic browser eviction risk." };
}
