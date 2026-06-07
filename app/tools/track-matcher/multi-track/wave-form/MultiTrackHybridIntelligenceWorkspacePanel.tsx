"use client";

import {
  buildMultiTrackHybridPlanningSentence,
  buildMultiTrackHybridSafetySummary,
  buildMultiTrackHybridSourceSummary,
  getMultiTrackHybridConfidenceClass,
  getMultiTrackHybridConfidenceLabel,
  getMultiTrackHybridFuturePlans,
  getMultiTrackHybridReadinessSummary,
  getMultiTrackHybridReadyOwnership,
  getMultiTrackHybridReviewSignals,
  getMultiTrackHybridStatusClass,
  getMultiTrackHybridStatusLabel,
  getMultiTrackHybridTrackAAssets,
  getMultiTrackHybridTrackBAssets,
} from "./MultiTrackHybridIntelligenceHelpers";
import { multiTrackHybridWorkspaceState } from "./MultiTrackHybridIntelligenceSeed";
import type {
  MultiTrackHybridAssetCandidate,
  MultiTrackHybridBuilderOwnershipItem,
  MultiTrackHybridCompatibilitySignal,
  MultiTrackHybridMergePlan,
  MultiTrackHybridUserConfirmationRule,
} from "./MultiTrackHybridIntelligenceTypes";

const panelClass = "rounded-3xl border border-white/10 bg-black p-5 text-white";
const cardClass = "rounded-2xl border border-white/10 bg-black p-4";
const labelClass = "text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60";
const bodyClass = "mt-2 text-sm leading-6 text-white/75";
const titleClass = "text-lg font-semibold text-white";
const gridClass = "mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3";

function StatusPill({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${className}`}>
      {label}
    </span>
  );
}

function SectionHeader({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div>
      <p className={labelClass}>{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-semibold text-white">{title}</h2>
      <p className={bodyClass}>{body}</p>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className={cardClass}>
      <p className={labelClass}>{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-white/70">{detail}</p>
    </article>
  );
}

function CompatibilityCard({ signal }: { signal: MultiTrackHybridCompatibilitySignal }) {
  return (
    <article className={cardClass}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className={titleClass}>{signal.label}</h3>
        <StatusPill
          label={getMultiTrackHybridStatusLabel(signal.status)}
          className={getMultiTrackHybridStatusClass(signal.status)}
        />
      </div>
      <p className={bodyClass}>{signal.detail}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <StatusPill
          label={getMultiTrackHybridConfidenceLabel(signal.confidence)}
          className={getMultiTrackHybridConfidenceClass(signal.confidence)}
        />
      </div>
      <p className="mt-3 text-xs leading-5 text-white/60">{signal.userRule}</p>
    </article>
  );
}

function AssetCard({ asset }: { asset: MultiTrackHybridAssetCandidate }) {
  return (
    <article className={cardClass}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className={labelClass}>{asset.sourceId === "track-a" ? "Track A" : "Track B"}</p>
          <h3 className="mt-1 text-base font-semibold text-white">{asset.label}</h3>
        </div>
        <StatusPill
          label={asset.assetType}
          className="border-white/15 text-white/70"
        />
      </div>
      <p className={bodyClass}>{asset.reason}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <StatusPill
          label={getMultiTrackHybridStatusLabel(asset.status)}
          className={getMultiTrackHybridStatusClass(asset.status)}
        />
        <StatusPill
          label={getMultiTrackHybridConfidenceLabel(asset.confidence)}
          className={getMultiTrackHybridConfidenceClass(asset.confidence)}
        />
      </div>
      <div className="mt-3">
        <p className={labelClass}>Usable For</p>
        <ul className="mt-2 space-y-1 text-sm text-white/70">
          {asset.usableFor.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      </div>
      <p className="mt-3 text-xs leading-5 text-white/60">{asset.requiredConfirmation}</p>
    </article>
  );
}

function MergePlanCard({ plan }: { plan: MultiTrackHybridMergePlan }) {
  return (
    <article className={cardClass}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className={titleClass}>{plan.title}</h3>
        <StatusPill
          label={getMultiTrackHybridStatusLabel(plan.status)}
          className={getMultiTrackHybridStatusClass(plan.status)}
        />
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 p-3">
          <p className={labelClass}>Track A Purpose</p>
          <p className="mt-2 text-sm leading-6 text-white/70">{plan.trackAPurpose}</p>
        </div>
        <div className="rounded-2xl border border-white/10 p-3">
          <p className={labelClass}>Track B Purpose</p>
          <p className="mt-2 text-sm leading-6 text-white/70">{plan.trackBPurpose}</p>
        </div>
      </div>
      <p className={bodyClass}>{plan.plannedOutcome}</p>
      <p className="mt-3 text-xs leading-5 text-white/60">Blocked until: {plan.blockedUntil}</p>
    </article>
  );
}

function ConfirmationRuleCard({ rule }: { rule: MultiTrackHybridUserConfirmationRule }) {
  return (
    <article className={cardClass}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-white">{rule.label}</h3>
        <StatusPill label={rule.owner} className="border-white/15 text-white/70" />
      </div>
      <p className={bodyClass}>{rule.rule}</p>
      <p className="mt-3 text-xs leading-5 text-white/60">Required before: {rule.requiredBefore}</p>
    </article>
  );
}

function OwnershipCard({ item }: { item: MultiTrackHybridBuilderOwnershipItem }) {
  return (
    <article className={cardClass}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-white">{item.label}</h3>
        <StatusPill
          label={getMultiTrackHybridStatusLabel(item.status)}
          className={getMultiTrackHybridStatusClass(item.status)}
        />
      </div>
      <p className={bodyClass}>{item.currentScope}</p>
      <p className="mt-3 text-sm leading-6 text-white/60">{item.futureScope}</p>
      <p className="mt-3 text-xs uppercase tracking-[0.18em] text-white/50">Owner: {item.owner}</p>
    </article>
  );
}

export default function MultiTrackHybridIntelligenceWorkspacePanel() {
  const state = multiTrackHybridWorkspaceState;
  const summary = getMultiTrackHybridReadinessSummary(state);
  const sourceSummary = buildMultiTrackHybridSourceSummary(state.assetCandidates);
  const trackAAssets = getMultiTrackHybridTrackAAssets(state.assetCandidates);
  const trackBAssets = getMultiTrackHybridTrackBAssets(state.assetCandidates);
  const reviewSignals = getMultiTrackHybridReviewSignals(state.compatibilitySignals);
  const futurePlans = getMultiTrackHybridFuturePlans(state.mergePlans);
  const readyOwnership = getMultiTrackHybridReadyOwnership(state.builderOwnership);
  const safetyRules = buildMultiTrackHybridSafetySummary();

  return (
    <section className={panelClass}>
      <SectionHeader
        eyebrow="Waveform Branch"
        title={state.title}
        body={state.description}
      />

      <div className={gridClass}>
        <SummaryCard
          label="Readiness"
          value={`${summary.ready}/${summary.total}`}
          detail={buildMultiTrackHybridPlanningSentence(state)}
        />
        <SummaryCard
          label="Track A Assets"
          value={`${sourceSummary.trackA}`}
          detail="Original hooks, vocal phrases, rhythm beds, and raw ideas that may become hybrid source material."
        />
        <SummaryCard
          label="Track B Assets"
          value={`${sourceSummary.trackB}`}
          detail="Finished hooks, chorus lifts, bass support, and produced sections that may support the hybrid."
        />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <div className={cardClass}>
          <p className={labelClass}>Review Signals</p>
          <p className="mt-2 text-3xl font-semibold text-white">{reviewSignals.length}</p>
          <p className={bodyClass}>Compatibility signals still requiring user review before future builder ownership.</p>
        </div>
        <div className={cardClass}>
          <p className={labelClass}>Future Plans</p>
          <p className="mt-2 text-3xl font-semibold text-white">{futurePlans.length}</p>
          <p className={bodyClass}>Plans reserved for later builder wiring after confidence gates are satisfied.</p>
        </div>
      </div>

      <div className="mt-8">
        <SectionHeader
          eyebrow="Compatibility"
          title="Tempo, Key, Stem, Hook, and Section Readiness"
          body="These cards define what must be known before Track A and Track B can be treated as hybrid-ready."
        />
        <div className={gridClass}>
          {state.compatibilitySignals.map((signal) => (
            <CompatibilityCard key={signal.id} signal={signal} />
          ))}
        </div>
      </div>

      <div className="mt-8">
        <SectionHeader
          eyebrow="Track A"
          title="Usable Pieces From Track A"
          body="Read-only candidates for original source material, ad-lib proof, riffs, grooves, or section anchors."
        />
        <div className={gridClass}>
          {trackAAssets.map((asset) => (
            <AssetCard key={asset.id} asset={asset} />
          ))}
        </div>
      </div>

      <div className="mt-8">
        <SectionHeader
          eyebrow="Track B"
          title="Usable Pieces From Track B"
          body="Read-only candidates for finished support material, hook lifts, bass support, chorus swaps, or produced ideas."
        />
        <div className={gridClass}>
          {trackBAssets.map((asset) => (
            <AssetCard key={asset.id} asset={asset} />
          ))}
        </div>
      </div>

      <div className="mt-8">
        <SectionHeader
          eyebrow="Merge Planning"
          title="Stem Merge, Hook Merge, Section Swap, Tempo / Key, and Builder Ownership"
          body="Planning cards only. Nothing here mutates audio or writes state."
        />
        <div className="mt-4 grid gap-3">
          {state.mergePlans.map((plan) => (
            <MergePlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      </div>

      <div className="mt-8">
        <SectionHeader
          eyebrow="Confirmation"
          title="User Confirmation Rules"
          body="Hybrid building must remain under user control before any future automation can act."
        />
        <div className={gridClass}>
          {state.confirmationRules.map((rule) => (
            <ConfirmationRuleCard key={rule.id} rule={rule} />
          ))}
        </div>
      </div>

      <div className="mt-8">
        <SectionHeader
          eyebrow="Ownership"
          title="Future Hybrid Builder Ownership"
          body="This defines what the current workspace owns now and what the future builder may own later."
        />
        <div className={gridClass}>
          {state.builderOwnership.map((item) => (
            <OwnershipCard key={item.id} item={item} />
          ))}
        </div>
      </div>

      <div className="mt-8 rounded-3xl border border-white/10 bg-black p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className={labelClass}>Safety Lock</p>
            <h3 className="mt-2 text-lg font-semibold text-white">Read-Only Hybrid Foundation</h3>
          </div>
          <StatusPill label={`${readyOwnership.length} ready ownership item(s)`} className="border-white/25 text-white" />
        </div>
        <ul className="mt-4 grid gap-2 text-sm text-white/70 md:grid-cols-2 xl:grid-cols-3">
          {safetyRules.map((rule) => (
            <li key={rule} className="rounded-2xl border border-white/10 p-3">
              {rule}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}