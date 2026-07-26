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
  if (value.action === "locate") {
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
