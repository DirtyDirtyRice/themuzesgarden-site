"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { TransportConfig, EngineEvent } from "../../engine/core/types";
import { createTransport } from "../../engine/core/transport";
import type { ClockConfig, ClockState } from "../../engine/core/clock";
import { tickClock } from "../../engine/core/clock";
import type { TransitionPlan } from "../../engine/core/transition";
import { analyzeTransition } from "../../engine/intelligence/transitionAnalyzer";
import { clearTransitionMemory, updateTransitionRecord } from "../../engine/intelligence/transitionMemory";
import {
  DEFAULT_COMBO_CONFIG,
  createComboState,
  updateComboFromScore,
  getComboStatus,
} from "../../engine/intelligence/comboTracker";

import LiveToastBanner from "./LiveToastBanner";
import LiveGameModePanel from "./LiveGameModePanel";
import LiveTransportPanel from "./LiveTransportPanel";
import LiveFooterPanel from "./LiveFooterPanel";

import type { ExecStatus, LastScore, ViewState, GameState, ToastKind, ToastState } from "./livePageTypes";
import { clamp01, computeAvgDisplayedDurationTicks } from "./livePageFormatting";
import { readMemorySnapshot } from "./livePageMemory";
import { computeLaneGainsFromPlan } from "./livePagePlanning";
import { pointsFromSmoothness } from "./livePageGame";
import { pushEngineEvents, stopTransportLoop, applyBpmAction } from "./livePageTransportActions";
import { startGameRoundAction, nextRoundReadyState, setGameEnabledState } from "./livePageRoundActions";
import { buildResetGameState, buildResetViewState } from "./livePageResetActions";
import { buildCountdownGameState, getExecIdDisplay } from "./livePageLoopHelpers";

export default function LivePage() {
  const initialCfg: TransportConfig = useMemo(
    () => ({
      bpm: 120,
      timeSig: { beatsPerBar: 4, beatUnit: 4 },
      ppq: 480,
      startBar: 1,
      startBeat: 1,
      startTick: 0,
    }),
    []
  );

  const clockCfg: ClockConfig = useMemo(
    () => ({
      lookaheadMs: 120,
      stepMs: 10,
    }),
    []
  );

  const cfgRef = useRef<TransportConfig>(initialCfg);

  const clockRef = useRef<ClockState>({
    transport: createTransport(cfgRef.current),
    accumulatorMs: 0,
  });

  const eventsRef = useRef<EngineEvent[]>([]);
  const rafRef = useRef<number | null>(null);
  const lastNowRef = useRef<number | null>(null);
  const reqCounterRef = useRef<number>(0);
  const armedPlanRef = useRef<TransitionPlan | null>(null);
  const autoStopRef = useRef<boolean>(true);
  const execHasStartedRef = useRef<boolean>(false);
  const lastCompletedPlanIdRef = useRef<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const [toast, setToast] = useState<ToastState>({
    visible: false,
    kind: "info",
    title: "",
    detail: null,
  });

  const [game, setGame] = useState<GameState>(() => {
    const now = Date.now();
    const combo = createComboState(now, DEFAULT_COMBO_CONFIG);

    return {
      enabled: false,
      score: 0,
      round: 1,
      status: "OFF",
      task: null,
      taskLabel: "",
      countdownText: null,
      roundPlanId: null,
      resultText: null,
      lastAward: null,
      lastCompletedPlanId: null,
      combo,
      comboOutcome: "good",
      comboMultiplier: 1,
    };
  });

  const [view, setView] = useState<ViewState>(() => {
    const t = clockRef.current.transport;
    const mem = readMemorySnapshot();

    return {
      running: false,
      bpm: t.bpm,
      bar: t.bar,
      beat: t.beat,
      tick: t.tick,
      tickAbs: t.tickAbs,
      tMs: t.tMs,
      msPerTick: t.msPerTick,
      windowFrom: t.tickAbs,
      windowTo: t.tickAbs,
      recentEvents: [],
      planned: null,
      planError: null,
      armedPlanId: null,
      autoStopAtPlanEnd: true,
      execStatus: "IDLE",
      execNote: null,
      lastCompletedPlanId: null,
      masterA: 1,
      masterB: 0,
      lastScore: null,
      ...mem,
    };
  });

  const viewRef = useRef<ViewState>(view);
  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  function showToast(kind: ToastKind, title: string, detail?: string | null, ms: number = 1800) {
    if (toastTimerRef.current != null) {
      window.clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }

    setToast({ visible: true, kind, title, detail: detail ?? null });

    toastTimerRef.current = window.setTimeout(() => {
      setToast((t) => ({ ...t, visible: false }));
      toastTimerRef.current = null;
    }, ms);
  }

  function refreshMemory() {
    const mem = readMemorySnapshot();
    setView((v) => ({
      ...v,
      ...mem,
    }));
  }

  function stop() {
    stopTransportLoop({
      rafRef,
      lastNowRef,
      setView,
    });
  }

  function start() {
    if (rafRef.current != null) return;

    setView((v) => ({ ...v, running: true }));

    const loop = (now: number) => {
      const last = lastNowRef.current ?? now;
      lastNowRef.current = now;

      const rawDt = now - last;
      const dtMs = Math.max(0, Math.min(rawDt, 50));

      const res = tickClock(cfgRef.current, clockCfg, clockRef.current, dtMs);
      clockRef.current = res.clock;

      pushEngineEvents(eventsRef, res.steps);

      const t = clockRef.current.transport;
      const armed = armedPlanRef.current;

      let nextExecStatus: ExecStatus = "IDLE";
      let nextExecNote: string | null = null;
      let nextArmedPlanId: string | null = null;
      let masterA = 1;
      let masterB = 0;
      let lastScore: LastScore | null = viewRef.current.lastScore;

      if (!armed) {
        execHasStartedRef.current = false;
        nextExecStatus = "IDLE";
        nextExecNote = null;
        nextArmedPlanId = null;
      } else {
        nextArmedPlanId = armed.requestId;

        if (t.tickAbs < armed.startTickAbs) {
          nextExecStatus = "ARMED";
          nextExecNote = `Waiting for start @ ${armed.startTickAbs}`;
        } else if (t.tickAbs >= armed.startTickAbs && t.tickAbs < armed.endTickAbs) {
          nextExecStatus = "RUNNING";
          nextExecNote = `Running ${t.tickAbs} / ${armed.endTickAbs}`;

          if (!execHasStartedRef.current) {
            showToast("info", "Round started", `Now running (plan ends @ ${armed.endTickAbs})`);
          }

          execHasStartedRef.current = true;

          const gains = computeLaneGainsFromPlan(armed, t.tickAbs);
          masterA = gains.masterA;
          masterB = gains.masterB;
        } else {
          nextExecStatus = "COMPLETED";
          nextExecNote = `Completed @ ${armed.endTickAbs}`;

          const gains = computeLaneGainsFromPlan(armed, armed.endTickAbs);
          masterA = gains.masterA;
          masterB = gains.masterB;

          const expectedEndMs = armed.endTickAbs * t.msPerTick;
          const actualEndMs = t.tMs;
          const score = analyzeTransition({ id: armed.requestId }, expectedEndMs, actualEndMs);

          lastScore = {
            id: score.id,
            timingErrorMs: score.timingErrorMs,
            smoothness: score.smoothness,
          };

          updateTransitionRecord(armed.requestId, { successScore: score.smoothness });
          lastCompletedPlanIdRef.current = armed.requestId;

          showToast("success", "Round ended", `Smoothness ${score.smoothness.toFixed(1)} / 100`);

          setGame((gstate) => {
            if (!gstate.enabled) return gstate;

            const isRoundPlan = gstate.roundPlanId != null && gstate.roundPlanId === armed.requestId;
            const isNewCompletion = gstate.lastCompletedPlanId !== armed.requestId;

            if ((gstate.status === "COUNTDOWN" || gstate.status === "AWAITING") && isRoundPlan && isNewCompletion) {
              const baseAward = pointsFromSmoothness(score.smoothness);
              const nowMs = Date.now();

              const comboUpd = updateComboFromScore(
                gstate.combo,
                clamp01(score.smoothness / 100),
                nowMs,
                DEFAULT_COMBO_CONFIG
              );

              const comboStatus = getComboStatus(comboUpd.state, comboUpd.outcome, DEFAULT_COMBO_CONFIG);
              const mult = comboStatus.multiplier;
              const finalAward = Math.round(baseAward * mult);
              const nextScore = gstate.score + finalAward;

              const result =
                finalAward > 0
                  ? `Nice! +${finalAward} pts (base ${baseAward} × ${mult.toFixed(2)} • ${comboStatus.label} • streak ${
                      comboStatus.streak
                    }) (smoothness ${score.smoothness.toFixed(1)})`
                  : `Try again — 0 pts (${comboStatus.label} • streak ${comboStatus.streak}) (smoothness ${score.smoothness.toFixed(
                      1
                    )})`;

              return {
                ...gstate,
                score: nextScore,
                status: "RESULT",
                resultText: result,
                lastAward: finalAward,
                lastCompletedPlanId: armed.requestId,
                countdownText: null,
                combo: comboUpd.state,
                comboOutcome: comboUpd.outcome,
                comboMultiplier: mult,
              };
            }

            return gstate;
          });

          armedPlanRef.current = null;
          execHasStartedRef.current = false;
          nextArmedPlanId = null;

          const memAfter = readMemorySnapshot();

          if (autoStopRef.current) {
            setView((v) => ({
              ...v,
              bpm: t.bpm,
              bar: t.bar,
              beat: t.beat,
              tick: t.tick,
              tickAbs: t.tickAbs,
              tMs: t.tMs,
              msPerTick: t.msPerTick,
              windowFrom: res.window.fromTickAbs,
              windowTo: res.window.toTickAbs,
              recentEvents: eventsRef.current.slice(-20),
              masterA,
              masterB,
              running: false,
              execStatus: nextExecStatus,
              execNote: nextExecNote,
              armedPlanId: null,
              lastCompletedPlanId: lastCompletedPlanIdRef.current,
              lastScore,
              ...memAfter,
            }));
            stop();
            return;
          }

          setView((v) => ({
            ...v,
            ...memAfter,
          }));
        }
      }

      setGame((gstate) => {
        if (!gstate.enabled) return gstate;

        return buildCountdownGameState({
          game: gstate,
          planned: viewRef.current.planned,
          tickAbs: t.tickAbs,
          cfg: cfgRef.current,
        });
      });

      setView((v) => ({
        ...v,
        bpm: t.bpm,
        bar: t.bar,
        beat: t.beat,
        tick: t.tick,
        tickAbs: t.tickAbs,
        tMs: t.tMs,
        msPerTick: t.msPerTick,
        windowFrom: res.window.fromTickAbs,
        windowTo: res.window.toTickAbs,
        recentEvents: eventsRef.current.slice(-20),
        masterA,
        masterB,
        execStatus: nextExecStatus,
        execNote: nextExecNote,
        armedPlanId: nextExecStatus === "IDLE" ? null : nextArmedPlanId,
        lastCompletedPlanId: lastCompletedPlanIdRef.current,
        lastScore,
      }));

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
  }

  function reset() {
    stop();

    eventsRef.current = [];
    reqCounterRef.current = 0;
    armedPlanRef.current = null;
    execHasStartedRef.current = false;
    lastCompletedPlanIdRef.current = null;

    clockRef.current = {
      transport: createTransport(cfgRef.current),
      accumulatorMs: 0,
    };

    setView((v) =>
      buildResetViewState({
        previous: v,
        cfg: cfgRef.current,
      })
    );

    setToast((tst) => ({ ...tst, visible: false }));
    setGame((g) => buildResetGameState(g));
  }

  function applyBpm(nextBpm: number) {
    applyBpmAction({
      nextBpm,
      cfgRef,
      clockRef,
      setView,
    });
  }

  function clearMemory() {
    clearTransitionMemory();
    refreshMemory();
  }

  function setGameEnabled(next: boolean) {
    setGame((g) => setGameEnabledState(next, g));
  }

  function startGameRound() {
    startGameRoundAction({
      game,
      viewRef,
      startTransport: start,
      autoStopRef,
      setView,
      showToast,
      cfgRef,
      clockRef,
      reqCounterRef,
      armedPlanRef,
      execHasStartedRef,
      refreshMemory,
      setGame,
    });
  }

  function nextRoundReady() {
    showToast("info", "Ready for next round", "Press Start Round when you’re ready.");
    setGame((g) => nextRoundReadyState(g));
  }

  useEffect(() => {
    refreshMemory();

    return () => {
      if (toastTimerRef.current != null) {
        window.clearTimeout(toastTimerRef.current);
      }
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const avgDurationDisplay = computeAvgDisplayedDurationTicks(view.memRecent);
  const nextRoundHot = game.enabled && game.status === "RESULT";
  const startRoundDisabled = !game.enabled || game.status !== "READY";
  const execIdDisplay = getExecIdDisplay(view);

  return (
    <div className="min-h-screen bg-black p-6 text-white">
      <div className="mx-auto max-w-5xl space-y-6">
        <h1 className="text-2xl font-bold text-white">Live Engine — Metronome + Transition Planner (Execute)</h1>

        <LiveToastBanner toast={toast} />

        <LiveGameModePanel
          game={game}
          nextRoundHot={nextRoundHot}
          startRoundDisabled={startRoundDisabled}
          onToggleEnabled={() => setGameEnabled(!game.enabled)}
          onStartRound={startGameRound}
          onNextRound={nextRoundReady}
        />

        <LiveTransportPanel
          view={view}
          execIdDisplay={execIdDisplay}
          avgDurationDisplay={avgDurationDisplay}
          onToggleStartStop={() => (view.running ? stop() : start())}
          onReset={reset}
          onApplyBpm={applyBpm}
          onRefreshMemory={refreshMemory}
          onClearMemory={clearMemory}
        />

        <LiveFooterPanel />
      </div>
    </div>
  );
}