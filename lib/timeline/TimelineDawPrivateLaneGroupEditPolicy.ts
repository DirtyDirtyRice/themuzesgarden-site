export type TimelineDawPrivateLaneGroupTarget = {
  id: string;
  timelineStartSeconds: number;
  sourceInSeconds: number;
  sourceOutSeconds: number;
  sampleRate: number;
};

export type TimelineDawPrivateLaneGroupEdit =
  | { action: "move"; deltaSeconds: number }
  | { action: "mix"; muted: boolean; gain: number; pan: number }
  | { action: "fade"; fadeInSeconds: number; fadeOutSeconds: number };

export function parseTimelineDawPrivateLaneGroupEdit(value: unknown, lanes: TimelineDawPrivateLaneGroupTarget[]): TimelineDawPrivateLaneGroupEdit {
  if (!value || typeof value !== "object") throw new Error("Group edit is required.");
  if (lanes.length < 2 || new Set(lanes.map((lane) => lane.id)).size !== lanes.length) throw new Error("Select at least two distinct private regions.");
  const input = value as Record<string, unknown>;
  if (input.groupAction === "move") {
    const deltaSeconds = Math.round(Number(input.deltaSeconds) * 1_000) / 1_000;
    if (!Number.isFinite(deltaSeconds) || lanes.some((lane) => lane.timelineStartSeconds + deltaSeconds < 0 || lane.timelineStartSeconds + deltaSeconds > 86_400)) {
      throw new Error("Group move must keep every region inside the session timeline.");
    }
    return { action: "move", deltaSeconds };
  }
  if (input.groupAction === "mix") {
    const gain = Number(input.gain); const pan = Number(input.pan);
    if (typeof input.muted !== "boolean" || !Number.isFinite(gain) || gain < 0 || gain > 2 || !Number.isFinite(pan) || pan < -1 || pan > 1) {
      throw new Error("Group mixer settings are invalid.");
    }
    return { action: "mix", muted: input.muted, gain, pan };
  }
  if (input.groupAction === "fade") {
    const fadeInSeconds = Number(input.fadeInSeconds); const fadeOutSeconds = Number(input.fadeOutSeconds);
    if (!Number.isFinite(fadeInSeconds) || !Number.isFinite(fadeOutSeconds) || fadeInSeconds < 0 || fadeOutSeconds < 0) throw new Error("Group fades must be finite and non-negative.");
    for (const lane of lanes) {
      const durationFrames = Math.round((lane.sourceOutSeconds - lane.sourceInSeconds) * lane.sampleRate);
      if (Math.round(fadeInSeconds * lane.sampleRate) + Math.round(fadeOutSeconds * lane.sampleRate) > durationFrames) {
        throw new Error("Group fades must fit every selected region.");
      }
    }
    return { action: "fade", fadeInSeconds, fadeOutSeconds };
  }
  throw new Error("Group edit action is invalid.");
}
