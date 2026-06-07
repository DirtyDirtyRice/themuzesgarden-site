"use client";

import {
  buildMultiTrackComparisonLaneCounts,
  buildMultiTrackComparisonPlanningSentence,
  buildMultiTrackComparisonSafetySummary,
  getMultiTrackComparisonConfidenceClass,
  getMultiTrackComparisonConfidenceLabel,
  getMultiTrackComparisonFutureMetrics,
  getMultiTrackComparisonFutureSteps,
  getMultiTrackComparisonReadyGuardrails,
  getMultiTrackComparisonReviewFindings,
  getMultiTrackComparisonStatusClass,
  getMultiTrackComparisonStatusLabel,
  getMultiTrackComparisonSummary,
} from "./MultiTrackComparisonIntelligenceHelpers";
import { multiTrackComparisonWorkspaceState } from "./MultiTrackComparisonIntelligenceSeed";
import type {
  MultiTrackComparisonFinding,
  MultiTrackComparisonGuardrail,
  MultiTrackComparisonMetric,
  MultiTrackComparisonWorkflowStep,
} from "./MultiTrackComparisonIntelligenceTypes";

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

function MetricCard({ metric }: { metric: MultiTrackComparisonMetric }) {
  return (
    <article className={cardClass}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className={labelClass}>{metric.lane}</p>
          <h3 className="mt-1 text-base font-semibold text-white">{metric.label}</h3>
        </div>
        <StatusPill
          label={getMultiTrackComparisonStatusLabel(metric.status)}
          className={getMultiTrackComparisonStatusClass(metric.status)}
        />
      </div>
      <p className={bodyClass}>{metric.currentMeaning}</p>
      <p className="mt-3 text-sm leading-6 text-white/60">{metric.futureMeaning}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <StatusPill label={metric.sourceId} className="border-white/15 text-white/70" />
        <StatusPill
          label={getMultiTrackComparisonConfidenceLabel(metric.confidence)}
          className={getMultiTrackComparisonConfidenceClass(metric.confidence)}
        />
      </div>
    </article>
  );
}

function FindingCard({ finding }: { finding: MultiTrackComparisonFinding }) {
  return (
    <article className={cardClass}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className={titleClass}>{finding.title}</h3>
        <StatusPill
          label={getMultiTrackComparisonStatusLabel(finding.status)}
          className={getMultiTrackComparisonStatusClass(finding.status)}
        />
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 p-3">
          <p className={labelClass}>Track A</p>
          <p className="mt-2 text-sm leading-6 text-white/70">{finding.trackAObservation}</p>
        </div>
        <div className="rounded-2xl border border-white/10 p-3">
          <p className={labelClass}>Track B</p>
          <p className="mt-2 text-sm leading-6 text-white/70">{finding.trackBObservation}</p>
        </div>
      </div>

      <p className={bodyClass}>{finding.comparisonMeaning}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <StatusPill label={finding.lane} className="border-white/15 text-white/70" />
        <StatusPill
          label={getMultiTrackComparisonConfidenceLabel(finding.confidence)}
          className={getMultiTrackComparisonConfidenceClass(finding.confidence)}
        />
      </div>
      <p className="mt-3 text-xs leading-5 text-white/60">{finding.requiredConfirmation}</p>
    </article>
  );
}

function WorkflowStepCard({ step }: { step: MultiTrackComparisonWorkflowStep }) {
  return (
    <article className={cardClass}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-white">{step.label}</h3>
        <StatusPill
          label={getMultiTrackComparisonStatusLabel(step.status)}
          className={getMultiTrackComparisonStatusClass(step.status)}
        />
      </div>
      <p className={bodyClass}>{step.purpose}</p>
      <p className="mt-3 text-xs uppercase tracking-[0.18em] text-white/50">Owner: {step.owner}</p>
      <p className="mt-3 text-xs leading-5 text-white/60">Blocked until: {step.blockedUntil}</p>
    </article>
  );
}

function GuardrailCard({ guardrail }: { guardrail: MultiTrackComparisonGuardrail }) {
  return (
    <article className={cardClass}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-white">{guardrail.label}</h3>
        <StatusPill
          label={getMultiTrackComparisonStatusLabel(guardrail.status)}
          className={getMultiTrackComparisonStatusClass(guardrail.status)}
        />
      </div>
      <p className={bodyClass}>{guardrail.rule}</p>
    </article>
  );
}

export default function MultiTrackComparisonIntelligenceWorkspacePanel() {
  const state = multiTrackComparisonWorkspaceState;
  const summary = getMultiTrackComparisonSummary(state);
  const laneCounts = buildMultiTrackComparisonLaneCounts(state.metrics);
  const futureMetrics = getMultiTrackComparisonFutureMetrics(state.metrics);
  const reviewFindings = getMultiTrackComparisonReviewFindings(state.findings);
  const futureSteps = getMultiTrackComparisonFutureSteps(state.workflowSteps);
  const readyGuardrails = getMultiTrackComparisonReadyGuardrails(state.guardrails);
  const safetyRules = buildMultiTrackComparisonSafetySummary();

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
          detail={buildMultiTrackComparisonPlanningSentence(state)}
        />
        <SummaryCard
          label="Review Findings"
          value={`${reviewFindings.length}`}
          detail="Findings requiring user confirmation before comparison meaning can be trusted."
        />
        <SummaryCard
          label="Future Analyzer Items"
          value={`${futureMetrics.length + futureSteps.length}`}
          detail="Comparison areas reserved for later analyzer wiring."
        />
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <SummaryCard label="Tempo" value={`${laneCounts.tempo}`} detail="BPM and drift planning." />
        <SummaryCard label="Key" value={`${laneCounts.key}`} detail="Harmonic relationship planning." />
        <SummaryCard label="Hook" value={`${laneCounts.hook}`} detail="Hook and riff comparison." />
        <SummaryCard label="Rhythm" value={`${laneCounts.rhythm}`} detail="Groove comparison planning." />
        <SummaryCard label="Lineage" value={`${laneCounts.lineage}`} detail="Original/result relationship planning." />
      </div>

      <div className="mt-8">
        <SectionHeader
          eyebrow="Metrics"
          title="Comparison Metrics"
          body="These define what Track A and Track B can eventually be compared on."
        />
        <div className={gridClass}>
          {state.metrics.map((metric) => (
            <MetricCard key={metric.id} metric={metric} />
          ))}
        </div>
      </div>

      <div className="mt-8">
        <SectionHeader
          eyebrow="Findings"
          title="Track A vs Track B Findings"
          body="Read-only comparison findings that stay manual until future analysis proves more."
        />
        <div className="mt-4 grid gap-3">
          {state.findings.map((finding) => (
            <FindingCard key={finding.id} finding={finding} />
          ))}
        </div>
      </div>

      <div className="mt-8">
        <SectionHeader
          eyebrow="Workflow"
          title="Comparison Workflow Steps"
          body="A safe sequence for comparing source roles, tempo/key, hooks, arrangement, and lineage."
        />
        <div className={gridClass}>
          {state.workflowSteps.map((step) => (
            <WorkflowStepCard key={step.id} step={step} />
          ))}
        </div>
      </div>

      <div className="mt-8">
        <SectionHeader
          eyebrow="Guardrails"
          title="Comparison Safety Rules"
          body="Rules that keep the comparison layer read-only and prevent false lineage or processing claims."
        />
        <div className={gridClass}>
          {state.guardrails.map((guardrail) => (
            <GuardrailCard key={guardrail.id} guardrail={guardrail} />
          ))}
        </div>
      </div>

      <div className="mt-8 rounded-3xl border border-white/10 bg-black p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className={labelClass}>Safety Lock</p>
            <h3 className="mt-2 text-lg font-semibold text-white">Read-Only Comparison Foundation</h3>
          </div>
          <StatusPill label={`${readyGuardrails.length} ready guardrail(s)`} className="border-white/25 text-white" />
        </div>
        <ul className="mt-4 grid gap-2 text-sm text-white/70 md:grid-cols-2 xl:grid-cols-4">
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