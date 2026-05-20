"use client";

import {
  createTrackMatcherDynamicLaneSummary,
  getTrackMatcherGenerationDynamicLanes,
  getTrackMatcherHiddenDynamicLanes,
  getTrackMatcherVisibleDynamicLanes,
} from "./trackMatcherDynamicLaneHelpers";

export function describeTrackMatcherDynamicLaneSystem() {
  const summary = createTrackMatcherDynamicLaneSummary();

  return [
    `${summary.total} dynamic lanes are registered.`,
    `${summary.visibleCount} are visible.`,
    `${summary.hiddenCount} are hidden future lanes.`,
    `${summary.analysisCount} support analysis workflows.`,
    `${summary.generationCount} support future generation workflows.`,
  ].join(" ");
}

export function describeTrackMatcherVisibleDynamicLanes() {
  const lanes = getTrackMatcherVisibleDynamicLanes();

  if (lanes.length === 0) {
    return "No visible dynamic lanes are currently active.";
  }

  return `Visible lanes: ${lanes.map((lane) => lane.title).join(", ")}.`;
}

export function describeTrackMatcherHiddenDynamicLanes() {
  const lanes = getTrackMatcherHiddenDynamicLanes();

  if (lanes.length === 0) {
    return "No hidden future lanes are registered.";
  }

  return `Hidden future lanes: ${lanes
    .map((lane) => lane.title)
    .join(", ")}.`;
}

export function describeTrackMatcherGenerationDynamicLanes() {
  const lanes = getTrackMatcherGenerationDynamicLanes();

  if (lanes.length === 0) {
    return "No generation-capable lanes are registered.";
  }

  return `Generation-capable lanes: ${lanes
    .map((lane) => lane.title)
    .join(", ")}.`;
}

export function getTrackMatcherDynamicLaneNextFocus() {
  const hiddenLanes = getTrackMatcherHiddenDynamicLanes();

  if (hiddenLanes.length > 0) {
    return "Begin wiring hidden lanes into registry-driven rendering paths.";
  }

  return "Expand active dynamic lane orchestration.";
}