"use client";

import type { TimelineDawTrackRegionLabels } from "@/lib/timeline/TimelineDawTrackRegionLabelPolicy";
import {
  createTimelineDawSessionScenes,
  type TimelineDawSessionScene,
} from "@/lib/timeline/TimelineDawSessionViewPolicy";

type SessionLane = { id: string; name: string };

const launchButton = "rounded-lg border border-cyan-200/25 bg-cyan-200 px-3 py-2 text-xs font-black text-cyan-950 transition hover:bg-white disabled:opacity-40";

export default function TimelineDawSessionView({
  lanes,
  labels,
  activeSceneId,
  onLaunchClip,
  onLaunchScene,
  onStop,
}: {
  lanes: SessionLane[];
  labels: TimelineDawTrackRegionLabels;
  activeSceneId?: string;
  onLaunchClip: (clip: { laneId: string; startSeconds: number; endSeconds: number; name: string }) => void;
  onLaunchScene: (scene: TimelineDawSessionScene) => void;
  onStop: () => void;
}) {
  const scenes = createTimelineDawSessionScenes(labels, lanes.map((lane) => lane.id));

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

      <div className="border-t border-cyan-300/15 p-4">
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
                      <button type="button" className={launchButton} aria-pressed={activeSceneId === scene.id} onClick={() => activeSceneId === scene.id ? onStop() : onLaunchScene(scene)}>
                        {activeSceneId === scene.id ? `Stop ${scene.name}` : `Launch ${scene.name}`}
                      </button>
                      <p className="mt-2 text-[11px] text-white/45">{scene.slots.length} active clip{scene.slots.length === 1 ? "" : "s"}</p>
                    </div>,
                    ...lanes.map((lane) => {
                      const slot = slotsByLane.get(lane.id);
                      return slot ? (
                        <button key={`${scene.id}:${lane.id}`} type="button" className="rounded-xl border border-white/15 bg-white/[0.06] p-3 text-left transition hover:border-cyan-200/50" onClick={() => onLaunchClip({ laneId: slot.laneId, startSeconds: slot.startSeconds, endSeconds: slot.endSeconds, name: slot.name })}>
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
