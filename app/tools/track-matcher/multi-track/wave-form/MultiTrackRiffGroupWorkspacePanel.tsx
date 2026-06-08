"use client";

import {
  DEFAULT_MULTI_TRACK_RIFF_GROUP_WORKSPACE_STATE,
  MULTI_TRACK_RIFF_GROUP_SOURCE_TRACKS,
} from "./MultiTrackRiffGroupSeed";
import {
  getMultiTrackRiffEditPlanForGroup,
  getMultiTrackRiffExperimentPlanForGroup,
  getMultiTrackRiffExtractPlanForGroup,
  getMultiTrackRiffGroupAverageNoteMatch,
  getMultiTrackRiffGroupAverageRhythmMatch,
  getMultiTrackRiffGroupAverageSimilarity,
  getMultiTrackRiffGroupColorLabel,
  getMultiTrackRiffGroupEngineDistanceLabel,
  getMultiTrackRiffGroupMaxTimingDrift,
  getMultiTrackRiffGroupReadyCount,
  getMultiTrackRiffGroupReviewCount,
  getMultiTrackRiffGroupStatusLabel,
  getMultiTrackRiffGroupTrackCoverage,
  getMultiTrackRiffInstanceReadinessLabel,
  getMultiTrackRiffInstanceRiskSummary,
  getMultiTrackRiffWorkspaceCoveragePercent,
  getMultiTrackRiffWorkspaceReadyPercent,
  getMultiTrackRiffWorkspaceTotalInstanceCount,
} from "./MultiTrackRiffGroupHelpers";
import type {
  MultiTrackRiffEditPlan,
  MultiTrackRiffExperimentPlan,
  MultiTrackRiffExtractPlan,
  MultiTrackRiffGroup,
  MultiTrackRiffInstance,
} from "./MultiTrackRiffGroupTypes";

const panelClass =
  "rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white shadow-2xl";

const cardClass =
  "rounded-2xl border border-white/10 bg-black/40 p-4 text-white";

const rowClass =
  "flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2";

const pillClass =
  "rounded-full border border-white/10 bg-white/[0.07] px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-white/70";

function WorkspaceSummary() {
  const state = DEFAULT_MULTI_TRACK_RIFF_GROUP_WORKSPACE_STATE;
  const totalInstances = getMultiTrackRiffWorkspaceTotalInstanceCount(state);
  const readyPercent = getMultiTrackRiffWorkspaceReadyPercent(state);
  const coveragePercent = getMultiTrackRiffWorkspaceCoveragePercent(state);
  const distanceLabel = getMultiTrackRiffGroupEngineDistanceLabel(state);

  return (
    <div className="mt-5 grid gap-4 md:grid-cols-5">
      <article className={cardClass}>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
          Target Tracks
        </p>
        <p className="mt-2 text-3xl font-black text-white">{state.targetTrackCount}</p>
      </article>

      <article className={cardClass}>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
          Riff Groups
        </p>
        <p className="mt-2 text-3xl font-black text-white">{state.groups.length}</p>
      </article>

      <article className={cardClass}>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
          Riff Clips
        </p>
        <p className="mt-2 text-3xl font-black text-white">{totalInstances}</p>
      </article>

      <article className={cardClass}>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
          Ready
        </p>
        <p className="mt-2 text-3xl font-black text-white">{readyPercent}%</p>
      </article>

      <article className={cardClass}>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
          Coverage
        </p>
        <p className="mt-2 text-3xl font-black text-white">{coveragePercent}%</p>
        <p className="mt-2 text-sm font-black text-white">{distanceLabel}</p>
      </article>
    </div>
  );
}

function SourceTrackGrid() {
  return (
    <article className={cardClass}>
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
            10 Track Target
          </p>
          <h3 className="mt-2 text-xl font-black text-white">
            Suno Version Normalization Map
          </h3>
          <p className="mt-2 text-sm leading-6 text-white/70">
            These are seed planning tracks. Later this becomes real loaded audio
            with waveform, key, BPM, offset, gain, mute, solo, and lane state.
          </p>
        </div>
        <span className={pillClass}>Chunky Road</span>
      </div>

      <div className="mt-5 grid gap-2 md:grid-cols-2 xl:grid-cols-5">
        {MULTI_TRACK_RIFF_GROUP_SOURCE_TRACKS.map((track) => (
          <div key={track.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <p className="text-sm font-black text-white">{track.label}</p>
            <p className="mt-1 text-xs text-white/60">{track.sunoVersionLabel}</p>
            <p className="mt-2 text-xs font-black text-white">
              {track.originalKey} → {track.targetKey}
            </p>
            <p className="mt-1 text-xs font-black text-white">
              {track.originalBpm} → {track.targetBpm} BPM
            </p>
            <p className="mt-2 text-xs text-white/70">
              {track.normalized ? "Normalized" : "Needs normalize"}
            </p>
          </div>
        ))}
      </div>
    </article>
  );
}

function RiffInstanceCard({ instance }: { instance: MultiTrackRiffInstance }) {
  return (
    <article className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-white">{instance.sourceTrackLabel}</p>
          <p className="mt-1 text-xs text-white/60">
            {instance.timeRange.startLabel} → {instance.timeRange.endLabel}
          </p>
        </div>
        <span className={pillClass}>{getMultiTrackRiffInstanceReadinessLabel(instance)}</span>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-3">
        <div className="rounded-lg border border-white/10 bg-black/30 p-2">
          <p className="text-xs text-white/60">Similarity</p>
          <p className="mt-1 text-lg font-black text-white">{instance.similarityPercent}%</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/30 p-2">
          <p className="text-xs text-white/60">Notes</p>
          <p className="mt-1 text-lg font-black text-white">{instance.noteMatchPercent}%</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/30 p-2">
          <p className="text-xs text-white/60">Rhythm</p>
          <p className="mt-1 text-lg font-black text-white">{instance.rhythmMatchPercent}%</p>
        </div>
      </div>

      <p className="mt-3 text-xs leading-5 text-white/70">{instance.notes}</p>
      <p className="mt-2 text-xs font-black leading-5 text-white">
        Risks: {getMultiTrackRiffInstanceRiskSummary(instance)}
      </p>
    </article>
  );
}

function PlanCard({
  extractPlan,
  editPlan,
  experimentPlan,
}: {
  extractPlan: MultiTrackRiffExtractPlan | null;
  editPlan: MultiTrackRiffEditPlan | null;
  experimentPlan: MultiTrackRiffExperimentPlan | null;
}) {
  return (
    <div className="mt-4 grid gap-3">
      {extractPlan ? (
        <div className={rowClass}>
          <span className="text-sm text-white/70">Extract</span>
          <span className="max-w-xl text-right text-sm font-black leading-6 text-white">
            {extractPlan.destinationLaneLabel} · {extractPlan.readyCount} ready /{" "}
            {extractPlan.reviewCount} review
          </span>
        </div>
      ) : null}

      {editPlan ? (
        <div className={rowClass}>
          <span className="text-sm text-white/70">Edit</span>
          <span className="max-w-xl text-right text-sm font-black leading-6 text-white">
            {editPlan.editMode} · {editPlan.microEditStepSeconds}s steps ·{" "}
            {editPlan.editableFields.join(", ")}
          </span>
        </div>
      ) : null}

      {experimentPlan ? (
        <div className={rowClass}>
          <span className="text-sm text-white/70">Experiment</span>
          <span className="max-w-xl text-right text-sm font-black leading-6 text-white">
            Duplicate {experimentPlan.duplicateCount}x ·{" "}
            {experimentPlan.knobTargets.join(", ")}
          </span>
        </div>
      ) : null}
    </div>
  );
}

function RiffGroupCard({ group }: { group: MultiTrackRiffGroup }) {
  const state = DEFAULT_MULTI_TRACK_RIFF_GROUP_WORKSPACE_STATE;
  const extractPlan = getMultiTrackRiffExtractPlanForGroup(
    state.extractPlans,
    group.id,
  );
  const editPlan = getMultiTrackRiffEditPlanForGroup(state.editPlans, group.id);
  const experimentPlan = getMultiTrackRiffExperimentPlanForGroup(
    state.experimentPlans,
    group.id,
  );

  return (
    <article className={cardClass}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
            {getMultiTrackRiffGroupColorLabel(group.color)} ·{" "}
            {getMultiTrackRiffGroupStatusLabel(group.status)}
          </p>
          <h3 className="mt-2 text-2xl font-black text-white">{group.label}</h3>
          <p className="mt-3 text-sm leading-6 text-white/70">{group.description}</p>
        </div>
        <span className={pillClass}>{group.familyConfidencePercent}% Family</span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-5">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs text-white/60">Avg Similarity</p>
          <p className="mt-1 text-2xl font-black text-white">
            {getMultiTrackRiffGroupAverageSimilarity(group)}%
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs text-white/60">Note Match</p>
          <p className="mt-1 text-2xl font-black text-white">
            {getMultiTrackRiffGroupAverageNoteMatch(group)}%
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs text-white/60">Rhythm</p>
          <p className="mt-1 text-2xl font-black text-white">
            {getMultiTrackRiffGroupAverageRhythmMatch(group)}%
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs text-white/60">Track Coverage</p>
          <p className="mt-1 text-2xl font-black text-white">
            {getMultiTrackRiffGroupTrackCoverage(group)}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs text-white/60">Max Drift</p>
          <p className="mt-1 text-2xl font-black text-white">
            {getMultiTrackRiffGroupMaxTimingDrift(group)}s
          </p>
        </div>
      </div>

      <PlanCard
        extractPlan={extractPlan}
        editPlan={editPlan}
        experimentPlan={experimentPlan}
      />

      <div className="mt-5 grid gap-3 xl:grid-cols-2">
        {group.instances.map((instance) => (
          <RiffInstanceCard key={instance.id} instance={instance} />
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className={pillClass}>{getMultiTrackRiffGroupReadyCount(group)} ready</span>
        <span className={pillClass}>
          {getMultiTrackRiffGroupReviewCount(group)} review
        </span>
        <span className={pillClass}>extract lane planned</span>
        <span className={pillClass}>0.1s micro edit target</span>
      </div>
    </article>
  );
}

export function MultiTrackRiffGroupWorkspacePanel() {
  const state = DEFAULT_MULTI_TRACK_RIFF_GROUP_WORKSPACE_STATE;

  return (
    <section className={panelClass}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/70">
            Multi Track Riff Group Engine
          </p>
          <h2 className="mt-2 text-3xl font-black text-white">
            Chunky Road Riff Family Workspace
          </h2>
          <p className="mt-3 max-w-5xl text-sm leading-6 text-white/70">
            {state.summary}
          </p>
        </div>

        <span className={pillClass}>
          {state.targetKey} · {state.targetBpm} BPM
        </span>
      </div>

      <WorkspaceSummary />

      <div className="mt-5">
        <SourceTrackGrid />
      </div>

      <div className="mt-5 grid gap-5">
        {state.groups.map((group) => (
          <RiffGroupCard key={group.id} group={group} />
        ))}
      </div>
    </section>
  );
}