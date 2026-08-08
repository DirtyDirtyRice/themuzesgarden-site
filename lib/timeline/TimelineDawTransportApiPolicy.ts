import type { TimelineDawTransportCommand } from "./TimelineDawTransportService";

const actions = new Set([
  "initialize",
  "play",
  "pause",
  "stop",
  "locate",
  "set-loop",
  "set-count-in",
  "complete-count-in",
  "set-metronome",
  "set-cue",
  "set-stop-return",
  "set-scrub-snap",
  "add-tempo", "update-tempo", "remove-tempo", "add-signature", "update-signature", "remove-signature",
]);
const text = (value: unknown) => typeof value === "string" && value.trim() ? value.trim() : null;
const whole = (value: unknown) =>
  typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : null;

export function parseTimelineDawTransportCommand(raw: unknown): TimelineDawTransportCommand {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("DAW transport command must be an object.");
  }
  const value = raw as Record<string, unknown>;
  if (typeof value.action !== "string" || !actions.has(value.action)) {
    throw new Error("DAW transport action is invalid.");
  }
  const sessionId = text(value.sessionId);
  const expectedWorkspaceRevision = whole(value.expectedWorkspaceRevision);
  if (!sessionId || expectedWorkspaceRevision === null) {
    throw new Error("Transport command requires sessionId and expectedWorkspaceRevision.");
  }
  if (value.action === "initialize") {
    return { action: "initialize", sessionId, expectedWorkspaceRevision };
  }
  const expectedTransportHead = whole(value.expectedTransportHead);
  if (expectedTransportHead === null) {
    throw new Error("Transport operation requires expectedTransportHead.");
  }
  if (value.action === "add-tempo" || value.action === "update-tempo") {
    const tick=whole(value.tick),bpm=typeof value.bpm==="number"&&Number.isFinite(value.bpm)&&value.bpm>=20&&value.bpm<=400?value.bpm:null,pointId=value.action==="update-tempo"?text(value.pointId):null;if(tick===null||bpm===null||(value.action==="update-tempo"&&!pointId))throw new Error("Tempo edits require a tick, 20-400 BPM, and an existing point ID when updating.");return{action:value.action,sessionId,expectedTransportHead,expectedWorkspaceRevision,tick,bpm,...(pointId?{pointId}:{})} as TimelineDawTransportCommand;
  }
  if (value.action === "remove-tempo" || value.action === "remove-signature") {
    const pointId=text(value.pointId);if(!pointId)throw new Error("Map removal requires a point ID.");return{action:value.action,sessionId,expectedTransportHead,expectedWorkspaceRevision,pointId};
  }
  if (value.action === "add-signature" || value.action === "update-signature") {
    const tick=whole(value.tick),numerator=whole(value.numerator),denominator=value.denominator;const pointId=value.action==="update-signature"?text(value.pointId):null;if(tick===null||numerator===null||numerator<1||numerator>32||![1,2,4,8,16,32].includes(Number(denominator))||(value.action==="update-signature"&&!pointId))throw new Error("Signature edits require a tick, numerator 1-32, valid denominator, and an existing point ID when updating.");return{action:value.action,sessionId,expectedTransportHead,expectedWorkspaceRevision,tick,numerator,denominator:Number(denominator) as 1|2|4|8|16|32,...(pointId?{pointId}:{})} as TimelineDawTransportCommand;
  }  if (value.action === "locate") {
    const tick = whole(value.tick);
    if (tick === null) throw new Error("Locate requires a non-negative tick.");
    return {
      action: "locate",
      sessionId,
      expectedTransportHead,
      expectedWorkspaceRevision,
      tick,
    };
  }
  if (value.action === "set-loop") {
    const startTick = whole(value.startTick);
    const endTick = whole(value.endTick);
    if (typeof value.enabled !== "boolean" || startTick === null || endTick === null) {
      throw new Error("Loop requires enabled, startTick, and endTick.");
    }
    if (value.enabled && endTick <= startTick) {
      throw new Error("Loop end must be after loop start.");
    }
    return {
      action: "set-loop",
      sessionId,
      expectedTransportHead,
      expectedWorkspaceRevision,
      enabled: value.enabled,
      startTick,
      endTick,
    };
  }
  if (value.action === "set-count-in") {
    const bars = whole(value.bars);
    if (bars === null || bars > 16) {
      throw new Error("Count-in bars must be a whole number from 0 to 16.");
    }
    return {
      action: "set-count-in",
      sessionId,
      expectedTransportHead,
      expectedWorkspaceRevision,
      bars,
    };
  }
  if (value.action === "complete-count-in") {
    return {
      action: "complete-count-in",
      sessionId,
      expectedTransportHead,
      expectedWorkspaceRevision,
    };
  }
  if (value.action === "set-metronome") {
    if (typeof value.enabled !== "boolean") {
      throw new Error("Metronome requires an enabled setting.");
    }
    return {
      action: "set-metronome",
      sessionId,
      expectedTransportHead,
      expectedWorkspaceRevision,
      enabled: value.enabled,
    };
  }
  if (value.action === "set-cue") {
    const tick = value.cueTick === null ? null : whole(value.cueTick);
    if (tick === null && value.cueTick !== null) {
      throw new Error("Cue tick must be null or a non-negative whole number.");
    }
    return {
      action: "set-cue",
      sessionId,
      expectedTransportHead,
      expectedWorkspaceRevision,
      tick,
    };
  }
  if (value.action === "set-stop-return") {
    if (typeof value.returnToCue !== "boolean") {
      throw new Error("Stop return requires a returnToCue setting.");
    }
    return {
      action: "set-stop-return",
      sessionId,
      expectedTransportHead,
      expectedWorkspaceRevision,
      returnToCue: value.returnToCue,
    };
  }
  if (value.action === "set-scrub-snap") {
    if (value.snap !== "free" && value.snap !== "beat" && value.snap !== "bar") {
      throw new Error("Scrub snap must be free, beat, or bar.");
    }
    return {
      action: "set-scrub-snap",
      sessionId,
      expectedTransportHead,
      expectedWorkspaceRevision,
      snap: value.snap,
    };
  }
  if (value.action === "stop") {
    const returnToTick = value.returnToTick === undefined ? undefined : whole(value.returnToTick);
    if (returnToTick === null) throw new Error("Stop returnToTick must be non-negative.");
    return {
      action: "stop",
      sessionId,
      expectedTransportHead,
      expectedWorkspaceRevision,
      returnToTick,
    };
  }
  if (value.action === "pause") {
    const tick = value.tick === undefined ? undefined : whole(value.tick);
    if (tick === null) throw new Error("Pause checkpoint tick must be non-negative.");
    return {
      action: "pause",
      sessionId,
      expectedTransportHead,
      expectedWorkspaceRevision,
      tick,
    };
  }
  return {
    action: "play",
    sessionId,
    expectedTransportHead,
    expectedWorkspaceRevision,
  };
}
