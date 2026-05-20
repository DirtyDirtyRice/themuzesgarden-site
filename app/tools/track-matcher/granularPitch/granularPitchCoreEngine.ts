"use client";

import { normalizeConfig } from "./granularPitchConfig";
import { createGranularPitchDiagnostics } from "./granularPitchDiagnostics";
import {
  cleanupGranularGrain,
  createGranularGrain,
} from "./granularPitchGrain";
import { safeModulo } from "./granularPitchMath";
import {
  advanceGranularPitchSchedulerCursor,
  createGranularPitchSchedulerCursor,
  getGranularPitchScheduleMetrics,
  shouldScheduleNextGrain,
  type GranularPitchSchedulerCursor,
} from "./granularPitchScheduler";
import type {
  GranularGrain,
  TrackMatcherGranularPitchEngineConfig,
  TrackMatcherGranularPitchEngineDiagnostics,
} from "./granularPitchTypes";

export type GranularPitchEngineStatus =
  | "idle"
  | "ready"
  | "playing"
  | "paused"
  | "stopped"
  | "failed";

export type GranularPitchEngineMode =
  | "preview"
  | "pro-pitch"
  | "offline";

export type GranularPitchEngineOptions = {
  context: AudioContext;
  output?: AudioNode | null;
  buffer?: AudioBuffer | null;
  config?: Partial<TrackMatcherGranularPitchEngineConfig> | null;
  mode?: GranularPitchEngineMode;
  onDiagnostics?: (
    diagnostics: TrackMatcherGranularPitchEngineDiagnostics,
  ) => void;
};

export type GranularPitchEngineState = {
  status: GranularPitchEngineStatus;
  mode: GranularPitchEngineMode;
  error: string;
  buffer: AudioBuffer | null;
  output: AudioNode;
  startedAtContextTime: number;
  pausedAtBufferTime: number;
  scheduledGrainCount: number;
  disposed: boolean;
};

function getBufferDuration(buffer: AudioBuffer | null) {
  if (!buffer || !Number.isFinite(buffer.duration)) return 0;
  return Math.max(0, buffer.duration);
}

function getSafeOffset(buffer: AudioBuffer, offset: number) {
  const duration = getBufferDuration(buffer);
  if (duration <= 0) return 0;
  return Math.min(Math.max(0, offset), Math.max(0, duration - 0.002));
}

function getCurrentBufferTime({
  context,
  state,
  config,
}: {
  context: AudioContext;
  state: GranularPitchEngineState;
  config: TrackMatcherGranularPitchEngineConfig;
}) {
  if (state.status !== "playing") return state.pausedAtBufferTime;

  const elapsed = Math.max(0, context.currentTime - state.startedAtContextTime);
  const duration = getBufferDuration(state.buffer);
  const current = state.pausedAtBufferTime + elapsed * config.tempoRatio;

  if (duration <= 0) return current;

  return safeModulo(current, duration);
}

export function createGranularPitchCoreEngine(
  options: GranularPitchEngineOptions,
) {
  const context = options.context;
  let config = normalizeConfig(options.config ?? undefined);
  let schedulerTimer: number | null = null;
  let cursor: GranularPitchSchedulerCursor | null = null;
  let grainId = 0;

  const activeGrains = new Map<number, GranularGrain>();

  const state: GranularPitchEngineState = {
    status: options.buffer ? "ready" : "idle",
    mode: options.mode ?? "pro-pitch",
    error: "",
    buffer: options.buffer ?? null,
    output: options.output ?? context.destination,
    startedAtContextTime: 0,
    pausedAtBufferTime: 0,
    scheduledGrainCount: 0,
    disposed: false,
  };

  function getDiagnostics() {
    const metrics = getGranularPitchScheduleMetrics(config);

    return createGranularPitchDiagnostics({
      status: state.status,
      mode: state.mode,
      config,
      grainSpacingMs: metrics.grainSpacingMs,
      scheduleAheadMs: metrics.scheduleAheadMs,
      scheduledGrainCount: state.scheduledGrainCount,
      activeGrainCount: activeGrains.size,
      currentBufferTime: getCurrentBufferTime({ context, state, config }),
      startedAtContextTime: state.startedAtContextTime,
      error: state.error,
    });
  }

  function publishDiagnostics() {
    options.onDiagnostics?.(getDiagnostics());
  }

  function clearSchedulerTimer() {
    if (schedulerTimer === null) return;

    window.clearTimeout(schedulerTimer);
    schedulerTimer = null;
  }

  function removeGrain(id: number) {
    const grain = activeGrains.get(id);
    if (!grain) return;

    activeGrains.delete(id);
    publishDiagnostics();
  }

  function stopAllGrains() {
    activeGrains.forEach((grain) => cleanupGranularGrain(grain));
    activeGrains.clear();
    publishDiagnostics();
  }

  function fail(message: string) {
    state.status = "failed";
    state.error = message;

    clearSchedulerTimer();
    stopAllGrains();
    publishDiagnostics();
  }

  function scheduleOneGrain() {
    if (!state.buffer || !cursor) return;

    if (activeGrains.size >= config.maxActiveGrains) return;

    const metrics = getGranularPitchScheduleMetrics(config);
    const duration = Math.min(
      metrics.grainDurationSeconds,
      Math.max(0.002, state.buffer.duration - 0.001),
    );

    grainId += 1;

    try {
      const grain = createGranularGrain({
        id: grainId,
        context,
        buffer: state.buffer,
        output: state.output,
        config,
        startTime: cursor.nextGrainContextTime,
        offset: cursor.nextGrainOffset,
        duration,
        onEnded: removeGrain,
      });

      activeGrains.set(grain.id, grain);
      state.scheduledGrainCount += 1;
    } catch (error) {
      fail(error instanceof Error ? error.message : "Could not schedule grain.");
    }

    cursor = advanceGranularPitchSchedulerCursor({
      cursor,
      config,
      bufferDuration: getBufferDuration(state.buffer),
    });
  }

  function scheduleGrains() {
    if (state.disposed || state.status !== "playing" || !cursor) return;

    while (
      shouldScheduleNextGrain({
        contextTime: context.currentTime,
        cursor,
        config,
      })
    ) {
      scheduleOneGrain();
    }

    publishDiagnostics();

    schedulerTimer = window.setTimeout(
      scheduleGrains,
      Math.max(8, config.grainSizeMs * 0.25),
    );
  }

  function start(startOffset?: number) {
    if (state.disposed) return getDiagnostics();

    if (!state.buffer) {
      fail("No decoded audio buffer is loaded.");
      return getDiagnostics();
    }

    clearSchedulerTimer();
    stopAllGrains();

    const offset =
      typeof startOffset === "number"
        ? getSafeOffset(state.buffer, startOffset)
        : state.pausedAtBufferTime;

    state.pausedAtBufferTime = offset;
    state.startedAtContextTime = context.currentTime;
    state.status = "playing";
    state.error = "";

    cursor = createGranularPitchSchedulerCursor({
      contextTime: context.currentTime,
      offset,
    });

    scheduleGrains();
    publishDiagnostics();

    return getDiagnostics();
  }

  function pause() {
    if (state.status !== "playing") return getDiagnostics();

    state.pausedAtBufferTime = getCurrentBufferTime({ context, state, config });
    state.status = "paused";

    clearSchedulerTimer();
    stopAllGrains();
    publishDiagnostics();

    return getDiagnostics();
  }

  function stop() {
    state.pausedAtBufferTime = 0;
    state.status = state.buffer ? "ready" : "idle";

    clearSchedulerTimer();
    stopAllGrains();
    publishDiagnostics();

    return getDiagnostics();
  }

  function seek(time: number) {
    const shouldResume = state.status === "playing";
    const buffer = state.buffer;

    state.pausedAtBufferTime = buffer ? getSafeOffset(buffer, time) : 0;

    clearSchedulerTimer();
    stopAllGrains();

    if (shouldResume) return start(state.pausedAtBufferTime);

    publishDiagnostics();
    return getDiagnostics();
  }

  function setBuffer(buffer: AudioBuffer | null) {
    clearSchedulerTimer();
    stopAllGrains();

    state.buffer = buffer;
    state.status = buffer ? "ready" : "idle";
    state.error = "";
    state.pausedAtBufferTime = 0;
    state.scheduledGrainCount = 0;

    publishDiagnostics();
    return getDiagnostics();
  }

  function setOutput(output: AudioNode | null) {
    state.output = output ?? context.destination;
    publishDiagnostics();
    return getDiagnostics();
  }

  function setConfig(nextConfig: Partial<TrackMatcherGranularPitchEngineConfig>) {
    const wasPlaying = state.status === "playing";
    const currentTime = getCurrentBufferTime({ context, state, config });

    config = normalizeConfig({
      ...config,
      ...nextConfig,
    });

    if (wasPlaying) return start(currentTime);

    publishDiagnostics();
    return getDiagnostics();
  }

  function dispose() {
    clearSchedulerTimer();
    stopAllGrains();

    state.disposed = true;
    state.status = "stopped";

    publishDiagnostics();
    return getDiagnostics();
  }

  publishDiagnostics();

  return {
    start,
    pause,
    stop,
    seek,
    setBuffer,
    setOutput,
    setConfig,
    getDiagnostics,
    dispose,
  };
}

export type GranularPitchCoreEngine = ReturnType<
  typeof createGranularPitchCoreEngine
>;