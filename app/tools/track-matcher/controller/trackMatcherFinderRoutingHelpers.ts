import { TRACK_MATCHER_FINDER_ROUTES } from "./trackMatcherFinderDestinationSeed";
import type {
  TrackMatcherFinderRoute,
  TrackMatcherFinderRouteDecision,
  TrackMatcherFinderRouteGroup,
  TrackMatcherFinderRoutePriority,
} from "./trackMatcherFinderRoutingTypes";
import type {
  TrackMatcherFinderDestination,
  TrackMatcherFinderTrackResult,
} from "./trackMatcherFinderTypes";

type RouteFitReason = {
  isAvailable: boolean;
  reason: string;
};

type RouteBoostBreakdown = {
  destinationHintBoost: number;
  nameMatchBoost: number;
  tagMatchBoost: number;
  typeFitBoost: number;
  priorityBoost: number;
};

function normalize(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replaceAll("_", " ")
    .replaceAll("-", " ");
}

function normalizeList(values: readonly unknown[]) {
  return values.map(normalize).filter(Boolean);
}

function hasAny(text: string, words: readonly string[]) {
  return words.some((word) => {
    const normalizedWord = normalize(word);
    return normalizedWord ? text.includes(normalizedWord) : false;
  });
}

function trackSearchText(track: TrackMatcherFinderTrackResult) {
  return normalizeList([
    track.title,
    track.artist,
    track.description,
    track.source,
    ...track.tags,
    ...track.destinationHints,
  ]).join(" ");
}

function trackIsFullSong(track: TrackMatcherFinderTrackResult) {
  return (
    !track.isStem &&
    !track.isHybridCandidate &&
    !normalize(track.title).includes("stem") &&
    !normalize(track.description).includes("stem")
  );
}

function routeAcceptsTrack(
  route: TrackMatcherFinderRoute,
  track: TrackMatcherFinderTrackResult,
) {
  if (track.isStem && !route.acceptsStem) return false;
  if (track.isInstrumental && !route.acceptsInstrumental) return false;
  if (track.isReferenceSong && !route.acceptsReference) return false;
  if (track.isHybridCandidate && !route.acceptsHybrid) return false;
  if (trackIsFullSong(track) && !route.acceptsFullSong) return false;
  return true;
}

function getDestinationHintBoost(
  track: TrackMatcherFinderTrackResult,
  destination: TrackMatcherFinderDestination,
) {
  return track.destinationHints.includes(destination) ? 50 : 0;
}

function getNameMatchBoost(
  track: TrackMatcherFinderTrackResult,
  route: TrackMatcherFinderRoute,
) {
  const text = trackSearchText(track);
  let boost = 0;

  if (route.destination === "bass" && hasAny(text, ["bass", "bassline", "low end", "low-end"])) {
    boost += 44;
  }

  if (route.destination === "drums" && hasAny(text, ["drum", "drums", "beat", "rhythm", "groove"])) {
    boost += 44;
  }

  if (route.destination === "vocal" && hasAny(text, ["vocal", "vocals", "voice", "sung", "chant"])) {
    boost += 44;
  }

  if (route.destination === "melody" && hasAny(text, ["melody", "hook", "lead", "topline", "top line"])) {
    boost += 44;
  }

  if (route.destination === "harmony" && hasAny(text, ["harmony", "chord", "chords", "pad", "stack"])) {
    boost += 40;
  }

  if (route.destination === "instrument" && hasAny(text, ["instrument", "guitar", "keys", "piano", "synth", "riff"])) {
    boost += 38;
  }

  if (route.destination === "stem" && hasAny(text, ["stem", "stems", "isolated", "separated"])) {
    boost += 38;
  }

  if (route.destination === "hybrid" && hasAny(text, ["hybrid", "blend", "combo", "candidate", "mashup"])) {
    boost += 46;
  }

  if (route.destination === "reference-song" && hasAny(text, ["reference", "sounds like", "sounds-like", "inspiration"])) {
    boost += 46;
  }

  if (route.destination === "analysis" && hasAny(text, ["analysis", "analyze", "diagnostic", "review", "score"])) {
    boost += 36;
  }

  if (route.destination === "original-idea" && hasAny(text, ["original", "idea", "sketch", "rough", "seed"])) {
    boost += 34;
  }

  if (route.destination === "suno-result" && hasAny(text, ["suno", "generated", "ai generated"])) {
    boost += 34;
  }

  return boost;
}

function getTagMatchBoost(
  track: TrackMatcherFinderTrackResult,
  route: TrackMatcherFinderRoute,
) {
  const tags = normalizeList(track.tags);
  let boost = 0;

  if (tags.includes(normalize(route.shortLabel))) boost += 28;
  if (tags.includes(normalize(route.destination))) boost += 24;

  if (route.intent === "deck-load" && tags.some((tag) => ["keeper", "reference", "final", "master"].includes(tag))) {
    boost += 16;
  }

  if (route.intent === "lane-load" && tags.some((tag) => ["stem", "instrumental", "hook", "groove"].includes(tag))) {
    boost += 18;
  }

  if (route.intent === "reference-load" && tags.some((tag) => ["reference", "sounds like", "inspiration"].includes(tag))) {
    boost += 20;
  }

  if (route.intent === "hybrid-load" && tags.some((tag) => ["hybrid", "blend", "candidate"].includes(tag))) {
    boost += 20;
  }

  if (route.intent === "analysis-load" && tags.some((tag) => ["analysis", "review", "problem", "diagnostic"].includes(tag))) {
    boost += 18;
  }

  return boost;
}

function getTypeFitBoost(
  track: TrackMatcherFinderTrackResult,
  route: TrackMatcherFinderRoute,
) {
  let boost = 0;

  if (track.isStem && route.acceptsStem) boost += 12;
  if (track.isInstrumental && route.acceptsInstrumental) boost += 10;
  if (track.isReferenceSong && route.acceptsReference) boost += 14;
  if (track.isHybridCandidate && route.acceptsHybrid) boost += 14;
  if (trackIsFullSong(track) && route.acceptsFullSong) boost += 8;

  if (route.destination === "track-a" || route.destination === "track-b") {
    boost += track.audioUrl ? 18 : 0;
  }

  return boost;
}

function getPriorityBoost(priority: TrackMatcherFinderRoutePriority) {
  if (priority === "primary") return 30;
  if (priority === "recommended") return 20;
  if (priority === "optional") return 5;
  return 0;
}

function getRouteFitReason(
  route: TrackMatcherFinderRoute,
  track: TrackMatcherFinderTrackResult,
): RouteFitReason {
  if (track.isStem && !route.acceptsStem) {
    return {
      isAvailable: false,
      reason: "This destination does not accept stems yet.",
    };
  }

  if (track.isInstrumental && !route.acceptsInstrumental) {
    return {
      isAvailable: false,
      reason: "This destination does not accept instrumental results yet.",
    };
  }

  if (track.isReferenceSong && !route.acceptsReference) {
    return {
      isAvailable: false,
      reason: "This destination does not accept reference songs yet.",
    };
  }

  if (track.isHybridCandidate && !route.acceptsHybrid) {
    return {
      isAvailable: false,
      reason: "This destination does not accept hybrid candidates yet.",
    };
  }

  if (trackIsFullSong(track) && !route.acceptsFullSong) {
    return {
      isAvailable: false,
      reason: "This destination is intended for parts, stems, or lane material rather than full songs.",
    };
  }

  return {
    isAvailable: true,
    reason: "Good fit for this result.",
  };
}

function getRouteStatusReason(route: TrackMatcherFinderRoute) {
  if (route.status === "ready") return "Ready now.";
  if (route.status === "future") return "Planned route. Safe to show, not wired yet.";
  if (route.status === "needs-review") return "Needs review before final wiring.";
  return "Blocked route.";
}

function getRouteReason(
  route: TrackMatcherFinderRoute,
  track: TrackMatcherFinderTrackResult,
  isAvailable: boolean,
) {
  if (!isAvailable) {
    return getRouteFitReason(route, track).reason;
  }

  return getRouteStatusReason(route);
}

function getBoostBreakdown(
  track: TrackMatcherFinderTrackResult,
  route: TrackMatcherFinderRoute,
): RouteBoostBreakdown {
  return {
    destinationHintBoost: getDestinationHintBoost(track, route.destination),
    nameMatchBoost: getNameMatchBoost(track, route),
    tagMatchBoost: getTagMatchBoost(track, route),
    typeFitBoost: getTypeFitBoost(track, route),
    priorityBoost: getPriorityBoost(route.priority),
  };
}

function getTotalBoost(breakdown: RouteBoostBreakdown) {
  return (
    breakdown.destinationHintBoost +
    breakdown.nameMatchBoost +
    breakdown.tagMatchBoost +
    breakdown.typeFitBoost +
    breakdown.priorityBoost
  );
}

function compareRouteDecisions(
  a: TrackMatcherFinderRouteDecision,
  b: TrackMatcherFinderRouteDecision,
) {
  if (a.isAvailable !== b.isAvailable) return a.isAvailable ? -1 : 1;
  if (a.isRecommended !== b.isRecommended) return a.isRecommended ? -1 : 1;
  if (a.route.status !== b.route.status) {
    if (a.route.status === "ready") return -1;
    if (b.route.status === "ready") return 1;
  }
  if (a.scoreBoost !== b.scoreBoost) return b.scoreBoost - a.scoreBoost;
  if (a.route.priority !== b.route.priority) {
    if (a.route.priority === "primary") return -1;
    if (b.route.priority === "primary") return 1;
    if (a.route.priority === "recommended") return -1;
    if (b.route.priority === "recommended") return 1;
  }
  return a.route.label.localeCompare(b.route.label);
}

export function getTrackMatcherFinderRouteByDestination(
  destination: TrackMatcherFinderDestination,
) {
  return TRACK_MATCHER_FINDER_ROUTES.find(
    (route) => route.destination === destination,
  );
}

export function buildTrackMatcherFinderRouteDecision(
  track: TrackMatcherFinderTrackResult,
  route: TrackMatcherFinderRoute,
): TrackMatcherFinderRouteDecision {
  const fit = getRouteFitReason(route, track);
  const isAvailable = fit.isAvailable && routeAcceptsTrack(route, track);
  const breakdown = getBoostBreakdown(track, route);
  const scoreBoost = getTotalBoost(breakdown);
  const isRecommended =
    isAvailable &&
    route.priority !== "hidden" &&
    (scoreBoost >= 48 || track.destinationHints.includes(route.destination));

  return {
    route,
    track,
    isAvailable,
    isRecommended,
    reason: getRouteReason(route, track, isAvailable),
    scoreBoost,
  };
}

export function buildTrackMatcherFinderRouteDecisions(
  track: TrackMatcherFinderTrackResult,
) {
  return TRACK_MATCHER_FINDER_ROUTES.map((route) =>
    buildTrackMatcherFinderRouteDecision(track, route),
  ).sort(compareRouteDecisions);
}

export function getRecommendedTrackMatcherFinderRoutes(
  track: TrackMatcherFinderTrackResult,
) {
  return buildTrackMatcherFinderRouteDecisions(track).filter(
    (decision) => decision.isAvailable && decision.isRecommended,
  );
}

export function getVisibleTrackMatcherFinderRoutes(
  track: TrackMatcherFinderTrackResult,
) {
  return buildTrackMatcherFinderRouteDecisions(track).filter(
    (decision) => decision.route.priority !== "hidden",
  );
}

export function getReadyTrackMatcherFinderRouteDecisions(
  track: TrackMatcherFinderTrackResult,
) {
  return buildTrackMatcherFinderRouteDecisions(track).filter(
    (decision) => decision.isAvailable && decision.route.status === "ready",
  );
}

export function getFutureTrackMatcherFinderRouteDecisions(
  track: TrackMatcherFinderTrackResult,
) {
  return buildTrackMatcherFinderRouteDecisions(track).filter(
    (decision) => decision.route.status === "future",
  );
}

export function getBestTrackMatcherFinderRouteDecision(
  track: TrackMatcherFinderTrackResult,
) {
  return buildTrackMatcherFinderRouteDecisions(track)[0] ?? null;
}

export function describeTrackMatcherFinderRouteDecision(
  decision: TrackMatcherFinderRouteDecision,
) {
  if (!decision.isAvailable) return decision.reason;
  if (decision.route.status !== "ready") return getRouteStatusReason(decision.route);
  if (decision.isRecommended) {
    return `Recommended for ${decision.route.shortLabel}.`;
  }

  return `Available for ${decision.route.shortLabel}.`;
}

export function groupTrackMatcherFinderRoutes(
  routes: readonly TrackMatcherFinderRoute[],
): TrackMatcherFinderRouteGroup[] {
  return [
    {
      id: "decks",
      label: "Decks",
      detail: "Direct comparison loading.",
      routes: routes.filter((route) => route.intent === "deck-load"),
    },
    {
      id: "lanes",
      label: "Lanes",
      detail: "Musical lane loading.",
      routes: routes.filter((route) => route.intent === "lane-load"),
    },
    {
      id: "support",
      label: "Support",
      detail: "Reference, hybrid, and analysis loading.",
      routes: routes.filter(
        (route) =>
          route.intent === "reference-load" ||
          route.intent === "hybrid-load" ||
          route.intent === "analysis-load",
      ),
    },
  ].filter((group) => group.routes.length > 0);
}

export function groupTrackMatcherFinderRouteDecisions(
  decisions: readonly TrackMatcherFinderRouteDecision[],
) {
  const groupedRoutes = groupTrackMatcherFinderRoutes(
    decisions.map((decision) => decision.route),
  );

  return groupedRoutes.map((group) => ({
    ...group,
    decisions: decisions.filter((decision) =>
      group.routes.some(
        (route) => route.destination === decision.route.destination,
      ),
    ),
  }));
}
