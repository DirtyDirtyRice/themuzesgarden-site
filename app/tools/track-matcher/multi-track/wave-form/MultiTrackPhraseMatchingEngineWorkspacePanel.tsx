"use client";

import { multiTrackPhraseMatchingEngineSeedState } from "./MultiTrackPhraseMatchingEngineSeed";
import {
  getPhraseCandidateById,
  getPhraseFamilyAction,
  getPhraseFamilyScore,
  getPhraseFeatureWeightedScore,
  getPhraseMatchingDistanceLabel,
  getPhraseMatchingEngineMetrics,
  getPhraseMatchingReadinessLabel,
  getPhraseMatchDecisionLabel,
  getPhraseMatchStatusLabel,
  getPhraseRoleLabel,
} from "./MultiTrackPhraseMatchingEngineHelpers";
import type {
  MultiTrackPhraseFamily,
  MultiTrackPhraseFeatureScore,
  MultiTrackPhraseMatch,
} from "./MultiTrackPhraseMatchingEngineTypes";

const panelClass =
  "rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white shadow-2xl";

const cardClass =
  "rounded-2xl border border-white/10 bg-black/40 p-4 text-white";

const rowClass =
  "flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2";

const pillClass =
  "rounded-full border border-white/10 bg-white/[0.07] px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-white/70";

function PhraseSummary() {
  const state = multiTrackPhraseMatchingEngineSeedState;
  const metrics = getPhraseMatchingEngineMetrics(state);

  return (
    <div className="mt-5 grid gap-4 md:grid-cols-4 xl:grid-cols-8">
      <article className={cardClass}><p className="text-xs text-white/60">Families</p><p className="mt-2 text-3xl font-black text-white">{metrics.familyCount}</p></article>
      <article className={cardClass}><p className="text-xs text-white/60">Phrases</p><p className="mt-2 text-3xl font-black text-white">{metrics.phraseCount}</p></article>
      <article className={cardClass}><p className="text-xs text-white/60">Matches</p><p className="mt-2 text-3xl font-black text-white">{metrics.matchCount}</p></article>
      <article className={cardClass}><p className="text-xs text-white/60">Accepted</p><p className="mt-2 text-3xl font-black text-white">{metrics.acceptedCount}</p></article>
      <article className={cardClass}><p className="text-xs text-white/60">Review</p><p className="mt-2 text-3xl font-black text-white">{metrics.reviewCount}</p></article>
      <article className={cardClass}><p className="text-xs text-white/60">Rejected</p><p className="mt-2 text-3xl font-black text-white">{metrics.rejectedCount}</p></article>
      <article className={cardClass}><p className="text-xs text-white/60">Average</p><p className="mt-2 text-3xl font-black text-white">{metrics.averageMatchPercent}%</p></article>
      <article className={cardClass}><p className="text-xs text-white/60">Drift</p><p className="mt-2 text-3xl font-black text-white">{metrics.maxDriftSecond}s</p></article>
    </div>
  );
}

function FeatureGrid({ scores }: { scores: MultiTrackPhraseFeatureScore[] }) {
  return (
    <div className="mt-4 grid gap-2 md:grid-cols-2">
      {scores.map((score) => (
        <div key={score.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-black text-white">{score.label}</p>
              <p className="mt-1 text-xs leading-5 text-white/60">{score.detail}</p>
            </div>
            <span className={pillClass}>{score.score}%</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function PhraseMatchCard({
  family,
  match,
}: {
  family: MultiTrackPhraseFamily;
  match: MultiTrackPhraseMatch;
}) {
  const reference = getPhraseCandidateById(
    multiTrackPhraseMatchingEngineSeedState.families,
    match.referencePhraseId,
  );
  const candidate = getPhraseCandidateById(
    multiTrackPhraseMatchingEngineSeedState.families,
    match.candidatePhraseId,
  );

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-white/60">
            {family.colorFamily} · {getPhraseRoleLabel(match.phraseRole)}
          </p>
          <h4 className="mt-2 text-lg font-black text-white">{match.label}</h4>
          <p className="mt-2 text-sm leading-6 text-white/70">{match.detail}</p>
        </div>

        <span className={pillClass}>{getPhraseMatchStatusLabel(match.status)}</span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-5">
        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
          <p className="text-xs text-white/60">Total</p>
          <p className="mt-1 text-2xl font-black text-white">{match.totalMatchPercent}%</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
          <p className="text-xs text-white/60">Weighted</p>
          <p className="mt-1 text-2xl font-black text-white">
            {getPhraseFeatureWeightedScore(match.featureScores)}%
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
          <p className="text-xs text-white/60">Drift</p>
          <p className="mt-1 text-2xl font-black text-white">{match.timingDriftSecond}s</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
          <p className="text-xs text-white/60">Reference</p>
          <p className="mt-1 text-sm font-black text-white">
            {reference?.trackLabel ?? "Unknown"}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
          <p className="text-xs text-white/60">Candidate</p>
          <p className="mt-1 text-sm font-black text-white">
            {candidate?.trackLabel ?? "Unknown"}
          </p>
        </div>
      </div>

      <FeatureGrid scores={match.featureScores} />

      <div className="mt-4 grid gap-2">
        <div className={rowClass}>
          <span className="text-sm text-white/70">Decision</span>
          <span className="text-right text-sm font-black text-white">
            {getPhraseMatchDecisionLabel(match)}
          </span>
        </div>
      </div>
    </article>
  );
}

function PhraseFamilyCard({ family }: { family: MultiTrackPhraseFamily }) {
  return (
    <article className={cardClass}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-white/60">
            {family.colorFamily} · {getPhraseRoleLabel(family.phraseRole)}
          </p>
          <h3 className="mt-2 text-2xl font-black text-white">{family.label}</h3>
          <p className="mt-3 text-sm leading-6 text-white/70">{family.detail}</p>
        </div>

        <span className={pillClass}>{getPhraseFamilyScore(family)}</span>
      </div>

      <div className="mt-4 grid gap-2">
        <div className={rowClass}>
          <span className="text-sm text-white/70">Readiness</span>
          <span className="text-sm font-black text-white">
            {getPhraseMatchingReadinessLabel(family.readiness)}
          </span>
        </div>
        <div className={rowClass}>
          <span className="text-sm text-white/70">Action</span>
          <span className="text-right text-sm font-black text-white">
            {getPhraseFamilyAction(family)}
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {family.matches.map((match) => (
          <PhraseMatchCard key={match.id} family={family} match={match} />
        ))}
      </div>
    </article>
  );
}

export function MultiTrackPhraseMatchingEngineWorkspacePanel() {
  const state = multiTrackPhraseMatchingEngineSeedState;

  return (
    <section className={panelClass}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-white/70">
            Multi Track Phrase Matching Engine
          </p>
          <h2 className="mt-2 text-3xl font-black text-white">{state.title}</h2>
          <p className="mt-3 max-w-5xl text-sm leading-6 text-white/70">
            {state.description}
          </p>
        </div>

        <span className={pillClass}>
          {state.targetKey} · {state.targetBpm} BPM ·{" "}
          {getPhraseMatchingDistanceLabel(state)}
        </span>
      </div>

      <PhraseSummary />

      <div className="mt-5 grid gap-5">
        {state.families.map((family) => (
          <PhraseFamilyCard key={family.id} family={family} />
        ))}
      </div>
    </section>
  );
}

export default MultiTrackPhraseMatchingEngineWorkspacePanel;