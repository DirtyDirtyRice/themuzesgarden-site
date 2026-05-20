"use client";

import {
  createTrackMatcherLaneIntelligenceSummary,
  getTrackMatcherLaneIntelligenceSignalsByDomain,
} from "./trackMatcherLaneIntelligenceHelpers";
import {
  getTrackMatcherLaneIntelligenceDomainLabel,
  type TrackMatcherLaneIntelligenceDomain,
  type TrackMatcherLaneIntelligenceSignal,
} from "./trackMatcherLaneIntelligenceTypes";

export function describeTrackMatcherLaneIntelligenceSignal(
  signal: TrackMatcherLaneIntelligenceSignal,
) {
  return `${signal.title}: ${signal.description}`;
}

export function describeTrackMatcherLaneIntelligenceFutureUse(
  signal: TrackMatcherLaneIntelligenceSignal,
) {
  return `${signal.title} — ${signal.futureUse}`;
}

export function describeTrackMatcherLaneIntelligenceDomain(
  domain: TrackMatcherLaneIntelligenceDomain,
) {
  const signals = getTrackMatcherLaneIntelligenceSignalsByDomain(domain);
  const label = getTrackMatcherLaneIntelligenceDomainLabel(domain);

  if (signals.length === 0) {
    return `${label} intelligence is reserved for a future Track Matcher lane pass.`;
  }

  return `${label} intelligence currently has ${signals.length} mapped signal${
    signals.length === 1 ? "" : "s"
  }.`;
}

export function describeTrackMatcherLaneIntelligenceSummary() {
  const summary = createTrackMatcherLaneIntelligenceSummary();

  return [
    `${summary.totalSignals} total lane intelligence signals are mapped.`,
    `${summary.activeSignals} are active today.`,
    `${summary.plannedSignals} are planned for future architecture work.`,
    `${summary.coreSignals} are core comparison signals.`,
    `${summary.futureSignals} are future-facing AI or generation signals.`,
  ].join(" ");
}

export function getTrackMatcherLaneIntelligenceNextFocus() {
  const summary = createTrackMatcherLaneIntelligenceSummary();

  if (summary.activeSignals < 4) {
    return "Strengthen active Deck A and Deck B comparison signals first.";
  }

  if (summary.plannedSignals > summary.activeSignals) {
    return "Convert planned reference, stem, and generated-candidate signals into real lane adapters.";
  }

  return "Begin wiring lane intelligence summaries into reusable UI panels.";
}