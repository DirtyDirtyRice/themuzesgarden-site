export type TimelineDawRecordingMode = "normal" | "punch" | "loop";

export type TimelineDawRecordingPlan = {
  mode: TimelineDawRecordingMode;
  sampleRate: number;
  countInBars: number;
  beatsPerBar: number;
  bpm: number;
  rangeStartFrame: number;
  rangeEndFrame: number | null;
  loopPasses: number;
  groupId: string | null;
};

export type TimelineDawRecordingPass = {
  passNumber: number;
  captureStartFrame: number;
  captureEndFrame: number;
  timelineStartFrame: number;
  sourceInFrame: number;
  sourceOutFrame: number;
};

export function parseTimelineDawRecordingPlan(value: unknown): TimelineDawRecordingPlan {
  if (!value || typeof value !== "object") throw new Error("Recording plan is required.");
  const input = value as Record<string, unknown>;
  const mode = input.mode;
  const sampleRate = Math.round(Number(input.sampleRate));
  const countInBars = Math.round(Number(input.countInBars ?? 0));
  const beatsPerBar = Math.round(Number(input.beatsPerBar ?? 4));
  const bpm = Number(input.bpm ?? 120);
  const rangeStartFrame = Math.round(Number(input.rangeStartFrame ?? 0));
  const rangeEndFrame = input.rangeEndFrame == null ? null : Math.round(Number(input.rangeEndFrame));
  const loopPasses = Math.round(Number(input.loopPasses ?? 1));
  if (mode !== "normal" && mode !== "punch" && mode !== "loop") throw new Error("Recording mode is invalid.");
  if (!Number.isInteger(sampleRate) || sampleRate < 8_000 || sampleRate > 384_000) throw new Error("Recording sample rate is invalid.");
  if (!Number.isInteger(countInBars) || countInBars < 0 || countInBars > 8) throw new Error("Count-in must be between 0 and 8 bars.");
  if (!Number.isInteger(beatsPerBar) || beatsPerBar < 1 || beatsPerBar > 32) throw new Error("Meter is invalid.");
  if (!Number.isFinite(bpm) || bpm < 20 || bpm > 400) throw new Error("Tempo is invalid.");
  if (!Number.isInteger(rangeStartFrame) || rangeStartFrame < 0) throw new Error("Recording start is invalid.");
  if (mode !== "normal" && (rangeEndFrame == null || rangeEndFrame <= rangeStartFrame)) throw new Error("Punch and loop recording require an ordered range.");
  if (!Number.isInteger(loopPasses) || loopPasses < 1 || loopPasses > 99) throw new Error("Loop passes must be between 1 and 99.");
  if (typeof input.groupId === "string" && input.groupId.trim().length > 120) throw new Error("Recording group is too long.");
  return {
    mode, sampleRate, countInBars, beatsPerBar, bpm, rangeStartFrame,
    rangeEndFrame: mode === "normal" ? null : rangeEndFrame,
    loopPasses: mode === "loop" ? loopPasses : 1,
    groupId: typeof input.groupId === "string" && input.groupId.trim() ? input.groupId.trim() : null,
  };
}

export function timelineDawCountInFrames(plan: TimelineDawRecordingPlan): number {
  return Math.round(plan.countInBars * plan.beatsPerBar * 60 / plan.bpm * plan.sampleRate);
}

export function createTimelineDawRecordingPasses(plan: TimelineDawRecordingPlan, capturedFrames: number): TimelineDawRecordingPass[] {
  if (!Number.isInteger(capturedFrames) || capturedFrames < 1) throw new Error("Captured frame count is invalid.");
  const countIn = timelineDawCountInFrames(plan);
  if (capturedFrames <= countIn) throw new Error("Capture ended before the count-in was complete.");
  if (plan.mode === "normal") return [{ passNumber: 1, captureStartFrame: countIn, captureEndFrame: capturedFrames, timelineStartFrame: plan.rangeStartFrame, sourceInFrame: countIn, sourceOutFrame: capturedFrames }];
  const length = (plan.rangeEndFrame as number) - plan.rangeStartFrame;
  const available = Math.max(0, capturedFrames - countIn);
  const passCount = plan.mode === "loop" ? Math.min(plan.loopPasses, Math.floor(available / length)) : Math.min(1, Math.floor(available / length));
  if (!passCount) throw new Error("Capture ended before the punch range was complete.");
  return Array.from({ length: passCount }, (_, index) => {
    const sourceInFrame = countIn + index * length;
    return { passNumber: index + 1, captureStartFrame: sourceInFrame, captureEndFrame: sourceInFrame + length, timelineStartFrame: plan.rangeStartFrame, sourceInFrame, sourceOutFrame: sourceInFrame + length };
  });
}
