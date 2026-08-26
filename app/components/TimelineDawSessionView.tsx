"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import type { TimelineDawTrackRegionLabels } from "@/lib/timeline/TimelineDawTrackRegionLabelPolicy";
import {
  createTimelineDawSessionScenes,
  createTimelineDawSessionNavigationIndex,
  createTimelineDawSessionArrangementPlan,
  createTimelineDawSessionPerformanceEvent,
  quantizeTimelineDawSessionPerformanceTake,
  createTimelineDawSessionSceneLaunch,
  resolveTimelineDawSessionKeyboardCommand,
  type TimelineDawSessionFollowAction,
  type TimelineDawSessionLaunchQuantization,
  type TimelineDawSessionScene,
  type TimelineDawSessionPerformanceEvent,
  type TimelineDawSessionTakeQuantization,
} from "@/lib/timeline/TimelineDawSessionViewPolicy";

type SessionLane = { id: string; name: string };
type LaunchSettings = { bpm: number; quantization: TimelineDawSessionLaunchQuantization; followAction: TimelineDawSessionFollowAction };

const launchButton = "rounded-lg border border-cyan-200/25 bg-cyan-200 px-3 py-2 text-xs font-black text-cyan-950 transition hover:bg-white disabled:opacity-40";

export default function TimelineDawSessionView({
  lanes,
  labels,
  activeSceneId,
  queuedLaunchName,
  onLaunchClip,
  onLaunchScene,
  onStop,
  onCancelQueued,
}: {
  lanes: SessionLane[];
  labels: TimelineDawTrackRegionLabels;
  activeSceneId?: string;
  queuedLaunchName?: string;
  onLaunchClip: (clip: { laneId: string; startSeconds: number; endSeconds: number; name: string }, settings: LaunchSettings) => void;
  onLaunchScene: (scene: TimelineDawSessionScene, settings: LaunchSettings) => void;
  onStop: () => void;
  onCancelQueued: () => void;
}) {
  const [bpm, setBpm] = useState(120);
  const [quantization, setQuantization] = useState<TimelineDawSessionLaunchQuantization>("bar");
  const [followAction, setFollowAction] = useState<TimelineDawSessionFollowAction>("stop");
  const [performanceEvents, setPerformanceEvents] = useState<TimelineDawSessionPerformanceEvent[]>([]);
  const [takeQuantization, setTakeQuantization] = useState<TimelineDawSessionTakeQuantization>("off");
  const performanceStartedAtRef = useRef<number | null>(null);
  const scenes = createTimelineDawSessionScenes(labels, lanes.map((lane) => lane.id));
  const settings = { bpm, quantization, followAction };
  const activeSceneIndex = scenes.findIndex((scene) => scene.id === activeSceneId);

  function recordPerformanceEvent(input: { kind: "clip" | "scene"; name: string; clips: Array<{ laneId: string; startSeconds: number; endSeconds: number }>; launchedAtMs: number }) {
    const { launchedAtMs, ...eventInput } = input;
    performanceStartedAtRef.current ??= launchedAtMs;
    const event = createTimelineDawSessionPerformanceEvent({
      id: crypto.randomUUID(),
      ...eventInput,
      launchedAtMs,
      takeStartedAtMs: performanceStartedAtRef.current,
      bpm,
    });
    setPerformanceEvents((current) => [...current, event]);
  }

  function downloadPerformanceTake() {
    const cleanedEvents = quantizeTimelineDawSessionPerformanceTake(performanceEvents, takeQuantization);
    const payload = {
      schema: "muzes-daw-session-performance/v1",
      createdAt: new Date().toISOString(),
      takeQuantization,
      events: cleanedEvents,
      arrangementPlan: createTimelineDawSessionArrangementPlan(cleanedEvents),
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
    onLaunchScene(scene, settings);
  }

  function handleLauncherKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    const command = resolveTimelineDawSessionKeyboardCommand({
      key: event.key,
      launcherFocused: event.currentTarget.contains(target),
      editableTarget: Boolean(target.closest("input, textarea, select, [contenteditable='true']")),
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      altKey: event.altKey,
      repeat: event.repeat,
    });
    if (!command || activeSceneIndex < 0) return;
    event.preventDefault();
    if (command === "stop") {
      onStop();
      return;
    }
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
          <p className="max-w-xl text-xs text-white/45">Queued launches wait for the selected musical boundary. Stop cancels a queued launch before any audio starts.</p>
          {queuedLaunchName ? <button type="button" className={launchButton} onClick={onCancelQueued}>Cancel queued {queuedLaunchName}</button> : null}
        </div>
        <div className="mb-4 rounded-xl border border-violet-300/20 bg-violet-300/[0.05] p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-black text-violet-100">Performance Take · {performanceEvents.length} launch{performanceEvents.length === 1 ? "" : "es"}</span>
            <label className="text-xs font-black text-white/70">Tighten timing
              <select className="ml-2 rounded-lg border border-white/20 bg-black px-2 py-1 text-white" value={takeQuantization} onChange={(event) => setTakeQuantization(event.target.value as TimelineDawSessionTakeQuantization)}>
                <option value="off">Keep live timing</option>
                <option value="beat">Nearest beat</option>
                <option value="two-beats">Nearest 2 beats</option>
                <option value="bar">Nearest bar</option>
              </select>
            </label>
            <button type="button" className={launchButton} disabled={!performanceEvents.length} onClick={downloadPerformanceTake}>Download Arrangement Plan</button>
            <button type="button" className={launchButton} disabled={!performanceEvents.length} onClick={undoLastPerformanceLaunch}>Undo Last Launch</button>
            <button type="button" className={launchButton} disabled={!performanceEvents.length} onClick={() => { setPerformanceEvents([]); performanceStartedAtRef.current = null; }}>Clear Performance Take</button>
          </div>
          {performanceEvents.length ? <ol className="mt-2 flex flex-wrap gap-2">{quantizeTimelineDawSessionPerformanceTake(performanceEvents, takeQuantization).map((event) => <li key={event.id} className="rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-[11px] text-white/60">Bar {event.bar} · Beat {event.beat} · {event.elapsedSeconds.toFixed(2)} sec · {event.name}</li>)}</ol> : <p className="mt-2 text-xs text-white/45">Launching a clip or scene begins a temporary performance take. Download creates a private local JSON arrangement plan; it does not alter the song.</p>}
          {performanceEvents.length ? <p className="mt-2 text-xs text-white/45">Timing cleanup changes only this preview and downloaded plan. Keep live timing preserves the performance exactly.</p> : null}
        </div>
        {activeSceneIndex >= 0 ? (
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-emerald-300/20 bg-emerald-300/[0.06] p-3" role="group" aria-label="Live scene navigation">
            <span className="text-xs font-black text-emerald-100">Playing {scenes[activeSceneIndex].name}</span>
            {(["previous", "replay", "next"] as const).map((action) => {
              const targetIndex = createTimelineDawSessionNavigationIndex(activeSceneIndex, scenes.length, action);
              const label = action === "previous" ? "Previous Scene" : action === "replay" ? "Replay Scene" : "Next Scene";
              return <button key={action} type="button" className={launchButton} disabled={targetIndex === null} onClick={(event) => targetIndex === null ? undefined : launchSceneAndRecord(scenes[targetIndex], event.timeStamp)}>{label}</button>;
            })}
            <button type="button" className={launchButton} onClick={onStop}>Stop Scene</button>
          </div>
        ) : null}
        <p className="mb-4 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/55"><strong>Focused Session View keyboard:</strong> P previous · R replay · N next · Space stop. Click inside the launcher first; shortcuts stay off while typing or using menus.</p>
        {scenes.length ? (
          <div className="overflow-x-auto">
            <div className="min-w-[720px]">
              <div className="grid gap-2" style={{ gridTemplateColumns: `minmax(150px, .7fr) repeat(${Math.max(1, lanes.length)}, minmax(150px, 1fr))` }}>
                <div className="p-2 text-xs font-black uppercase tracking-[0.14em] text-white/45">Scene</div>
                {lanes.map((lane) => <div key={lane.id} className="p-2 text-xs font-black text-white/65">{lane.name}</div>)}
                {scenes.map((scene) => {
                  const slotsByLane = new Map(scene.slots.map((slot) => [slot.laneId, slot]));
                  return [
                    <div key={`${scene.id}:launch`} className="rounded-xl border border-cyan-300/20 bg-black/40 p-2">
                      <button type="button" className={launchButton} aria-pressed={activeSceneId === scene.id} onClick={(event) => { if (activeSceneId === scene.id) onStop(); else launchSceneAndRecord(scene, event.timeStamp); }}>
                        {activeSceneId === scene.id ? `Stop ${scene.name}` : `Launch ${scene.name}`}
                      </button>
                      <p className="mt-2 text-[11px] text-white/45">{scene.slots.length} active clip{scene.slots.length === 1 ? "" : "s"}</p>
                    </div>,
                    ...lanes.map((lane) => {
                      const slot = slotsByLane.get(lane.id);
                      return slot ? (
                        <button key={`${scene.id}:${lane.id}`} type="button" className="rounded-xl border border-white/15 bg-white/[0.06] p-3 text-left transition hover:border-cyan-200/50" onClick={(event) => { recordPerformanceEvent({ kind: "clip", name: slot.name, clips: [{ laneId: slot.laneId, startSeconds: slot.startSeconds, endSeconds: slot.endSeconds }], launchedAtMs: event.timeStamp }); onLaunchClip({ laneId: slot.laneId, startSeconds: slot.startSeconds, endSeconds: slot.endSeconds, name: slot.name }, settings); }}>
                          <span className="block text-xs font-black text-white">{slot.name}</span>
                          <span className="mt-1 block text-[11px] text-white/45">{slot.startSeconds.toFixed(2)}–{slot.endSeconds.toFixed(2)} sec</span>
                        </button>
                      ) : <div key={`${scene.id}:${lane.id}`} className="rounded-xl border border-dashed border-white/10 p-3 text-xs text-white/25">Empty slot</div>;
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
