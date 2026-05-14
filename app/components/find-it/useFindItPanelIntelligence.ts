import { useEffect, useMemo, useRef, useState } from "react";
import type { NavigationSearchResult } from "@/lib/navigation/navigationSearch";

import {
  createFindItLayerBadges,
  createFindItPanelSyncSnapshot,
  type FindItPanelLayerBadge,
  type FindItPanelSyncSnapshot,
  type FindItSectionStatesInput,
} from "./findItPanelCrossPanelSync";
import {
  appendFindItEvent,
  createFindItEvent,
  type FindItPanelIntelligenceEvent,
} from "./findItPanelIntelligenceEvents";
import {
  createBehaviorSnapshot,
  type FindItPanelBehaviorSnapshot,
} from "./findItPanelBehaviorLearning";
import {
  createDecisionSnapshot,
  type FindItPanelDecisionSnapshot,
} from "./findItPanelDecisionEngine";
import {
  createFocusSnapshot,
  type FindItPanelFocusSnapshot,
} from "./findItPanelFocusModel";

export type FindItPanelIntelligence = {
  behavior: FindItPanelBehaviorSnapshot;
  decisions: FindItPanelDecisionSnapshot;
  focus: FindItPanelFocusSnapshot;
  layerBadges: {
    meaning: FindItPanelLayerBadge;
    targetPath: FindItPanelLayerBadge;
    moreInfo: FindItPanelLayerBadge;
  };
  sync: FindItPanelSyncSnapshot;
  headline: string;
  summary: string;
};

function getNextEvent({
  activeResult,
  decisions,
  hasFocusedTarget,
  hasSearchText,
  isWaitingForDebounce,
  matchCount,
  pathname,
  previousNodeId,
  previousPathname,
}: {
  activeResult: NavigationSearchResult | null;
  decisions: FindItPanelDecisionSnapshot;
  hasFocusedTarget: boolean;
  hasSearchText: boolean;
  isWaitingForDebounce: boolean;
  matchCount: number;
  pathname: string;
  previousNodeId: string | null;
  previousPathname: string | null;
}): FindItPanelIntelligenceEvent | null {
  if (previousPathname && previousPathname !== pathname) {
    return createFindItEvent({
      kind: "route_context_changed",
      label: "Route context changed",
      detail: `Current page moved from ${previousPathname} to ${pathname}.`,
    });
  }

  if (!hasSearchText) {
    return null;
  }

  if (isWaitingForDebounce) {
    return createFindItEvent({
      kind: "debounce_waiting",
      label: "Search settling",
      detail: "Search input changed and results are waiting for debounce.",
    });
  }

  if (matchCount === 0) {
    return createFindItEvent({
      kind: "no_results",
      label: "No results",
      detail: "Search returned no matching targets.",
    });
  }

  if (decisions.shouldPromoteTargetPath && activeResult) {
    return createFindItEvent({
      kind: "layout_promoted",
      label: "Path promoted",
      detail: `${activeResult.node.label} is strong enough to move route guidance higher.`,
    });
  }

  if (decisions.shouldLockMeaning && activeResult) {
    return createFindItEvent({
      kind: "meaning_locked",
      label: "Meaning locked",
      detail: `Meaning layer is locked to ${activeResult.node.label}.`,
    });
  }

  if (activeResult && previousNodeId && previousNodeId !== activeResult.node.id) {
    return createFindItEvent({
      kind: "target_changed",
      label: "Target changed",
      detail: `Selected target changed to ${activeResult.node.label}.`,
    });
  }

  if (hasFocusedTarget && activeResult) {
    return createFindItEvent({
      kind: "focused_target",
      label: "Focused target",
      detail: `${activeResult.node.label} is strong enough for promoted path guidance.`,
    });
  }

  return createFindItEvent({
    kind: "results_ready",
    label: "Results ready",
    detail: `${matchCount} result${matchCount === 1 ? "" : "s"} available.`,
  });
}

function getHeadline(sync: FindItPanelSyncSnapshot, decisions: FindItPanelDecisionSnapshot) {
  if (decisions.shouldPromoteTargetPath) {
    return "Cross-panel intelligence promoted the path";
  }

  if (decisions.shouldLockMeaning) {
    return "Cross-panel intelligence locked the meaning layer";
  }

  if (sync.syncStrength === "strong") {
    return "Cross-panel intelligence is aligned";
  }

  if (sync.syncStrength === "medium") {
    return "Cross-panel intelligence is usable";
  }

  if (sync.syncStrength === "weak") {
    return "Cross-panel intelligence needs attention";
  }

  return "Cross-panel intelligence is waiting";
}

function getSummary({
  sync,
  behavior,
  focus,
  decisions,
}: {
  sync: FindItPanelSyncSnapshot;
  behavior: FindItPanelBehaviorSnapshot;
  focus: FindItPanelFocusSnapshot;
  decisions: FindItPanelDecisionSnapshot;
}) {
  return `${decisions.decisionMessage} ${sync.syncMessage} Focus: ${focus.focusLabel}. Behavior: ${behavior.behaviorLabel}.`;
}

export function useFindItPanelIntelligence({
  activeResult,
  cleanSearchValue,
  hasFocusedTarget,
  hasSearchText,
  isWaitingForDebounce,
  matches,
  pathname,
  safeSelectedIndex,
  searchValue,
  sectionStates,
}: {
  activeResult: NavigationSearchResult | null;
  cleanSearchValue: string;
  hasFocusedTarget: boolean;
  hasSearchText: boolean;
  isWaitingForDebounce: boolean;
  matches: NavigationSearchResult[];
  pathname: string;
  safeSelectedIndex: number;
  searchValue: string;
  sectionStates: FindItSectionStatesInput;
}): FindItPanelIntelligence {
  const [events, setEvents] = useState<FindItPanelIntelligenceEvent[]>([]);
  const previousNodeIdRef = useRef<string | null>(null);
  const previousPathnameRef = useRef<string | null>(null);

  const matchCount = matches.length;
  const activeNodeId = activeResult?.node.id ?? null;

  const decisions = useMemo(
    () =>
      createDecisionSnapshot({
        activeResult,
        hasFocusedTarget,
        hasSearchText,
        isWaitingForDebounce,
        matchCount,
        safeSelectedIndex,
      }),
    [
      activeResult,
      hasFocusedTarget,
      hasSearchText,
      isWaitingForDebounce,
      matchCount,
      safeSelectedIndex,
    ],
  );

  useEffect(() => {
    const nextEvent = getNextEvent({
      activeResult,
      decisions,
      hasFocusedTarget,
      hasSearchText,
      isWaitingForDebounce,
      matchCount,
      pathname,
      previousNodeId: previousNodeIdRef.current,
      previousPathname: previousPathnameRef.current,
    });

    setEvents((currentEvents) => appendFindItEvent(currentEvents, nextEvent));

    previousNodeIdRef.current = activeNodeId;
    previousPathnameRef.current = pathname;
  }, [
    activeNodeId,
    activeResult,
    decisions,
    hasFocusedTarget,
    hasSearchText,
    isWaitingForDebounce,
    matchCount,
    pathname,
    searchValue,
  ]);

  const sync = useMemo(
    () =>
      createFindItPanelSyncSnapshot({
        activeResult,
        cleanSearchValue,
        hasFocusedTarget,
        hasSearchText,
        isWaitingForDebounce,
        matchCount,
        pathname,
        sectionStates,
      }),
    [
      activeResult,
      cleanSearchValue,
      hasFocusedTarget,
      hasSearchText,
      isWaitingForDebounce,
      matchCount,
      pathname,
      sectionStates,
    ],
  );

  const behavior = useMemo(() => createBehaviorSnapshot(events), [events]);

  const focus = useMemo(
    () =>
      createFocusSnapshot({
        activeResult,
        safeSelectedIndex,
        matchCount,
        hasFocusedTarget,
      }),
    [activeResult, hasFocusedTarget, matchCount, safeSelectedIndex],
  );

  const layerBadges = useMemo(
    () =>
      createFindItLayerBadges({
        activeResult,
        hasFocusedTarget: decisions.shouldPromoteTargetPath || hasFocusedTarget,
        matchCount,
      }),
    [activeResult, decisions.shouldPromoteTargetPath, hasFocusedTarget, matchCount],
  );

  const headline = getHeadline(sync, decisions);
  const summary = getSummary({ sync, behavior, focus, decisions });

  return {
    behavior,
    decisions,
    focus,
    layerBadges,
    sync,
    headline,
    summary,
  };
}