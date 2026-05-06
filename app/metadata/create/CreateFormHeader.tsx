import {
  getStepProgressLabel,
  STEP_HELP,
  STEP_LABELS,
  STEP_REQUIREMENT_COPY,
} from "./createFormStepSystem";
import type { FormStep } from "./createFormStepSystem";
import type { StepStatus } from "./createFormValidation";

export default function CreateFormHeader({
  step,
  status,
}: {
  step: FormStep;
  status: StepStatus;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-white/45">
          Guided Builder
        </p>

        <h2 className="mt-1 text-2xl font-semibold text-white">
          Create Record Step-by-Step
        </h2>

        <p className="mt-2 text-sm text-white/65">
          * = required. Press Next when the current required step is complete.
        </p>
      </div>

      <section
        data-step-complete={status.complete}
        className="rounded-2xl border border-white/10 bg-black/30 p-4"
      >
        <p className="text-sm text-white/60">{getStepProgressLabel(step)}</p>

        <h3 className="mt-1 text-lg font-semibold text-white">
          {STEP_LABELS[step]}
        </h3>

        <p className="mt-2 text-sm leading-6 text-white/65">
          {STEP_HELP[step]}
        </p>

        <p className="mt-2 text-xs leading-5 text-white/50">
          {STEP_REQUIREMENT_COPY[step]}
        </p>
      </section>
    </div>
  );
}