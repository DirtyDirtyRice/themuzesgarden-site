import {
  buildTrackMatcherFinderRouteDecisions,
  getTrackMatcherFinderRouteByDestination,
} from "./trackMatcherFinderRoutingHelpers";
import type {
  TrackMatcherFinderCommand,
  TrackMatcherFinderCommandKind,
} from "./trackMatcherFinderRoutingTypes";
import type {
  TrackMatcherFinderDestination,
  TrackMatcherFinderTrackResult,
} from "./trackMatcherFinderTypes";

function getCommandKind(
  destination: TrackMatcherFinderDestination,
): TrackMatcherFinderCommandKind {
  if (destination === "track-a") return "load-track-a";
  if (destination === "track-b") return "load-track-b";
  if (destination === "reference-song") return "copy-reference";
  if (destination === "analysis") return "open-details";
  if (
    destination === "melody" ||
    destination === "harmony" ||
    destination === "drums" ||
    destination === "bass" ||
    destination === "vocal" ||
    destination === "instrument" ||
    destination === "stem" ||
    destination === "hybrid"
  ) {
    return "load-lane";
  }

  return "future-action";
}

function buildCommandId(
  track: TrackMatcherFinderTrackResult,
  destination: TrackMatcherFinderDestination,
) {
  return `${track.id}::${destination}`;
}

export function buildTrackMatcherFinderCommand(
  track: TrackMatcherFinderTrackResult,
  destination: TrackMatcherFinderDestination,
): TrackMatcherFinderCommand | null {
  const route = getTrackMatcherFinderRouteByDestination(destination);
  if (!route) return null;

  const decision = buildTrackMatcherFinderRouteDecisions(track).find(
    (item) => item.route.destination === destination,
  );

  const disabled = !decision?.isAvailable || route.status !== "ready";

  return {
    id: buildCommandId(track, destination),
    kind: getCommandKind(destination),
    trackId: track.id,
    destination,
    label: route.label,
    detail: route.detail,
    disabled,
    disabledReason: disabled
      ? decision?.reason ?? "This route is not available yet."
      : undefined,
  };
}

export function buildTrackMatcherFinderCommands(
  track: TrackMatcherFinderTrackResult,
): TrackMatcherFinderCommand[] {
  return buildTrackMatcherFinderRouteDecisions(track)
    .map((decision) =>
      buildTrackMatcherFinderCommand(track, decision.route.destination),
    )
    .filter((command): command is TrackMatcherFinderCommand =>
      Boolean(command),
    );
}

export function getReadyTrackMatcherFinderCommands(
  track: TrackMatcherFinderTrackResult,
) {
  return buildTrackMatcherFinderCommands(track).filter(
    (command) => !command.disabled,
  );
}

export function getFutureTrackMatcherFinderCommands(
  track: TrackMatcherFinderTrackResult,
) {
  return buildTrackMatcherFinderCommands(track).filter(
    (command) => command.disabled,
  );
}

export function describeTrackMatcherFinderCommand(
  command: TrackMatcherFinderCommand,
) {
  if (command.disabled) {
    return command.disabledReason ?? "Not wired yet.";
  }

  if (command.kind === "load-track-a") return "Loads this result into Track A.";
  if (command.kind === "load-track-b") return "Loads this result into Track B.";
  if (command.kind === "load-lane") return "Loads this result into a lane.";
  if (command.kind === "copy-reference") return "Marks this as a reference.";
  if (command.kind === "open-details") return "Opens more analysis details.";

  return command.detail;
}