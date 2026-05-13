import Link from "next/link";
import { useMemo } from "react";

import { getNavigationPath } from "@/lib/navigation/navigationPath";
import type { NavigationSearchResult } from "@/lib/navigation/navigationSearch";

import FindItTreeStep from "./FindItTreeStep";
import { getSafeFindItRoute } from "./findItPanelUtils";

function EmptyTargetPathMessage() {
  return (
    <div className="mt-3 rounded-xl border border-white/10 bg-black/50 p-3">
      <p className="text-sm font-semibold text-white">
        Type what you want to find.
      </p>

      <p className="mt-1 text-sm leading-6 text-white/60">
        Find It will stay clean until you search. After you type, the path and
        instructions will appear here.
      </p>
    </div>
  );
}

function getTargetActionText({
  isAlreadyHere,
  targetLabel,
}: {
  isAlreadyHere: boolean;
  targetLabel?: string;
}) {
  if (isAlreadyHere) {
    return "You are already here";
  }

  if (targetLabel) {
    return `Go to ${targetLabel}`;
  }

  return "No direct page yet";
}

function getDirectionLabel(direction?: string) {
  if (direction === "up") return "Go up";
  if (direction === "down") return "Go deeper";
  if (direction === "across") return "Switch section";
  return "Continue";
}

export default function FindItTargetPathPanel({
  pathname,
  selectedResult,
}: {
  pathname: string;
  selectedResult: NavigationSearchResult | null;
}) {
  const pathResult = useMemo(() => {
    if (!selectedResult) return null;

    return getNavigationPath({
      currentPathname: pathname,
      targetNodeId: selectedResult.node.id,
    });
  }, [pathname, selectedResult]);

  const targetSteps =
    pathResult?.steps.map((step) => step.label) ?? [
      "Type what you are trying to find",
    ];

  const targetFinalStep = targetSteps[targetSteps.length - 1];
  const currentLabel = pathResult?.currentNode?.label ?? "No page selected yet";
  const targetLabel = pathResult?.targetNode?.label;
  const totalSteps = pathResult?.steps.length ?? 0;

  const safeRoute = getSafeFindItRoute(pathResult?.targetNode?.href);

  const isAlreadyHere =
    pathResult?.currentNode?.id === pathResult?.targetNode?.id;

  const goButtonText = getTargetActionText({
    isAlreadyHere,
    targetLabel,
  });

  return (
    <div className="rounded-xl border border-emerald-300/40 bg-emerald-300/10 p-3 shadow-[0_0_28px_rgba(110,231,183,0.18)] ring-1 ring-emerald-200/20 transition">
      <div className="rounded-xl border border-emerald-200/25 bg-emerald-200/10 px-3 py-2">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-100">
          Target path
        </p>

        <p className="mt-1 text-sm font-semibold text-emerald-50">
          {pathResult
            ? "Follow these steps to reach your destination."
            : "Waiting for your search."}
        </p>
      </div>

      <p className="mt-3 text-base font-semibold text-white">
        {targetLabel ?? "Type a destination to build the path"}
      </p>

      {pathResult ? (
        <p className="mt-1 text-xs leading-5 text-white/55">
          {pathResult.message}
        </p>
      ) : (
        <EmptyTargetPathMessage />
      )}

      {pathResult ? (
        <div className="mt-3 grid gap-2 rounded-xl border border-white/10 bg-black/55 p-3 md:grid-cols-3">
          <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/45">
              You are on
            </p>

            <p className="mt-1 text-sm font-semibold text-white">
              {currentLabel}
            </p>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/45">
              Target
            </p>

            <p className="mt-1 text-sm font-semibold text-white">
              {targetLabel ?? "Unknown target"}
            </p>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/45">
              Steps
            </p>

            <p className="mt-1 text-sm font-semibold text-white">
              {isAlreadyHere ? "Already here" : `${totalSteps} steps`}
            </p>
          </div>
        </div>
      ) : null}

      {isAlreadyHere ? (
        <span className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-emerald-100/50 bg-emerald-100/15 px-4 py-3 text-sm font-bold text-emerald-50">
          {goButtonText}
        </span>
      ) : safeRoute ? (
        <Link
          href={safeRoute}
          aria-label={goButtonText}
          className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-emerald-100/80 bg-white px-4 py-3 text-sm font-bold !text-black transition"
        >
          {goButtonText}
        </Link>
      ) : null}

      <div className="mt-3 flex flex-col gap-2">
        {pathResult?.steps.map((step, index) => (
          <FindItTreeStep
            key={`target-${step.id}`}
            label={`${getDirectionLabel(step.direction)} → ${step.label}`}
            href={step.href}
            marker={
              step.isCurrentLocation
                ? "here"
                : step.isTarget
                ? "target"
                : undefined
            }
            fullPath={pathResult.steps.map((s) => s.href || "")}
            stepIndex={index}
          />
        ))}
      </div>

      {pathResult?.targetNode ? (
        <div className="mt-3 flex flex-col gap-3 rounded-xl border border-white/10 bg-black/60 p-3">
          <p className="text-sm leading-6 text-white/75">
            {pathResult.targetNode.description}
          </p>
        </div>
      ) : null}
    </div>
  );
}