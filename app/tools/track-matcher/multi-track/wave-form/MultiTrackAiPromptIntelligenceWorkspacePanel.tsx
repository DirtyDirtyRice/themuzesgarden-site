"use client";

import { multiTrackAiPromptWorkspaceState } from "./MultiTrackAiPromptIntelligenceSeed";
import type {
  MultiTrackAiPromptGuardrail,
  MultiTrackAiPromptInputRequirement,
  MultiTrackAiPromptOutputTarget,
  MultiTrackAiPromptTemplate,
  MultiTrackAiPromptWorkflowStep,
} from "./MultiTrackAiPromptWorkspaceTypes";

const panelClass = "rounded-3xl border border-white/10 bg-black p-5 text-white";
const cardClass = "rounded-2xl border border-white/10 bg-black p-4";
const labelClass = "text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60";
const bodyClass = "mt-2 text-sm leading-6 text-white/75";
const gridClass = "mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3";

function getMultiTrackAiPromptStatusLabel(status: string): string {
  if (status === "ready") return "Ready";
  if (status === "needs-review") return "Needs Review";
  if (status === "blocked") return "Blocked";
  return "Future";
}

function getMultiTrackAiPromptConfidenceLabel(confidence: string): string {
  if (confidence === "high") return "High";
  if (confidence === "medium") return "Medium";
  if (confidence === "low") return "Low";
  return "Manual Required";
}

function getMultiTrackAiPromptStatusClass(status: string): string {
  if (status === "ready") return "border-white/30 text-white";
  if (status === "needs-review") return "border-white/20 text-white/80";
  if (status === "blocked") return "border-white/15 text-white/60";
  return "border-white/10 text-white/50";
}

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

function TemplateCard({ template }: { template: MultiTrackAiPromptTemplate }) {
  return (
    <article className={cardClass}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className={labelClass}>{template.category}</p>
          <h3 className="mt-1 text-base font-semibold text-white">{template.label}</h3>
        </div>
        <StatusPill
          label={getMultiTrackAiPromptStatusLabel(template.status)}
          className={getMultiTrackAiPromptStatusClass(template.status)}
        />
      </div>

      <p className={bodyClass}>{template.purpose}</p>

      <div className="mt-3 rounded-2xl border border-white/10 p-3">
        <p className={labelClass}>Template</p>
        <p className="mt-2 text-sm leading-6 text-white/65">{template.templateText}</p>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <StatusPill label={template.actionType} className="border-white/15 text-white/70" />
        <StatusPill
          label={getMultiTrackAiPromptConfidenceLabel(template.confidence)}
          className="border-white/15 text-white/70"
        />
        <StatusPill label={template.owner} className="border-white/15 text-white/70" />
      </div>

      <div className="mt-3 rounded-2xl border border-white/10 p-3">
        <p className={labelClass}>Required Inputs</p>
        <p className="mt-2 text-xs leading-5 text-white/60">
          {template.requiredInputs.join(", ")}
        </p>
      </div>

      <p className="mt-3 text-xs leading-5 text-white/60">{template.userRule}</p>
    </article>
  );
}

function InputRequirementCard({
  input,
}: {
  input: MultiTrackAiPromptInputRequirement;
}) {
  return (
    <article className={cardClass}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className={labelClass}>{input.inputSource}</p>
          <h3 className="mt-1 text-base font-semibold text-white">{input.label}</h3>
        </div>
        <StatusPill
          label={getMultiTrackAiPromptStatusLabel(input.status)}
          className={getMultiTrackAiPromptStatusClass(input.status)}
        />
      </div>

      <p className={bodyClass}>{input.detail}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        <StatusPill
          label={getMultiTrackAiPromptConfidenceLabel(input.confidence)}
          className="border-white/15 text-white/70"
        />
      </div>

      <p className="mt-3 text-xs leading-5 text-white/60">{input.missingBehavior}</p>
    </article>
  );
}

function OutputTargetCard({
  output,
}: {
  output: MultiTrackAiPromptOutputTarget;
}) {
  return (
    <article className={cardClass}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className={labelClass}>{output.category}</p>
          <h3 className="mt-1 text-base font-semibold text-white">{output.label}</h3>
        </div>
        <StatusPill
          label={getMultiTrackAiPromptStatusLabel(output.status)}
          className={getMultiTrackAiPromptStatusClass(output.status)}
        />
      </div>

      <p className={bodyClass}>{output.outputPurpose}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        <StatusPill label={output.owner} className="border-white/15 text-white/70" />
      </div>

      <p className="mt-3 text-xs leading-5 text-white/60">{output.safetyNote}</p>
    </article>
  );
}

function GuardrailCard({ guardrail }: { guardrail: MultiTrackAiPromptGuardrail }) {
  return (
    <article className={cardClass}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-white">{guardrail.label}</h3>
        <StatusPill
          label={getMultiTrackAiPromptStatusLabel(guardrail.status)}
          className={getMultiTrackAiPromptStatusClass(guardrail.status)}
        />
      </div>

      <p className={bodyClass}>{guardrail.rule}</p>
      <p className="mt-3 text-xs uppercase tracking-[0.18em] text-white/50">
        Owner: {guardrail.owner}
      </p>
    </article>
  );
}

function WorkflowStepCard({ step }: { step: MultiTrackAiPromptWorkflowStep }) {
  return (
    <article className={cardClass}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-white">{step.label}</h3>
        <StatusPill
          label={getMultiTrackAiPromptStatusLabel(step.status)}
          className={getMultiTrackAiPromptStatusClass(step.status)}
        />
      </div>

      <p className={bodyClass}>{step.purpose}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        <StatusPill label={step.owner} className="border-white/15 text-white/70" />
      </div>

      <p className="mt-3 text-xs leading-5 text-white/60">
        Blocked until: {step.blockedUntil}
      </p>
    </article>
  );
}

function countAiPromptStatus(status: string): number {
  const state = multiTrackAiPromptWorkspaceState;

  return [
    ...state.templates,
    ...state.inputRequirements,
    ...state.outputTargets,
    ...state.guardrails,
    ...state.workflowSteps,
  ].filter((item) => item.status === status).length;
}

export default function MultiTrackAiPromptIntelligenceWorkspacePanel() {
  const state = multiTrackAiPromptWorkspaceState;
  const readyCount = countAiPromptStatus("ready");
  const reviewCount = countAiPromptStatus("needs-review");
  const blockedCount = countAiPromptStatus("blocked");
  const futureCount = countAiPromptStatus("future");

  return (
    <section className={panelClass}>
      <SectionHeader
        eyebrow="#14 Waveform Branch"
        title={state.title}
        body={state.description}
      />

      <div className={gridClass}>
        <SummaryCard
          label="Templates"
          value={`${state.templates.length}`}
          detail="Prompt templates for description, comparison, hybrid planning, arrangement, stem notes, hooks, training, safety, and export."
        />
        <SummaryCard
          label="Input Requirements"
          value={`${state.inputRequirements.length}`}
          detail="Input gates that prevent the system from inventing missing track facts."
        />
        <SummaryCard
          label="Output Targets"
          value={`${state.outputTargets.length}`}
          detail="Future destinations for safe prompt output after review."
        />
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Ready" value={`${readyCount}`} detail="Available read-only prompt planning items." />
        <SummaryCard label="Needs Review" value={`${reviewCount}`} detail="Items that require user or manual review." />
        <SummaryCard label="Blocked" value={`${blockedCount}`} detail="Items blocked until another layer exists." />
        <SummaryCard label="Future" value={`${futureCount}`} detail="Reserved for future AI, analyzer, export, or builder layers." />
      </div>

      <div className="mt-8">
        <SectionHeader
          eyebrow="Templates"
          title="AI Prompt Templates"
          body="Read-only prompt templates that separate confirmed facts, suggestions, questions, and safety warnings."
        />
        <div className={gridClass}>
          {state.templates.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      </div>

      <div className="mt-8">
        <SectionHeader
          eyebrow="Inputs"
          title="Prompt Input Requirements"
          body="Required inputs for safe prompt generation, including tracks, comparison context, confidence gates, hybrid plans, training notes, user notes, and future analysis."
        />
        <div className={gridClass}>
          {state.inputRequirements.map((input) => (
            <InputRequirementCard key={input.id} input={input} />
          ))}
        </div>
      </div>

      <div className="mt-8">
        <SectionHeader
          eyebrow="Outputs"
          title="Prompt Output Targets"
          body="Future output targets for Suno prompts, hybrid builder notes, arrangement notes, comparison questions, training questions, and safety warnings."
        />
        <div className={gridClass}>
          {state.outputTargets.map((output) => (
            <OutputTargetCard key={output.id} output={output} />
          ))}
        </div>
      </div>

      <div className="mt-8">
        <SectionHeader
          eyebrow="Guardrails"
          title="AI Prompt Guardrails"
          body="Rules that prevent invented BPM, invented key, false lineage, false stem labels, unsafe builder commands, and user-meaning override."
        />
        <div className={gridClass}>
          {state.guardrails.map((guardrail) => (
            <GuardrailCard key={guardrail.id} guardrail={guardrail} />
          ))}
        </div>
      </div>

      <div className="mt-8">
        <SectionHeader
          eyebrow="Workflow"
          title="AI Prompt Workflow Steps"
          body="Safe prompt workflow from user notes to confidence checks, draft building, user approval, and future export."
        />
        <div className={gridClass}>
          {state.workflowSteps.map((step) => (
            <WorkflowStepCard key={step.id} step={step} />
          ))}
        </div>
      </div>

      <div className="mt-8 rounded-3xl border border-white/10 bg-black p-4">
        <p className={labelClass}>Safety Lock</p>
        <h3 className="mt-2 text-lg font-semibold text-white">
          Read-Only AI Prompt Foundation
        </h3>
        <p className={bodyClass}>
          This panel does not generate prompts, call AI, write to Supabase, change audio, or approve musical meaning.
          It only displays the future-safe prompt planning structure.
        </p>
      </div>
    </section>
  );
}