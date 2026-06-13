
import {
  calculateMultiTrackSurvivorPromotionCandidateScore,
  getMultiTrackSurvivorPromotionDecisionLabel,
  getMultiTrackSurvivorPromotionReadinessLabel,
  getMultiTrackSurvivorPromotionRecommendedDecision,
  getMultiTrackSurvivorPromotionWorkspaceSummary,
  sortMultiTrackSurvivorPromotionCandidates,
} from "./MultiTrackSurvivorPromotionEngineHelpers";
import { multiTrackSurvivorPromotionWorkspaceSeed } from "./MultiTrackSurvivorPromotionEngineSeed";
import type {
  MultiTrackSurvivorPromotionCandidate,
  MultiTrackSurvivorPromotionKeeperBankSlot,
  MultiTrackSurvivorPromotionWorkspaceState,
} from "./MultiTrackSurvivorPromotionEngineTypes";

type MultiTrackSurvivorPromotionEngineWorkspacePanelProps = {
  workspace?: MultiTrackSurvivorPromotionWorkspaceState;
};

function MultiTrackSurvivorPromotionStatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-white/15 bg-black p-4">
      <div className="text-xs uppercase tracking-[0.24em] text-white/70">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
      <div className="mt-2 text-sm leading-6 text-white/70">{detail}</div>
    </div>
  );
}

function MultiTrackSurvivorPromotionCandidateCard({
  candidate,
}: {
  candidate: MultiTrackSurvivorPromotionCandidate;
}) {
  const calculatedScore = calculateMultiTrackSurvivorPromotionCandidateScore(candidate);
  const recommendedDecision = getMultiTrackSurvivorPromotionRecommendedDecision(candidate);

  return (
    <article className="rounded-2xl border border-white/15 bg-black p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.24em] text-white/70">
            {candidate.sectionLabel} · bars {candidate.startBar}-{candidate.endBar}
          </div>
          <h3 className="mt-2 text-lg font-semibold text-white">{candidate.title}</h3>
          <p className="mt-2 text-sm leading-6 text-white/70">
            Cluster: {candidate.sourceClusterId} · Versions: {candidate.sourceVersionIds.join(", ")}
          </p>
        </div>

        <div className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white">
          {getMultiTrackSurvivorPromotionDecisionLabel(candidate.decision)}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 p-3">
          <div className="text-xs uppercase tracking-[0.2em] text-white/70">Calculated</div>
          <div className="mt-1 text-xl font-semibold text-white">{calculatedScore}</div>
        </div>
        <div className="rounded-xl border border-white/10 p-3">
          <div className="text-xs uppercase tracking-[0.2em] text-white/70">Confidence</div>
          <div className="mt-1 text-xl font-semibold text-white">{candidate.confidence}</div>
        </div>
        <div className="rounded-xl border border-white/10 p-3">
          <div className="text-xs uppercase tracking-[0.2em] text-white/70">Recommended</div>
          <div className="mt-1 text-xl font-semibold text-white">
            {getMultiTrackSurvivorPromotionDecisionLabel(recommendedDecision)}
          </div>
        </div>
      </div>
    </article>
  );
}

function MultiTrackSurvivorPromotionKeeperBankCard({
  slot,
}: {
  slot: MultiTrackSurvivorPromotionKeeperBankSlot;
}) {
  return (
    <article className="rounded-2xl border border-white/15 bg-black p-4">
      <h3 className="text-lg font-semibold text-white">{slot.label}</h3>
      <p className="mt-2 text-sm leading-6 text-white/70">{slot.description}</p>
      <div className="mt-4 text-sm leading-6 text-white/70">
        Accepted: {slot.acceptedCandidateIds.length} · Pending: {slot.pendingCandidateIds.length}
      </div>
    </article>
  );
}

export function MultiTrackSurvivorPromotionEngineWorkspacePanel({
  workspace = multiTrackSurvivorPromotionWorkspaceSeed,
}: MultiTrackSurvivorPromotionEngineWorkspacePanelProps) {
  const sortedCandidates = sortMultiTrackSurvivorPromotionCandidates(workspace.candidates);
  const promotedCount = workspace.candidates.filter((candidate) => candidate.decision === "promote").length;
  const reviewCount = workspace.candidates.filter(
    (candidate) => candidate.decision === "review" || candidate.readiness === "needs-review",
  ).length;

  return (
    <section className="rounded-3xl border border-white/15 bg-black p-5 text-white">
      <div className="text-xs uppercase tracking-[0.28em] text-white/70">Preserved Engine</div>
      <h2 className="mt-2 text-2xl font-semibold text-white">{workspace.engineTitle}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-white/70">{workspace.enginePurpose}</p>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <MultiTrackSurvivorPromotionStatCard
          label="Summary"
          value={`${workspace.candidates.length}`}
          detail={getMultiTrackSurvivorPromotionWorkspaceSummary(workspace)}
        />
        <MultiTrackSurvivorPromotionStatCard
          label="Promoted"
          value={`${promotedCount}`}
          detail="Candidates strong enough to move toward keeper bank promotion later."
        />
        <MultiTrackSurvivorPromotionStatCard
          label="Review"
          value={`${reviewCount}`}
          detail="Candidates that should stay visible until human listening confirms value."
        />
      </div>

      <div className="mt-6 grid gap-4">
        {sortedCandidates.map((candidate) => (
          <MultiTrackSurvivorPromotionCandidateCard key={candidate.id} candidate={candidate} />
        ))}
      </div>

      <div className="mt-6 grid gap-4">
        {workspace.keeperBankSlots.map((slot) => (
          <MultiTrackSurvivorPromotionKeeperBankCard key={slot.id} slot={slot} />
        ))}
      </div>
    </section>
  );
}