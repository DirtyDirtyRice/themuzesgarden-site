import type { FindItSelectionMemorySnapshot } from "./findItResultsMemory";
import { describeFindItMemoryStrength } from "./findItResultsMemory";
import type { FindItIntentState } from "./findItResultsIntent";
import type { FindItPredictionModel } from "./findItResultsPrediction";

function getBrainBadgeClasses() {
  return "rounded-full border border-white/10 bg-black/45 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/60";
}

function getStrengthTone(strength: FindItSelectionMemorySnapshot["memoryStrength"]) {
  if (strength === "strong") {
    return "border-emerald-300/30 bg-emerald-300/10 text-emerald-100/85";
  }

  if (strength === "medium") {
    return "border-sky-300/30 bg-sky-300/10 text-sky-100/85";
  }

  if (strength === "weak") {
    return "border-amber-300/30 bg-amber-300/10 text-amber-100/85";
  }

  return "border-white/10 bg-black/30 text-white/65";
}

function getPredictionTone(prediction: FindItPredictionModel) {
  const confidence = prediction.topCandidate?.confidence;

  if (confidence === "high") {
    return "border-emerald-300/30 bg-emerald-300/10";
  }

  if (confidence === "medium") {
    return "border-sky-300/30 bg-sky-300/10";
  }

  return "border-white/10 bg-black/30";
}

function getStabilityTone(intent: FindItIntentState) {
  if (intent.isStable) {
    return "border-emerald-300/30 bg-emerald-300/10";
  }

  return "border-amber-300/30 bg-amber-300/10";
}

export default function FindItResultsBrainSummary({
  memory,
  prediction,
  intent,
}: {
  memory: FindItSelectionMemorySnapshot;
  prediction: FindItPredictionModel;
  intent: FindItIntentState;
}) {
  const badgeClasses = getBrainBadgeClasses();

  return (
    <div className="mt-4 rounded-xl border border-fuchsia-300/25 bg-fuchsia-300/10 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-fuchsia-100/65">
            Results brain
          </p>

          <p className="mt-1 text-sm font-semibold text-white">
            Predictive + memory-aware selection layer
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className={badgeClasses}>
            {describeFindItMemoryStrength(memory.memoryStrength)}
          </span>
          <span className={badgeClasses}>{prediction.confidenceLabel}</span>
          <span className={badgeClasses}>{intent.stabilityLabel}</span>
        </div>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <div className={`rounded-xl border p-3 ${getStrengthTone(memory.memoryStrength)}`}>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] opacity-70">
            Memory
          </p>

          <p className="mt-1 text-sm leading-5">
            {memory.memoryMessage}
          </p>

          {memory.recentSelections.length > 0 ? (
            <p className="mt-2 text-[11px] opacity-65">
              Recent: {memory.recentSelections[0]?.selectedLabel}
            </p>
          ) : (
            <p className="mt-2 text-[11px] opacity-65">
              No recent selections yet.
            </p>
          )}
        </div>

        <div className={`rounded-xl border p-3 ${getPredictionTone(prediction)}`}>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/55">
            Prediction
          </p>

          <p className="mt-1 text-sm leading-5 text-white/80">
            {prediction.predictionMessage}
          </p>

          <p className="mt-2 text-[11px] text-white/50">
            {prediction.confidenceCopy}
          </p>
        </div>

        <div className={`rounded-xl border p-3 ${getStabilityTone(intent)}`}>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/55">
            Stability
          </p>

          <p className="mt-1 text-sm leading-5 text-white/80">
            {intent.stabilityMessage}
          </p>

          <p className="mt-2 text-[11px] text-white/50">
            Current index: {intent.stableSelectedIndex + 1}
          </p>
        </div>
      </div>

      {prediction.topCandidate ? (
        <div className="mt-3 rounded-xl border border-white/10 bg-black/25 p-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">
            Top signals
          </p>

          <div className="mt-2 flex flex-wrap gap-2">
            {prediction.topCandidate.signals.map((signal) => (
              <span
                className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] text-white/60"
                key={`${signal.label}-${signal.value}`}
              >
                {signal.label}: {signal.value} ({signal.weight})
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}