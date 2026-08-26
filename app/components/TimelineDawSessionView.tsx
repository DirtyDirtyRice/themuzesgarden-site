"use client";

import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import type { TimelineDawTrackRegionLabels } from "@/lib/timeline/TimelineDawTrackRegionLabelPolicy";
import {
  createTimelineDawSessionScenes,
  createTimelineDawSessionNavigationIndex,
  createTimelineDawSessionConsolidatedArrangementPlan,
  createTimelineDawSessionArrangementPreview,
  createTimelineDawSessionPerformanceEvent,
  createTimelineDawSessionSavedTake,
  createTimelineDawSessionTakeSummary,
  createTimelineDawSessionCompTake,
  createTimelineDawSessionTakeLaneBundle,
  parseTimelineDawSessionTakeLaneBundle,
  createTimelineDawSessionLiveSetPlan,
  parseTimelineDawSessionLiveSetPlan,
  analyzeTimelineDawSessionLiveSetFlow,
  createTimelineDawSessionLiveCue,
  createTimelineDawSessionLiveProgressLabel,
  createTimelineDawSessionScenePassProgress,
  createTimelineDawSessionSceneRemainingLabel,
  createTimelineDawSessionSceneUpNextCue,
  createTimelineDawSessionClipPassProgress,
  moveTimelineDawSessionScene,
  orderTimelineDawSessionScenes,
  resolveTimelineDawSessionSceneFollowAction,
  resolveTimelineDawSessionScenePlayCount,
  quantizeTimelineDawSessionPerformanceTake,
  createTimelineDawSessionSceneLaunch,
  resolveTimelineDawSessionKeyboardCommand,
  resolveTimelineDawSessionSceneHotkeyIndex,
  resolveTimelineDawSessionClipLaunchMode,
  resolveTimelineDawSessionClipQuantization,
  resolveTimelineDawSessionClipPlayCount,
  findTimelineDawSessionClipSlot,
  createTimelineDawSessionClipPlaybackStatus,
  createTimelineDawSessionClipTransportState,
  createTimelineDawSessionClipUpNextCue,
  createTimelineDawSessionClipRemainingLabel,
  createTimelineDawSessionQueuedLaunchProgress,
  createTimelineDawSessionQueuedStopLabel,
  resolveTimelineDawSessionClipKeyboardCommand,
  type TimelineDawSessionFollowAction,
  type TimelineDawSessionLaunchQuantization,
  type TimelineDawSessionScene,
  type TimelineDawSessionPerformanceEvent,
  type TimelineDawSessionTakeQuantization,
  type TimelineDawSessionSavedTake,
  type TimelineDawSessionSceneFollowChoice,
  type TimelineDawSessionClipLaunchMode,
  type TimelineDawSessionClipLaunchChoice,
  type TimelineDawSessionClipQuantizationChoice,
} from "@/lib/timeline/TimelineDawSessionViewPolicy";

type SessionLane = { id: string; name: string };
type LaunchSettings = { bpm: number; quantization: TimelineDawSessionLaunchQuantization; clipLaunchMode: TimelineDawSessionClipLaunchMode; clipPlayCount: number; followAction: TimelineDawSessionFollowAction; defaultFollowAction: TimelineDawSessionFollowAction; sceneFollowActions: Record<string, TimelineDawSessionFollowAction>; sceneFollowTargetIds: Record<string, string>; scenePlayCounts: Record<string, number>; sceneOrderIds: string[] };

const launchButton = "rounded-lg border border-cyan-200/25 bg-cyan-200 px-3 py-2 text-xs font-black text-cyan-950 transition hover:bg-white disabled:opacity-40";

export default function TimelineDawSessionView({
  lanes,
  labels,
  activeSceneId,
  activeClipId,
  activeClipPlayback,
  activeSceneProgress,
  activeScenePaused,
  queuedLaunchName,
  queuedLaunchProgress,
  onLaunchClip,
  onLaunchScene,
  onStop,
  onPauseScene,
  onResumeScene,
  onPauseClip,
  onResumeClip,
  onPreviousClip,
  onReplayClip,
  onAdvanceClip,
  onCancelQueued,
  onLaunchQueuedNow,
  onQueueStop,
}: {
  lanes: SessionLane[];
  labels: TimelineDawTrackRegionLabels;
  activeSceneId?: string;
  activeClipId?: string;
  activeClipPlayback?: { mode: TimelineDawSessionClipLaunchMode; currentPass: number; totalPasses: number; paused: boolean; passStartedAtMs?: number; passDurationMs?: number; pausedAtMs?: number };
  activeSceneProgress?: { currentIteration: number; totalIterations: number | null; passStartedAtMs: number; passDurationMs: number; pausedAtMs?: number };
  activeScenePaused: boolean;
  queuedLaunchName?: string;
  queuedLaunchProgress?: { queuedAtMs: number; delayMs: number };
  onLaunchClip: (clip: { id: string; laneId: string; startSeconds: number; endSeconds: number; name: string }, settings: LaunchSettings) => void;
  onLaunchScene: (scene: TimelineDawSessionScene, settings: LaunchSettings) => void;
  onStop: () => void;
  onPauseScene: () => void;
  onResumeScene: () => void;
  onPauseClip: () => void;
  onResumeClip: () => void;
  onPreviousClip: () => void;
  onReplayClip: () => void;
  onAdvanceClip: () => void;
  onCancelQueued: () => void;
  onLaunchQueuedNow: () => void;
  onQueueStop: (settings: { bpm: number; quantization: TimelineDawSessionLaunchQuantization }) => void;
}) {
  const [bpm, setBpm] = useState(120);
  const [quantization, setQuantization] = useState<TimelineDawSessionLaunchQuantization>("bar");
  const [followAction, setFollowAction] = useState<TimelineDawSessionFollowAction>("stop");
  const [clipLaunchMode, setClipLaunchMode] = useState<TimelineDawSessionClipLaunchMode>("one-shot");
  const [clipLaunchChoices, setClipLaunchChoices] = useState<Record<string, TimelineDawSessionClipLaunchChoice>>({});
  const [clipQuantizationChoices, setClipQuantizationChoices] = useState<Record<string, TimelineDawSessionClipQuantizationChoice>>({});
  const [clipPlayCounts, setClipPlayCounts] = useState<Record<string, number>>({});
  const [performanceEvents, setPerformanceEvents] = useState<TimelineDawSessionPerformanceEvent[]>([]);
  const [takeQuantization, setTakeQuantization] = useState<TimelineDawSessionTakeQuantization>("off");
  const [takeName, setTakeName] = useState("Take 1");
  const [savedTakes, setSavedTakes] = useState<TimelineDawSessionSavedTake[]>([]);
  const [preferredTakeId, setPreferredTakeId] = useState<string | null>(null);
  const [compName, setCompName] = useState("Comp 1");
  const [compSelections, setCompSelections] = useState<string[]>([]);
  const [bundleNotice, setBundleNotice] = useState("");
  const [liveSetNotice, setLiveSetNotice] = useState("");
  const [sceneOrderIds, setSceneOrderIds] = useState<string[]>([]);
  const [sceneFollowChoices, setSceneFollowChoices] = useState<Record<string, TimelineDawSessionSceneFollowChoice>>({});
  const [scenePlayCounts, setScenePlayCounts] = useState<Record<string, number>>({});
  const [sceneFollowTargetIds, setSceneFollowTargetIds] = useState<Record<string, string>>({});
  const [liveProgressNowMs, setLiveProgressNowMs] = useState(() => Date.now());
  const performanceStartedAtRef = useRef<number | null>(null);
  const baseScenes = createTimelineDawSessionScenes(labels, lanes.map((lane) => lane.id));
  const scenes = orderTimelineDawSessionScenes(baseScenes, sceneOrderIds);
  const sceneFollowActions = Object.fromEntries(scenes.map((scene) => [scene.id, resolveTimelineDawSessionSceneFollowAction(scene.id, sceneFollowChoices, followAction)]));
  const resolvedScenePlayCounts = Object.fromEntries(scenes.map((scene) => [scene.id, resolveTimelineDawSessionScenePlayCount(scene.id, scenePlayCounts)]));
  const settings = { bpm, quantization, clipLaunchMode, clipPlayCount: 1, followAction, defaultFollowAction: followAction, sceneFollowActions, sceneFollowTargetIds, scenePlayCounts: resolvedScenePlayCounts, sceneOrderIds: scenes.map((scene) => scene.id) };
  const liveSetFlow = analyzeTimelineDawSessionLiveSetFlow(scenes, sceneFollowActions, sceneFollowTargetIds, resolvedScenePlayCounts);
  const sceneNamesById = new Map(scenes.map((scene) => [scene.id, scene.name]));
  const activeSceneIndex = scenes.findIndex((scene) => scene.id === activeSceneId);
  const activeClipTransport = activeClipPlayback ? createTimelineDawSessionClipTransportState(activeClipPlayback) : null;
  const activeClipUpNextCue = activeClipPlayback ? createTimelineDawSessionClipUpNextCue(activeClipPlayback) : null;
  const activeClip = findTimelineDawSessionClipSlot(scenes, activeClipId);
  const liveCue = createTimelineDawSessionLiveCue(activeSceneIndex, scenes, sceneFollowActions, sceneFollowTargetIds, resolvedScenePlayCounts);
  const livePassProgress = activeSceneProgress ? createTimelineDawSessionScenePassProgress({ ...activeSceneProgress, nowMs: liveProgressNowMs }) : null;
  const activeSceneUpNextCue = activeSceneProgress && liveCue ? createTimelineDawSessionSceneUpNextCue({ currentIteration: activeSceneProgress.currentIteration, totalIterations: activeSceneProgress.totalIterations, followAction: liveCue.action, nextSceneName: liveCue.nextSceneId ? sceneNamesById.get(liveCue.nextSceneId) : undefined }) : null;
  const activeSceneRemainingLabel = activeSceneProgress && livePassProgress ? createTimelineDawSessionSceneRemainingLabel({ currentIteration: activeSceneProgress.currentIteration, totalIterations: activeSceneProgress.totalIterations, passDurationSeconds: activeSceneProgress.passDurationMs / 1000, currentPassRemainingSeconds: livePassProgress.remainingSeconds }) : null;
  const activeClipPassProgress = activeClipPlayback?.passStartedAtMs !== undefined && activeClipPlayback.passDurationMs !== undefined ? createTimelineDawSessionClipPassProgress({ passStartedAtMs: activeClipPlayback.passStartedAtMs, passDurationMs: activeClipPlayback.passDurationMs, pausedAtMs: activeClipPlayback.pausedAtMs, nowMs: liveProgressNowMs }) : null;
  const activeClipRemainingLabel = activeClipPlayback && activeClipPassProgress ? createTimelineDawSessionClipRemainingLabel({ ...activeClipPlayback, passDurationSeconds: (activeClipPlayback.passDurationMs ?? 0) / 1000, currentPassRemainingSeconds: activeClipPassProgress.remainingSeconds }) : null;
  const queuedProgress = queuedLaunchProgress ? createTimelineDawSessionQueuedLaunchProgress(queuedLaunchProgress.queuedAtMs, queuedLaunchProgress.delayMs, liveProgressNowMs) : null;
  const queuedStopLabel = createTimelineDawSessionQueuedStopLabel(quantization);
  const cleanedPerformanceEvents = quantizeTimelineDawSessionPerformanceTake(performanceEvents, takeQuantization);
  const arrangementPreview = createTimelineDawSessionConsolidatedArrangementPlan(cleanedPerformanceEvents);
  const arrangementTimeline = createTimelineDawSessionArrangementPreview(arrangementPreview, lanes.map((lane) => lane.id));
  const savedTakeSummaries = new Map(savedTakes.map((take) => [take.id, createTimelineDawSessionTakeSummary(take)]));

  useEffect(() => {
    if ((!activeSceneProgress || activeScenePaused) && !queuedProgress && (!activeClipPassProgress || activeClipPlayback?.paused)) return;
    const timer = window.setInterval(() => setLiveProgressNowMs(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [activeClipPassProgress, activeClipPlayback?.paused, activeScenePaused, activeSceneProgress, queuedProgress]);

  function recordPerformanceEvent(input: { kind: "clip" | "scene"; name: string; clips: Array<{ laneId: string; startSeconds: number; endSeconds: number }>; launchedAtMs: number }) {
    const { launchedAtMs, ...eventInput } = input;
    const startsFreshTake = performanceStartedAtRef.current === null;
    performanceStartedAtRef.current ??= launchedAtMs;
    const event = createTimelineDawSessionPerformanceEvent({
      id: crypto.randomUUID(),
      ...eventInput,
      launchedAtMs,
      takeStartedAtMs: performanceStartedAtRef.current,
      bpm,
    });
    setPerformanceEvents((current) => startsFreshTake && current.length ? [event] : [...current, event]);
  }

  function savePerformanceTake() {
    const savedTake = createTimelineDawSessionSavedTake({ id: crypto.randomUUID(), name: takeName, quantization: takeQuantization, events: performanceEvents });
    setSavedTakes((current) => [...current, savedTake]);
    setPreferredTakeId((current) => current ?? savedTake.id);
    setTakeName(`Take ${savedTakes.length + 2}`);
  }

  function loadPerformanceTake(take: TimelineDawSessionSavedTake) {
    const loaded = createTimelineDawSessionSavedTake(take);
    setPerformanceEvents(loaded.events);
    setTakeQuantization(loaded.quantization);
    setTakeName(loaded.name);
    performanceStartedAtRef.current = null;
  }

  function removePerformanceTake(takeId: string) {
    setSavedTakes((current) => current.filter((candidate) => candidate.id !== takeId));
    setPreferredTakeId((current) => current === takeId ? null : current);
    setCompSelections((current) => current.filter((selection) => !selection.startsWith(`${takeId}:`)));
  }

  function toggleCompSelection(takeId: string, eventId: string) {
    const selection = `${takeId}:${eventId}`;
    setCompSelections((current) => current.includes(selection) ? current.filter((candidate) => candidate !== selection) : [...current, selection]);
  }

  function buildCompTake() {
    const id = crypto.randomUUID();
    const compTake = createTimelineDawSessionCompTake({
      id,
      name: compName,
      takes: savedTakes,
      selections: compSelections.map((selection) => { const separator = selection.indexOf(":"); return { takeId: selection.slice(0, separator), eventId: selection.slice(separator + 1) }; }),
    });
    setSavedTakes((current) => [...current, compTake]);
    setCompSelections([]);
    setCompName(`Comp ${savedTakes.filter((take) => take.name.startsWith("Comp ")).length + 2}`);
  }

  function downloadTakeLaneBundle() {
    const bundle = createTimelineDawSessionTakeLaneBundle({ createdAt: new Date().toISOString(), preferredTakeId, takes: savedTakes });
    const url = URL.createObjectURL(new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "session-take-lanes.json";
    anchor.click();
    URL.revokeObjectURL(url);
    setBundleNotice(`Downloaded ${bundle.takes.length} Take Lane${bundle.takes.length === 1 ? "" : "s"}.`);
  }

  async function importTakeLaneBundle(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      if (file.size > 5_000_000) throw new Error("Take Lane bundles must be 5 MB or smaller.");
      const bundle = parseTimelineDawSessionTakeLaneBundle(JSON.parse(await file.text()) as unknown);
      setSavedTakes((current) => [...new Map([...current, ...bundle.takes].map((take) => [take.id, take])).values()]);
      if (bundle.preferredTakeId) setPreferredTakeId(bundle.preferredTakeId);
      setBundleNotice(`Imported ${bundle.takes.length} validated Take Lane${bundle.takes.length === 1 ? "" : "s"}.`);
    } catch (error) {
      setBundleNotice(error instanceof Error ? error.message : "The Take Lane bundle could not be imported.");
    }
  }

  function downloadLiveSetPlan() {
    const plan = createTimelineDawSessionLiveSetPlan({ createdAt: new Date().toISOString(), bpm, launchQuantization: quantization, defaultClipLaunchMode: clipLaunchMode, clipLaunchChoices, clipQuantizationChoices, clipPlayCounts, defaultFollowAction: followAction, sceneOrderIds: scenes.map((scene) => scene.id), sceneFollowChoices, scenePlayCounts: resolvedScenePlayCounts, sceneFollowTargetIds });
    const url = URL.createObjectURL(new Blob([JSON.stringify(plan, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "session-live-set-plan.json";
    anchor.click();
    URL.revokeObjectURL(url);
    setLiveSetNotice(`Downloaded a ${plan.sceneOrderIds.length}-scene Live Set Plan.`);
  }

  async function importLiveSetPlan(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      if (file.size > 1_000_000) throw new Error("Live Set Plans must be 1 MB or smaller.");
      const plan = parseTimelineDawSessionLiveSetPlan(JSON.parse(await file.text()) as unknown);
      setBpm(plan.bpm);
      setQuantization(plan.launchQuantization);
      setClipLaunchMode(plan.defaultClipLaunchMode);
      setClipLaunchChoices(plan.clipLaunchChoices);
      setClipQuantizationChoices(plan.clipQuantizationChoices);
      setClipPlayCounts(plan.clipPlayCounts);
      setFollowAction(plan.defaultFollowAction);
      setSceneOrderIds(plan.sceneOrderIds);
      setSceneFollowChoices(plan.sceneFollowChoices);
      setScenePlayCounts(plan.scenePlayCounts);
      setSceneFollowTargetIds(plan.sceneFollowTargetIds);
      setLiveSetNotice(`Restored a validated ${plan.sceneOrderIds.length}-scene Live Set Plan.`);
    } catch (error) {
      setLiveSetNotice(error instanceof Error ? error.message : "The Live Set Plan could not be imported.");
    }
  }

  function downloadPerformanceTake() {
    const payload = {
      schema: "muzes-daw-session-performance/v1",
      createdAt: new Date().toISOString(),
      takeQuantization,
      events: cleanedPerformanceEvents,
      arrangementPlan: arrangementPreview,
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "session-performance-take.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function undoLastPerformanceLaunch() {
    setPerformanceEvents((current) => {
      if (current.length <= 1) performanceStartedAtRef.current = null;
      return current.slice(0, -1);
    });
  }

  function launchSceneAndRecord(scene: TimelineDawSessionScene, launchedAtMs: number) {
    recordPerformanceEvent({ kind: "scene", name: scene.name, clips: createTimelineDawSessionSceneLaunch(scene), launchedAtMs });
    onLaunchScene(scene, { ...settings, followAction: sceneFollowActions[scene.id] ?? followAction });
  }

  function handleLauncherKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    const shortcutContext = {
      key: event.key,
      launcherFocused: event.currentTarget.contains(target),
      editableTarget: Boolean(target.closest("input, textarea, select, [contenteditable='true']")),
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      altKey: event.altKey,
      repeat: event.repeat,
    };
    const sceneHotkeyIndex = resolveTimelineDawSessionSceneHotkeyIndex({ ...shortcutContext, sceneCount: scenes.length });
    if (sceneHotkeyIndex !== null) {
      event.preventDefault();
      launchSceneAndRecord(scenes[sceneHotkeyIndex], event.timeStamp);
      return;
    }
    const command = resolveTimelineDawSessionKeyboardCommand(shortcutContext);
    if (!command) return;
    event.preventDefault();
    if (command === "stop") {
      onStop();
      return;
    }
    if (command === "queue-stop") {
      onQueueStop({ bpm, quantization });
      return;
    }
    if (command === "launch-queued") {
      if (queuedLaunchName) onLaunchQueuedNow();
      return;
    }
    if (command === "cancel-queued") {
      if (queuedLaunchName) onCancelQueued();
      return;
    }
    const clipCommand = resolveTimelineDawSessionClipKeyboardCommand(command, Boolean(activeClip), activeClipTransport?.canGoPrevious ?? false);
    if (clipCommand) {
      if (clipCommand === "previous") onPreviousClip();
      else if (clipCommand === "replay") onReplayClip();
      else if (clipCommand === "next") onAdvanceClip();
      else if (activeClipPlayback?.paused) onResumeClip();
      else onPauseClip();
      return;
    }
    if (command === "pause-resume") {
      if (activeSceneIndex >= 0) {
        if (activeScenePaused) onResumeScene(); else onPauseScene();
      }
      return;
    }
    if (activeSceneIndex < 0) return;
    const targetIndex = createTimelineDawSessionNavigationIndex(activeSceneIndex, scenes.length, command);
    if (targetIndex !== null) launchSceneAndRecord(scenes[targetIndex], event.timeStamp);
  }

  return (
    <details className="mt-4 rounded-2xl border border-cyan-300/25 bg-cyan-300/[0.05]">
      <summary className="cursor-pointer list-none p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-100">Session View</p>
            <h3 className="mt-1 text-xl font-black text-white">Clip and Scene Launcher</h3>
            <p className="mt-1 text-xs text-white/55">Launch saved Named Regions without changing the linear arrangement.</p>
          </div>
          <span className="rounded-full border border-cyan-200/20 px-3 py-1 text-xs font-black text-cyan-100">{scenes.length} scene{scenes.length === 1 ? "" : "s"}</span>
        </div>
      </summary>

      <div className="border-t border-cyan-300/15 p-4" tabIndex={0} onKeyDown={handleLauncherKeyDown} aria-label="Session View performance controls">
        <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-white/10 bg-black/30 p-3">
          <label className="text-xs font-black text-white/70">Session BPM
            <input className="mt-1 block w-28 rounded-lg border border-white/20 bg-black px-3 py-2 text-white" type="number" min={30} max={300} step={1} value={bpm} onChange={(event) => setBpm(Math.min(300, Math.max(30, Number(event.target.value) || 120)))} />
          </label>
          <label className="text-xs font-black text-white/70">Launch quantization
            <select className="mt-1 block rounded-lg border border-white/20 bg-black px-3 py-2 text-white" value={quantization} onChange={(event) => setQuantization(event.target.value as TimelineDawSessionLaunchQuantization)}>
              <option value="immediate">Immediate</option>
              <option value="beat">Next Beat</option>
              <option value="two-beats">Next 2 Beats</option>
              <option value="bar">Next Bar</option>
            </select>
          </label>
          <label className="text-xs font-black text-white/70">After scene ends
            <select className="mt-1 block rounded-lg border border-white/20 bg-black px-3 py-2 text-white" value={followAction} onChange={(event) => setFollowAction(event.target.value as TimelineDawSessionFollowAction)}>
              <option value="stop">Stop at End</option>
              <option value="next">Launch Next Scene</option>
              <option value="loop">Loop Current Scene</option>
            </select>
          </label>
          <label className="text-xs font-black text-white/70">Individual clip launch
            <select className="mt-1 block rounded-lg border border-white/20 bg-black px-3 py-2 text-white" value={clipLaunchMode} onChange={(event) => setClipLaunchMode(event.target.value as TimelineDawSessionClipLaunchMode)}>
              <option value="one-shot">One-Shot</option>
              <option value="loop">Loop Until Stopped</option>
            </select>
          </label>
          <p className="max-w-xl text-xs text-white/45">Queued launches wait for the selected musical boundary. Stop cancels a queued launch before any audio starts.</p>
          {queuedLaunchName ? <div className="w-full rounded-lg border border-amber-300/20 bg-amber-300/[0.06] p-3" role="status" aria-live="polite"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-black text-amber-100">Queued: {queuedLaunchName}</span>{queuedProgress ? <span className="text-[11px] font-black text-amber-50">Launches in {queuedProgress.remainingSeconds.toFixed(2)} sec</span> : null}<div className="flex flex-wrap gap-2"><button type="button" className={launchButton} onClick={onLaunchQueuedNow}>Launch Now</button><button type="button" className={launchButton} onClick={onCancelQueued}>Cancel queued launch</button></div></div>{queuedProgress ? <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/40" role="progressbar" aria-label="Queued launch countdown" aria-valuemin={0} aria-valuemax={100} aria-valuenow={queuedProgress.percent}><div className="h-full rounded-full bg-amber-300 transition-[width] duration-100" style={{ width: `${queuedProgress.percent}%` }} /></div> : null}<p className="mt-2 text-[10px] text-amber-50/60">Enter launches now · Escape cancels</p></div> : null}
          <button type="button" className={launchButton} onClick={onStop}>Stop Session Audio</button>
          <button type="button" className={launchButton} onClick={() => onQueueStop({ bpm, quantization })}>{queuedStopLabel}</button>
          <button type="button" className={launchButton} onClick={downloadLiveSetPlan}>Download Live Set Plan</button>
          <label className={`${launchButton} cursor-pointer`}>Import Live Set Plan<input className="sr-only" type="file" accept="application/json,.json" onChange={importLiveSetPlan} /></label>
          {liveSetNotice ? <p className="w-full text-xs text-white/55" role="status">{liveSetNotice}</p> : null}
        </div>
        <div className="mb-4 rounded-xl border border-violet-300/20 bg-violet-300/[0.05] p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-black text-violet-100">Performance Take · {performanceEvents.length} launch{performanceEvents.length === 1 ? "" : "es"}</span>
            <label className="text-xs font-black text-white/70">Take name
              <input className="ml-2 w-32 rounded-lg border border-white/20 bg-black px-2 py-1 text-white" maxLength={80} value={takeName} onChange={(event) => setTakeName(event.target.value)} />
            </label>
            <label className="text-xs font-black text-white/70">Tighten timing
              <select className="ml-2 rounded-lg border border-white/20 bg-black px-2 py-1 text-white" value={takeQuantization} onChange={(event) => setTakeQuantization(event.target.value as TimelineDawSessionTakeQuantization)}>
                <option value="off">Keep live timing</option>
                <option value="beat">Nearest beat</option>
                <option value="two-beats">Nearest 2 beats</option>
                <option value="bar">Nearest bar</option>
              </select>
            </label>
            <button type="button" className={launchButton} disabled={!performanceEvents.length} onClick={downloadPerformanceTake}>Download Arrangement Plan</button>
            <button type="button" className={launchButton} disabled={!performanceEvents.length || !takeName.trim()} onClick={savePerformanceTake}>Save Take Lane</button>
            <button type="button" className={launchButton} disabled={!performanceEvents.length} onClick={undoLastPerformanceLaunch}>Undo Last Launch</button>
            <button type="button" className={launchButton} disabled={!performanceEvents.length} onClick={() => { setPerformanceEvents([]); performanceStartedAtRef.current = null; }}>Clear Performance Take</button>
          </div>
          {savedTakes.length ? <div className="mt-3 rounded-xl border border-violet-200/15 bg-black/20 p-2">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-violet-100">Saved Take Lanes · {savedTakes.length}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-black/30 p-2">
              <label className="text-[11px] font-black text-white/70">Comp name <input className="ml-2 w-32 rounded-lg border border-white/20 bg-black px-2 py-1 text-white" maxLength={80} value={compName} onChange={(event) => setCompName(event.target.value)} /></label>
              <span className="text-[11px] text-white/50">{compSelections.length} launch{compSelections.length === 1 ? "" : "es"} selected</span>
              <button type="button" className={launchButton} disabled={!compSelections.length || !compName.trim()} onClick={buildCompTake}>Build Comp Lane</button>
              <button type="button" className={launchButton} disabled={!compSelections.length} onClick={() => setCompSelections([])}>Clear Comp Choices</button>
              <button type="button" className={launchButton} onClick={downloadTakeLaneBundle}>Download Take Lane Bundle</button>
              <label className={`${launchButton} cursor-pointer`}>Import Take Lane Bundle<input className="sr-only" type="file" accept="application/json,.json" onChange={importTakeLaneBundle} /></label>
            </div>
            {bundleNotice ? <p className="mt-2 text-[11px] text-white/55" role="status">{bundleNotice}</p> : null}
            <ul className="mt-2 grid gap-2 lg:grid-cols-2">{savedTakes.map((take) => { const summary = savedTakeSummaries.get(take.id); return <li key={take.id} className={`rounded-lg border p-2 text-[11px] text-white/60 ${preferredTakeId === take.id ? "border-amber-300/50 bg-amber-300/10" : "border-white/10 bg-black/30"}`}>
              <div className="flex flex-wrap items-center gap-2"><strong className="text-white/80">{preferredTakeId === take.id ? "★ " : ""}{take.name}</strong><span>{summary?.durationSeconds.toFixed(2)} sec · {summary?.launchCount} launches · {summary?.placementCount} clips · {summary?.trackCount} tracks · {summary?.sceneLaunchCount} scenes</span></div>
              <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" className={launchButton} onClick={() => loadPerformanceTake(take)}>Load</button>
              <button type="button" className={launchButton} disabled={preferredTakeId === take.id} onClick={() => setPreferredTakeId(take.id)}>Set Preferred</button>
              <button type="button" className={launchButton} onClick={() => removePerformanceTake(take.id)}>Remove</button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">{take.events.map((event) => { const selection = `${take.id}:${event.id}`; const selected = compSelections.includes(selection); return <button key={event.id} type="button" aria-pressed={selected} className={`rounded-md border px-2 py-1 text-[10px] font-black ${selected ? "border-emerald-200 bg-emerald-200 text-emerald-950" : "border-white/15 bg-white/5 text-white/60"}`} onClick={() => toggleCompSelection(take.id, event.id)}>{selected ? "✓ " : "+ "}{event.name} @ {event.elapsedSeconds.toFixed(2)}</button>; })}</div>
            </li>; })}</ul>
          </div> : null}
          {performanceEvents.length ? <ol className="mt-2 flex flex-wrap gap-2">{cleanedPerformanceEvents.map((event) => <li key={event.id} className="rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-[11px] text-white/60">Bar {event.bar} · Beat {event.beat} · {event.elapsedSeconds.toFixed(2)} sec · {event.name}</li>)}</ol> : <p className="mt-2 text-xs text-white/45">Launching a clip or scene begins a temporary performance take. Download creates a private local JSON arrangement plan; it does not alter the song.</p>}
          {performanceEvents.length ? <p className="mt-2 text-xs text-white/45">Arrangement preview: {arrangementPreview.length} clip placement{arrangementPreview.length === 1 ? "" : "s"}. A new launch on the same track ends the earlier placement at that exact point, matching Session View playback. Timing cleanup changes only this preview and downloaded plan.</p> : null}
          {performanceEvents.length ? (
            <div className="mt-3 overflow-x-auto rounded-xl border border-white/10 bg-black/30 p-3" aria-label="Arrangement timeline preview">
              <div className="mb-2 flex items-center justify-between gap-3 text-[11px] font-black uppercase tracking-[0.12em] text-white/45">
                <span>Arrangement Timeline</span>
                <span>0.00–{arrangementTimeline.durationSeconds.toFixed(2)} sec</span>
              </div>
              <div className="min-w-[620px] space-y-2">
                {arrangementTimeline.lanes.map((previewLane) => {
                  const lane = lanes.find((candidate) => candidate.id === previewLane.laneId);
                  return <div key={previewLane.laneId} className="grid grid-cols-[120px_1fr] items-center gap-2">
                    <span className="truncate text-[11px] font-black text-white/55">{lane?.name ?? previewLane.laneId}</span>
                    <div className="relative h-9 overflow-hidden rounded-lg border border-white/10 bg-white/[0.04]">
                      {previewLane.clips.map((clip) => <div key={`${clip.eventId}:${clip.laneId}:${clip.timelineStartSeconds}`} className="absolute inset-y-1 overflow-hidden rounded-md border border-violet-200/40 bg-violet-300/25 px-2 py-1 text-[10px] font-black text-violet-50" style={{ left: `${clip.leftPercent}%`, width: `${clip.widthPercent}%` }} title={`${clip.eventName}: ${clip.timelineStartSeconds.toFixed(2)}–${clip.timelineEndSeconds.toFixed(2)} sec`}>
                        <span className="whitespace-nowrap">{clip.eventName} · {clip.timelineStartSeconds.toFixed(2)}–{clip.timelineEndSeconds.toFixed(2)}</span>
                      </div>)}
                    </div>
                  </div>;
                })}
              </div>
            </div>
          ) : null}
        </div>
        {activeSceneIndex >= 0 ? (
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-emerald-300/20 bg-emerald-300/[0.06] p-3" role="group" aria-label="Live scene navigation">
            <span className="text-xs font-black text-emerald-100">{activeScenePaused ? "Paused" : "Playing"} {scenes[activeSceneIndex].name}</span>
            {activeSceneProgress ? <span className="rounded-md border border-cyan-200/20 bg-cyan-200/10 px-2 py-1 text-[11px] font-black text-cyan-50" role="status" aria-live="polite">{createTimelineDawSessionLiveProgressLabel(activeSceneProgress.currentIteration, activeSceneProgress.totalIterations)}</span> : null}
            {liveCue ? <span className="rounded-md border border-emerald-200/20 bg-black/25 px-2 py-1 text-[11px] font-black text-emerald-50" aria-label="Active scene follow cue">Cue: ×{liveCue.playCount} {liveCue.playCount === 1 ? "play" : "plays"}, then {liveCue.action === "stop" ? "Stop" : liveCue.action === "loop" ? "Loop Current" : liveCue.nextSceneId ? sceneNamesById.get(liveCue.nextSceneId) ?? liveCue.nextSceneId : "End Set"}</span> : null}
            {activeSceneUpNextCue ? <span className="rounded-md border border-amber-200/25 bg-amber-200/10 px-2 py-1 text-[11px] font-black text-amber-50" aria-label="Active scene up next cue">Up Next: {activeSceneUpNextCue}</span> : null}
            {activeSceneRemainingLabel ? <span className="rounded-md border border-violet-200/25 bg-violet-200/10 px-2 py-1 text-[11px] font-black text-violet-50" aria-label="Active scene total remaining time">{activeSceneRemainingLabel}</span> : null}
            {livePassProgress ? <div className="w-full" aria-label="Current scene pass time"><div className="mb-1 flex justify-between gap-3 text-[10px] font-black text-emerald-50/70"><span>{livePassProgress.elapsedSeconds.toFixed(1)} sec elapsed</span><span>{livePassProgress.remainingSeconds.toFixed(1)} sec remaining</span></div><div className="h-2 overflow-hidden rounded-full bg-black/40" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={livePassProgress.percent}><div className="h-full rounded-full bg-emerald-300 transition-[width] duration-200" style={{ width: `${livePassProgress.percent}%` }} /></div></div> : null}
            {(["previous", "replay", "next"] as const).map((action) => {
              const targetIndex = createTimelineDawSessionNavigationIndex(activeSceneIndex, scenes.length, action);
              const label = action === "previous" ? "Previous Scene" : action === "replay" ? "Replay Scene" : "Next Scene";
              return <button key={action} type="button" className={launchButton} disabled={targetIndex === null} onClick={(event) => targetIndex === null ? undefined : launchSceneAndRecord(scenes[targetIndex], event.timeStamp)}>{label}</button>;
            })}
            {activeScenePaused ? <button type="button" className={launchButton} onClick={onResumeScene}>Resume Scene</button> : <button type="button" className={launchButton} onClick={onPauseScene}>Pause Scene</button>}
            <button type="button" className={launchButton} onClick={onStop}>Stop Scene</button>
          </div>
        ) : null}
        {activeSceneIndex < 0 && activeClip ? <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-cyan-300/25 bg-cyan-300/[0.08] p-3" role="group" aria-label="Active individual clip controls"><span className="text-xs font-black text-cyan-50">{activeClipPlayback?.paused ? "Paused" : "Playing"} clip {activeClip.name}</span><span className="text-[11px] text-white/55">{activeClip.startSeconds.toFixed(2)}–{activeClip.endSeconds.toFixed(2)} sec</span>{activeClipPlayback ? <span className="rounded-md border border-cyan-200/20 bg-black/25 px-2 py-1 text-[11px] font-black text-cyan-50" role="status" aria-live="polite">{createTimelineDawSessionClipPlaybackStatus(activeClipPlayback)}</span> : null}{activeClipUpNextCue ? <span className="rounded-md border border-amber-200/25 bg-amber-200/10 px-2 py-1 text-[11px] font-black text-amber-50" aria-label="Active clip up next cue">Up Next: {activeClipUpNextCue}</span> : null}{activeClipRemainingLabel ? <span className="rounded-md border border-violet-200/25 bg-violet-200/10 px-2 py-1 text-[11px] font-black text-violet-50" aria-label="Active clip total remaining time">{activeClipRemainingLabel}</span> : null}{activeClipPassProgress ? <div className="w-full" aria-label="Current clip pass time"><div className="mb-1 flex justify-between gap-3 text-[10px] font-black text-cyan-50/70"><span>{activeClipPassProgress.elapsedSeconds.toFixed(1)} sec elapsed</span><span>{activeClipPassProgress.remainingSeconds.toFixed(1)} sec remaining</span></div><div className="h-2 overflow-hidden rounded-full bg-black/40" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={activeClipPassProgress.percent}><div className="h-full rounded-full bg-cyan-300 transition-[width] duration-200" style={{ width: `${activeClipPassProgress.percent}%` }} /></div></div> : null}{activeClipTransport ? <><button type="button" className={launchButton} disabled={!activeClipTransport.canGoPrevious} onClick={onPreviousClip}>Previous Pass</button><button type="button" className={launchButton} onClick={onReplayClip}>Replay Clip</button></> : null}{activeClipPlayback?.paused ? <button type="button" className={launchButton} onClick={onResumeClip}>Resume Clip</button> : <button type="button" className={launchButton} onClick={onPauseClip}>Pause Clip</button>}{activeClipTransport ? <button type="button" className={launchButton} onClick={onAdvanceClip}>{activeClipTransport.advanceLabel}</button> : null}<button type="button" className={launchButton} onClick={onStop}>Stop Clip</button></div> : null}
        <p className="mb-4 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/55"><strong>Focused Session View keyboard:</strong> 1–9 launch the matching visible scene · P previous scene/pass · R replay scene/clip · N next scene/pass or finish clip · K pause/resume active clip or scene · Q quantized stop · Enter launch queued now · Escape cancel queued · Space immediate stop. Active clip and queue controls take priority over scene navigation. Click inside the launcher first; shortcuts stay off while typing or using menus.</p>
        {scenes.length ? <div className="mb-4 rounded-xl border border-amber-300/20 bg-amber-300/[0.05] p-3" aria-label="Live Set flow check">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-100">Live Set Flow Check</p>
          <p className="mt-1 text-xs text-white/65">{liveSetFlow.pathIds.map((id) => sceneNamesById.get(id) ?? id).join(" → ")} · {liveSetFlow.status === "loops" ? `loops at ${sceneNamesById.get(liveSetFlow.cycleAtSceneId ?? "") ?? "scene"}` : liveSetFlow.status === "stops" ? "stops by scene action" : "ends after the final safe target"}</p>
          <p className="mt-1 text-[11px] text-white/45">{liveSetFlow.unreachableSceneIds.length ? `Not reached from the first scene: ${liveSetFlow.unreachableSceneIds.map((id) => sceneNamesById.get(id) ?? id).join(", ")}.` : "Every scene is reachable from the first scene."} Play counts affect duration, not this route.</p>
          <ol className="mt-2 flex flex-wrap gap-2">{liveSetFlow.schedule.map((entry) => <li key={entry.sceneId} className="rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-[10px] text-white/55">{sceneNamesById.get(entry.sceneId) ?? entry.sceneId} ×{entry.playCount} · {entry.startSeconds.toFixed(2)}–{entry.endSeconds.toFixed(2)} sec</li>)}</ol>
          <p className="mt-2 text-[11px] font-black text-amber-100">{liveSetFlow.estimatedSourceDurationSeconds === null ? `Open-ended after ${liveSetFlow.schedule.at(-1)?.endSeconds.toFixed(2) ?? "0.00"} sec because the route loops.` : `Estimated source time: ${liveSetFlow.estimatedSourceDurationSeconds.toFixed(2)} sec.`}</p>
          <p className="mt-1 text-[10px] text-white/35">Source-time estimate uses the longest region in each scene before track stretch or other playback transforms.</p>
        </div> : null}
        {scenes.length ? (
          <div className="overflow-x-auto">
            <div className="min-w-[720px]">
              <div className="grid gap-2" style={{ gridTemplateColumns: `minmax(150px, .7fr) repeat(${Math.max(1, lanes.length)}, minmax(150px, 1fr))` }}>
                <div className="p-2 text-xs font-black uppercase tracking-[0.14em] text-white/45">Scene</div>
                {lanes.map((lane) => <div key={lane.id} className="p-2 text-xs font-black text-white/65">{lane.name}</div>)}
                {scenes.map((scene, sceneIndex) => {
                  const slotsByLane = new Map(scene.slots.map((slot) => [slot.laneId, slot]));
                  return [
                    <div key={`${scene.id}:launch`} className="rounded-xl border border-cyan-300/20 bg-black/40 p-2">
                      {sceneIndex < 9 ? <span className="mb-2 inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-cyan-200/25 bg-cyan-200/10 px-1 text-[10px] font-black text-cyan-50" aria-label={`Keyboard shortcut ${sceneIndex + 1}`}>{sceneIndex + 1}</span> : null}
                      <button type="button" className={launchButton} aria-pressed={activeSceneId === scene.id} onClick={(event) => { if (activeSceneId === scene.id) onStop(); else launchSceneAndRecord(scene, event.timeStamp); }}>
                        {activeSceneId === scene.id ? `Stop ${scene.name}` : `Launch ${scene.name}`}
                      </button>
                      <div className="mt-2 flex gap-1" aria-label={`Reorder ${scene.name} scene`}>
                        <button type="button" className={launchButton} disabled={scenes[0]?.id === scene.id} onClick={() => setSceneOrderIds((current) => moveTimelineDawSessionScene(baseScenes, current, scene.id, "up"))}>↑</button>
                        <button type="button" className={launchButton} disabled={scenes.at(-1)?.id === scene.id} onClick={() => setSceneOrderIds((current) => moveTimelineDawSessionScene(baseScenes, current, scene.id, "down"))}>↓</button>
                      </div>
                      <label className="mt-2 block text-[10px] font-black text-white/55">After this scene
                        <select className="mt-1 block w-full rounded-md border border-white/15 bg-black px-2 py-1 text-white" value={sceneFollowChoices[scene.id] ?? "global"} onChange={(event) => setSceneFollowChoices((current) => ({ ...current, [scene.id]: event.target.value as TimelineDawSessionSceneFollowChoice }))}>
                          <option value="global">Use global ({followAction})</option>
                          <option value="stop">Stop</option>
                          <option value="next">Launch Next</option>
                          <option value="loop">Loop</option>
                        </select>
                      </label>
                      <label className="mt-2 block text-[10px] font-black text-white/55">Plays before Stop/Next
                        <input className="mt-1 block w-full rounded-md border border-white/15 bg-black px-2 py-1 text-white" type="number" min={1} max={16} step={1} value={resolveTimelineDawSessionScenePlayCount(scene.id, scenePlayCounts)} onChange={(event) => setScenePlayCounts((current) => ({ ...current, [scene.id]: Math.min(16, Math.max(1, Number(event.target.value) || 1)) }))} />
                      </label>
                      <label className="mt-2 block text-[10px] font-black text-white/55">Launch Next target
                        <select className="mt-1 block w-full rounded-md border border-white/15 bg-black px-2 py-1 text-white" value={sceneFollowTargetIds[scene.id] ?? ""} onChange={(event) => setSceneFollowTargetIds((current) => ({ ...current, [scene.id]: event.target.value }))}>
                          <option value="">Next visible scene</option>
                          {scenes.filter((candidate) => candidate.id !== scene.id).map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}
                        </select>
                      </label>
                      <p className="mt-2 text-[11px] text-white/45">{scene.slots.length} active clip{scene.slots.length === 1 ? "" : "s"}</p>
                    </div>,
                    ...lanes.map((lane) => {
                      const slot = slotsByLane.get(lane.id);
                      if (!slot) return <div key={`${scene.id}:${lane.id}`} className="rounded-xl border border-dashed border-white/10 p-3 text-xs text-white/25">Empty slot</div>;
                      const resolvedClipLaunchMode = resolveTimelineDawSessionClipLaunchMode(slot.id, clipLaunchChoices, clipLaunchMode);
                      const resolvedClipQuantization = resolveTimelineDawSessionClipQuantization(slot.id, clipQuantizationChoices, quantization);
                      const resolvedClipPlayCount = resolveTimelineDawSessionClipPlayCount(slot.id, clipPlayCounts);
                      return <div key={`${scene.id}:${lane.id}`} className={`rounded-xl border p-2 ${activeClipId === slot.id ? "border-cyan-200 bg-cyan-200/15 ring-2 ring-cyan-200/30" : "border-white/15 bg-white/[0.06]"}`}>
                        <button type="button" aria-pressed={activeClipId === slot.id} className="w-full rounded-lg p-1 text-left transition hover:bg-cyan-200/10" onClick={(event) => { recordPerformanceEvent({ kind: "clip", name: slot.name, clips: [{ laneId: slot.laneId, startSeconds: slot.startSeconds, endSeconds: slot.endSeconds }], launchedAtMs: event.timeStamp }); onLaunchClip({ id: slot.id, laneId: slot.laneId, startSeconds: slot.startSeconds, endSeconds: slot.endSeconds, name: slot.name }, { ...settings, clipLaunchMode: resolvedClipLaunchMode, clipPlayCount: resolvedClipPlayCount, quantization: resolvedClipQuantization }); }}>
                          <span className="block text-xs font-black text-white">{slot.name}</span>
                          <span className="mt-1 block text-[11px] text-white/45">{slot.startSeconds.toFixed(2)}–{slot.endSeconds.toFixed(2)} sec · {resolvedClipLaunchMode === "loop" ? "Loop" : `Play ×${resolvedClipPlayCount}`} · {resolvedClipQuantization}</span>
                        </button>
                        <label className="mt-2 block text-[10px] font-black text-white/50">Clip behavior
                          <select className="mt-1 block w-full rounded-md border border-white/15 bg-black px-2 py-1 text-white" value={clipLaunchChoices[slot.id] ?? "global"} onChange={(event) => setClipLaunchChoices((current) => ({ ...current, [slot.id]: event.target.value as TimelineDawSessionClipLaunchChoice }))}>
                            <option value="global">Use default ({clipLaunchMode === "loop" ? "Loop" : "One-Shot"})</option>
                            <option value="one-shot">One-Shot</option>
                            <option value="loop">Loop Until Stopped</option>
                          </select>
                        </label>
                        <label className="mt-2 block text-[10px] font-black text-white/50">Clip quantization
                          <select className="mt-1 block w-full rounded-md border border-white/15 bg-black px-2 py-1 text-white" value={clipQuantizationChoices[slot.id] ?? "global"} onChange={(event) => setClipQuantizationChoices((current) => ({ ...current, [slot.id]: event.target.value as TimelineDawSessionClipQuantizationChoice }))}>
                            <option value="global">Use default ({quantization})</option>
                            <option value="immediate">Immediate</option>
                            <option value="beat">Next Beat</option>
                            <option value="two-beats">Next 2 Beats</option>
                            <option value="bar">Next Bar</option>
                          </select>
                        </label>
                        <label className="mt-2 block text-[10px] font-black text-white/50">Finite play count
                          <input className="mt-1 block w-full rounded-md border border-white/15 bg-black px-2 py-1 text-white disabled:opacity-40" type="number" min={1} max={16} step={1} disabled={resolvedClipLaunchMode === "loop"} value={resolvedClipPlayCount} onChange={(event) => setClipPlayCounts((current) => ({ ...current, [slot.id]: Math.min(16, Math.max(1, Number(event.target.value) || 1)) }))} />
                        </label>
                      </div>;
                    }),
                  ];
                })}
              </div>
            </div>
          </div>
        ) : (
          <p className="rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-white/55">Create and name regions on the tracks below. Matching names such as Verse, Chorus, or Solo automatically become launchable scenes.</p>
        )}
        <p className="mt-3 text-xs text-white/45">Scene playback is temporary and protected. It does not move clips, overwrite automation, change mix settings, or modify source recordings.</p>
      </div>
    </details>
  );
}
