import type { FormStep } from "./createFormStepSystem";
import {
  getForwardButtonText,
  getPrevStep,
  isRequiredStep,
} from "./createFormStepSystem";
import { formatMissingItems } from "./createFormValidation";
import type { StepStatus } from "./createFormValidation";

export default function CreateFormNavigation({
  step,
  status,
  onBack,
  onNext,
}: {
  step: FormStep;
  status: StepStatus;
  onBack: () => void;
  onNext: () => void;
}) {
  const prevStep = getPrevStep(step);
  const isBlocked = isRequiredStep(step) && !status.complete;

  return (
    <div className="mt-6 flex flex-col gap-3">
      <NextReadinessMessage step={step} status={status} />

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          disabled={!prevStep}
          onClick={onBack}
          className={[
            "rounded-md border border-white/10 px-4 py-2 text-sm transition",
            prevStep
              ? "text-white/70 hover:opacity-85 active:scale-[0.98]"
              : "cursor-not-allowed text-white/30",
          ].join(" ")}
        >
          Back
        </button>

        <button
          type="button"
          onClick={onNext}
          className={[
            "rounded-md px-4 py-2 text-sm font-medium transition",
            isBlocked
              ? "bg-white/10 text-white/45 hover:opacity-85"
              : "bg-white text-black hover:opacity-85 active:scale-[0.98]",
          ].join(" ")}
        >
          {getForwardButtonText(step)}
        </button>
      </div>
    </div>
  );
}

function NextReadinessMessage({
  step,
  status,
}: {
  step: FormStep;
  status: StepStatus;
}) {
  if (!isRequiredStep(step)) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
          Next button status
        </p>

        <p className="mt-1 text-sm leading-6 text-white/70">
          Relationship is optional. Press Next when you are ready to review.
        </p>
      </div>
    );
  }

  if (status.complete) {
    return (
      <div className="rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-3 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">
          Next button status
        </p>

        <p className="mt-1 text-sm leading-6 text-emerald-50/80">
          Required fields complete. You can continue.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-yellow-300/25 bg-yellow-300/10 px-3 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-yellow-100">
        Next button status
      </p>

      <p className="mt-1 text-sm leading-6 text-yellow-50/85">
        Required fields still needed: {formatMissingItems(status.missing)}
      </p>
    </div>
  );
}