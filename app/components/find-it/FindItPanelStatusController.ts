import type { NavigationSearchResult } from "@/lib/navigation/navigationSearch";

import type {
  FindItCommandCenterModel,
  FindItPanelLayoutModel,
  FindItPanelModel,
  FindItPanelModelInput,
  FindItPanelPhase,
  FindItPanelSectionState,
  FindItSyncCard,
  FindItSystemStatus,
} from "./FindItPanelTypes";

export function getCleanSearchValue(searchValue: string) {
  return searchValue.trim();
}

export function getSelectedResult(
  matches: NavigationSearchResult[],
  safeSelectedIndex: number,
) {
  return matches[safeSelectedIndex] ?? matches[0] ?? null;
}

export function getResultKindLabel(result: NavigationSearchResult | null) {
  if (!result) {
    return "None";
  }

  const cleanKind = result.node.kind.replace(/_/g, " ");
  return cleanKind.charAt(0).toUpperCase() + cleanKind.slice(1);
}

export function getSearchDepthLabel(matchCount: number) {
  if (matchCount === 0) {
    return "No results";
  }

  if (matchCount === 1) {
    return "Single target";
  }

  if (matchCount <= 3) {
    return "Focused choices";
  }

  if (matchCount <= 8) {
    return "Compare mode";
  }

  return "Wide scan";
}

export function getPanelPhase({
  hasSearchText,
  isWaitingForDebounce,
  matchCount,
  selectedResult,
}: {
  hasSearchText: boolean;
  isWaitingForDebounce: boolean;
  matchCount: number;
  selectedResult: NavigationSearchResult | null;
}): FindItPanelPhase {
  if (!hasSearchText) {
    return {
      eyebrow: "Find It ready",
      headline: "Tell Find It what you are trying to reach.",
      body:
        "The search box, current page, results, meaning, path, and more-info preview are standing by.",
      nextStep: "Type one simple word first.",
    };
  }

  if (isWaitingForDebounce) {
    return {
      eyebrow: "Reading input",
      headline: "Find It is updating the result model.",
      body:
        "The controller is waiting for the search text to settle before syncing the panels.",
      nextStep: "Pause for the result list to refresh.",
    };
  }

  if (matchCount === 0) {
    return {
      eyebrow: "No match",
      headline: "Find It could not lock onto a destination yet.",
      body:
        "The system needs a broader or simpler term before it can coordinate path, meaning, and action.",
      nextStep: "Try metadata, projects, player, manual, generator, or scale.",
    };
  }

  if (!selectedResult) {
    return {
      eyebrow: "Selection needed",
      headline: "Results exist, but no target is active.",
      body:
        "The row list is available, but the target, meaning, and action systems need a selected result.",
      nextStep: "Click a result or use the arrow keys.",
    };
  }

  if (matchCount === 1) {
    return {
      eyebrow: "Direct route",
      headline: `"${selectedResult.node.label}" is the active destination.`,
      body:
        "All Find It panels can focus on one destination, so the route can be treated as a direct decision.",
      nextStep: "Check the path panel, then open when it looks right.",
    };
  }

  return {
    eyebrow: "Decision mode",
    headline: `"${selectedResult.node.label}" is the current selected candidate.`,
    body:
      "The system is coordinating multiple possible results. Use the selected row, meaning panel, and path panel together.",
    nextStep: "Compare before opening.",
  };
}

export function getSystemStatus({
  hasSearchText,
  isWaitingForDebounce,
  matchCount,
  selectedResult,
}: {
  hasSearchText: boolean;
  isWaitingForDebounce: boolean;
  matchCount: number;
  selectedResult: NavigationSearchResult | null;
}): FindItSystemStatus {
  if (!hasSearchText) {
    return {
      label: "Idle",
      detail: "Waiting for search text.",
      toneClasses: "border-white/10 bg-white/[0.03] text-white/60",
    };
  }

  if (isWaitingForDebounce) {
    return {
      label: "Updating",
      detail: "Input is settling before panels refresh.",
      toneClasses: "border-sky-300/30 bg-sky-300/10 text-sky-100/80",
    };
  }

  if (matchCount === 0) {
    return {
      label: "Needs broader search",
      detail: "No destination is available yet.",
      toneClasses: "border-amber-300/30 bg-amber-300/10 text-amber-100/80",
    };
  }

  if (!selectedResult) {
    return {
      label: "Needs selection",
      detail: "Results exist but no active target is synced.",
      toneClasses: "border-amber-300/30 bg-amber-300/10 text-amber-100/80",
    };
  }

  return {
    label: "Synced",
    detail: "Results, meaning, target path, and actions are aligned.",
    toneClasses: "border-emerald-300/30 bg-emerald-300/10 text-emerald-100/80",
  };
}

export function getPrimaryLayoutModel(
  hasFocusedTarget: boolean,
): FindItPanelLayoutModel {
  if (hasFocusedTarget) {
    return {
      label: "Target-first layout",
      copy:
        "A selected destination exists, so the route appears before the result comparison area.",
      targetFirst: true,
    };
  }

  return {
    label: "Search-first layout",
    copy:
      "No destination has taken priority yet, so results and current-page context stay first.",
    targetFirst: false,
  };
}

export function getSyncCards({
  hasSearchText,
  isWaitingForDebounce,
  matchCount,
  safeSelectedIndex,
  selectedResult,
}: {
  hasSearchText: boolean;
  isWaitingForDebounce: boolean;
  matchCount: number;
  safeSelectedIndex: number;
  selectedResult: NavigationSearchResult | null;
}): FindItSyncCard[] {
  return [
    {
      title: "Search",
      value: hasSearchText ? "Active" : "Waiting",
      detail: isWaitingForDebounce
        ? "Input is settling."
        : hasSearchText
          ? "Search text is feeding the controller."
          : "Type to begin.",
    },
    {
      title: "Results",
      value: getSearchDepthLabel(matchCount),
      detail:
        matchCount > 0
          ? `${matchCount} destination${matchCount === 1 ? "" : "s"} available.`
          : "No destinations are available yet.",
    },
    {
      title: "Selection",
      value: selectedResult ? `#${safeSelectedIndex + 1}` : "None",
      detail: selectedResult
        ? selectedResult.node.label
        : "No result is selected yet.",
    },
    {
      title: "Type",
      value: getResultKindLabel(selectedResult),
      detail: selectedResult
        ? "Used by meaning, path, and action previews."
        : "Will appear after selection.",
    },
  ];
}

export function getCommandStripCopy({
  hasSearchText,
  isWaitingForDebounce,
  matchCount,
  selectedResult,
}: {
  hasSearchText: boolean;
  isWaitingForDebounce: boolean;
  matchCount: number;
  selectedResult: NavigationSearchResult | null;
}) {
  if (!hasSearchText) {
    return "Command flow: type → inspect results → select target → confirm path → open.";
  }

  if (isWaitingForDebounce) {
    return "Command flow: input is updating, then the full panel stack will resync.";
  }

  if (matchCount === 0) {
    return "Command flow: broaden the search before selecting a destination.";
  }

  if (!selectedResult) {
    return "Command flow: choose a row so the other panels know what to explain.";
  }

  return `Command flow: "${selectedResult.node.label}" is driving the result, meaning, path, and action panels.`;
}

export function getPanelSectionStates({
  hasFocusedTarget,
  hasSearchText,
  isWaitingForDebounce,
  matchCount,
  selectedResult,
}: {
  hasFocusedTarget: boolean;
  hasSearchText: boolean;
  isWaitingForDebounce: boolean;
  matchCount: number;
  selectedResult: NavigationSearchResult | null;
}): FindItPanelSectionState[] {
  return [
    {
      name: "command",
      label: "Command",
      isActive: true,
      detail: "Always explains what Find It is doing.",
    },
    {
      name: "search",
      label: "Search",
      isActive: hasSearchText || isWaitingForDebounce,
      detail: hasSearchText ? "Search is active." : "Waiting for text.",
    },
    {
      name: "target",
      label: "Target",
      isActive: !!selectedResult,
      detail: hasFocusedTarget
        ? "Target path is promoted."
        : "Target path stays in standard order.",
    },
    {
      name: "grid",
      label: "Results",
      isActive: matchCount > 0,
      detail:
        matchCount > 0
          ? "Rows are available for comparison."
          : "Rows will appear after matching.",
    },
    {
      name: "meaning",
      label: "Meaning",
      isActive: !!selectedResult,
      detail: selectedResult
        ? "Meaning layer can explain the target."
        : "Meaning layer needs a target.",
    },
    {
      name: "moreInfo",
      label: "More info",
      isActive: true,
      detail: "Extra help stays available.",
    },
  ];
}

export function getCommandCenterModel({
  cleanSearchValue,
  hasSearchText,
  isWaitingForDebounce,
  matchCount,
  safeSelectedIndex,
  selectedResult,
}: {
  cleanSearchValue: string;
  hasSearchText: boolean;
  isWaitingForDebounce: boolean;
  matchCount: number;
  safeSelectedIndex: number;
  selectedResult: NavigationSearchResult | null;
}): FindItCommandCenterModel {
  return {
    phase: getPanelPhase({
      hasSearchText,
      isWaitingForDebounce,
      matchCount,
      selectedResult,
    }),
    status: getSystemStatus({
      hasSearchText,
      isWaitingForDebounce,
      matchCount,
      selectedResult,
    }),
    syncCards: getSyncCards({
      hasSearchText,
      isWaitingForDebounce,
      matchCount,
      safeSelectedIndex,
      selectedResult,
    }),
    commandStripCopy: getCommandStripCopy({
      hasSearchText,
      isWaitingForDebounce,
      matchCount,
      selectedResult,
    }),
    cleanSearchValue,
  };
}

export function buildFindItPanelModel({
  hasFocusedTarget,
  hasSearchText,
  isWaitingForDebounce,
  matches,
  safeSelectedIndex,
  searchValue,
  selectedResult,
}: FindItPanelModelInput): FindItPanelModel {
  const cleanSearchValue = getCleanSearchValue(searchValue);
  const activeResult =
    selectedResult ?? getSelectedResult(matches, safeSelectedIndex);
  const matchCount = matches.length;

  return {
    activeResult,
    cleanSearchValue,
    commandCenter: getCommandCenterModel({
      cleanSearchValue,
      hasSearchText,
      isWaitingForDebounce,
      matchCount,
      safeSelectedIndex,
      selectedResult: activeResult,
    }),
    layout: getPrimaryLayoutModel(hasFocusedTarget),
    matchCount,
    resultKindLabel: getResultKindLabel(activeResult),
  };
}