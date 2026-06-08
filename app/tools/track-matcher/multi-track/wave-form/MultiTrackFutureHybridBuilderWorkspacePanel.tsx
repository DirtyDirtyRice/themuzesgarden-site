"use client";

import { multiTrackFutureHybridBuilderWorkspaceState } from "./MultiTrackFutureHybridBuilderSeed";
import {
  getMultiTrackFutureHybridBuilderEvidenceSummary,
  getMultiTrackFutureHybridBuilderEvidenceSourceLabel,
  getMultiTrackFutureHybridBuilderLaneCandidates,
  getMultiTrackFutureHybridBuilderLaneRecipeSteps,
  getMultiTrackFutureHybridBuilderOutputTargetLabel,
  getMultiTrackFutureHybridBuilderOutputTargetSummary,
  getMultiTrackFutureHybridBuilderRecipeStepCandidates,
  getMultiTrackFutureHybridBuilderRecipeTypeLabel,
  getMultiTrackFutureHybridBuilderRiskSummary,
  getMultiTrackFutureHybridBuilderSourceRoleLabel,
  getMultiTrackFutureHybridBuilderStatusClass,
  getMultiTrackFutureHybridBuilderStatusLabel,
  getMultiTrackFutureHybridBuilderWorkspaceSummary,
} from "./MultiTrackFutureHybridBuilderHelpers";
import type {
  MultiTrackFutureHybridBuilderCandidate,
  MultiTrackFutureHybridBuilderChecklistItem,
  MultiTrackFutureHybridBuilderLane,
  MultiTrackFutureHybridBuilderRecipeStep,
} from "./MultiTrackFutureHybridBuilderTypes";

function FutureHybridStatusPill({
  status,
}: {
  status: MultiTrackFutureHybridBuilderChecklistItem["status"];
}) {
  return (
    <span
      className={`rounded-full border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${getMultiTrackFutureHybridBuilderStatusClass(
        status,
      )}`}
    >
      {getMultiTrackFutureHybridBuilderStatusLabel(status)}
    </span>
  );
}

function FutureHybridBlockHeader({
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

function FutureHybridMetricCard({
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

function FutureHybridCandidateCard({
  candidate,
}: {
  candidate: MultiTrackFutureHybridBuilderCandidate;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-black p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
            {getMultiTrackFutureHybridBuilderSourceRoleLabel(
              candidate.sourceRole,
            )}
          </p>
          <h4 className="mt-2 text-base font-semibold text-white">
            {candidate.title}
          </h4>
          <p className="mt-2 text-sm leading-6 text-white/70">
            {candidate.summary}
          </p>
        </div>
        <FutureHybridStatusPill status={candidate.readinessStatus} />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
            Strength
          </p>
          <p className="mt-2 text-sm text-white/75">
            {candidate.strengthLabel}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
            Evidence
          </p>
          <p className="mt-2 text-sm text-white/75">
            {getMultiTrackFutureHybridBuilderEvidenceSourceLabel(
              candidate.evidenceSource,
            )}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
            Risks
          </p>
          <p className="mt-2 text-sm text-white/75">
            {getMultiTrackFutureHybridBuilderRiskSummary(candidate.risks)}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
          Usable For
        </p>
        <p className="mt-2 text-sm leading-6 text-white/70">
          {getMultiTrackFutureHybridBuilderOutputTargetSummary(
            candidate.usableFor,
          )}
        </p>
      </div>
    </article>
  );
}

function FutureHybridRecipeStepCard({
  recipeStep,
  candidates,
}: {
  recipeStep: MultiTrackFutureHybridBuilderRecipeStep;
  candidates: MultiTrackFutureHybridBuilderCandidate[];
}) {
  const stepCandidates = getMultiTrackFutureHybridBuilderRecipeStepCandidates(
    recipeStep,
    candidates,
  );

  return (
    <article className="rounded-2xl border border-white/10 bg-black p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
            Step {recipeStep.orderLabel} ·{" "}
            {getMultiTrackFutureHybridBuilderRecipeTypeLabel(
              recipeStep.recipeType,
            )}
          </p>
          <h4 className="mt-2 text-base font-semibold text-white">
            {recipeStep.title}
          </h4>
          <p className="mt-2 text-sm leading-6 text-white/70">
            {recipeStep.instruction}
          </p>
        </div>
        <FutureHybridStatusPill status={recipeStep.readinessStatus} />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
            Candidates
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {stepCandidates.map((candidate) => (
              <span
                key={candidate.id}
                className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-white/70"
              >
                {candidate.title}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
            Evidence
          </p>
          <p className="mt-2 text-sm leading-6 text-white/70">
            {getMultiTrackFutureHybridBuilderEvidenceSummary(
              recipeStep.evidenceSources,
            )}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-black p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
            Review Note
          </p>
          <p className="mt-2 text-sm leading-6 text-white/65">
            {recipeStep.reviewNote}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-black p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
            Risks
          </p>
          <p className="mt-2 text-sm leading-6 text-white/65">
            {getMultiTrackFutureHybridBuilderRiskSummary(recipeStep.risks)}
          </p>
        </div>
      </div>
    </article>
  );
}

function FutureHybridLaneCard({
  lane,
  candidates,
  recipeSteps,
}: {
  lane: MultiTrackFutureHybridBuilderLane;
  candidates: MultiTrackFutureHybridBuilderCandidate[];
  recipeSteps: MultiTrackFutureHybridBuilderRecipeStep[];
}) {
  const laneCandidates = getMultiTrackFutureHybridBuilderLaneCandidates(
    lane,
    candidates,
  );
  const laneRecipeSteps = getMultiTrackFutureHybridBuilderLaneRecipeSteps(
    lane,
    recipeSteps,
  );

  return (
    <article className="rounded-2xl border border-white/10 bg-black p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
            {getMultiTrackFutureHybridBuilderOutputTargetLabel(
              lane.outputTarget,
            )}
          </p>
          <h4 className="mt-2 text-base font-semibold text-white">
            {lane.title}
          </h4>
          <p className="mt-2 text-sm leading-6 text-white/70">
            {lane.description}
          </p>
        </div>
        <FutureHybridStatusPill status={lane.status} />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
            Lane Candidates
          </p>
          <div className="mt-3 space-y-2">
            {laneCandidates.map((candidate) => (
              <p key={candidate.id} className="text-sm text-white/75">
                {candidate.title}
              </p>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
            Recipe Steps
          </p>
          <div className="mt-3 space-y-2">
            {laneRecipeSteps.map((recipeStep) => (
              <p key={recipeStep.id} className="text-sm text-white/75">
                {recipeStep.orderLabel}. {recipeStep.title}
              </p>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-4 rounded-xl border border-white/10 bg-black p-3 text-sm leading-6 text-white/65">
        {lane.reviewGoal}
      </p>
    </article>
  );
}

function FutureHybridChecklistRow({
  item,
}: {
  item: MultiTrackFutureHybridBuilderChecklistItem;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h4 className="text-sm font-semibold text-white">{item.label}</h4>
          <p className="mt-2 text-sm leading-6 text-white/65">{item.detail}</p>
        </div>
        <FutureHybridStatusPill status={item.status} />
      </div>
    </div>
  );
}

export function MultiTrackFutureHybridBuilderWorkspacePanel() {
  const workspace = multiTrackFutureHybridBuilderWorkspaceState;
  const readyCandidateCount = workspace.candidates.filter(
    (candidate) => candidate.readinessStatus === "ready",
  ).length;
  const reviewCandidateCount = workspace.candidates.filter(
    (candidate) => candidate.readinessStatus === "needs-review",
  ).length;
  const readyRecipeStepCount = workspace.recipeSteps.filter(
    (recipeStep) => recipeStep.readinessStatus === "ready",
  ).length;
  const futureLaneCount = workspace.lanes.filter(
    (lane) => lane.status === "future",
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
              {getMultiTrackFutureHybridBuilderWorkspaceSummary(workspace)}
            </p>
          </div>
          <FutureHybridStatusPill status={workspace.status} />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <FutureHybridMetricCard
          label="Ready Candidates"
          value={String(readyCandidateCount)}
          detail="Source candidates safe for read-only hybrid planning."
        />
        <FutureHybridMetricCard
          label="Review Candidates"
          value={String(reviewCandidateCount)}
          detail="Candidates that need stronger evidence before creative use."
        />
        <FutureHybridMetricCard
          label="Ready Steps"
          value={String(readyRecipeStepCount)}
          detail="Recipe steps safe for planning notes."
        />
        <FutureHybridMetricCard
          label="Future Lanes"
          value={String(futureLaneCount)}
          detail="Reserved lanes for future render or AI output."
        />
      </div>

      <div className="space-y-4">
        <FutureHybridBlockHeader
          eyebrow="Candidates"
          title="Hybrid source candidates"
          description="Read-only candidates from Track A, Track B, sections, stems, arrangement, lineage, prompts, and future render targets."
        />
        <div className="grid gap-4 xl:grid-cols-2">
          {workspace.candidates.map((candidate) => (
            <FutureHybridCandidateCard
              key={candidate.id}
              candidate={candidate}
            />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <FutureHybridBlockHeader
          eyebrow="Recipe"
          title="Future hybrid recipe steps"
          description="Planning steps for compatibility review, section anchor, stem layers, tempo/key plan, arrangement remap, prompt plan, and future render."
        />
        <div className="grid gap-4 xl:grid-cols-2">
          {workspace.recipeSteps.map((recipeStep) => (
            <FutureHybridRecipeStepCard
              key={recipeStep.id}
              recipeStep={recipeStep}
              candidates={workspace.candidates}
            />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <FutureHybridBlockHeader
          eyebrow="Lanes"
          title="Hybrid builder lanes"
          description="Grouped planning lanes for review notes, arrangement planning, stem/mix planning, Suno prompt planning, and future render workflows."
        />
        <div className="grid gap-4 xl:grid-cols-2">
          {workspace.lanes.map((lane) => (
            <FutureHybridLaneCard
              key={lane.id}
              lane={lane}
              candidates={workspace.candidates}
              recipeSteps={workspace.recipeSteps}
            />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <FutureHybridBlockHeader
          eyebrow="Checklist"
          title="Recovery-safe checklist"
          description="Guardrails for keeping this final roadmap branch read-only, compatibility-first, and future-render isolated."
        />
        <div className="grid gap-4 md:grid-cols-2">
          {workspace.checklist.map((item) => (
            <FutureHybridChecklistRow key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}