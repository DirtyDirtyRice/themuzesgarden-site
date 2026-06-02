import type { MultiTrackEngineState } from "../../engine/multiTrackEngineTypes";
import {
  MULTI_TRACK_INSIGHT_V2_EMPTY_STATE_CARD,
  MULTI_TRACK_INSIGHT_V2_SAFE_FOUNDATION_CARD,
} from "./MultiTrackInsightV2Seed";
import type { MultiTrackInsightV2Card } from "./MultiTrackInsightV2Types";

function createLoadedTrackInsight(engineState: MultiTrackEngineState): MultiTrackInsightV2Card {
  const trackALoaded = engineState.trackA.loaded;
  const trackBLoaded = engineState.trackB.loaded;

  if (!trackALoaded && !trackBLoaded) {
    return MULTI_TRACK_INSIGHT_V2_EMPTY_STATE_CARD;
  }

  if (trackALoaded && trackBLoaded) {
    return {
      id: "insight-v2-both-tracks-loaded",
      category: "track",
      severity: "good",
      title: "Both track lanes are loaded",
      detail: "Track A and Track B both have source material in engine state.",
      recommendation: "Review comparison, sync, and timeline readiness before saving.",
      actionLabel: "Compare lanes",
    };
  }

  return {
    id: "insight-v2-one-track-loaded",
    category: "track",
    severity: "warning",
    title: "Only one track lane is loaded",
    detail: trackALoaded
      ? "Track A is loaded, but Track B is still empty."
      : "Track B is loaded, but Track A is still empty.",
    recommendation: "Load the missing lane before judging match quality.",
    actionLabel: "Load missing lane",
  };
}

function createComparisonInsight(engineState: MultiTrackEngineState): MultiTrackInsightV2Card {
  const { comparison } = engineState;
  const readySignals = comparison.signals.filter((signal) => signal.ready).length;

  if (comparison.weightedScore >= 80) {
    return {
      id: "insight-v2-comparison-strong",
      category: "comparison",
      severity: "good",
      title: "Comparison confidence is strong",
      detail: `${comparison.strongestMatchLabel} is currently the strongest comparison signal.`,
      recommendation: "This comparison is approaching export-level confidence.",
      actionLabel: "Review export",
    };
  }

  if (comparison.weightedScore >= 60) {
    return {
      id: "insight-v2-comparison-save-ready",
      category: "comparison",
      severity: "info",
      title: "Comparison may be snapshot-ready",
      detail: `Weighted score is ${Math.round(comparison.weightedScore)} with ${readySignals} ready signal(s).`,
      recommendation: "Save a snapshot after checking warnings and timeline alignment.",
      actionLabel: "Review snapshot",
    };
  }

  return {
    id: "insight-v2-comparison-low",
    category: "comparison",
    severity: "warning",
    title: "Comparison confidence is low",
    detail: `Weighted score is ${Math.round(comparison.weightedScore)} and strongest signal is ${comparison.strongestMatchLabel}.`,
    recommendation: "Improve track readiness, tempo, key, waveform, or structure data before saving.",
    actionLabel: "Improve readiness",
  };
}

function createTimelineInsight(engineState: MultiTrackEngineState): MultiTrackInsightV2Card {
  const { timeline } = engineState;

  if (timeline.markers.length > 0 && timeline.cues.length > 0) {
    return {
      id: "insight-v2-timeline-has-structure",
      category: "timeline",
      severity: "good",
      title: "Timeline structure exists",
      detail: `${timeline.markers.length} marker(s) and ${timeline.cues.length} cue(s) are available.`,
      recommendation: "Use timeline structure as the next foundation for sync and comparison work.",
      actionLabel: "Prepare sync",
    };
  }

  if (timeline.markers.length > 0) {
    return {
      id: "insight-v2-timeline-markers-only",
      category: "timeline",
      severity: "info",
      title: "Timeline markers exist",
      detail: `${timeline.markers.length} marker(s) are available, but cues are limited.`,
      recommendation: "Add cues for downbeats, transitions, impacts, or vocals.",
      actionLabel: "Add cues",
    };
  }

  return {
    id: "insight-v2-timeline-empty",
    category: "timeline",
    severity: "warning",
    title: "Timeline structure is thin",
    detail: "No useful marker structure is available yet.",
    recommendation: "Add timeline markers before deeper sync decisions.",
    actionLabel: "Add markers",
  };
}

function createDecisionInsight(engineState: MultiTrackEngineState): MultiTrackInsightV2Card {
  const { decision } = engineState;

  return {
    id: `insight-v2-decision-${decision.route}`,
    category: "decision",
    severity: decision.readiness === "blocked" ? "blocked" : "info",
    title: `Decision route is ${decision.route}`,
    detail: decision.reason,
    recommendation: decision.canExport
      ? "Export is allowed by the current decision state."
      : decision.canSave
        ? "Snapshot saving is allowed, but export is not ready yet."
        : "Follow the primary action before attempting save or export.",
    actionLabel: decision.primaryActionLabel,
  };
}

function createFindingInsight(engineState: MultiTrackEngineState): MultiTrackInsightV2Card {
  const { analysis } = engineState;

  if (analysis.blockedCount > 0) {
    return {
      id: "insight-v2-blocked-findings",
      category: "workflow",
      severity: "blocked",
      title: "Blocked findings need attention",
      detail: `${analysis.blockedCount} blocked finding(s) are active.`,
      recommendation: "Resolve blocked items before continuing workstation expansion.",
      actionLabel: "Review blocks",
    };
  }

  if (analysis.warningCount > 0) {
    return {
      id: "insight-v2-warning-findings",
      category: "workflow",
      severity: "warning",
      title: "Warning findings are active",
      detail: `${analysis.warningCount} warning finding(s) are active.`,
      recommendation: "Review warnings before saving, exporting, or adding deeper automation.",
      actionLabel: "Review warnings",
    };
  }

  return {
    id: "insight-v2-findings-clean",
    category: "workflow",
    severity: "good",
    title: "No blocking findings",
    detail: `${analysis.findings.length} finding(s) are active, with no blocked warnings reported.`,
    recommendation: "Continue safe workstation growth from the current green foundation.",
    actionLabel: "Continue growth",
  };
}

function createSnapshotInsight(engineState: MultiTrackEngineState): MultiTrackInsightV2Card {
  if (engineState.snapshots.length > 0) {
    return {
      id: "insight-v2-snapshots-exist",
      category: "snapshot",
      severity: "good",
      title: "Snapshots are being captured",
      detail: `${engineState.snapshots.length} snapshot(s) exist in engine state.`,
      recommendation: "Build snapshot browsing after source and waveform panels mature.",
      actionLabel: "Review snapshots",
    };
  }

  return {
    id: "insight-v2-no-snapshots",
    category: "snapshot",
    severity: "info",
    title: "No snapshots saved yet",
    detail: "The engine has no saved comparison snapshots.",
    recommendation: "Save snapshots only after comparison confidence and readiness improve.",
    actionLabel: "Wait to save",
  };
}

export function buildMultiTrackInsightV2Cards(
  engineState: MultiTrackEngineState,
): MultiTrackInsightV2Card[] {
  return [
    MULTI_TRACK_INSIGHT_V2_SAFE_FOUNDATION_CARD,
    createLoadedTrackInsight(engineState),
    createComparisonInsight(engineState),
    createTimelineInsight(engineState),
    createDecisionInsight(engineState),
    createFindingInsight(engineState),
    createSnapshotInsight(engineState),
  ];
}