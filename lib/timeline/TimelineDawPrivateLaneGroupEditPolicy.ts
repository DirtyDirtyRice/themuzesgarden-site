export type TimelineDawPrivateLaneGroupTarget = {
  id: string;
  timelineStartSeconds: number;
  sourceInSeconds: number;
  sourceOutSeconds: number;
  sampleRate: number;
  stretchRatio?: number;
  transformBypassed?: boolean;
};

export type TimelineDawPrivateLaneGroupEdit =
  | { action: "move"; deltaSeconds: number }
  | { action: "align-start"; timelineStartSeconds: number }
  | { action: "align-end"; timelineStartSecondsById: Record<string, number> }
  | { action: "sequence"; timelineStartSecondsById: Record<string, number> }
  | { action: "mix"; muted: boolean; gain: number; pan: number }
  | { action: "fade"; fadeInSeconds: number; fadeOutSeconds: number }
  | { action: "audibility"; clearSolo: boolean; unmute: boolean };

export function parseTimelineDawPrivateLaneGroupEdit(value: unknown, lanes: TimelineDawPrivateLaneGroupTarget[]): TimelineDawPrivateLaneGroupEdit {
  if (!value || typeof value !== "object") throw new Error("Group edit is required.");
  if (!lanes.length || new Set(lanes.map((lane) => lane.id)).size !== lanes.length) throw new Error("Select at least one distinct private track.");
  const input = value as Record<string, unknown>;
  if (input.groupAction === "audibility") {
    if (typeof input.clearSolo !== "boolean" || typeof input.unmute !== "boolean" || (!input.clearSolo && !input.unmute)) {
      throw new Error("Choose Solo, Mute, or both to restore track sound.");
    }
    return { action: "audibility", clearSolo: input.clearSolo, unmute: input.unmute };
  }
  if (lanes.length < 2) throw new Error("Select at least two distinct private tracks.");
  if (input.groupAction === "move") {
    const deltaSeconds = Math.round(Number(input.deltaSeconds) * 1_000) / 1_000;
    if (!Number.isFinite(deltaSeconds) || lanes.some((lane) => lane.timelineStartSeconds + deltaSeconds < 0 || lane.timelineStartSeconds + deltaSeconds > 86_400)) {
      throw new Error("Group move must keep every region inside the session timeline.");
    }
    return { action: "move", deltaSeconds };
  }
  if (input.groupAction === "align-start") {
    const timelineStartSeconds = Math.min(...lanes.map((lane) => lane.timelineStartSeconds));
    if (!Number.isFinite(timelineStartSeconds) || timelineStartSeconds < 0 || timelineStartSeconds > 86_400) {
      throw new Error("Selected track starts cannot be aligned inside the session timeline.");
    }
    if (lanes.every((lane) => lane.timelineStartSeconds === timelineStartSeconds)) {
      throw new Error("The selected tracks already start together.");
    }
    return { action: "align-start", timelineStartSeconds };
  }
  if (input.groupAction === "align-end") {
    const timing = lanes.map((lane) => {
      const speedFactor = lane.transformBypassed ? 1 : (lane.stretchRatio ?? 1);
      const duration = (lane.sourceOutSeconds - lane.sourceInSeconds) * speedFactor;
      const end = lane.timelineStartSeconds + duration;
      if (![speedFactor, duration, end].every(Number.isFinite) || speedFactor <= 0 || duration <= 0 || end > 86_400) {
        throw new Error("Selected track endings cannot be aligned inside the session timeline.");
      }
      return { id: lane.id, duration, end };
    });
    const latestEnd = Math.max(...timing.map((item) => item.end));
    const timelineStartSecondsById = Object.fromEntries(timing.map((item) => [item.id, Math.round((latestEnd - item.duration) * 1_000) / 1_000]));
    if (Object.values(timelineStartSecondsById).some((start) => start < 0 || start > 86_400)) {
      throw new Error("Selected track endings cannot be aligned inside the session timeline.");
    }
    if (lanes.every((lane) => lane.timelineStartSeconds === timelineStartSecondsById[lane.id])) {
      throw new Error("The selected tracks already end together.");
    }
    return { action: "align-end", timelineStartSecondsById };
  }
  if (input.groupAction === "sequence") {
    const ordered = [...lanes].sort((a, b) => a.timelineStartSeconds - b.timelineStartSeconds || a.id.localeCompare(b.id));
    let nextStart = ordered[0].timelineStartSeconds;
    const timelineStartSecondsById: Record<string, number> = {};
    for (const lane of ordered) {
      const speedFactor = lane.transformBypassed ? 1 : (lane.stretchRatio ?? 1);
      const duration = (lane.sourceOutSeconds - lane.sourceInSeconds) * speedFactor;
      const roundedStart = Math.round(nextStart * 1_000) / 1_000;
      const nextEnd = roundedStart + duration;
      if (![speedFactor, duration, nextEnd].every(Number.isFinite) || speedFactor <= 0 || duration <= 0 || roundedStart < 0 || nextEnd > 86_400) {
        throw new Error("Selected tracks cannot fit one after another inside the session timeline.");
      }
      timelineStartSecondsById[lane.id] = roundedStart;
      nextStart = nextEnd;
    }
    if (lanes.every((lane) => lane.timelineStartSeconds === timelineStartSecondsById[lane.id])) {
      throw new Error("The selected tracks are already placed one after another.");
    }
    return { action: "sequence", timelineStartSecondsById };
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
