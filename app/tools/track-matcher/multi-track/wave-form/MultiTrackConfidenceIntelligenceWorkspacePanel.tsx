"use client";

import {
  buildMultiTrackConfidenceBucketCounts,
  buildMultiTrackConfidencePlanningSentence,
  buildMultiTrackConfidenceSafetySummary,
  getMultiTrackConfidenceBlockingRisks,
  getMultiTrackConfidenceBucketClass,
  getMultiTrackConfidenceBucketLabel,
  getMultiTrackConfidenceEvidenceForSource,
  getMultiTrackConfidenceEvidenceLabel,
  getMultiTrackConfidenceFutureSources,
  getMultiTrackConfidenceManualSources,
  getMultiTrackConfidenceReadyEvidence,
  getMultiTrackConfidenceRisksForSource,
  getMultiTrackConfidenceStatusClass,
  getMultiTrackConfidenceStatusLabel,
  getMultiTrackConfidenceWorkspaceSummary,
} from "./MultiTrackConfidenceIntelligenceHelpers";
import { multiTrackConfidenceWorkspaceState } from "./MultiTrackConfidenceIntelligenceSeed";
import type {
  MultiTrackConfidenceDashboardCard,
  MultiTrackConfidenceEvidence,
  MultiTrackConfidenceRisk,
  MultiTrackConfidenceSafetyRule,
  MultiTrackConfidenceSource,
} from "./MultiTrackConfidenceIntelligenceTypes";

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

function DashboardCard({ card }: { card: MultiTrackConfidenceDashboardCard }) {
  return (
    <article className={cardClass}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className={labelClass}>{card.lane}</p>
          <h3 className="mt-1 text-base font-semibold text-white">{card.title}</h3>
        </div>
        <StatusPill
          label={`${card.score}/100`}
          className={getMultiTrackConfidenceBucketClass(card.bucket)}
        />
      </div>
      <p className={bodyClass}>{card.summary}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <StatusPill
          label={getMultiTrackConfidenceBucketLabel(card.bucket)}
          className={getMultiTrackConfidenceBucketClass(card.bucket)}
        />
        <StatusPill
          label={getMultiTrackConfidenceStatusLabel(card.status)}
          className={getMultiTrackConfidenceStatusClass(card.status)}
        />
      </div>
      <p className="mt-3 text-xs leading-5 text-white/60">{card.nextAction}</p>
    </article>
  );
}

function SourceCard({
  source,
  evidence,
  risks,
}: {
  source: MultiTrackConfidenceSource;
  evidence: MultiTrackConfidenceEvidence[];
  risks: MultiTrackConfidenceRisk[];
}) {
  return (
    <article className={cardClass}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className={labelClass}>{source.lane}</p>
          <h3 className="mt-1 text-base font-semibold text-white">{source.label}</h3>
        </div>
        <StatusPill
          label={`${source.score}/100`}
          className={getMultiTrackConfidenceBucketClass(source.bucket)}
        />
      </div>

      <p className={bodyClass}>{source.currentMeaning}</p>
      <p className="mt-3 text-sm leading-6 text-white/60">{source.futureMeaning}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        <StatusPill
          label={getMultiTrackConfidenceBucketLabel(source.bucket)}
          className={getMultiTrackConfidenceBucketClass(source.bucket)}
        />
        <StatusPill
          label={getMultiTrackConfidenceStatusLabel(source.status)}
          className={getMultiTrackConfidenceStatusClass(source.status)}
        />
        <StatusPill label={source.owner} className="border-white/15 text-white/70" />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 p-3">
          <p className={labelClass}>Evidence</p>
          <ul className="mt-2 space-y-2 text-sm text-white/70">
            {evidence.length === 0 ? (
              <li>No evidence attached yet.</li>
            ) : (
              evidence.map((item) => (
                <li key={item.id}>
                  {getMultiTrackConfidenceEvidenceLabel(item.evidenceType)} — {item.label}
                </li>
              ))
            )}
          </ul>
        </div>
        <div className="rounded-2xl border border-white/10 p-3">
          <p className={labelClass}>Risks</p>
          <ul className="mt-2 space-y-2 text-sm text-white/70">
            {risks.length === 0 ? (
              <li>No risk attached yet.</li>
            ) : (
              risks.map((risk) => (
                <li key={risk.id}>
                  {risk.label} — {risk.escalation}
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <p className="mt-3 text-xs leading-5 text-white/60">{source.userRule}</p>
    </article>
  );
}

function EvidenceCard({ evidence }: { evidence: MultiTrackConfidenceEvidence }) {
  return (
    <article className={cardClass}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-white">{evidence.label}</h3>
        <StatusPill
          label={getMultiTrackConfidenceStatusLabel(evidence.status)}
          className={getMultiTrackConfidenceStatusClass(evidence.status)}
        />
      </div>
      <p className={bodyClass}>{evidence.detail}</p>
      <p className="mt-3 text-xs uppercase tracking-[0.18em] text-white/50">
        {getMultiTrackConfidenceEvidenceLabel(evidence.evidenceType)}
      </p>
    </article>
  );
}

function RiskCard({ risk }: { risk: MultiTrackConfidenceRisk }) {
  return (
    <article className={cardClass}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-white">{risk.label}</h3>
        <StatusPill
          label={risk.escalation}
          className={getMultiTrackConfidenceStatusClass(risk.status)}
        />
      </div>
      <p className={bodyClass}>{risk.detail}</p>
      <p className="mt-3 text-xs uppercase tracking-[0.18em] text-white/50">{risk.riskFactor}</p>
    </article>
  );
}

function SafetyRuleCard({ rule }: { rule: MultiTrackConfidenceSafetyRule }) {
  return (
    <article className={cardClass}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-white">{rule.label}</h3>
        <StatusPill
          label={getMultiTrackConfidenceStatusLabel(rule.status)}
          className={getMultiTrackConfidenceStatusClass(rule.status)}
        />
      </div>
      <p className={bodyClass}>{rule.rule}</p>
      <p className="mt-3 text-xs uppercase tracking-[0.18em] text-white/50">Owner: {rule.owner}</p>
    </article>
  );
}

export default function MultiTrackConfidenceIntelligenceWorkspacePanel() {
  const state = multiTrackConfidenceWorkspaceState;
  const summary = getMultiTrackConfidenceWorkspaceSummary(state);
  const bucketCounts = buildMultiTrackConfidenceBucketCounts(state.sources);
  const manualSources = getMultiTrackConfidenceManualSources(state.sources);
  const futureSources = getMultiTrackConfidenceFutureSources(state.sources);
  const readyEvidence = getMultiTrackConfidenceReadyEvidence(state.evidence);
  const blockingRisks = getMultiTrackConfidenceBlockingRisks(state.risks);
  const safetyRules = buildMultiTrackConfidenceSafetySummary();

  return (
    <section className={panelClass}>
      <SectionHeader
        eyebrow="#13 Waveform Branch"
        title={state.title}
        body={state.description}
      />

      <div className={gridClass}>
        <SummaryCard
          label="Readiness"
          value={`${summary.ready}/${summary.total}`}
          detail={buildMultiTrackConfidencePlanningSentence(state)}
        />
        <SummaryCard
          label="Average Confidence"
          value={`${summary.averageScore}/100`}
          detail="Average score across confidence sources only."
        />
        <SummaryCard
          label="Manual Review"
          value={`${manualSources.length}`}
          detail="Sources that need user or manual review before trust increases."
        />
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Weak" value={`${bucketCounts.weak}`} detail="Low evidence confidence sources." />
        <SummaryCard label="Unknown" value={`${bucketCounts.unknown}`} detail="Missing or unconfirmed evidence." />
        <SummaryCard label="Manual" value={`${bucketCounts.manualReview}`} detail="User review required." />
        <SummaryCard label="Future" value={`${futureSources.length}`} detail="Reserved for future analyzer, AI, DSP, or builder." />
      </div>

      <div className="mt-8">
        <SectionHeader
          eyebrow="Dashboard"
          title="Confidence Dashboard Cards"
          body="Top-level confidence cards for overall, tempo, key, hook, structure, stem, hybrid, and lineage trust."
        />
        <div className={gridClass}>
          {state.dashboardCards.map((card) => (
            <DashboardCard key={card.id} card={card} />
          ))}
        </div>
      </div>

      <div className="mt-8">
        <SectionHeader
          eyebrow="Sources"
          title="Confidence Sources"
          body="Each source explains current confidence, future confidence, ownership, score, evidence, risk, and user rules."
        />
        <div className="mt-4 grid gap-3">
          {state.sources.map((source) => (
            <SourceCard
              key={source.id}
              source={source}
              evidence={getMultiTrackConfidenceEvidenceForSource(state.evidence, source.id)}
              risks={getMultiTrackConfidenceRisksForSource(state.risks, source.id)}
            />
          ))}
        </div>
      </div>

      <div className="mt-8">
        <SectionHeader
          eyebrow="Evidence"
          title="Confidence Evidence"
          body="Evidence can be user-confirmed, metadata-confirmed, future analyzer, future AI, future DSP, seed-only, or missing."
        />
        <div className={gridClass}>
          {state.evidence.map((evidence) => (
            <EvidenceCard key={evidence.id} evidence={evidence} />
          ))}
        </div>
      </div>

      <div className="mt-8">
        <SectionHeader
          eyebrow="Risks"
          title="Confidence Risk Factors"
          body="Risks explain why confidence cannot be upgraded yet."
        />
        <div className={gridClass}>
          {state.risks.map((risk) => (
            <RiskCard key={risk.id} risk={risk} />
          ))}
        </div>
      </div>

      <div className="mt-8">
        <SectionHeader
          eyebrow="Safety"
          title="Confidence Safety Rules"
          body="Rules that prevent inflated confidence, false ownership, false lineage, and automatic AI approval."
        />
        <div className={gridClass}>
          {state.safetyRules.map((rule) => (
            <SafetyRuleCard key={rule.id} rule={rule} />
          ))}
        </div>
      </div>

      <div className="mt-8 rounded-3xl border border-white/10 bg-black p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className={labelClass}>Safety Lock</p>
            <h3 className="mt-2 text-lg font-semibold text-white">Read-Only Confidence Foundation</h3>
          </div>
          <StatusPill label={`${readyEvidence.length} ready evidence item(s)`} className="border-white/25 text-white" />
          <StatusPill label={`${blockingRisks.length} blocking risk item(s)`} className="border-white/15 text-white/70" />
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