"use client";

import {
  buildMultiTrackPromptExportPlanningSentence,
  buildMultiTrackPromptExportSafetySummary,
  buildMultiTrackPromptExportTargetCounts,
  getMultiTrackPromptExportConfidenceClass,
  getMultiTrackPromptExportConfidenceLabel,
  getMultiTrackPromptExportFormatLabel,
  getMultiTrackPromptExportFuturePlans,
  getMultiTrackPromptExportOwnerLabel,
  getMultiTrackPromptExportReadyPlans,
  getMultiTrackPromptExportReviewPlans,
  getMultiTrackPromptExportSourceLabel,
  getMultiTrackPromptExportStatusClass,
  getMultiTrackPromptExportStatusLabel,
  getMultiTrackPromptExportTargetLabel,
  getMultiTrackPromptExportWorkspaceSummary,
} from "./MultiTrackPromptExportIntelligenceHelpers";
import { multiTrackPromptExportWorkspaceState } from "./MultiTrackPromptExportIntelligenceSeed";
import type {
  MultiTrackPromptExportChecklistItem,
  MultiTrackPromptExportGate,
  MultiTrackPromptExportPlan,
  MultiTrackPromptExportPreviewCard,
  MultiTrackPromptExportRiskItem,
} from "./MultiTrackPromptExportIntelligenceTypes";

const panelClass = "rounded-3xl border border-white/10 bg-black p-5 text-white";
const cardClass = "rounded-2xl border border-white/10 bg-black p-4";
const labelClass = "text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60";
const bodyClass = "mt-2 text-sm leading-6 text-white/75";
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

function GateCard({ gate }: { gate: MultiTrackPromptExportGate }) {
  return (
    <article className={cardClass}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className={labelClass}>{getMultiTrackPromptExportSourceLabel(gate.source)}</p>
          <h3 className="mt-1 text-base font-semibold text-white">{gate.label}</h3>
        </div>
        <StatusPill
          label={getMultiTrackPromptExportStatusLabel(gate.status)}
          className={getMultiTrackPromptExportStatusClass(gate.status)}
        />
      </div>

      <p className={bodyClass}>{gate.requirement}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        <StatusPill
          label={getMultiTrackPromptExportConfidenceLabel(gate.confidence)}
          className={getMultiTrackPromptExportConfidenceClass(gate.confidence)}
        />
        <StatusPill
          label={getMultiTrackPromptExportOwnerLabel(gate.owner)}
          className="border-white/15 text-white/70"
        />
      </div>

      <p className="mt-3 text-xs leading-5 text-white/60">{gate.missingBehavior}</p>
    </article>
  );
}

function PlanCard({ plan }: { plan: MultiTrackPromptExportPlan }) {
  return (
    <article className={cardClass}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className={labelClass}>{getMultiTrackPromptExportTargetLabel(plan.target)}</p>
          <h3 className="mt-1 text-base font-semibold text-white">{plan.label}</h3>
        </div>
        <StatusPill
          label={getMultiTrackPromptExportStatusLabel(plan.status)}
          className={getMultiTrackPromptExportStatusClass(plan.status)}
        />
      </div>

      <p className={bodyClass}>{plan.purpose}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        <StatusPill
          label={getMultiTrackPromptExportFormatLabel(plan.format)}
          className="border-white/15 text-white/70"
        />
        <StatusPill
          label={getMultiTrackPromptExportConfidenceLabel(plan.confidence)}
          className={getMultiTrackPromptExportConfidenceClass(plan.confidence)}
        />
        <StatusPill
          label={getMultiTrackPromptExportOwnerLabel(plan.owner)}
          className="border-white/15 text-white/70"
        />
      </div>

      <div className="mt-3 rounded-2xl border border-white/10 p-3">
        <p className={labelClass}>Allowed Sources</p>
        <p className="mt-2 text-xs leading-5 text-white/60">
          {plan.allowedSources.map(getMultiTrackPromptExportSourceLabel).join(", ")}
        </p>
      </div>

      <p className="mt-3 text-xs leading-5 text-white/60">{plan.exportRule}</p>
      <p className="mt-2 text-xs leading-5 text-white/50">Blocked until: {plan.blockedUntil}</p>
    </article>
  );
}

function RiskCard({ risk }: { risk: MultiTrackPromptExportRiskItem }) {
  return (
    <article className={cardClass}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className={labelClass}>{risk.risk}</p>
          <h3 className="mt-1 text-base font-semibold text-white">{risk.label}</h3>
        </div>
        <StatusPill
          label={getMultiTrackPromptExportStatusLabel(risk.status)}
          className={getMultiTrackPromptExportStatusClass(risk.status)}
        />
      </div>

      <p className={bodyClass}>{risk.detail}</p>
      <p className="mt-3 text-xs leading-5 text-white/60">{risk.preventionRule}</p>
      <p className="mt-3 text-xs uppercase tracking-[0.18em] text-white/50">
        Owner: {getMultiTrackPromptExportOwnerLabel(risk.owner)}
      </p>
    </article>
  );
}

function ChecklistCard({ item }: { item: MultiTrackPromptExportChecklistItem }) {
  return (
    <article className={cardClass}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-white">{item.label}</h3>
        <StatusPill
          label={getMultiTrackPromptExportStatusLabel(item.status)}
          className={getMultiTrackPromptExportStatusClass(item.status)}
        />
      </div>

      <p className={bodyClass}>{item.detail}</p>
      <p className="mt-3 text-xs uppercase tracking-[0.18em] text-white/50">
        Owner: {getMultiTrackPromptExportOwnerLabel(item.owner)}
      </p>
    </article>
  );
}

function PreviewCard({ card }: { card: MultiTrackPromptExportPreviewCard }) {
  return (
    <article className={cardClass}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className={labelClass}>{getMultiTrackPromptExportTargetLabel(card.target)}</p>
          <h3 className="mt-1 text-base font-semibold text-white">{card.label}</h3>
        </div>
        <StatusPill
          label={getMultiTrackPromptExportStatusLabel(card.status)}
          className={getMultiTrackPromptExportStatusClass(card.status)}
        />
      </div>

      <p className={bodyClass}>{card.summary}</p>

      <div className="mt-3 rounded-2xl border border-white/10 p-3">
        <p className={labelClass}>{getMultiTrackPromptExportFormatLabel(card.format)}</p>
        <p className="mt-2 text-sm leading-6 text-white/65">{card.safeOutputExample}</p>
      </div>
    </article>
  );
}

export default function MultiTrackPromptExportIntelligenceWorkspacePanel() {
  const state = multiTrackPromptExportWorkspaceState;
  const summary = getMultiTrackPromptExportWorkspaceSummary(state);
  const targetCounts = buildMultiTrackPromptExportTargetCounts(state.plans);
  const readyPlans = getMultiTrackPromptExportReadyPlans(state.plans);
  const reviewPlans = getMultiTrackPromptExportReviewPlans(state.plans);
  const futurePlans = getMultiTrackPromptExportFuturePlans(state.plans);
  const safetySummary = buildMultiTrackPromptExportSafetySummary();

  return (
    <section className={panelClass}>
      <SectionHeader
        eyebrow="#15 Waveform Branch"
        title={state.title}
        body={state.description}
      />

      <div className={gridClass}>
        <SummaryCard
          label="Readiness"
          value={`${summary.ready}/${summary.total}`}
          detail={buildMultiTrackPromptExportPlanningSentence(state)}
        />
        <SummaryCard
          label="Export Plans"
          value={`${state.plans.length}`}
          detail="Targets for Suno, notes, manual copy, training, builder instructions, and future APIs."
        />
        <SummaryCard
          label="Review Plans"
          value={`${reviewPlans.length}`}
          detail="Plans that require manual or user review before export."
        />
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Ready Plans" value={`${readyPlans.length}`} detail="Currently safe as read-only display." />
        <SummaryCard label="Future Plans" value={`${futurePlans.length}`} detail="Reserved for future exporter or builder wiring." />
        <SummaryCard label="Suno" value={`${targetCounts.suno}`} detail="Prompt export planning for Suno." />
        <SummaryCard label="Manual Copy" value={`${targetCounts.manualCopy}`} detail="User-controlled copy workflow." />
      </div>

      <div className="mt-8">
        <SectionHeader
          eyebrow="Gates"
          title="Prompt Export Gates"
          body="Input gates that prevent missing track facts, confidence gaps, and future-only data from becoming exported truth."
        />
        <div className={gridClass}>
          {state.gates.map((gate) => (
            <GateCard key={gate.id} gate={gate} />
          ))}
        </div>
      </div>

      <div className="mt-8">
        <SectionHeader
          eyebrow="Plans"
          title="Prompt Export Plans"
          body="Read-only export plan cards for safe future routing to Suno, notes, hybrid builder, training, manual copy, and export APIs."
        />
        <div className={gridClass}>
          {state.plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      </div>

      <div className="mt-8">
        <SectionHeader
          eyebrow="Risks"
          title="Prompt Export Risks"
          body="Risk rules that stop invented BPM, invented key, false lineage, false stems, unsafe builder commands, and unreviewed AI output."
        />
        <div className={gridClass}>
          {state.risks.map((risk) => (
            <RiskCard key={risk.id} risk={risk} />
          ))}
        </div>
      </div>

      <div className="mt-8">
        <SectionHeader
          eyebrow="Checklist"
          title="Export Safety Checklist"
          body="Family-level checks for imports, read-only behavior, user approval, and blocked future API work."
        />
        <div className={gridClass}>
          {state.checklist.map((item) => (
            <ChecklistCard key={item.id} item={item} />
          ))}
        </div>
      </div>

      <div className="mt-8">
        <SectionHeader
          eyebrow="Preview"
          title="Safe Export Preview Cards"
          body="Preview examples are display-only. They show safe wording patterns without sending anything anywhere."
        />
        <div className={gridClass}>
          {state.previewCards.map((card) => (
            <PreviewCard key={card.id} card={card} />
          ))}
        </div>
      </div>

      <div className="mt-8 rounded-3xl border border-white/10 bg-black p-4">
        <p className={labelClass}>Safety Lock</p>
        <h3 className="mt-2 text-lg font-semibold text-white">
          Read-Only Prompt Export Foundation
        </h3>
        <ul className="mt-4 grid gap-2 text-sm text-white/70 md:grid-cols-2 xl:grid-cols-3">
          {safetySummary.map((item) => (
            <li key={item} className="rounded-2xl border border-white/10 p-3">
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}