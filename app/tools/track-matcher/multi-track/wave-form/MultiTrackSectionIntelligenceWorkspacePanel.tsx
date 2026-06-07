"use client";

import { multiTrackSectionIntelligenceWorkspaceState } from "./MultiTrackSectionIntelligenceSeed";
import {
  getMultiTrackSectionBehaviorLabel,
  getMultiTrackSectionEnergyShapeLabel,
  getMultiTrackSectionEvidenceSourceLabel,
  getMultiTrackSectionReadyTransitionCount,
  getMultiTrackSectionReviewGroupSections,
  getMultiTrackSectionReviewGroupTransitions,
  getMultiTrackSectionRiskSummary,
  getMultiTrackSectionRoleLabel,
  getMultiTrackSectionStatusClass,
  getMultiTrackSectionStatusLabel,
  getMultiTrackSectionTransitionLabel,
  getMultiTrackSectionTransitionTypeLabel,
  getMultiTrackSectionWorkspaceSummary,
} from "./MultiTrackSectionIntelligenceHelpers";
import type {
  MultiTrackSectionChecklistItem,
  MultiTrackSectionReviewGroup,
  MultiTrackSectionTransition,
  MultiTrackSectionUnit,
} from "./MultiTrackSectionIntelligenceTypes";

function SectionStatusPill({
  status,
}: {
  status: MultiTrackSectionChecklistItem["status"];
}) {
  return (
    <span
      className={`rounded-full border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${getMultiTrackSectionStatusClass(
        status,
      )}`}
    >
      {getMultiTrackSectionStatusLabel(status)}
    </span>
  );
}

function SectionBlockHeader({
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

function SectionMetricCard({
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

function SectionUnitCard({ section }: { section: MultiTrackSectionUnit }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-black p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
            {getMultiTrackSectionRoleLabel(section.role)}
          </p>
          <h4 className="mt-2 text-base font-semibold text-white">
            {section.label}
          </h4>
          <p className="mt-2 text-sm leading-6 text-white/70">
            {section.summary}
          </p>
        </div>
        <SectionStatusPill status={section.readinessStatus} />
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
            Behavior
          </p>
          <p className="mt-2 text-sm text-white/75">
            {getMultiTrackSectionBehaviorLabel(section.behavior)}
          </p>
          <p className="mt-1 text-xs text-white/50">
            {getMultiTrackSectionEnergyShapeLabel(section.energyShape)}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
            Evidence
          </p>
          <p className="mt-2 text-sm text-white/75">
            {getMultiTrackSectionEvidenceSourceLabel(section.evidenceSource)}
          </p>
          <p className="mt-1 text-xs text-white/50">
            {section.confidenceLabel}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
            Transition In / Out
          </p>
          <p className="mt-2 text-sm text-white/75">
            {getMultiTrackSectionTransitionTypeLabel(section.transitionIn)} →{" "}
            {getMultiTrackSectionTransitionTypeLabel(section.transitionOut)}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
            Risks
          </p>
          <p className="mt-2 text-sm leading-6 text-white/70">
            {getMultiTrackSectionRiskSummary(section.risks)}
          </p>
        </div>
      </div>

      <p className="mt-4 rounded-xl border border-white/10 bg-black p-3 text-sm leading-6 text-white/65">
        {section.reviewNote}
      </p>
    </article>
  );
}

function SectionTransitionCard({
  transition,
  sections,
}: {
  transition: MultiTrackSectionTransition;
  sections: MultiTrackSectionUnit[];
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-black p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
            {getMultiTrackSectionTransitionTypeLabel(
              transition.transitionType,
            )}
          </p>
          <h4 className="mt-2 text-base font-semibold text-white">
            {getMultiTrackSectionTransitionLabel(transition, sections)}
          </h4>
          <p className="mt-2 text-sm leading-6 text-white/70">
            {transition.description}
          </p>
        </div>
        <SectionStatusPill status={transition.readinessStatus} />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
            Evidence
          </p>
          <p className="mt-2 text-sm text-white/75">
            {getMultiTrackSectionEvidenceSourceLabel(
              transition.evidenceSource,
            )}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
            Confidence
          </p>
          <p className="mt-2 text-sm text-white/75">
            {transition.confidenceLabel}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
            Risks
          </p>
          <p className="mt-2 text-sm text-white/75">
            {getMultiTrackSectionRiskSummary(transition.risks)}
          </p>
        </div>
      </div>
    </article>
  );
}

function SectionReviewGroupCard({
  group,
  sections,
  transitions,
}: {
  group: MultiTrackSectionReviewGroup;
  sections: MultiTrackSectionUnit[];
  transitions: MultiTrackSectionTransition[];
}) {
  const groupSections = getMultiTrackSectionReviewGroupSections(group, sections);
  const groupTransitions = getMultiTrackSectionReviewGroupTransitions(
    group,
    transitions,
  );

  return (
    <article className="rounded-2xl border border-white/10 bg-black p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h4 className="text-base font-semibold text-white">{group.title}</h4>
          <p className="mt-2 text-sm leading-6 text-white/70">
            {group.description}
          </p>
        </div>
        <SectionStatusPill status={group.status} />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
            Sections
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {groupSections.map((section) => (
              <span
                key={section.id}
                className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-white/70"
              >
                {section.label}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
            Transitions
          </p>
          <div className="mt-3 space-y-2">
            {groupTransitions.length > 0 ? (
              groupTransitions.map((transition) => (
                <p key={transition.id} className="text-sm text-white/70">
                  {getMultiTrackSectionTransitionLabel(transition, sections)}
                </p>
              ))
            ) : (
              <p className="text-sm text-white/50">
                Future analyzer transitions pending.
              </p>
            )}
          </div>
        </div>
      </div>

      <p className="mt-4 rounded-xl border border-white/10 bg-black p-3 text-sm leading-6 text-white/65">
        {group.reviewGoal}
      </p>
    </article>
  );
}

function SectionChecklistRow({
  item,
}: {
  item: MultiTrackSectionChecklistItem;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h4 className="text-sm font-semibold text-white">{item.label}</h4>
          <p className="mt-2 text-sm leading-6 text-white/65">{item.detail}</p>
        </div>
        <SectionStatusPill status={item.status} />
      </div>
    </div>
  );
}

export function MultiTrackSectionIntelligenceWorkspacePanel() {
  const workspace = multiTrackSectionIntelligenceWorkspaceState;
  const readySectionCount = workspace.sections.filter(
    (section) => section.readinessStatus === "ready",
  ).length;
  const reviewSectionCount = workspace.sections.filter(
    (section) => section.readinessStatus === "needs-review",
  ).length;
  const peakSectionCount = workspace.sections.filter(
    (section) => section.energyShape === "peak",
  ).length;
  const readyTransitionCount = getMultiTrackSectionReadyTransitionCount(
    workspace.transitions,
  );

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
              {getMultiTrackSectionWorkspaceSummary(workspace)}
            </p>
          </div>
          <SectionStatusPill status={workspace.status} />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SectionMetricCard
          label="Ready Sections"
          value={String(readySectionCount)}
          detail="Section cards safe for read-only display."
        />
        <SectionMetricCard
          label="Review Sections"
          value={String(reviewSectionCount)}
          detail="Sections that need stronger boundary or role evidence."
        />
        <SectionMetricCard
          label="Peak Sections"
          value={String(peakSectionCount)}
          detail="High-energy hook or release sections."
        />
        <SectionMetricCard
          label="Ready Transitions"
          value={String(readyTransitionCount)}
          detail="Transition links safe for review."
        />
      </div>

      <div className="space-y-4">
        <SectionBlockHeader
          eyebrow="Sections"
          title="Section behavior map"
          description="Read-only section cards for role, behavior, energy shape, timing, evidence, confidence, and transition readiness."
        />
        <div className="grid gap-4 xl:grid-cols-2">
          {workspace.sections.map((section) => (
            <SectionUnitCard key={section.id} section={section} />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <SectionBlockHeader
          eyebrow="Transitions"
          title="Section transitions"
          description="Handoffs between song sections, including pickup, fill, drop, fade, clean-cut, and stop behavior."
        />
        <div className="grid gap-4 xl:grid-cols-2">
          {workspace.transitions.map((transition) => (
            <SectionTransitionCard
              key={transition.id}
              transition={transition}
              sections={workspace.sections}
            />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <SectionBlockHeader
          eyebrow="Review Groups"
          title="Section review groups"
          description="Grouped review lanes for hooks, energy shape, transitions, and future analyzer section maps."
        />
        <div className="grid gap-4 xl:grid-cols-2">
          {workspace.reviewGroups.map((group) => (
            <SectionReviewGroupCard
              key={group.id}
              group={group}
              sections={workspace.sections}
              transitions={workspace.transitions}
            />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <SectionBlockHeader
          eyebrow="Checklist"
          title="Recovery-safe checklist"
          description="Guardrails for keeping this branch separate from arrangement flow and confidence-gated."
        />
        <div className="grid gap-4 md:grid-cols-2">
          {workspace.checklist.map((item) => (
            <SectionChecklistRow key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}