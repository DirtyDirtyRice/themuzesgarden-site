import Link from "next/link";

import { useTargetPathController } from "./target-path/targetPathController";

import FindItTargetHeader from "./target-path/FindItTargetHeader";
import FindItTargetMeaning from "./target-path/FindItTargetMeaning";
import FindItTargetSteps from "./target-path/FindItTargetSteps";
import FindItTargetSummary from "./target-path/FindItTargetSummary";

import type { NavigationSearchResult } from "@/lib/navigation/navigationSearch";

function getPanelStatusText({
  hasPath,
  hasSafeRoute,
  isAlreadyHere,
  isPromoted,
}: {
  hasPath: boolean;
  hasSafeRoute: boolean;
  isAlreadyHere: boolean;
  isPromoted: boolean;
}) {
  if (!hasPath) {
    return "Search for a destination to build a target path.";
  }

  if (isAlreadyHere) {
    return "Find It confirmed that you are already on the selected target.";
  }

  if (isPromoted) {
    return "Find It promoted this route because the active target is stable enough to guide the next move.";
  }

  if (hasSafeRoute) {
    return "Find It has a safe route and a guided path for this target.";
  }

  return "Find It found the target, but direct navigation is not available yet.";
}

function getPanelBorderTone({
  hasPath,
  hasSafeRoute,
  isAlreadyHere,
  isPromoted,
}: {
  hasPath: boolean;
  hasSafeRoute: boolean;
  isAlreadyHere: boolean;
  isPromoted: boolean;
}) {
  if (!hasPath) {
    return "border-white/10 bg-white/5";
  }

  if (isAlreadyHere) {
    return "border-sky-300/40 bg-sky-300/10";
  }

  if (isPromoted) {
    return "border-emerald-300/50 bg-emerald-300/10 ring-2 ring-emerald-300/35";
  }

  if (hasSafeRoute) {
    return "border-emerald-300/40 bg-emerald-300/10";
  }

  return "border-yellow-300/40 bg-yellow-300/10";
}

function getActionTone(isClickable: boolean) {
  if (isClickable) {
    return "bg-white text-black hover:bg-emerald-100";
  }

  return "cursor-not-allowed border border-white/10 bg-black/35 text-white/45";
}

function getPromotionLabel({
  hasPath,
  isPromoted,
  isAlreadyHere,
}: {
  hasPath: boolean;
  isPromoted: boolean;
  isAlreadyHere: boolean;
}) {
  if (!hasPath) {
    return null;
  }

  if (isAlreadyHere) {
    return "Already here";
  }

  if (isPromoted) {
    return "Promoted";
  }

  return null;
}

export default function FindItTargetPathPanel({
  pathname,
  selectedResult,
}: {
  pathname: string;
  selectedResult: NavigationSearchResult | null;
}) {
  const {
    pathResult,
    metadataMeaning,
    currentLabel,
    targetLabel,
    isAlreadyHere,
    statusLabel,
    steps,
    summary,
    routeInfo,
    actionState,
  } = useTargetPathController({
    pathname,
    selectedResult,
  });

  const hasPath = Boolean(pathResult);
  const hasSafeRoute = routeInfo.hasSafeRoute;
  const isPromoted = Boolean(pathResult && selectedResult && !isAlreadyHere && hasSafeRoute && steps.length <= 3);
  const promotionLabel = getPromotionLabel({
    hasPath,
    isPromoted,
    isAlreadyHere,
  });

  const panelStatusText = getPanelStatusText({
    hasPath,
    hasSafeRoute,
    isAlreadyHere,
    isPromoted,
  });

  const panelTone = getPanelBorderTone({
    hasPath,
    hasSafeRoute,
    isAlreadyHere,
    isPromoted,
  });

  return (
    <div className={`rounded-xl border p-3 ${panelTone}`}>
      <div className="mb-3 rounded-xl border border-white/10 bg-black/35 px-3 py-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/45">
              Find It target path
            </p>

            <p className="mt-1 text-sm leading-6 text-white/75">
              {panelStatusText}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {promotionLabel ? (
              <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-100/75">
                {promotionLabel}
              </span>
            ) : null}

            <span className="rounded-full border border-white/15 bg-white/5 px-2 py-1 text-[10px] font-bold uppercase text-white/60">
              {statusLabel}
            </span>
          </div>
        </div>
      </div>

      <FindItTargetHeader
        hasPath={hasPath}
        targetLabel={targetLabel}
        statusLabel={statusLabel}
      />

      {pathResult ? (
        <div className="mt-3 flex flex-col gap-3">
          <FindItTargetSummary
            currentLabel={currentLabel}
            targetLabel={targetLabel}
            stepCount={steps.length}
            isAlreadyHere={isAlreadyHere}
            summary={summary}
          />

          <div className="rounded-xl border border-white/10 bg-black/45 p-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/45">
                  Route action
                </p>

                <p className="mt-1 text-sm font-semibold text-white">
                  {actionState.label}
                </p>

                <p className="mt-1 text-xs leading-5 text-white/55">
                  {actionState.helperText}
                </p>
              </div>

              {actionState.href && actionState.isClickable ? (
                <Link
                  href={actionState.href}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold ${getActionTone(
                    actionState.isClickable,
                  )}`}
                >
                  {actionState.label} →
                </Link>
              ) : (
                <span
                  className={`rounded-lg px-3 py-2 text-sm font-semibold ${getActionTone(
                    actionState.isClickable,
                  )}`}
                >
                  {actionState.disabledReason ?? "Unavailable"}
                </span>
              )}
            </div>

            {routeInfo.routeWarning ? (
              <div className="mt-3 rounded-lg border border-yellow-200/25 bg-yellow-200/10 px-3 py-2">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-yellow-50">
                  Route warning
                </p>

                <p className="mt-1 text-sm leading-6 text-yellow-50/75">
                  {routeInfo.routeWarning}
                </p>
              </div>
            ) : null}

            {isPromoted ? (
              <div className="mt-3 rounded-lg border border-emerald-300/25 bg-emerald-300/10 px-3 py-2">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-100/80">
                  Promoted route
                </p>

                <p className="mt-1 text-sm leading-6 text-emerald-50/75">
                  The intelligence layer moved this path forward because the current result is stable and the route is short enough to act on.
                </p>
              </div>
            ) : null}
          </div>

          <FindItTargetMeaning metadataMeaning={metadataMeaning} />

          <FindItTargetSteps steps={steps} />
        </div>
      ) : null}
    </div>
  );
}