"use client";

import { multiTrackVersionAlignmentEngineSeedState } from "./MultiTrackVersionAlignmentEngineSeed";
import {
  getVersionAlignmentCorrectionLabel,
  getVersionAlignmentDistanceLabel,
  getVersionAlignmentEngineMetrics,
  getVersionAlignmentGroupScore,
  getVersionAlignmentPendingCorrectionCount,
  getVersionAlignmentReadinessLabel,
  getVersionAlignmentStatusLabel,
  getVersionAlignmentTrackAction,
  getVersionAlignmentTrackScore,
} from "./MultiTrackVersionAlignmentEngineHelpers";
import type {
  MultiTrackVersionAlignmentCorrection,
  MultiTrackVersionAlignmentGroup,
  MultiTrackVersionAlignmentTrack,
} from "./MultiTrackVersionAlignmentEngineTypes";

const panelClass =
  "rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white shadow-2xl";

const cardClass =
  "rounded-2xl border border-white/10 bg-black/40 p-4 text-white";

const rowClass =
  "flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2";

const pillClass =
  "rounded-full border border-white/10 bg-white/[0.07] px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-white/70";

function AlignmentSummary() {
  const state = multiTrackVersionAlignmentEngineSeedState;
  const metrics = getVersionAlignmentEngineMetrics(state);

  return (
    <div className="mt-5 grid gap-4 md:grid-cols-4 xl:grid-cols-8">
      <article className={cardClass}>
        <p className="text-xs text-white/60">Groups</p>
        <p className="mt-2 text-3xl font-black text-white">{metrics.groupCount}</p>
      </article>
      <article className={cardClass}>
        <p className="text-xs text-white/60">Tracks</p>
        <p className="mt-2 text-3xl font-black text-white">{metrics.trackCount}</p>
      </article>
      <article className={cardClass}>
        <p className="text-xs text-white/60">Ready</p>
        <p className="mt-2 text-3xl font-black text-white">{metrics.readyCount}</p>
      </article>
      <article className={cardClass}>
        <p className="text-xs text-white/60">Review</p>
        <p className="mt-2 text-3xl font-black text-white">{metrics.reviewCount}</p>
      </article>
      <article className={cardClass}>
        <p className="text-xs text-white/60">Confidence</p>
        <p className="mt-2 text-3xl font-black text-white">{metrics.averageConfidence}%</p>
      </article>
      <article className={cardClass}>
        <p className="text-xs text-white/60">Offset</p>
        <p className="mt-2 text-3xl font-black text-white">{metrics.maxOffsetSeconds}s</p>
      </article>
      <article className={cardClass}>
        <p className="text-xs text-white/60">Drift</p>
        <p className="mt-2 text-3xl font-black text-white">{metrics.maxDriftSeconds}s</p>
      </article>
      <article className={cardClass}>
        <p className="text-xs text-white/60">Score</p>
        <p className="mt-2 text-3xl font-black text-white">{metrics.groupScore}</p>
      </article>
    </div>
  );
}

function CorrectionRow({ correction }: { correction: MultiTrackVersionAlignmentCorrection }) {
  return (
    <div className={rowClass}>
      <span className="text-sm text-white/70">{getVersionAlignmentCorrectionLabel(correction)}</span>
      <span className="max-w-xl text-right text-sm font-black leading-6 text-white">
        {correction.amountLabel} · {correction.ready ? "ready" : "not needed"} ·{" "}
        {correction.detail}
      </span>
    </div>
  );
}

function TrackCard({ track }: { track: MultiTrackVersionAlignmentTrack }) {
  return (
    <article className={cardClass}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-white/60">
            {track.versionLabel} · {track.role}
          </p>
          <h4 className="mt-2 text-xl font-black text-white">{track.label}</h4>
          <p className="mt-2 text-sm leading-6 text-white/70">{track.notes}</p>
        </div>

        <span className={pillClass}>{getVersionAlignmentTrackScore(track)}</span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-5">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs text-white/60">Status</p>
          <p className="mt-1 text-sm font-black text-white">
            {getVersionAlignmentStatusLabel(track.status)}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs text-white/60">Key</p>
          <p className="mt-1 text-sm font-black text-white">
            {track.originalKey} → {track.targetKey}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs text-white/60">BPM</p>
          <p className="mt-1 text-sm font-black text-white">
            {track.originalBpm} → {track.targetBpm}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs text-white/60">Offset</p>
          <p className="mt-1 text-sm font-black text-white">{track.startOffsetSeconds}s</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs text-white/60">Corrections</p>
          <p className="mt-1 text-sm font-black text-white">
            {getVersionAlignmentPendingCorrectionCount(track)}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        <div className={rowClass}>
          <span className="text-sm text-white/70">Action</span>
          <span className="text-right text-sm font-black text-white">
            {getVersionAlignmentTrackAction(track)}
          </span>
        </div>

        {track.corrections.map((correction) => (
          <CorrectionRow key={correction.id} correction={correction} />
        ))}
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-2">
        {track.anchors.map((anchor) => (
          <div key={anchor.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <p className="text-sm font-black text-white">{anchor.label}</p>
            <p className="mt-1 text-xs text-white/60">
              Ref {anchor.referenceTime.label} · Candidate {anchor.candidateTime.label}
            </p>
            <p className="mt-2 text-xs font-black text-white">
              Offset {anchor.offsetSeconds}s · {anchor.confidencePercent}%
            </p>
          </div>
        ))}
      </div>
    </article>
  );
}

function GroupCard({ group }: { group: MultiTrackVersionAlignmentGroup }) {
  return (
    <article className={cardClass}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-white/60">
            {group.targetKey} · {group.targetBpm} BPM
          </p>
          <h3 className="mt-2 text-2xl font-black text-white">{group.label}</h3>
          <p className="mt-3 text-sm leading-6 text-white/70">{group.detail}</p>
        </div>

        <span className={pillClass}>{getVersionAlignmentGroupScore(group)}</span>
      </div>

      <div className="mt-5 grid gap-4">
        {group.tracks.map((track) => (
          <TrackCard key={track.id} track={track} />
        ))}
      </div>
    </article>
  );
}

export function MultiTrackVersionAlignmentEngineWorkspacePanel() {
  const state = multiTrackVersionAlignmentEngineSeedState;

  return (
    <section className={panelClass}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-white/70">
            Multi Track Version Alignment Engine
          </p>
          <h2 className="mt-2 text-3xl font-black text-white">{state.title}</h2>
          <p className="mt-3 max-w-5xl text-sm leading-6 text-white/70">
            {state.description}
          </p>
        </div>

        <span className={pillClass}>
          {state.targetKey} · {state.targetBpm} BPM ·{" "}
          {getVersionAlignmentDistanceLabel(state)}
        </span>
      </div>

      <AlignmentSummary />

      <div className="mt-5 grid gap-5">
        {state.groups.map((group) => (
          <GroupCard key={group.id} group={group} />
        ))}
      </div>
    </section>
  );
}

export default MultiTrackVersionAlignmentEngineWorkspacePanel;