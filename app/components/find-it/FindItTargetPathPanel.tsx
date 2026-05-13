import Link from "next/link";
import { useMemo } from "react";

import { getMetadataMeaningForSearch } from "@/lib/metadata/metadataLibrarySeed";
import { getNavigationPath } from "@/lib/navigation/navigationPath";
import type { NavigationSearchResult } from "@/lib/navigation/navigationSearch";

import FindItTreeStep from "./FindItTreeStep";
import { getSafeFindItRoute } from "./findItPanelUtils";

type MeaningAction = {
  href: string;
  label: string;
  note: string;
};

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

function getResultMeaning({
  currentLabel,
  isAlreadyHere,
  targetFinalStep,
  targetLabel,
  totalSteps,
}: {
  currentLabel: string;
  isAlreadyHere: boolean;
  targetFinalStep: string;
  targetLabel?: string;
  totalSteps: number;
}) {
  if (!targetLabel) {
    return {
      title: "No explanation yet",
      text: "Pick a result and Find It will explain why that destination matters.",
      nextStep:
        "Start by typing a plain word like metadata, projects, player, manual, or create.",
    };
  }

  if (isAlreadyHere) {
    return {
      title: "Why this result?",
      text: `${targetLabel} matched because it is the page you are already viewing.`,
      nextStep:
        "Stay here if this is the page you wanted, or choose another result to compare paths.",
    };
  }

  return {
    title: "Why this result?",
    text: `${targetLabel} matched your search because it is a known app destination. You are starting from ${currentLabel}, and Find It found ${targetFinalStep} as the target in ${totalSteps} steps.`,
    nextStep:
      "Use the main destination button when you are ready to move, or use the explanation links below to understand the system first.",
  };
}

function getMeaningActions({
  metadataSlug,
  safeRoute,
  targetHref,
  targetLabel,
}: {
  metadataSlug?: string;
  safeRoute: string | null;
  targetHref?: string;
  targetLabel?: string;
}): MeaningAction[] {
  const actions: MeaningAction[] = [
    {
      href: "/about",
      label: "Open Manual",
      note: "Read the plain-language explanation hub.",
    },
    {
      href: "/about/find-it",
      label: "Read Find It Guide",
      note: "Understand how path guidance works.",
    },
  ];

  if (metadataSlug) {
    actions.unshift({
      href: `/metadata/${metadataSlug}`,
      label: "Open Full Record",
      note: "Read the complete metadata explanation.",
    });
  }

  if (targetHref?.startsWith("/about") && targetHref !== "/about") {
    actions.unshift({
      href: targetHref,
      label: "Open Manual Page",
      note: targetLabel
        ? `Read the manual page for ${targetLabel}.`
        : "Read the matching manual page.",
    });
  }

  if (targetHref?.startsWith("/metadata")) {
    actions.unshift({
      href: "/about/metadata",
      label: "Open Metadata Guide",
      note: "Understand the knowledge layer before jumping deeper.",
    });
  }

  if (safeRoute && safeRoute !== targetHref) {
    actions.push({
      href: safeRoute,
      label: "Open Safe Target",
      note: "Use the verified route Find It selected.",
    });
  }

  return actions.slice(0, 4);
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

  const queryText = selectedResult?.node?.label ?? "";

  const metadataMeaning = useMemo(() => {
    return getMetadataMeaningForSearch(queryText);
  }, [queryText]);

  const targetSteps =
    pathResult?.steps.map((step) => step.label) ?? [
      "Type what you are trying to find",
    ];

  const targetFinalStep = targetSteps[targetSteps.length - 1];
  const currentLabel = pathResult?.currentNode?.label ?? "No page selected yet";
  const targetLabel = pathResult?.targetNode?.label;
  const targetHref = pathResult?.targetNode?.href;
  const totalSteps = pathResult?.steps.length ?? 0;

  const safeRoute = getSafeFindItRoute(targetHref);

  const isAlreadyHere =
    pathResult?.currentNode?.id === pathResult?.targetNode?.id;

  const goButtonText = getTargetActionText({
    isAlreadyHere,
    targetLabel,
  });

  const resultMeaning = getResultMeaning({
    currentLabel,
    isAlreadyHere,
    targetFinalStep,
    targetLabel,
    totalSteps,
  });

  const meaningActions = getMeaningActions({
    metadataSlug: metadataMeaning?.slug,
    safeRoute,
    targetHref,
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

      {pathResult ? (
        <div className="mt-3 rounded-xl border border-sky-300/20 bg-sky-300/10 p-3">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-100/80">
            {metadataMeaning ? metadataMeaning.title : resultMeaning.title}
          </p>

          <p className="mt-2 text-sm leading-6 text-sky-50/75">
            {metadataMeaning ? metadataMeaning.excerpt : resultMeaning.text}
          </p>

          <div className="mt-3 rounded-lg border border-sky-200/15 bg-black/25 p-3">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-100/65">
              Suggested next step
            </p>

            <p className="mt-2 text-sm leading-6 text-sky-50/75">
              {metadataMeaning
                ? "Open the full metadata record to read the deeper explanation, fields, and relationships."
                : resultMeaning.nextStep}
            </p>
          </div>

          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {meaningActions.map((action) => (
              <Link
                key={`${action.href}-${action.label}`}
                href={action.href}
                className="rounded-lg border border-sky-200/20 bg-black/30 px-3 py-2 transition hover:border-sky-100/45 hover:bg-sky-100/10"
              >
                <p className="text-sm font-bold text-sky-50">
                  {action.label} →
                </p>

                <p className="mt-1 text-xs leading-5 text-sky-100/55">
                  {action.note}
                </p>
              </Link>
            ))}
          </div>

          <p className="mt-3 text-xs leading-5 text-sky-100/55">
            This panel is the future bridge for metadata meanings, manual
            explanations, relationship notes, and word-level help.
          </p>
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