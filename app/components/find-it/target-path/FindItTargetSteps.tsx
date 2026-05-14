import FindItTreeStep from "../FindItTreeStep";

type TargetPathStep = {
  id: string;
  label: string;
  href?: string;
  kind?: string;
  isCurrentLocation?: boolean;
  isTarget?: boolean;
  direction?: "stay" | "up" | "down" | "across";
};

function getDirectionLabel(direction?: TargetPathStep["direction"]) {
  if (direction === "up") return "Go up";
  if (direction === "down") return "Go deeper";
  if (direction === "across") return "Switch";
  if (direction === "stay") return "Stay";
  return "Continue";
}

function getDirectionHelp(direction?: TargetPathStep["direction"]) {
  if (direction === "up") {
    return "Move back toward a parent page before heading to the target.";
  }

  if (direction === "down") {
    return "Move deeper into this section to get closer to the target.";
  }

  if (direction === "across") {
    return "Switch sideways to a related section.";
  }

  if (direction === "stay") {
    return "You are already on this step.";
  }

  return "Continue through the guided path.";
}

function getStepBadge(step: TargetPathStep, index: number) {
  if (step.isCurrentLocation && step.isTarget) {
    return "Here + Target";
  }

  if (step.isCurrentLocation) {
    return "You are here";
  }

  if (step.isTarget) {
    return "Target";
  }

  return `Step ${index + 1}`;
}

function getStepTone(step: TargetPathStep) {
  if (step.isCurrentLocation && step.isTarget) {
    return "border-emerald-200/35 bg-emerald-200/10 text-emerald-50";
  }

  if (step.isCurrentLocation) {
    return "border-sky-200/35 bg-sky-200/10 text-sky-50";
  }

  if (step.isTarget) {
    return "border-yellow-200/35 bg-yellow-200/10 text-yellow-50";
  }

  return "border-white/15 bg-white/5 text-white/65";
}

function getStepRouteStatus(step: TargetPathStep) {
  if (step.href) {
    return "Clickable route available";
  }

  if (step.isCurrentLocation) {
    return "Current position";
  }

  return "Navigation label only";
}

function getFullPath(steps: TargetPathStep[]) {
  return steps.map((step) => step.href || "");
}

function getPathOverview(steps: TargetPathStep[]) {
  const currentStep = steps.find((step) => step.isCurrentLocation);
  const targetStep = steps.find((step) => step.isTarget);

  if (currentStep && targetStep && currentStep.id === targetStep.id) {
    return "You are already at the target. The path below confirms your current location.";
  }

  if (currentStep && targetStep) {
    return `Start at ${currentStep.label}, then follow the path until you reach ${targetStep.label}.`;
  }

  if (targetStep) {
    return `Follow the path below until you reach ${targetStep.label}.`;
  }

  return "Follow the path below from top to bottom.";
}

export default function FindItTargetSteps({
  steps,
}: {
  steps: TargetPathStep[];
}) {
  if (!steps.length) {
    return (
      <div className="mt-3 rounded-xl border border-white/10 bg-black/40 p-3">
        <p className="text-sm font-semibold text-white/75">
          No path steps yet
        </p>

        <p className="mt-1 text-xs leading-5 text-white/45">
          Search for a destination first. When Find It finds a target, the full
          step-by-step route will appear here.
        </p>
      </div>
    );
  }

  const fullPath = getFullPath(steps);
  const pathOverview = getPathOverview(steps);

  return (
    <div className="mt-3 flex flex-col gap-3">
      <div className="rounded-xl border border-white/10 bg-black/45 p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/45">
              Guided steps
            </p>

            <p className="mt-1 text-sm leading-6 text-white/75">
              {pathOverview}
            </p>
          </div>

          <span className="rounded-full border border-white/15 bg-white/5 px-2 py-1 text-[10px] font-bold uppercase text-white/60">
            {steps.length} {steps.length === 1 ? "step" : "steps"}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {steps.map((step, index) => {
          const directionLabel = getDirectionLabel(step.direction);
          const stepBadge = getStepBadge(step, index);
          const stepTone = getStepTone(step);
          const routeStatus = getStepRouteStatus(step);

          return (
            <div
              key={step.id}
              className="rounded-xl border border-white/10 bg-black/35 p-2"
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <span
                  className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${stepTone}`}
                >
                  {stepBadge}
                </span>

                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
                  {routeStatus}
                </span>
              </div>

              <FindItTreeStep
                label={`${directionLabel} → ${step.label}`}
                href={step.href}
                stepIndex={index}
                fullPath={fullPath}
              />

              <p className="mt-2 px-1 text-xs leading-5 text-white/45">
                {getDirectionHelp(step.direction)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}