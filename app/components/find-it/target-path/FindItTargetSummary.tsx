type SummaryStatus =
  | "waiting"
  | "ready"
  | "already-here"
  | "needs-route";

type ControllerSummary = {
  currentLabel: string;
  targetLabel: string | null;
  stepCount: number;
  status: SummaryStatus;
  statusLabel: string;
  headline: string;
  detail: string;
  nextStep: string;
};

type SummaryMetric = {
  label: string;
  value: string;
  helper: string;
};

function getSummaryStatus({
  stepCount,
  isAlreadyHere,
}: {
  stepCount: number;
  isAlreadyHere: boolean;
}): SummaryStatus {
  if (isAlreadyHere) return "already-here";
  if (stepCount === 0) return "waiting";
  if (stepCount > 0) return "ready";
  return "needs-route";
}

function getStatusLabel(status: SummaryStatus) {
  if (status === "already-here") return "Already here";
  if (status === "ready") return "Path ready";
  if (status === "needs-route") return "Needs route";
  return "Waiting";
}

function getStatusTone(status: SummaryStatus) {
  if (status === "already-here") {
    return "border-sky-200/35 bg-sky-200/10 text-sky-50";
  }

  if (status === "ready") {
    return "border-emerald-200/35 bg-emerald-200/10 text-emerald-50";
  }

  if (status === "needs-route") {
    return "border-yellow-200/35 bg-yellow-200/10 text-yellow-50";
  }

  return "border-white/15 bg-black/40 text-white/60";
}

function getSummaryHeadline({
  status,
  targetLabel,
}: {
  status: SummaryStatus;
  targetLabel: string | null;
}) {
  if (status === "already-here") {
    return `You are already at ${targetLabel ?? "the target"}`;
  }

  if (status === "ready") {
    return `Guided path ready for ${targetLabel ?? "your destination"}`;
  }

  if (status === "needs-route") {
    return `Target found${targetLabel ? `: ${targetLabel}` : ""}`;
  }

  return "Waiting for a target";
}

function getSummaryMessage({
  status,
  currentLabel,
  targetLabel,
}: {
  status: SummaryStatus;
  currentLabel: string;
  targetLabel: string | null;
}) {
  if (status === "already-here") {
    return "Find It confirmed that your current page already matches the selected target.";
  }

  if (status === "ready") {
    return `Find It built a readable route from ${currentLabel} to ${
      targetLabel ?? "the selected target"
    }.`;
  }

  if (status === "needs-route") {
    return "A target exists, but no safe direct page route is available yet.";
  }

  return "Start typing to generate a navigation path.";
}

function getNextStepHint({
  status,
}: {
  status: SummaryStatus;
}) {
  if (status === "already-here") {
    return "No action needed unless you want a different destination.";
  }

  if (status === "ready") {
    return "Follow the steps below or use the safe action button when it appears.";
  }

  if (status === "needs-route") {
    return "Try refining your search or choose a nearby result with a direct page.";
  }

  return "Enter a search above.";
}

function getStepValue({
  stepCount,
  isAlreadyHere,
}: {
  stepCount: number;
  isAlreadyHere: boolean;
}) {
  if (isAlreadyHere) return "Already here";
  if (stepCount === 0) return "—";
  if (stepCount === 1) return "1 step";
  return `${stepCount} steps`;
}

function getStepHelper({
  status,
}: {
  status: SummaryStatus;
}) {
  if (status === "already-here") {
    return "The target and current page match.";
  }

  if (status === "ready") {
    return "Use the guided list below from top to bottom.";
  }

  if (status === "needs-route") {
    return "The tree can explain the target, but direct navigation is blocked.";
  }

  return "Steps appear after a result is selected.";
}

function getCurrentHelper({
  currentLabel,
}: {
  currentLabel: string;
}) {
  if (currentLabel === "No page selected") {
    return "Find It has not resolved the current page yet.";
  }

  return "This is where Find It thinks you are starting from.";
}

function getTargetHelper({
  targetLabel,
}: {
  targetLabel: string | null;
}) {
  if (!targetLabel) {
    return "No destination has been selected yet.";
  }

  return "This is the destination Find It is trying to guide you to.";
}

function buildFallbackSummary({
  currentLabel,
  targetLabel,
  stepCount,
  isAlreadyHere,
}: {
  currentLabel: string;
  targetLabel: string | null;
  stepCount: number;
  isAlreadyHere: boolean;
}): ControllerSummary {
  const status = getSummaryStatus({
    stepCount,
    isAlreadyHere,
  });

  return {
    currentLabel,
    targetLabel,
    stepCount,
    status,
    statusLabel: getStatusLabel(status),
    headline: getSummaryHeadline({
      status,
      targetLabel,
    }),
    detail: getSummaryMessage({
      status,
      currentLabel,
      targetLabel,
    }),
    nextStep: getNextStepHint({
      status,
    }),
  };
}

function buildSummaryMetrics({
  summary,
  isAlreadyHere,
}: {
  summary: ControllerSummary;
  isAlreadyHere: boolean;
}): SummaryMetric[] {
  return [
    {
      label: "You are on",
      value: summary.currentLabel,
      helper: getCurrentHelper({
        currentLabel: summary.currentLabel,
      }),
    },
    {
      label: "Target",
      value: summary.targetLabel ?? "Unknown",
      helper: getTargetHelper({
        targetLabel: summary.targetLabel,
      }),
    },
    {
      label: "Steps",
      value: getStepValue({
        stepCount: summary.stepCount,
        isAlreadyHere,
      }),
      helper: getStepHelper({
        status: summary.status,
      }),
    },
  ];
}

function getReadinessChecklist(summary: ControllerSummary) {
  return [
    {
      label: "Current page detected",
      isReady: summary.currentLabel !== "No page selected",
    },
    {
      label: "Target selected",
      isReady: Boolean(summary.targetLabel),
    },
    {
      label: "Path steps available",
      isReady: summary.status === "ready" || summary.status === "already-here",
    },
  ];
}

function getChecklistTone(isReady: boolean) {
  if (isReady) {
    return "border-emerald-200/25 bg-emerald-200/10 text-emerald-50";
  }

  return "border-white/10 bg-black/30 text-white/45";
}

export default function FindItTargetSummary({
  currentLabel,
  targetLabel,
  stepCount,
  isAlreadyHere,
  summary,
}: {
  currentLabel: string;
  targetLabel: string | null;
  stepCount: number;
  isAlreadyHere: boolean;
  summary?: ControllerSummary;
}) {
  const activeSummary =
    summary ??
    buildFallbackSummary({
      currentLabel,
      targetLabel,
      stepCount,
      isAlreadyHere,
    });

  const metrics = buildSummaryMetrics({
    summary: activeSummary,
    isAlreadyHere,
  });

  const checklist = getReadinessChecklist(activeSummary);
  const statusTone = getStatusTone(activeSummary.status);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/55 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/45">
            Path context
          </p>

          <h3 className="mt-1 text-base font-semibold text-white">
            {activeSummary.headline}
          </h3>
        </div>

        <span
          className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${statusTone}`}
        >
          {activeSummary.statusLabel}
        </span>
      </div>

      <div className="grid gap-2 md:grid-cols-3">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2"
          >
            <p className="text-xs text-white/45">{metric.label}</p>

            <p className="mt-1 font-semibold text-white">
              {metric.value}
            </p>

            <p className="mt-1 text-xs leading-5 text-white/45">
              {metric.helper}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">
          What Find It knows
        </p>

        <p className="mt-1 text-sm leading-6 text-white/80">
          {activeSummary.detail}
        </p>
      </div>

      <div className="rounded-lg border border-white/10 bg-black/35 px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">
          Next move
        </p>

        <p className="mt-1 text-sm leading-6 text-white/75">
          {activeSummary.nextStep}
        </p>
      </div>

      <div className="grid gap-2 md:grid-cols-3">
        {checklist.map((item) => (
          <div
            key={item.label}
            className={`rounded-lg border px-3 py-2 ${getChecklistTone(
              item.isReady,
            )}`}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.12em]">
              {item.isReady ? "Ready" : "Waiting"}
            </p>

            <p className="mt-1 text-xs leading-5">
              {item.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}