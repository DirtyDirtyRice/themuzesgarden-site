import type { NavigationSearchResult } from "@/lib/navigation/navigationSearch";

export type FindItSectionStatesInput = unknown;

export type FindItPanelSyncLayerId =
  | "search"
  | "results"
  | "currentPage"
  | "meaning"
  | "targetPath"
  | "moreInfo";

export type FindItPanelSyncStatus =
  | "idle"
  | "waiting"
  | "ready"
  | "focused"
  | "synced"
  | "attention";

export type FindItPanelLayerBadgeTone = "default" | "emerald" | "amber";

export type FindItPanelLayerBadge = {
  badge: string;
  description: string;
  tone?: FindItPanelLayerBadgeTone;
};

export type FindItPanelSyncLayer = {
  id: FindItPanelSyncLayerId;
  label: string;
  status: FindItPanelSyncStatus;
  priority: number;
  isActive: boolean;
  isBlocked: boolean;
  reason: string;
  nextStep: string;
};

export type FindItPanelSyncSnapshot = {
  layers: FindItPanelSyncLayer[];
  activeLayerCount: number;
  blockedLayerCount: number;
  readyLayerCount: number;
  primaryLayer: FindItPanelSyncLayer;
  syncLabel: string;
  syncMessage: string;
  syncStrength: "idle" | "weak" | "medium" | "strong";
};

function getSelectedLabel(activeResult: NavigationSearchResult | null) {
  return activeResult?.node.label ?? "No selected target";
}

function createLayer({
  id,
  label,
  status,
  priority,
  isActive,
  isBlocked,
  reason,
  nextStep,
}: FindItPanelSyncLayer): FindItPanelSyncLayer {
  return {
    id,
    label,
    status,
    priority,
    isActive,
    isBlocked,
    reason,
    nextStep,
  };
}

function getSearchLayer({
  hasSearchText,
  isWaitingForDebounce,
  cleanSearchValue,
}: {
  hasSearchText: boolean;
  isWaitingForDebounce: boolean;
  cleanSearchValue: string;
}) {
  if (!hasSearchText) {
    return createLayer({
      id: "search",
      label: "Search input",
      status: "idle",
      priority: 10,
      isActive: false,
      isBlocked: false,
      reason: "Search is empty.",
      nextStep: "Type what you are trying to find.",
    });
  }

  if (isWaitingForDebounce) {
    return createLayer({
      id: "search",
      label: "Search input",
      status: "waiting",
      priority: 95,
      isActive: true,
      isBlocked: false,
      reason: "Search text is still settling.",
      nextStep: "Pause for results to update.",
    });
  }

  return createLayer({
    id: "search",
    label: "Search input",
    status: "synced",
    priority: 72,
    isActive: true,
    isBlocked: false,
    reason: `Search is active for "${cleanSearchValue}".`,
    nextStep: "Compare the result brain and meaning layer.",
  });
}

function getResultsLayer({
  hasSearchText,
  isWaitingForDebounce,
  matchCount,
  selectedLabel,
}: {
  hasSearchText: boolean;
  isWaitingForDebounce: boolean;
  matchCount: number;
  selectedLabel: string;
}) {
  if (!hasSearchText) {
    return createLayer({
      id: "results",
      label: "Results brain",
      status: "idle",
      priority: 20,
      isActive: false,
      isBlocked: true,
      reason: "Results need search text.",
      nextStep: "Start with the search box.",
    });
  }

  if (isWaitingForDebounce) {
    return createLayer({
      id: "results",
      label: "Results brain",
      status: "waiting",
      priority: 88,
      isActive: true,
      isBlocked: false,
      reason: "Results are waiting for debounce.",
      nextStep: "Let the search finish updating.",
    });
  }

  if (matchCount === 0) {
    return createLayer({
      id: "results",
      label: "Results brain",
      status: "attention",
      priority: 84,
      isActive: true,
      isBlocked: true,
      reason: "No matching navigation targets were found.",
      nextStep: "Use broader search words.",
    });
  }

  return createLayer({
    id: "results",
    label: "Results brain",
    status: matchCount <= 3 ? "focused" : "ready",
    priority: matchCount <= 3 ? 93 : 76,
    isActive: true,
    isBlocked: false,
    reason: `${matchCount} result${matchCount === 1 ? "" : "s"} available. Current target: ${selectedLabel}.`,
    nextStep:
      matchCount <= 3
        ? "Use the current target as the main candidate."
        : "Step through candidates before opening.",
  });
}

function getCurrentPageLayer(pathname: string) {
  return createLayer({
    id: "currentPage",
    label: "Current page",
    status: "synced",
    priority: 55,
    isActive: true,
    isBlocked: false,
    reason: `Current page context is ${pathname || "/"}.`,
    nextStep: "Use current location as the starting point for path guidance.",
  });
}

function getMeaningLayer({
  hasSearchText,
  matchCount,
  selectedLabel,
}: {
  hasSearchText: boolean;
  matchCount: number;
  selectedLabel: string;
}) {
  if (!hasSearchText || matchCount === 0) {
    return createLayer({
      id: "meaning",
      label: "Meaning layer",
      status: "idle",
      priority: 30,
      isActive: false,
      isBlocked: true,
      reason: "Meaning needs an active selected result.",
      nextStep: "Create a search result first.",
    });
  }

  return createLayer({
    id: "meaning",
    label: "Meaning layer",
    status: matchCount <= 3 ? "focused" : "ready",
    priority: matchCount <= 3 ? 86 : 68,
    isActive: true,
    isBlocked: false,
    reason: `Meaning can explain ${selectedLabel}.`,
    nextStep: "Read meaning before opening the target.",
  });
}

function getTargetPathLayer({
  hasFocusedTarget,
  hasSearchText,
  matchCount,
  selectedLabel,
}: {
  hasFocusedTarget: boolean;
  hasSearchText: boolean;
  matchCount: number;
  selectedLabel: string;
}) {
  if (!hasSearchText || matchCount === 0) {
    return createLayer({
      id: "targetPath",
      label: "Target path",
      status: "idle",
      priority: 25,
      isActive: false,
      isBlocked: true,
      reason: "Target path needs a selected result.",
      nextStep: "Search and select a destination.",
    });
  }

  if (hasFocusedTarget) {
    return createLayer({
      id: "targetPath",
      label: "Target path",
      status: "focused",
      priority: 94,
      isActive: true,
      isBlocked: false,
      reason: `${selectedLabel} is focused enough to promote the path layer.`,
      nextStep: "Verify the path before opening.",
    });
  }

  return createLayer({
    id: "targetPath",
    label: "Target path",
    status: "ready",
    priority: 64,
    isActive: true,
    isBlocked: false,
    reason: `Route guidance is ready for ${selectedLabel}.`,
    nextStep: "Compare meaning first, then check the route.",
  });
}

function getMoreInfoLayer({
  hasSearchText,
  matchCount,
}: {
  hasSearchText: boolean;
  matchCount: number;
}) {
  if (!hasSearchText) {
    return createLayer({
      id: "moreInfo",
      label: "More info",
      status: "idle",
      priority: 15,
      isActive: false,
      isBlocked: false,
      reason: "More information waits behind the main search layers.",
      nextStep: "Search first if you need contextual help.",
    });
  }

  return createLayer({
    id: "moreInfo",
    label: "More info",
    status: matchCount > 0 ? "ready" : "attention",
    priority: matchCount > 0 ? 48 : 58,
    isActive: true,
    isBlocked: false,
    reason:
      matchCount > 0
        ? "More information can support the selected result."
        : "More information can help broaden the search.",
    nextStep:
      matchCount > 0
        ? "Use it after meaning and path guidance."
        : "Use it to recover from no results.",
  });
}

function getPrimaryLayer(layers: FindItPanelSyncLayer[]) {
  return [...layers].sort((left, right) => right.priority - left.priority)[0] ?? layers[0];
}

function getSyncStrength({
  activeLayerCount,
  blockedLayerCount,
  readyLayerCount,
}: {
  activeLayerCount: number;
  blockedLayerCount: number;
  readyLayerCount: number;
}): FindItPanelSyncSnapshot["syncStrength"] {
  if (activeLayerCount === 0) return "idle";
  if (blockedLayerCount > 0) return "weak";
  if (readyLayerCount >= 4) return "strong";
  return "medium";
}

function getSyncLabel(strength: FindItPanelSyncSnapshot["syncStrength"]) {
  if (strength === "strong") return "Strong sync";
  if (strength === "medium") return "Useful sync";
  if (strength === "weak") return "Needs attention";
  return "Waiting";
}

function getSyncMessage({
  strength,
  primaryLayer,
}: {
  strength: FindItPanelSyncSnapshot["syncStrength"];
  primaryLayer: FindItPanelSyncLayer;
}) {
  if (strength === "strong") {
    return `Panels are aligned. Lead layer: ${primaryLayer.label}.`;
  }

  if (strength === "medium") {
    return `Panels are usable. Watch ${primaryLayer.label}.`;
  }

  if (strength === "weak") {
    return `A panel needs attention. Start with ${primaryLayer.label}.`;
  }

  return "Cross-panel sync is waiting for search input.";
}

export function createFindItPanelSyncSnapshot({
  activeResult,
  cleanSearchValue,
  hasFocusedTarget,
  hasSearchText,
  isWaitingForDebounce,
  matchCount,
  pathname,
}: {
  activeResult: NavigationSearchResult | null;
  cleanSearchValue: string;
  hasFocusedTarget: boolean;
  hasSearchText: boolean;
  isWaitingForDebounce: boolean;
  matchCount: number;
  pathname: string;
  sectionStates: FindItSectionStatesInput;
}) {
  const selectedLabel = getSelectedLabel(activeResult);

  const layers = [
    getSearchLayer({ hasSearchText, isWaitingForDebounce, cleanSearchValue }),
    getResultsLayer({
      hasSearchText,
      isWaitingForDebounce,
      matchCount,
      selectedLabel,
    }),
    getCurrentPageLayer(pathname),
    getMeaningLayer({ hasSearchText, matchCount, selectedLabel }),
    getTargetPathLayer({
      hasFocusedTarget,
      hasSearchText,
      matchCount,
      selectedLabel,
    }),
    getMoreInfoLayer({ hasSearchText, matchCount }),
  ];

  const activeLayerCount = layers.filter((layer) => layer.isActive).length;
  const blockedLayerCount = layers.filter((layer) => layer.isBlocked).length;
  const readyLayerCount = layers.filter(
    (layer) =>
      layer.status === "ready" ||
      layer.status === "focused" ||
      layer.status === "synced",
  ).length;
  const primaryLayer = getPrimaryLayer(layers);
  const syncStrength = getSyncStrength({
    activeLayerCount,
    blockedLayerCount,
    readyLayerCount,
  });

  return {
    layers,
    activeLayerCount,
    blockedLayerCount,
    readyLayerCount,
    primaryLayer,
    syncLabel: getSyncLabel(syncStrength),
    syncMessage: getSyncMessage({ strength: syncStrength, primaryLayer }),
    syncStrength,
  };
}

export function createFindItLayerBadges({
  activeResult,
  hasFocusedTarget,
  matchCount,
}: {
  activeResult: NavigationSearchResult | null;
  hasFocusedTarget: boolean;
  matchCount: number;
}): {
  meaning: FindItPanelLayerBadge;
  targetPath: FindItPanelLayerBadge;
  moreInfo: FindItPanelLayerBadge;
} {
  const selectedLabel = activeResult?.node.label ?? "the selected result";

  return {
    meaning: {
      badge: activeResult ? "Target aware" : "Waiting",
      description: activeResult
        ? `This panel explains ${selectedLabel} before the user commits to navigation.`
        : "This panel explains the selected result before the user commits to navigation.",
      tone: "default",
    },
    targetPath: {
      badge: activeResult ? "Route ready" : "No target",
      description:
        hasFocusedTarget || matchCount <= 3
          ? "The route is coordinated with the focused target and ready to compare."
          : "The route stays below meaning until a focused target becomes strong enough to move first.",
      tone: activeResult ? "emerald" : "default",
    },
    moreInfo: {
      badge: activeResult ? "Context ready" : "Helper",
      description: activeResult
        ? `The final helper layer is ready to explain nearby context for ${selectedLabel}.`
        : "The final helper layer stays available after search, selection, meaning, and route guidance.",
      tone: "default",
    },
  };
}