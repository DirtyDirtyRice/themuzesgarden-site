import { getMetadataMeaningForSearch } from "@/lib/metadata/metadataLibrarySeed";
import { getNavigationPath } from "@/lib/navigation/navigationPath";
import type { NavigationSearchResult } from "@/lib/navigation/navigationSearch";

import { getSafeFindItRoute } from "../findItPanelUtils";

type PathPanelStatus = "waiting" | "ready" | "already-here" | "needs-route";

type PathStepDirection = "stay" | "up" | "down" | "across";

type PathStepViewModel = {
  id: string;
  label: string;
  href?: string;
  kind?: string;
  isCurrentLocation?: boolean;
  isTarget?: boolean;
  direction?: PathStepDirection;
};

type TargetActionState = {
  label: string;
  helperText: string;
  href?: string;
  disabledReason?: string;
  isClickable: boolean;
};

type TargetPathSummary = {
  currentLabel: string;
  targetLabel: string | null;
  stepCount: number;
  status: PathPanelStatus;
  statusLabel: string;
  headline: string;
  detail: string;
  nextStep: string;
};

type TargetPathRouteInfo = {
  targetHref: string | undefined;
  safeRoute: string | undefined;
  hasSafeRoute: boolean;
  routeLabel: string;
  routeWarning: string | null;
};

type TargetPathControllerResult = {
  pathResult: ReturnType<typeof getNavigationPath> | null;
  metadataMeaning: ReturnType<typeof getMetadataMeaningForSearch>;

  currentLabel: string;
  targetLabel: string | null;

  targetHref: string | undefined;
  safeRoute: string | undefined;
  steps: PathStepViewModel[];

  isAlreadyHere: boolean;
  status: PathPanelStatus;
  statusLabel: string;

  goButtonText: string;
  actionState: TargetActionState;
  summary: TargetPathSummary;
  routeInfo: TargetPathRouteInfo;
};

function getPathPanelStatus({
  isAlreadyHere,
  pathExists,
  safeRoute,
}: {
  isAlreadyHere: boolean;
  pathExists: boolean;
  safeRoute: string | undefined;
}): PathPanelStatus {
  if (!pathExists) return "waiting";
  if (isAlreadyHere) return "already-here";
  if (!safeRoute) return "needs-route";
  return "ready";
}

function getStatusLabel(status: PathPanelStatus) {
  if (status === "already-here") return "Already here";
  if (status === "ready") return "Safe route ready";
  if (status === "needs-route") return "Needs route";
  return "Waiting";
}

function getTargetActionText({
  isAlreadyHere,
  targetLabel,
}: {
  isAlreadyHere: boolean;
  targetLabel?: string | null;
}) {
  if (isAlreadyHere) return "You are already here";
  if (targetLabel) return `Go to ${targetLabel}`;
  return "No direct page yet";
}

function getSummaryHeadline({
  status,
  targetLabel,
}: {
  status: PathPanelStatus;
  targetLabel: string | null;
}) {
  if (status === "already-here") {
    return `You are already at ${targetLabel ?? "the target"}`;
  }

  if (status === "ready") {
    return `Path ready for ${targetLabel ?? "your destination"}`;
  }

  if (status === "needs-route") {
    return `Target found${targetLabel ? `: ${targetLabel}` : ""}`;
  }

  return "Waiting for a target";
}

function getSummaryDetail({
  status,
  currentLabel,
  targetLabel,
}: {
  status: PathPanelStatus;
  currentLabel: string;
  targetLabel: string | null;
}) {
  if (status === "already-here") {
    return "Find It confirmed that your current page already matches the selected target.";
  }

  if (status === "ready") {
    return `Find It built a safe path from ${currentLabel} to ${
      targetLabel ?? "the selected target"
    }.`;
  }

  if (status === "needs-route") {
    return "Find It found the target in the navigation tree, but that target does not expose a safe route yet.";
  }

  return "Choose a search result so Find It can build a route from your current page.";
}

function getNextStep({
  status,
}: {
  status: PathPanelStatus;
}) {
  if (status === "already-here") {
    return "Stay on this page or pick a different result.";
  }

  if (status === "ready") {
    return "Follow the guided steps and use the route action when available.";
  }

  if (status === "needs-route") {
    return "Try a nearby search result that has a visible page route.";
  }

  return "Type in the Find It search box above.";
}

function normalizePathStep(step: {
  id: string;
  label: string;
  href?: string;
  kind?: string;
  isCurrentLocation?: boolean;
  isTarget?: boolean;
  direction?: string;
}): PathStepViewModel {
  const direction =
    step.direction === "stay" ||
    step.direction === "up" ||
    step.direction === "down" ||
    step.direction === "across"
      ? step.direction
      : undefined;

  return {
    id: step.id,
    label: step.label,
    href: step.href,
    kind: step.kind,
    isCurrentLocation: step.isCurrentLocation,
    isTarget: step.isTarget,
    direction,
  };
}

function getRouteInfo({
  targetHref,
  safeRoute,
}: {
  targetHref: string | undefined;
  safeRoute: string | undefined;
}): TargetPathRouteInfo {
  if (safeRoute) {
    return {
      targetHref,
      safeRoute,
      hasSafeRoute: true,
      routeLabel: "Safe route available",
      routeWarning: null,
    };
  }

  if (targetHref) {
    return {
      targetHref,
      safeRoute,
      hasSafeRoute: false,
      routeLabel: "Route blocked",
      routeWarning:
        "The target has a route value, but Find It did not approve it as a safe app route.",
    };
  }

  return {
    targetHref,
    safeRoute,
    hasSafeRoute: false,
    routeLabel: "No direct route",
    routeWarning:
      "This target can be explained in the tree, but it does not have a direct page link yet.",
  };
}

function getActionState({
  status,
  safeRoute,
  targetLabel,
  isAlreadyHere,
}: {
  status: PathPanelStatus;
  safeRoute: string | undefined;
  targetLabel: string | null;
  isAlreadyHere: boolean;
}): TargetActionState {
  if (isAlreadyHere) {
    return {
      label: "You are already here",
      helperText: "No navigation action is needed for this target.",
      isClickable: false,
      disabledReason: "Current page already matches the target.",
    };
  }

  if (status === "ready" && safeRoute) {
    return {
      label: targetLabel ? `Go to ${targetLabel}` : "Open target page",
      helperText: "This route passed the Find It safety check.",
      href: safeRoute,
      isClickable: true,
    };
  }

  if (status === "needs-route") {
    return {
      label: "No direct page yet",
      helperText: "Find It can explain the path, but cannot open this target directly yet.",
      isClickable: false,
      disabledReason: "Missing safe route.",
    };
  }

  return {
    label: "Choose a result first",
    helperText: "Search for a target to activate path actions.",
    isClickable: false,
    disabledReason: "No selected target.",
  };
}

function getSummary({
  currentLabel,
  targetLabel,
  stepCount,
  status,
  statusLabel,
}: {
  currentLabel: string;
  targetLabel: string | null;
  stepCount: number;
  status: PathPanelStatus;
  statusLabel: string;
}): TargetPathSummary {
  return {
    currentLabel,
    targetLabel,
    stepCount,
    status,
    statusLabel,
    headline: getSummaryHeadline({
      status,
      targetLabel,
    }),
    detail: getSummaryDetail({
      status,
      currentLabel,
      targetLabel,
    }),
    nextStep: getNextStep({
      status,
    }),
  };
}

export function useTargetPathController({
  pathname,
  selectedResult,
}: {
  pathname: string;
  selectedResult: NavigationSearchResult | null;
}): TargetPathControllerResult {
  const pathResult = selectedResult
    ? getNavigationPath({
        currentPathname: pathname,
        targetNodeId: selectedResult.node.id,
      })
    : null;

  const queryText = selectedResult?.node.label ?? "";
  const metadataMeaning = getMetadataMeaningForSearch(queryText);

  const currentLabel = pathResult?.currentNode?.label ?? "No page selected";
  const targetLabel = pathResult?.targetNode?.label ?? null;
  const targetHref = pathResult?.targetNode?.href ?? undefined;

  const safeRouteRaw = getSafeFindItRoute(targetHref);
  const safeRoute = safeRouteRaw ?? undefined;

  const isAlreadyHere =
    Boolean(pathResult) &&
    pathResult?.currentNode?.id === pathResult?.targetNode?.id;

  const steps = pathResult?.steps.map(normalizePathStep) ?? [];

  const status = getPathPanelStatus({
    isAlreadyHere,
    pathExists: Boolean(pathResult),
    safeRoute,
  });

  const statusLabel = getStatusLabel(status);

  const goButtonText = getTargetActionText({
    isAlreadyHere,
    targetLabel,
  });

  const routeInfo = getRouteInfo({
    targetHref,
    safeRoute,
  });

  const actionState = getActionState({
    status,
    safeRoute,
    targetLabel,
    isAlreadyHere,
  });

  const summary = getSummary({
    currentLabel,
    targetLabel,
    stepCount: steps.length,
    status,
    statusLabel,
  });

  return {
    pathResult,
    metadataMeaning,

    currentLabel,
    targetLabel,

    targetHref,
    safeRoute,
    steps,

    isAlreadyHere,
    status,
    statusLabel,

    goButtonText,
    actionState,
    summary,
    routeInfo,
  };
}