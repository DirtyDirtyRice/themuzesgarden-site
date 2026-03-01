"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { TransportConfig, EngineEvent, GridPos } from "../../engine/core/types";
import { createTransport, setBpm } from "../../engine/core/transport";
import type { ClockConfig, ClockState } from "../../engine/core/clock";
import { tickClock } from "../../engine/core/clock";
import type { TransitionPlan, TransitionRequest, TransitionEvent } from "../../engine/core/transition";
import { planTransition } from "../../engine/core/transition";
import { computeGridMath } from "../../engine/core/grid";
import { analyzeTransition } from "../../engine/intelligence/transitionAnalyzer";
import {
  clearTransitionMemory,
  getMemoryStats,
  getTransitionMemory,
  updateTransitionRecord,
  type TransitionMemoryRecord,
} from "../../engine/intelligence/transitionMemory";

import {
  DEFAULT_COMBO_CONFIG,
  createComboState,
  updateComboFromScore,
  getComboStatus,
  type ComboState,
} from "../../engine/intelligence/comboTracker";

type ExecStatus = "IDLE" | "ARMED" | "RUNNING" | "COMPLETED";

type LastScore = {
  id: string;
  timingErrorMs: number;
  smoothness: number;
};

type ViewState = {
  running: boolean;

  bpm: number;
  bar: number;
  beat: number;
  tick: number;
  tickAbs: number;
  tMs: number;
  msPerTick: number;

  windowFrom: number;
  windowTo: number;

  recentEvents: EngineEvent[];

  planned: TransitionPlan | null;
  planError: string | null;

  // Execution / simulation
  armedPlanId: string | null;
  autoStopAtPlanEnd: boolean;
  execStatus: ExecStatus;
  execNote: string | null;

  // ✅ NEW: keep a display id for the most recently completed plan
  lastCompletedPlanId: string | null;

  // Simulated lane gains
  masterA: number;
  masterB: number;

  lastScore: LastScore | null;

  memTotal: number;
  memAvgDuration: number;
  memRecent: TransitionMemoryRecord[];
};

type GameTaskKind = "CUT_NEXT_BEAT" | "CUT_NEXT_BAR" | "XFADE_1BEAT_NEXT_BAR";
type GameRoundStatus = "OFF" | "READY" | "COUNTDOWN" | "AWAITING" | "RESULT";

type GameState = {
  enabled: boolean;
  score: number;
  round: number;

  status: GameRoundStatus;
  task: GameTaskKind | null;

  taskLabel: string;
  countdownText: string | null;

  roundPlanId: string | null; // plan id created for this round
  resultText: string | null;
  lastAward: number | null;

  lastCompletedPlanId: string | null; // de-dupe completions

  combo: ComboState;
  comboOutcome: "perfect" | "good" | "grace" | "break";
  comboMultiplier: number;
};

type ToastKind = "info" | "success" | "warn";
type ToastState = { visible: boolean; kind: ToastKind; title: string; detail?: string | null };

function clamp01(x: number) {
  if (!Number.isFinite(x)) return 0;
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

function fmtPos(p: GridPos) {
  return `${p.bar}:${p.beat}:${p.tick}`;
}

function eventTick(e: TransitionEvent): number {
  if (e.type === "GainRamp") return e.startTickAbs;
  if (e.type === "Marker") return e.atTickAbs;
  return e.atTickAbs;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function computeLaneGainsFromPlan(plan: TransitionPlan, nowTickAbs: number): { masterA: number; masterB: number } {
  let a = 1;
  let b = 0;

  const switchEv = plan.events.find((e) => e.type === "SwitchState");
  if (switchEv && switchEv.type === "SwitchState") {
    if (nowTickAbs >= switchEv.atTickAbs) {
      a = 0;
      b = 1;
    }
  }

  const ramps = plan.events.filter((e) => e.type === "GainRamp") as Extract<TransitionEvent, { type: "GainRamp" }>[];

  for (const r of ramps) {
    const start = r.startTickAbs;
    const end = r.endTickAbs;

    const from = clamp01(r.from);
    const to = clamp01(r.to);

    if (nowTickAbs < start) continue;

    if (nowTickAbs >= end) {
      if (r.lane === "masterA") a = to;
      if (r.lane === "masterB") b = to;
      continue;
    }

    const t = (nowTickAbs - start) / Math.max(1, end - start);
    const v = clamp01(lerp(from, to, t));

    if (r.lane === "masterA") a = v;
    if (r.lane === "masterB") b = v;
  }

  return { masterA: clamp01(a), masterB: clamp01(b) };
}

function StatusPill({ status }: { status: ExecStatus }) {
  const base = "inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold";
  if (status === "IDLE") return <span className={`${base} bg-zinc-50 text-zinc-700`}>IDLE</span>;
  if (status === "ARMED") return <span className={`${base} bg-blue-50 text-blue-800`}>ARMED</span>;
  if (status === "RUNNING") return <span className={`${base} bg-amber-50 text-amber-800`}>RUNNING</span>;
  return <span className={`${base} bg-green-50 text-green-800`}>COMPLETED</span>;
}

function fmtTs(ts: number) {
  try {
    return new Date(ts).toLocaleTimeString();
  } catch {
    return String(ts);
  }
}

function displayDurationTicks(durationTicks: number) {
  if (!Number.isFinite(durationTicks)) return 1;
  return Math.max(1, Math.round(durationTicks));
}

function computeAvgDisplayedDurationTicks(records: TransitionMemoryRecord[]) {
  if (records.length === 0) return 0;
  let sum = 0;
  for (const r of records) sum += displayDurationTicks(r.durationTicks);
  return sum / records.length;
}

function taskLabel(kind: GameTaskKind) {
  if (kind === "CUT_NEXT_BEAT") return "CUT @ next beat";
  if (kind === "CUT_NEXT_BAR") return "CUT @ next bar";
  return "XFADE (1 beat) @ next bar";
}

function pickTask(round: number): GameTaskKind {
  const tasks: GameTaskKind[] = ["CUT_NEXT_BEAT", "CUT_NEXT_BAR", "XFADE_1BEAT_NEXT_BAR"];
  return tasks[(round - 1) % tasks.length];
}

function pointsFromSmoothness(smoothness: number) {
  const s = Number.isFinite(smoothness) ? smoothness : 0;
  if (s >= 95) return 30;
  if (s >= 85) return 20;
  if (s >= 70) return 10;
  if (s >= 50) return 5;
  return 0;
}

function roundStateLabel(status: GameRoundStatus) {
  if (status === "READY") return "READY — click Start Round";
  if (status === "COUNTDOWN") return "COUNTDOWN — waiting for start";
  if (status === "AWAITING") return "RUNNING — play the task";
  if (status === "RESULT") return "RESULT — click Next Round";
  return "OFF";
}

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

  // ✅ Keep last completed id for display clarity
  const lastCompletedPlanIdRef = useRef<string | null>(null);

  // ✅ Round clarity toast (UI-only)
  const toastTimerRef = useRef<number | null>(null);
  const [toast, setToast] = useState<ToastState>({ visible: false, kind: "info", title: "", detail: null });

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

  function readMemorySnapshot() {
    const stats = getMemoryStats();
    const all = getTransitionMemory();
    return {
      memTotal: stats.totalTransitions,
      memAvgDuration: stats.avgDuration,
      memRecent: all.slice(-10).reverse(),
    };
  }

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

  function refreshMemory() {
    const mem = readMemorySnapshot();
    setView((v) => ({
      ...v,
      ...mem,
    }));
  }

  function clearMemory() {
    clearTransitionMemory();
    refreshMemory();
  }

  function pushEvents(steps: { emitted: EngineEvent[] }[]) {
    for (const s of steps) {
      for (const e of s.emitted) eventsRef.current.push(e);
    }
    if (eventsRef.current.length > 500) {
      eventsRef.current = eventsRef.current.slice(-500);
    }
  }

  function stop() {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    lastNowRef.current = null;
    setView((v) => ({ ...v, running: false }));
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

      pushEvents(res.steps);

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
          masterA = 1;
          masterB = 0;
        } else if (t.tickAbs >= armed.startTickAbs && t.tickAbs < armed.endTickAbs) {
          nextExecStatus = "RUNNING";
          nextExecNote = `Running ${t.tickAbs} / ${armed.endTickAbs}`;

          if (!execHasStartedRef.current) {
            showToast("info", "Round started", `Now running (plan ends @ ${armed.endTickAbs})`);
          }

          execHasStartedRef.current = true;

          const g = computeLaneGainsFromPlan(armed, t.tickAbs);
          masterA = g.masterA;
          masterB = g.masterB;
        } else {
          nextExecStatus = "COMPLETED";
          nextExecNote = `Completed @ ${armed.endTickAbs}`;

          const g = computeLaneGainsFromPlan(armed, armed.endTickAbs);
          masterA = g.masterA;
          masterB = g.masterB;

          const expectedEndMs = armed.endTickAbs * t.msPerTick;
          const actualEndMs = t.tMs;

          const score = analyzeTransition({ id: armed.requestId }, expectedEndMs, actualEndMs);
          lastScore = {
            id: score.id,
            timingErrorMs: score.timingErrorMs,
            smoothness: score.smoothness,
          };

          updateTransitionRecord(armed.requestId, { successScore: score.smoothness });

          // ✅ Remember last completed id for display clarity
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
              armedPlanId: null, // still keep "no stale armed id"
              lastCompletedPlanId: lastCompletedPlanIdRef.current, // ✅ show completion id separately
              lastScore,
              ...memAfter,
            }));
            stop();
            return;
          } else {
            setView((v) => ({
              ...v,
              ...memAfter,
            }));
          }
        }
      }

      setGame((gstate) => {
        if (!gstate.enabled) return gstate;
        if (gstate.status !== "COUNTDOWN" && gstate.status !== "AWAITING") return gstate;

        const p = viewRef.current.planned;
        if (!p) return { ...gstate, countdownText: gstate.countdownText ?? "—" };

        const remainingTicks = p.startTickAbs - t.tickAbs;
        if (remainingTicks > 0) {
          const gm = computeGridMath(cfgRef.current);
          const beatsLeft = remainingTicks / gm.ticksPerBeat;
          const barsLeft = beatsLeft / cfgRef.current.timeSig.beatsPerBar;

          const text =
            barsLeft >= 1
              ? `Starts in ~${barsLeft.toFixed(2)} bars`
              : beatsLeft >= 1
              ? `Starts in ~${beatsLeft.toFixed(2)} beats`
              : `Starts in ~${remainingTicks} ticks`;

          return { ...gstate, countdownText: text, status: "COUNTDOWN" };
        }

        return { ...gstate, countdownText: "Running...", status: "AWAITING" };
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

        // ✅ KISS: never show an id when IDLE, keep COMPLETED id in separate field
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

    const t = clockRef.current.transport;
    const mem = readMemorySnapshot();

    setView((v) => ({
      ...v,
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
      execStatus: "IDLE",
      execNote: null,
      lastCompletedPlanId: null,
      masterA: 1,
      masterB: 0,
      lastScore: null,
      ...mem,
    }));

    setToast((tst) => ({ ...tst, visible: false }));

    setGame((g) => {
      const now = Date.now();
      const combo = createComboState(now, DEFAULT_COMBO_CONFIG);
      return {
        ...g,
        status: g.enabled ? "READY" : "OFF",
        task: null,
        taskLabel: "",
        countdownText: null,
        roundPlanId: null,
        resultText: null,
        lastAward: null,

        combo,
        comboOutcome: "good",
        comboMultiplier: 1,
      };
    });
  }

  function applyBpm(nextBpm: number) {
    if (!Number.isFinite(nextBpm) || nextBpm <= 0) return;

    cfgRef.current = { ...cfgRef.current, bpm: nextBpm };

    clockRef.current = {
      ...clockRef.current,
      transport: setBpm(cfgRef.current, clockRef.current.transport, nextBpm),
    };

    const t = clockRef.current.transport;

    setView((v) => ({
      ...v,
      bpm: t.bpm,
      msPerTick: t.msPerTick,
    }));
  }

  function makeReq(partial: Omit<TransitionRequest, "id">): TransitionRequest {
    const tickAbs = clockRef.current.transport.tickAbs;
    const n = (reqCounterRef.current += 1);
    const id = `req_${tickAbs}_${n}`;
    return { id, ...partial };
  }

  function plan(req: TransitionRequest) {
    try {
      const p = planTransition(cfgRef.current, clockRef.current.transport, req);
      setView((v) => ({ ...v, planned: p, planError: null }));
      refreshMemory();
      return p;
    } catch (err) {
      const msg = err instanceof Error ? err.message : typeof err === "string" ? err : JSON.stringify(err);
      console.error("planTransition error:", err);
      setView((v) => ({ ...v, planned: null, planError: msg }));
      return null;
    }
  }

  function replanFromExistingPlan(old: TransitionPlan): TransitionPlan | null {
    const isBarAligned = old.startPos.beat === 1 && old.startPos.tick === 0;
    const quantizeKind: "bar" | "beat" = isBarAligned ? "bar" : "beat";

    const ramps = old.events.filter((e) => e.type === "GainRamp") as Extract<TransitionEvent, { type: "GainRamp" }>[];
    const maxRampLen = ramps.reduce((m, r) => Math.max(m, r.endTickAbs - r.startTickAbs), 0);

    const strategy =
      maxRampLen > 0 ? { kind: "crossfade" as const, fadeTicks: maxRampLen } : { kind: "cut" as const };

    const req = makeReq({
      fromStateId: old.fromStateId,
      toStateId: old.toStateId,
      quantize: { kind: quantizeKind },
      strategy,
      minDelayTicks: 1,
    });

    try {
      return planTransition(cfgRef.current, clockRef.current.transport, req);
    } catch (err) {
      console.error("replanFromExistingPlan error:", err);
      return null;
    }
  }

  function armSpecificPlan(planned: TransitionPlan) {
    const nowTickAbs = clockRef.current.transport.tickAbs;

    const isStaleStart = planned.startTickAbs <= nowTickAbs;
    if (isStaleStart) {
      const fresh = replanFromExistingPlan(planned);
      if (!fresh) {
        setView((v) => ({
          ...v,
          execStatus: "IDLE",
          execNote: "Plan start was stale and auto-replan failed — click a plan button again.",
        }));
        return null;
      }

      armedPlanRef.current = fresh;
      execHasStartedRef.current = false;

      setView((v) => ({
        ...v,
        planned: fresh,
        armedPlanId: fresh.requestId,
        execStatus: "ARMED",
        execNote: `Stale plan detected — replanned + armed @ ${fresh.startTickAbs}`,
        masterA: 1,
        masterB: 0,
      }));

      refreshMemory();
      return fresh;
    }

    armedPlanRef.current = planned;
    execHasStartedRef.current = false;

    setView((v) => ({
      ...v,
      armedPlanId: planned.requestId,
      execStatus: "ARMED",
      execNote: `Waiting for start @ ${planned.startTickAbs}`,
      masterA: 1,
      masterB: 0,
    }));

    refreshMemory();
    return planned;
  }

  function setGameEnabled(next: boolean) {
    setGame((g) => {
      const now = Date.now();
      const combo = createComboState(now, DEFAULT_COMBO_CONFIG);
      return {
        ...g,
        enabled: next,
        status: next ? "READY" : "OFF",
        resultText: null,
        countdownText: null,
        task: null,
        taskLabel: "",
        roundPlanId: null,
        lastAward: null,

        combo,
        comboOutcome: "good",
        comboMultiplier: 1,
      };
    });
  }

  function startGameRound() {
    if (!viewRef.current.running) start();

    // ✅ KISS / USER FRIENDLY: in game mode, each round clearly ends → force auto-stop ON
    if (!autoStopRef.current) {
      autoStopRef.current = true;
      setView((v) => ({ ...v, autoStopAtPlanEnd: true }));
    }

    setView((v) => ({
      ...v,
      lastScore: null,
      execNote: null,
    }));

    showToast("info", "Round starting…", "Planning + arming transition");

    const kind = pickTask(game.round);

    let planned: TransitionPlan | null = null;

    if (kind === "CUT_NEXT_BEAT") {
      planned = plan(
        makeReq({
          fromStateId: "A",
          toStateId: "B",
          quantize: { kind: "beat" },
          strategy: { kind: "cut" },
          minDelayTicks: 1,
        })
      );
    }

    if (kind === "CUT_NEXT_BAR") {
      planned = plan(
        makeReq({
          fromStateId: "A",
          toStateId: "B",
          quantize: { kind: "bar" },
          strategy: { kind: "cut" },
          minDelayTicks: 1,
        })
      );
    }

    if (kind === "XFADE_1BEAT_NEXT_BAR") {
      const gm = computeGridMath(cfgRef.current);
      planned = plan(
        makeReq({
          fromStateId: "A",
          toStateId: "B",
          quantize: { kind: "bar" },
          strategy: { kind: "crossfade", fadeTicks: gm.ticksPerBeat },
          minDelayTicks: 1,
        })
      );
    }

    if (!planned) {
      showToast("warn", "Round failed", "Plan failed — try Start Round again.");
      setGame((g) => ({
        ...g,
        status: "READY",
        task: kind,
        taskLabel: taskLabel(kind),
        countdownText: null,
        resultText: "Plan failed — try Start Round again.",
        lastAward: 0,
        roundPlanId: null,
      }));
      return;
    }

    const armed = armSpecificPlan(planned);

    setGame((g) => ({
      ...g,
      round: g.round + 1,
      status: "COUNTDOWN",
      task: kind,
      taskLabel: taskLabel(kind),
      countdownText: "Starting...",
      resultText: null,
      lastAward: null,
      roundPlanId: armed ? armed.requestId : planned.requestId,
    }));
  }

  function nextRoundReady() {
    showToast("info", "Ready for next round", "Press Start Round when you’re ready.");

    setGame((g) => ({
      ...g,
      status: "READY",
      task: null,
      taskLabel: "",
      countdownText: null,
      roundPlanId: null,
      resultText: null,
      lastAward: null,
    }));
  }

  useEffect(() => {
    refreshMemory();
    return () => {
      if (toastTimerRef.current != null) window.clearTimeout(toastTimerRef.current);
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const avgDurationDisplay = computeAvgDisplayedDurationTicks(view.memRecent);

  const toastStyle =
    toast.kind === "success"
      ? { wrap: "border-green-200 bg-green-50", title: "text-green-900", detail: "text-green-800" }
      : toast.kind === "warn"
      ? { wrap: "border-amber-200 bg-amber-50", title: "text-amber-900", detail: "text-amber-800" }
      : { wrap: "border-blue-200 bg-blue-50", title: "text-blue-900", detail: "text-blue-800" };

  const nextRoundHot = game.enabled && game.status === "RESULT";
  const startRoundDisabled = !game.enabled || game.status !== "READY";
  const execIdDisplay =
    view.execStatus === "COMPLETED" ? view.lastCompletedPlanId ?? view.armedPlanId : view.armedPlanId;

  return (
    <div className="min-h-screen bg-zinc-100 p-6 text-black">
      <div className="mx-auto max-w-5xl space-y-6">
        <h1 className="text-2xl font-bold">Live Engine — Metronome + Transition Planner (Execute)</h1>

        {/* ✅ Round Clarity Banner */}
        {toast.visible ? (
          <div className={`rounded-2xl border p-3 shadow-sm ${toastStyle.wrap}`}>
            <div className={`text-sm font-semibold ${toastStyle.title}`}>{toast.title}</div>
            {toast.detail ? <div className={`mt-1 text-xs ${toastStyle.detail}`}>{toast.detail}</div> : null}
          </div>
        ) : null}

        {/* ✅ Game Mode Panel (Solo) */}
        <div className="rounded-2xl border bg-white p-4 shadow">
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-sm font-semibold text-zinc-800">Game Mode (Solo)</div>

            <div className="ml-auto flex items-center gap-2">
              <span className="rounded-full border bg-zinc-50 px-2 py-1 text-xs font-semibold text-zinc-700">
                {game.enabled ? "ON" : "OFF"}
              </span>

              <button
                className="rounded-xl border bg-white px-4 py-2 text-sm font-medium text-black shadow hover:bg-zinc-100"
                onClick={() => setGameEnabled(!game.enabled)}
              >
                {game.enabled ? "Disable" : "Enable"}
              </button>
            </div>
          </div>

          {!game.enabled ? (
            <div className="mt-2 text-xs text-zinc-600">Enable this to get simple performance tasks and earn points.</div>
          ) : (
            <div className="mt-3 grid gap-3 sm:grid-cols-5">
              {/* ✅ Persistent Round State */}
              <div className="sm:col-span-5 rounded-xl border bg-zinc-50 p-3">
                <div className="text-xs text-zinc-600">Round State</div>
                <div className="mt-1 text-sm font-semibold text-zinc-900">{roundStateLabel(game.status)}</div>
                <div className="mt-1 font-mono text-[11px] text-zinc-600">raw={game.status}</div>

                {game.status === "AWAITING" ? (
                  <div className="mt-2 rounded-lg border bg-white p-2">
                    <div className="text-xs font-semibold text-amber-800">● LIVE: ROUND RUNNING</div>
                    <div className="mt-1 text-[11px] text-zinc-600">Play the task now. Round ends automatically.</div>
                  </div>
                ) : null}

                {game.status === "RESULT" ? (
                  <div className="mt-2 rounded-lg border bg-white p-2">
                    <div className="text-xs font-semibold text-green-800">✓ READY: NEXT ROUND</div>
                    <div className="mt-1 text-[11px] text-zinc-600">Press “Next Round”, then “Start Round”.</div>
                  </div>
                ) : null}
              </div>

              <div className="rounded-xl border bg-zinc-50 p-3">
                <div className="text-xs text-zinc-600">Score</div>
                <div className="mt-1 font-mono text-lg">{game.score}</div>
              </div>

              <div className="rounded-xl border bg-zinc-50 p-3">
                <div className="text-xs text-zinc-600">Round</div>
                <div className="mt-1 font-mono text-lg">{Math.max(1, game.round - 1)}</div>
              </div>

              <div className="rounded-xl border bg-zinc-50 p-3">
                <div className="text-xs text-zinc-600">Streak</div>
                <div className="mt-1 font-mono text-lg">{game.combo.streak}</div>
                <div className="mt-1 text-[11px] text-zinc-600">best {game.combo.bestStreak}</div>
              </div>

              <div className="rounded-xl border bg-zinc-50 p-3">
                <div className="text-xs text-zinc-600">Multiplier</div>
                <div className="mt-1 font-mono text-lg">×{game.comboMultiplier.toFixed(2)}</div>
                <div className="mt-1 text-[11px] text-zinc-600">{game.comboOutcome}</div>
              </div>

              <div className="sm:col-span-5 rounded-xl border bg-white p-3">
                <div className="text-xs font-semibold text-zinc-800">Task</div>
                <div className="mt-1 text-sm text-zinc-700">{game.taskLabel || "—"}</div>

                <div className="mt-2 text-xs text-zinc-600">
                  Countdown: <span className="font-mono">{game.countdownText ?? "—"}</span>
                </div>

                <div className="mt-2 text-xs text-zinc-600">
                  Round Plan: <span className="font-mono">{game.roundPlanId ?? "—"}</span>
                </div>

                {game.resultText ? (
                  <div className="mt-2 rounded-lg border bg-zinc-50 p-2 text-sm text-zinc-800">{game.resultText}</div>
                ) : null}

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    className="rounded-xl border bg-white px-4 py-2 text-sm font-medium text-black shadow hover:bg-zinc-100 disabled:opacity-50"
                    onClick={startGameRound}
                    disabled={startRoundDisabled}
                    title={startRoundDisabled ? "Click Next Round first" : "Start the next round"}
                  >
                    Start Round
                  </button>

                  <button
                    className={`rounded-xl border px-4 py-2 text-sm font-medium shadow ${
                      nextRoundHot
                        ? "bg-green-50 text-green-900 hover:bg-green-100"
                        : "bg-white text-black hover:bg-zinc-100"
                    } disabled:opacity-50`}
                    onClick={nextRoundReady}
                    disabled={game.status !== "RESULT"}
                  >
                    Next Round
                  </button>

                  <div className="ml-auto text-xs text-zinc-600">
                    Round ends → metronome stops automatically (KISS). Press <span className="font-mono">Next Round</span>{" "}
                    then <span className="font-mono">Start Round</span>.
                  </div>
                </div>

                <div className="mt-2 text-[11px] text-zinc-600">
                  Debug: <span className="font-mono">game.enabled={String(game.enabled)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow">
          <div className="flex flex-wrap items-end gap-3">
            <button
              className="rounded-xl border bg-white px-4 py-2 font-medium text-black shadow hover:bg-zinc-100"
              onClick={() => (view.running ? stop() : start())}
            >
              {view.running ? "Stop" : "Start"}
            </button>

            <button
              className="rounded-xl border bg-white px-4 py-2 font-medium text-black shadow hover:bg-zinc-100"
              onClick={reset}
            >
              Reset
            </button>

            <div className="flex flex-col">
              <label className="text-xs text-zinc-600">BPM</label>
              <input
                className="w-28 rounded-xl border bg-white px-3 py-2 text-black"
                type="number"
                min={1}
                step={1}
                value={view.bpm}
                onChange={(e) => applyBpm(Number(e.target.value))}
              />
            </div>

            <div className="ml-auto text-xs text-zinc-600">
              Window {view.windowFrom} → {view.windowTo} ticks
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-4">
            <div className="rounded-xl border bg-zinc-50 p-3 font-mono text-sm">
              bar={view.bar} beat={view.beat} tick={view.tick}
              <br />
              tickAbs={view.tickAbs}
            </div>

            <div className="rounded-xl border bg-zinc-50 p-3 font-mono text-sm">
              tMs={Math.round(view.tMs)}
              <br />
              msPerTick={view.msPerTick.toFixed(6)}
            </div>

            <div className="rounded-xl border bg-zinc-50 p-3 font-mono text-sm">
              masterA={view.masterA.toFixed(3)}
              <br />
              masterB={view.masterB.toFixed(3)}
            </div>

            <div className="rounded-xl border bg-zinc-50 p-3">
              <div className="text-xs text-zinc-600">Execution</div>
              <div className="mt-2 flex items-center gap-2">
                <StatusPill status={view.execStatus} />
                <span className="font-mono text-xs text-zinc-700">{execIdDisplay ?? "none"}</span>
              </div>
              {view.execNote ? <div className="mt-2 text-xs text-zinc-600">{view.execNote}</div> : null}
              {view.execStatus === "COMPLETED" && view.lastCompletedPlanId ? (
                <div className="mt-2 text-[11px] text-zinc-600">
                  lastCompletedPlanId: <span className="font-mono">{view.lastCompletedPlanId}</span>
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-4 rounded-xl border bg-zinc-50 p-3">
            <div className="text-xs font-semibold text-zinc-700">Last Transition Score</div>
            {view.lastScore ? (
              <div className="mt-2 font-mono text-xs text-zinc-800 space-y-1">
                <div>id={view.lastScore.id}</div>
                <div>timingErrorMs={view.lastScore.timingErrorMs.toFixed(2)}</div>
                <div>smoothness={view.lastScore.smoothness.toFixed(1)} / 100</div>
              </div>
            ) : (
              <div className="mt-1 text-xs text-zinc-600">No score yet — execute a transition.</div>
            )}
          </div>

          <div className="mt-4 rounded-xl border bg-zinc-50 p-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="text-xs font-semibold text-zinc-700">Transition Memory (session)</div>

              <div className="ml-auto flex items-center gap-2">
                <button
                  className="rounded-lg border bg-white px-3 py-1 text-xs font-medium text-black shadow hover:bg-zinc-100"
                  onClick={refreshMemory}
                >
                  Refresh
                </button>
                <button
                  className="rounded-lg border bg-white px-3 py-1 text-xs font-medium text-black shadow hover:bg-zinc-100"
                  onClick={clearMemory}
                >
                  Clear Memory
                </button>
              </div>
            </div>

            <div className="mt-2 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border bg-white p-2">
                <div className="text-[11px] text-zinc-600">totalTransitions</div>
                <div className="font-mono text-sm">{view.memTotal}</div>
              </div>
              <div className="rounded-lg border bg-white p-2">
                <div className="text-[11px] text-zinc-600">avgDuration (display ticks)</div>
                <div className="font-mono text-sm">{avgDurationDisplay.toFixed(2)}</div>
              </div>
              <div className="rounded-lg border bg-white p-2">
                <div className="text-[11px] text-zinc-600">latest</div>
                <div className="font-mono text-[11px] text-zinc-800">
                  {view.memRecent[0] ? `${view.memRecent[0].id} @ ${fmtTs(view.memRecent[0].timestamp)}` : "none"}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow">
          <div className="text-sm text-zinc-700">
            View at <span className="font-mono">http://localhost:3000/live</span>
          </div>
        </div>
      </div>
    </div>
  );
}