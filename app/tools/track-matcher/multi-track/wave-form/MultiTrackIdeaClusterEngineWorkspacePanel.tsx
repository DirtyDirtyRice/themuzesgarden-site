"use client";

import { multiTrackIdeaClusterEngineSeedState } from "./MultiTrackIdeaClusterEngineSeed";
import {
  getIdeaClusterAction,
  getIdeaClusterActionPlanSummary,
  getIdeaClusterAverageMemberConfidence,
  getIdeaClusterAverageMutationDistance,
  getIdeaClusterAverageSimilarity,
  getIdeaClusterDecisionLabel,
  getIdeaClusterDistanceLabel,
  getIdeaClusterEngineMetrics,
  getIdeaClusterReadinessLabel,
  getIdeaClusterScore,
  getIdeaClusterStatusLabel,
  getIdeaClusterWeightedEvidenceScore,
} from "./MultiTrackIdeaClusterEngineHelpers";
import type {
  MultiTrackIdeaCluster,
  MultiTrackIdeaClusterActionPlan,
  MultiTrackIdeaClusterMember,
} from "./MultiTrackIdeaClusterEngineTypes";

const panelClass =
  "rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white shadow-2xl";

const cardClass =
  "rounded-2xl border border-white/10 bg-black/40 p-4 text-white";

const rowClass =
  "flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2";

const pillClass =
  "rounded-full border border-white/10 bg-white/[0.07] px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-white/70";

function IdeaClusterSummary() {
  const state = multiTrackIdeaClusterEngineSeedState;
  const metrics = getIdeaClusterEngineMetrics(state);

  return (
    <div className="mt-5 grid gap-4 md:grid-cols-6">
      <article className={cardClass}><p className="text-xs text-white/60">Clusters</p><p className="mt-2 text-3xl font-black text-white">{metrics.clusterCount}</p></article>
      <article className={cardClass}><p className="text-xs text-white/60">Members</p><p className="mt-2 text-3xl font-black text-white">{metrics.memberCount}</p></article>
      <article className={cardClass}><p className="text-xs text-white/60">Ready</p><p className="mt-2 text-3xl font-black text-white">{metrics.readyClusterCount}</p></article>
      <article className={cardClass}><p className="text-xs text-white/60">Review</p><p className="mt-2 text-3xl font-black text-white">{metrics.reviewClusterCount}</p></article>
      <article className={cardClass}><p className="text-xs text-white/60">Promote</p><p className="mt-2 text-3xl font-black text-white">{metrics.promotedCount}</p></article>
      <article className={cardClass}><p className="text-xs text-white/60">Score</p><p className="mt-2 text-3xl font-black text-white">{metrics.averageClusterScore}</p></article>
    </div>
  );
}

function MemberCard({ member }: { member: MultiTrackIdeaClusterMember }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-white/60">
            {member.versionLabel} · {member.color}
          </p>
          <h4 className="mt-2 text-lg font-black text-white">{member.label}</h4>
          <p className="mt-2 text-sm leading-6 text-white/70">{member.notes}</p>
        </div>
        <span className={pillClass}>{member.confidencePercent}%</span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
          <p className="text-xs text-white/60">Time</p>
          <p className="mt-1 text-sm font-black text-white">{member.timeRange.label}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
          <p className="text-xs text-white/60">Similarity</p>
          <p className="mt-1 text-2xl font-black text-white">{member.similarityPercent}%</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
          <p className="text-xs text-white/60">Mutation</p>
          <p className="mt-1 text-2xl font-black text-white">{member.mutationDistancePercent}%</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
          <p className="text-xs text-white/60">Status</p>
          <p className="mt-1 text-sm font-black text-white">
            {getIdeaClusterStatusLabel(member.status)}
          </p>
        </div>
      </div>
    </article>
  );
}

function ClusterCard({ cluster }: { cluster: MultiTrackIdeaCluster }) {
  return (
    <article className={cardClass}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-white/60">
            {cluster.color} · {cluster.kind}
          </p>
          <h3 className="mt-2 text-2xl font-black text-white">{cluster.label}</h3>
          <p className="mt-3 text-sm leading-6 text-white/70">{cluster.detail}</p>
        </div>
        <span className={pillClass}>{getIdeaClusterScore(cluster)}</span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-5">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs text-white/60">Evidence</p>
          <p className="mt-1 text-2xl font-black text-white">
            {getIdeaClusterWeightedEvidenceScore(cluster.evidence)}%
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs text-white/60">Confidence</p>
          <p className="mt-1 text-2xl font-black text-white">
            {getIdeaClusterAverageMemberConfidence(cluster)}%
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs text-white/60">Similarity</p>
          <p className="mt-1 text-2xl font-black text-white">
            {getIdeaClusterAverageSimilarity(cluster)}%
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs text-white/60">Mutation</p>
          <p className="mt-1 text-2xl font-black text-white">
            {getIdeaClusterAverageMutationDistance(cluster)}%
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs text-white/60">Members</p>
          <p className="mt-1 text-2xl font-black text-white">{cluster.members.length}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        <div className={rowClass}>
          <span className="text-sm text-white/70">Readiness</span>
          <span className="text-sm font-black text-white">
            {getIdeaClusterReadinessLabel(cluster.readiness)}
          </span>
        </div>
        <div className={rowClass}>
          <span className="text-sm text-white/70">Decision</span>
          <span className="text-sm font-black text-white">
            {getIdeaClusterDecisionLabel(cluster.decision)}
          </span>
        </div>
        <div className={rowClass}>
          <span className="text-sm text-white/70">Action</span>
          <span className="text-right text-sm font-black text-white">
            {getIdeaClusterAction(cluster)}
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {cluster.members.map((member) => (
          <MemberCard key={member.id} member={member} />
        ))}
      </div>
    </article>
  );
}

function ActionPlanCard({ plan }: { plan: MultiTrackIdeaClusterActionPlan }) {
  return (
    <article className={cardClass}>
      <h3 className="text-lg font-black text-white">{plan.label}</h3>
      <p className="mt-2 text-sm leading-6 text-white/70">{plan.detail}</p>
      <div className="mt-4 grid gap-2">
        <div className={rowClass}>
          <span className="text-sm text-white/70">Plan</span>
          <span className="text-right text-sm font-black text-white">
            {getIdeaClusterActionPlanSummary(plan)}
          </span>
        </div>
        <div className={rowClass}>
          <span className="text-sm text-white/70">Next</span>
          <span className="max-w-xl text-right text-sm font-black leading-6 text-white">
            {plan.nextAction}
          </span>
        </div>
      </div>
    </article>
  );
}

export function MultiTrackIdeaClusterEngineWorkspacePanel() {
  const state = multiTrackIdeaClusterEngineSeedState;

  return (
    <section className={panelClass}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-white/70">
            Multi Track Idea Cluster Engine
          </p>
          <h2 className="mt-2 text-3xl font-black text-white">{state.title}</h2>
          <p className="mt-3 max-w-5xl text-sm leading-6 text-white/70">
            {state.description}
          </p>
        </div>

        <span className={pillClass}>
          {state.targetKey} · {state.targetBpm} BPM · {getIdeaClusterDistanceLabel(state)}
        </span>
      </div>

      <IdeaClusterSummary />

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {state.actionPlans.map((plan) => (
          <ActionPlanCard key={plan.id} plan={plan} />
        ))}
      </div>

      <div className="mt-5 grid gap-5">
        {state.clusters.map((cluster) => (
          <ClusterCard key={cluster.id} cluster={cluster} />
        ))}
      </div>
    </section>
  );
}

export default MultiTrackIdeaClusterEngineWorkspacePanel;