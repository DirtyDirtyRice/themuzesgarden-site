"use client";

import { multiTrackArrangementIntelligenceWorkspaceState } from "./MultiTrackArrangementIntelligenceSeed";
import {
  getMultiTrackArrangementEnergyLabel,
  getMultiTrackArrangementEvidenceSourceLabel,
  getMultiTrackArrangementFlowSections,
  getMultiTrackArrangementRoleLabel,
  getMultiTrackArrangementSectionRiskSummary,
  getMultiTrackArrangementSectionTypeLabel,
  getMultiTrackArrangementStatusClass,
  getMultiTrackArrangementStatusLabel,
  getMultiTrackArrangementWorkspaceSummary,
} from "./MultiTrackArrangementIntelligenceHelpers";
import type {
  MultiTrackArrangementChecklistItem,
  MultiTrackArrangementFlow,
  MultiTrackArrangementPattern,
  MultiTrackArrangementSection,
} from "./MultiTrackArrangementIntelligenceTypes";

function ArrangementStatusPill({
  status,
}: {
  status: MultiTrackArrangementChecklistItem["status"];
}) {
  return (
    <span
      className={`rounded-full border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${getMultiTrackArrangementStatusClass(
        status,
      )}`}
    >
      {getMultiTrackArrangementStatusLabel(status)}
    </span>
  );
}

function ArrangementSectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/60">
        {eyebrow}
      </p>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="max-w-4xl text-sm leading-6 text-white/70">
        {description}
      </p>
    </div>
  );
}

function ArrangementMetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-white/65">{detail}</p>
    </div>
  );
}

function ArrangementSectionCard({
  section,
}: {
  section: MultiTrackArrangementSection;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-black p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
            {getMultiTrackArrangementSectionTypeLabel(section.sectionType)}
          </p>
          <h4 className="mt-2 text-base font-semibold text-white">
            {section.label}
          </h4>
          <p className="mt-2 text-sm leading-6 text-white/70">
            {section.notes}
          </p>
        </div>
        <ArrangementStatusPill status={section.readinessStatus} />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
            Time
          </p>
          <p className="mt-2 text-sm text-white/75">
            {section.startLabel} → {section.endLabel}
          </p>
          <p className="mt-1 text-xs text-white/50">{section.durationLabel}</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
            Energy / Role
          </p>
          <p className="mt-2 text-sm text-white/75">
            {getMultiTrackArrangementEnergyLabel(section.energyLevel)} ·{" "}
            {getMultiTrackArrangementRoleLabel(section.role)}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
            Evidence
          </p>
          <p className="mt-2 text-sm text-white/75">
            {getMultiTrackArrangementEvidenceSourceLabel(section.evidenceSource)}
          </p>
          <p className="mt-1 text-xs text-white/50">
            {section.confidenceLabel}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-black p-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
          Risks
        </p>
        <p className="mt-2 text-sm leading-6 text-white/65">
          {getMultiTrackArrangementSectionRiskSummary(section)}
        </p>
      </div>
    </article>
  );
}

function ArrangementFlowCard({
  flow,
  sections,
}: {
  flow: MultiTrackArrangementFlow;
  sections: MultiTrackArrangementSection[];
}) {
  const flowSections = getMultiTrackArrangementFlowSections(flow, sections);

  return (
    <article className="rounded-2xl border border-white/10 bg-black p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h4 className="text-base font-semibold text-white">{flow.title}</h4>
          <p className="mt-2 text-sm leading-6 text-white/70">
            {flow.description}
          </p>
        </div>
        <ArrangementStatusPill status={flow.readinessStatus} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {flowSections.length > 0 ? (
          flowSections.map((section) => (
            <span
              key={section.id}
              className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-white/70"
            >
              {section.label}
            </span>
          ))
        ) : (
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-white/50">
            Future analyzer sections pending
          </span>
        )}
      </div>

      <p className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm leading-6 text-white/65">
        {flow.reviewNote}
      </p>
    </article>
  );
}

function ArrangementPatternCard({
  pattern,
}: {
  pattern: MultiTrackArrangementPattern;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-black p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h4 className="text-base font-semibold text-white">
            {pattern.title}
          </h4>
          <p className="mt-2 text-sm leading-6 text-white/70">
            {pattern.description}
          </p>
        </div>
        <ArrangementStatusPill status={pattern.readinessStatus} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {pattern.sectionTypes.map((sectionType) => (
          <span
            key={sectionType}
            className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-white/70"
          >
            {getMultiTrackArrangementSectionTypeLabel(sectionType)}
          </span>
        ))}
      </div>

      <p className="mt-4 text-sm leading-6 text-white/65">{pattern.useCase}</p>
    </article>
  );
}

function ArrangementChecklistRow({
  item,
}: {
  item: MultiTrackArrangementChecklistItem;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h4 className="text-sm font-semibold text-white">{item.label}</h4>
          <p className="mt-2 text-sm leading-6 text-white/65">{item.detail}</p>
        </div>
        <ArrangementStatusPill status={item.status} />
      </div>
    </div>
  );
}

export function MultiTrackArrangementIntelligenceWorkspacePanel() {
  const workspace = multiTrackArrangementIntelligenceWorkspaceState;
  const readySectionCount = workspace.sections.filter(
    (section) => section.readinessStatus === "ready",
  ).length;
  const reviewSectionCount = workspace.sections.filter(
    (section) => section.readinessStatus === "needs-review",
  ).length;
  const peakSectionCount = workspace.sections.filter(
    (section) => section.energyLevel === "peak",
  ).length;

  return (
    <section className="space-y-6 rounded-3xl border border-white/10 bg-black p-5">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/50">
              Waveform Workstation
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              {workspace.title}
            </h2>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-white/70">
              {workspace.description}
            </p>
            <p className="mt-3 text-sm font-semibold text-white/75">
              {getMultiTrackArrangementWorkspaceSummary(workspace)}
            </p>
          </div>
          <ArrangementStatusPill status={workspace.status} />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <ArrangementMetricCard
          label="Ready Sections"
          value={String(readySectionCount)}
          detail="Arrangement sections safe for read-only display."
        />
        <ArrangementMetricCard
          label="Review Sections"
          value={String(reviewSectionCount)}
          detail="Sections that need stronger boundary confirmation."
        />
        <ArrangementMetricCard
          label="Peak Sections"
          value={String(peakSectionCount)}
          detail="High-energy release points for future comparison."
        />
        <ArrangementMetricCard
          label="Flows"
          value={String(workspace.flows.length)}
          detail="Arrangement paths for review and future hybrid building."
        />
      </div>

      <div className="space-y-4">
        <ArrangementSectionHeader
          eyebrow="Sections"
          title="Arrangement section map"
          description="Read-only section cards for song structure, energy, role, timing, confidence, and review risks."
        />
        <div className="grid gap-4 xl:grid-cols-2">
          {workspace.sections.map((section) => (
            <ArrangementSectionCard key={section.id} section={section} />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <ArrangementSectionHeader
          eyebrow="Flows"
          title="Arrangement flows"
          description="Reusable section paths for classic song review, hybrid building, and future AI analyzer output."
        />
        <div className="grid gap-4 xl:grid-cols-3">
          {workspace.flows.map((flow) => (
            <ArrangementFlowCard
              key={flow.id}
              flow={flow}
              sections={workspace.sections}
            />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <ArrangementSectionHeader
          eyebrow="Patterns"
          title="Arrangement patterns"
          description="Common section relationships that can later support comparison, lineage, and hybrid decisions."
        />
        <div className="grid gap-4 xl:grid-cols-2">
          {workspace.patterns.map((pattern) => (
            <ArrangementPatternCard key={pattern.id} pattern={pattern} />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <ArrangementSectionHeader
          eyebrow="Checklist"
          title="Recovery-safe checklist"
          description="Guardrails for keeping this branch isolated, read-only, and confidence-aware."
        />
        <div className="grid gap-4 md:grid-cols-2">
          {workspace.checklist.map((item) => (
            <ArrangementChecklistRow key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}