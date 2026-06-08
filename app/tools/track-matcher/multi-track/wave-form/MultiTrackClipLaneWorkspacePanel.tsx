"use client";

import { DEFAULT_MULTI_TRACK_CLIP_LANE_WORKSPACE_STATE } from "./MultiTrackClipLaneSeed";
import {
  getMultiTrackClipLaneDuplicatePlanSummary,
  getMultiTrackClipLaneDurationSeconds,
  getMultiTrackClipLaneEditTargetLabel,
  getMultiTrackClipLaneExperimentDistanceLabel,
  getMultiTrackClipLaneMetrics,
  getMultiTrackClipLaneReadyPercent,
  getMultiTrackClipLaneRenderCount,
  getMultiTrackClipLaneRenderPercent,
  getMultiTrackClipLaneRenderPlanSummary,
  getMultiTrackClipLaneRenderStatusLabel,
  getMultiTrackClipLaneSelectedCount,
  getMultiTrackClipLaneSelectionSummary,
  getMultiTrackClipLaneStatusLabel,
} from "./MultiTrackClipLaneHelpers";
import type {
  MultiTrackClipLane,
  MultiTrackClipLaneClip,
  MultiTrackClipLaneDuplicatePlan,
  MultiTrackClipLaneRenderPlan,
  MultiTrackClipLaneSelection,
} from "./MultiTrackClipLaneTypes";

const panelClass =
  "rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white shadow-2xl";

const cardClass =
  "rounded-2xl border border-white/10 bg-black/40 p-4 text-white";

const rowClass =
  "flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2";

const pillClass =
  "rounded-full border border-white/10 bg-white/[0.07] px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-white/70";

function WorkspaceSummary() {
  const state = DEFAULT_MULTI_TRACK_CLIP_LANE_WORKSPACE_STATE;
  const metrics = getMultiTrackClipLaneMetrics(state);
  const readyPercent = getMultiTrackClipLaneReadyPercent(state);
  const renderPercent = getMultiTrackClipLaneRenderPercent(state);
  const distanceLabel = getMultiTrackClipLaneExperimentDistanceLabel(state);

  return (
    <div className="mt-5 grid gap-4 md:grid-cols-5">
      <article className={cardClass}>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
          Lanes
        </p>
        <p className="mt-2 text-3xl font-black text-white">{metrics.laneCount}</p>
      </article>

      <article className={cardClass}>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
          Clips
        </p>
        <p className="mt-2 text-3xl font-black text-white">{metrics.clipCount}</p>
      </article>

      <article className={cardClass}>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
          Selected
        </p>
        <p className="mt-2 text-3xl font-black text-white">
          {metrics.selectedClipCount}
        </p>
      </article>

      <article className={cardClass}>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
          Ready
        </p>
        <p className="mt-2 text-3xl font-black text-white">{readyPercent}%</p>
      </article>

      <article className={cardClass}>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
          Render
        </p>
        <p className="mt-2 text-3xl font-black text-white">{renderPercent}%</p>
        <p className="mt-2 text-sm font-black text-white">{distanceLabel}</p>
      </article>
    </div>
  );
}

function ClipCard({ clip }: { clip: MultiTrackClipLaneClip }) {
  return (
    <article className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-white">{clip.sourceTrackLabel}</p>
          <p className="mt-1 text-xs text-white/60">
            {clip.sourceTimeRange.startLabel} → {clip.sourceTimeRange.endLabel}
          </p>
        </div>

        <span className={pillClass}>
          {getMultiTrackClipLaneRenderStatusLabel(clip.renderStatus)}
        </span>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-4">
        <div className="rounded-lg border border-white/10 bg-black/30 p-2">
          <p className="text-xs text-white/60">Nudge</p>
          <p className="mt-1 text-lg font-black text-white">{clip.nudgeSeconds}s</p>
        </div>

        <div className="rounded-lg border border-white/10 bg-black/30 p-2">
          <p className="text-xs text-white/60">Gain</p>
          <p className="mt-1 text-lg font-black text-white">{clip.gainDb} dB</p>
        </div>

        <div className="rounded-lg border border-white/10 bg-black/30 p-2">
          <p className="text-xs text-white/60">Pitch</p>
          <p className="mt-1 text-lg font-black text-white">
            {clip.pitchShiftSemitones}
          </p>
        </div>

        <div className="rounded-lg border border-white/10 bg-black/30 p-2">
          <p className="text-xs text-white/60">Stretch</p>
          <p className="mt-1 text-lg font-black text-white">{clip.stretchPercent}%</p>
        </div>
      </div>

      <p className="mt-3 text-xs leading-5 text-white/70">{clip.notes}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className={pillClass}>{clip.selected ? "Selected" : "Not Selected"}</span>
        <span className={pillClass}>{clip.muted ? "Muted" : "Audible"}</span>
        <span className={pillClass}>{clip.locked ? "Locked" : "Editable"}</span>
      </div>
    </article>
  );
}

function LaneCard({ lane }: { lane: MultiTrackClipLane }) {
  return (
    <article className={cardClass}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
            Lane {lane.laneNumber} · {lane.laneMode}
          </p>
          <h3 className="mt-2 text-2xl font-black text-white">{lane.label}</h3>
          <p className="mt-3 text-sm leading-6 text-white/70">{lane.detail}</p>
        </div>

        <span className={pillClass}>{getMultiTrackClipLaneStatusLabel(lane.status)}</span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-5">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs text-white/60">Clips</p>
          <p className="mt-1 text-2xl font-black text-white">{lane.clips.length}</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs text-white/60">Selected</p>
          <p className="mt-1 text-2xl font-black text-white">
            {getMultiTrackClipLaneSelectedCount(lane)}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs text-white/60">Render Clips</p>
          <p className="mt-1 text-2xl font-black text-white">
            {getMultiTrackClipLaneRenderCount(lane)}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs text-white/60">Duration</p>
          <p className="mt-1 text-2xl font-black text-white">
            {getMultiTrackClipLaneDurationSeconds(lane)}s
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs text-white/60">Micro Edit</p>
          <p className="mt-1 text-2xl font-black text-white">
            {lane.microEditStepSeconds}s
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 xl:grid-cols-2">
        {lane.clips.map((clip) => (
          <ClipCard key={clip.id} clip={clip} />
        ))}
      </div>
    </article>
  );
}

function SelectionCard({ selection }: { selection: MultiTrackClipLaneSelection }) {
  const state = DEFAULT_MULTI_TRACK_CLIP_LANE_WORKSPACE_STATE;

  return (
    <article className={cardClass}>
      <h3 className="text-lg font-black text-white">{selection.label}</h3>
      <p className="mt-2 text-sm leading-6 text-white/70">{selection.detail}</p>

      <div className="mt-4 grid gap-2">
        <div className={rowClass}>
          <span className="text-sm text-white/70">Summary</span>
          <span className="max-w-xl text-right text-sm font-black leading-6 text-white">
            {getMultiTrackClipLaneSelectionSummary(state.lanes, selection)}
          </span>
        </div>

        <div className={rowClass}>
          <span className="text-sm text-white/70">Edit Targets</span>
          <span className="max-w-xl text-right text-sm font-black leading-6 text-white">
            {selection.editTargets.map(getMultiTrackClipLaneEditTargetLabel).join(", ")}
          </span>
        </div>
      </div>
    </article>
  );
}

function DuplicatePlanCard({ plan }: { plan: MultiTrackClipLaneDuplicatePlan }) {
  return (
    <article className={cardClass}>
      <h3 className="text-lg font-black text-white">{plan.label}</h3>
      <p className="mt-2 text-sm leading-6 text-white/70">{plan.detail}</p>

      <div className="mt-4 grid gap-2">
        <div className={rowClass}>
          <span className="text-sm text-white/70">Duplicate Plan</span>
          <span className="max-w-xl text-right text-sm font-black leading-6 text-white">
            {getMultiTrackClipLaneDuplicatePlanSummary(plan)}
          </span>
        </div>

        <div className={rowClass}>
          <span className="text-sm text-white/70">Ready</span>
          <span className="text-sm font-black text-white">{plan.ready ? "Yes" : "No"}</span>
        </div>
      </div>
    </article>
  );
}

function RenderPlanCard({ plan }: { plan: MultiTrackClipLaneRenderPlan }) {
  return (
    <article className={cardClass}>
      <h3 className="text-lg font-black text-white">{plan.label}</h3>
      <p className="mt-2 text-sm leading-6 text-white/70">{plan.detail}</p>

      <div className="mt-4 grid gap-2">
        <div className={rowClass}>
          <span className="text-sm text-white/70">Render Plan</span>
          <span className="max-w-xl text-right text-sm font-black leading-6 text-white">
            {getMultiTrackClipLaneRenderPlanSummary(plan)}
          </span>
        </div>

        <div className={rowClass}>
          <span className="text-sm text-white/70">Ready</span>
          <span className="text-sm font-black text-white">{plan.ready ? "Yes" : "No"}</span>
        </div>
      </div>
    </article>
  );
}

export function MultiTrackClipLaneWorkspacePanel() {
  const state = DEFAULT_MULTI_TRACK_CLIP_LANE_WORKSPACE_STATE;

  return (
    <section className={panelClass}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/70">
            Multi Track Clip Lane Engine
          </p>
          <h2 className="mt-2 text-3xl font-black text-white">
            Extract, Edit, Duplicate, Render
          </h2>
          <p className="mt-3 max-w-5xl text-sm leading-6 text-white/70">
            {state.summary}
          </p>
        </div>

        <span className={pillClass}>
          {state.targetKey} · {state.targetBpm} BPM · {state.microEditStepSeconds}s
        </span>
      </div>

      <WorkspaceSummary />

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {state.selections.map((selection) => (
          <SelectionCard key={selection.id} selection={selection} />
        ))}
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {state.duplicatePlans.map((plan) => (
          <DuplicatePlanCard key={plan.id} plan={plan} />
        ))}
        {state.renderPlans.map((plan) => (
          <RenderPlanCard key={plan.id} plan={plan} />
        ))}
      </div>

      <div className="mt-5 grid gap-5">
        {state.lanes.map((lane) => (
          <LaneCard key={lane.id} lane={lane} />
        ))}
      </div>
    </section>
  );
}