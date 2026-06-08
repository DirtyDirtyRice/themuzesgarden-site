"use client";

import { DEFAULT_MULTI_TRACK_SIMILARITY_WORKSPACE_STATE } from "./MultiTrackSimilaritySeed";
import {
  getMultiTrackSimilarityAverageConfidence,
  getMultiTrackSimilarityAverageScore,
  getMultiTrackSimilarityCandidateSafetyLabel,
  getMultiTrackSimilarityDecisionLabel,
  getMultiTrackSimilarityEngineDistanceLabel,
  getMultiTrackSimilarityFamilySummaries,
  getMultiTrackSimilarityMaxTimingDrift,
  getMultiTrackSimilarityStatusLabel,
  getMultiTrackSimilarityWeightedFeatureScore,
  getMultiTrackSimilarityWorkspaceReadinessPercent,
  getMultiTrackSimilarityWorkspaceReviewPercent,
} from "./MultiTrackSimilarityHelpers";
import type {
  MultiTrackSimilarityCandidate,
  MultiTrackSimilarityFamilySummary,
  MultiTrackSimilarityFeatureScore,
} from "./MultiTrackSimilarityTypes";

const panelClass =
  "rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white shadow-2xl";

const cardClass =
  "rounded-2xl border border-white/10 bg-black/40 p-4 text-white";

const rowClass =
  "flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2";

const pillClass =
  "rounded-full border border-white/10 bg-white/[0.07] px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-white/70";

function WorkspaceSummary() {
  const state = DEFAULT_MULTI_TRACK_SIMILARITY_WORKSPACE_STATE;
  const readiness = getMultiTrackSimilarityWorkspaceReadinessPercent(state);
  const review = getMultiTrackSimilarityWorkspaceReviewPercent(state);
  const distanceLabel = getMultiTrackSimilarityEngineDistanceLabel(state);

  return (
    <div className="mt-5 grid gap-4 md:grid-cols-5">
      <article className={cardClass}>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
          Candidates
        </p>
        <p className="mt-2 text-3xl font-black text-white">{state.candidates.length}</p>
      </article>

      <article className={cardClass}>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
          Avg Similarity
        </p>
        <p className="mt-2 text-3xl font-black text-white">
          {getMultiTrackSimilarityAverageScore(state.candidates)}%
        </p>
      </article>

      <article className={cardClass}>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
          Avg Confidence
        </p>
        <p className="mt-2 text-3xl font-black text-white">
          {getMultiTrackSimilarityAverageConfidence(state.candidates)}%
        </p>
      </article>

      <article className={cardClass}>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
          Accepted
        </p>
        <p className="mt-2 text-3xl font-black text-white">{readiness}%</p>
      </article>

      <article className={cardClass}>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
          Review
        </p>
        <p className="mt-2 text-3xl font-black text-white">{review}%</p>
        <p className="mt-2 text-sm font-black text-white">{distanceLabel}</p>
      </article>
    </div>
  );
}

function ThresholdPanel() {
  const thresholds = DEFAULT_MULTI_TRACK_SIMILARITY_WORKSPACE_STATE.thresholds;

  return (
    <article className={cardClass}>
      <h3 className="text-xl font-black text-white">Similarity Thresholds</h3>
      <p className="mt-2 text-sm leading-6 text-white/70">
        These numbers define the first monster-matching rules before real DSP and AI scans.
      </p>

      <div className="mt-4 grid gap-2 md:grid-cols-2">
        <div className={rowClass}>
          <span className="text-sm text-white/70">Monster Match</span>
          <span className="text-sm font-black text-white">
            {thresholds.monsterMatchPercent}%
          </span>
        </div>

        <div className={rowClass}>
          <span className="text-sm text-white/70">Same Family</span>
          <span className="text-sm font-black text-white">
            {thresholds.sameFamilyPercent}%
          </span>
        </div>

        <div className={rowClass}>
          <span className="text-sm text-white/70">Review</span>
          <span className="text-sm font-black text-white">{thresholds.reviewPercent}%</span>
        </div>

        <div className={rowClass}>
          <span className="text-sm text-white/70">Max Timing Drift</span>
          <span className="text-sm font-black text-white">
            {thresholds.maxTimingDriftSeconds}s
          </span>
        </div>
      </div>
    </article>
  );
}

function FeatureScoreGrid({ scores }: { scores: MultiTrackSimilarityFeatureScore[] }) {
  return (
    <div className="mt-4 grid gap-2 md:grid-cols-2">
      {scores.map((score) => (
        <div key={score.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-black text-white">{score.label}</p>
              <p className="mt-1 text-xs leading-5 text-white/60">{score.detail}</p>
            </div>
            <span className={pillClass}>{score.scorePercent}%</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function CandidateCard({ candidate }: { candidate: MultiTrackSimilarityCandidate }) {
  return (
    <article className={cardClass}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
            {candidate.riffGroupLabel}
          </p>
          <h3 className="mt-2 text-xl font-black text-white">{candidate.label}</h3>
          <p className="mt-3 text-sm leading-6 text-white/70">{candidate.detail}</p>
        </div>

        <span className={pillClass}>{getMultiTrackSimilarityStatusLabel(candidate.status)}</span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-5">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs text-white/60">Total</p>
          <p className="mt-1 text-2xl font-black text-white">
            {candidate.totalSimilarityPercent}%
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs text-white/60">Confidence</p>
          <p className="mt-1 text-2xl font-black text-white">
            {candidate.confidencePercent}%
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs text-white/60">Drift</p>
          <p className="mt-1 text-2xl font-black text-white">
            {candidate.timingDriftSeconds}s
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs text-white/60">Decision</p>
          <p className="mt-1 text-sm font-black text-white">
            {getMultiTrackSimilarityDecisionLabel(candidate.decision)}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs text-white/60">Weighted</p>
          <p className="mt-1 text-2xl font-black text-white">
            {getMultiTrackSimilarityWeightedFeatureScore(candidate.featureScores)}%
          </p>
        </div>
      </div>

      <FeatureScoreGrid scores={candidate.featureScores} />

      <p className="mt-4 text-sm font-black text-white">
        {getMultiTrackSimilarityCandidateSafetyLabel(candidate)}
      </p>
    </article>
  );
}

function FamilySummaryCard({ summary }: { summary: MultiTrackSimilarityFamilySummary }) {
  return (
    <article className={cardClass}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
            {summary.color}
          </p>
          <h3 className="mt-2 text-lg font-black text-white">{summary.riffGroupLabel}</h3>
        </div>

        <span className={pillClass}>{summary.averageSimilarityPercent}%</span>
      </div>

      <div className="mt-4 grid gap-2">
        <div className={rowClass}>
          <span className="text-sm text-white/70">Candidates</span>
          <span className="text-sm font-black text-white">{summary.candidateCount}</span>
        </div>

        <div className={rowClass}>
          <span className="text-sm text-white/70">Accepted</span>
          <span className="text-sm font-black text-white">{summary.acceptedCount}</span>
        </div>

        <div className={rowClass}>
          <span className="text-sm text-white/70">Review</span>
          <span className="text-sm font-black text-white">{summary.reviewCount}</span>
        </div>

        <div className={rowClass}>
          <span className="text-sm text-white/70">Max Drift</span>
          <span className="text-sm font-black text-white">
            {summary.maxTimingDriftSeconds}s
          </span>
        </div>
      </div>
    </article>
  );
}

export function MultiTrackSimilarityWorkspacePanel() {
  const state = DEFAULT_MULTI_TRACK_SIMILARITY_WORKSPACE_STATE;
  const familySummaries = getMultiTrackSimilarityFamilySummaries(state.candidates);

  return (
    <section className={panelClass}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/70">
            Multi Track Similarity Engine
          </p>
          <h2 className="mt-2 text-3xl font-black text-white">
            Same-Family Riff Matching
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

      <div className="mt-5 grid gap-4 xl:grid-cols-3">
        <ThresholdPanel />
        {familySummaries.map((summary) => (
          <FamilySummaryCard key={summary.id} summary={summary} />
        ))}
      </div>

      <div className="mt-5 grid gap-5">
        {state.candidates.map((candidate) => (
          <CandidateCard key={candidate.id} candidate={candidate} />
        ))}
      </div>
    </section>
  );
}