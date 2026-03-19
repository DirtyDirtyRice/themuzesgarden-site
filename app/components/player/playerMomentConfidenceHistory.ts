import {
  buildConfidenceHistoryPoint,
  buildMomentConfidenceHistory,
} from "./playerMomentConfidenceHistory.builders";

import type {
  BuildConfidenceHistoryParams,
  BuildConfidenceHistoryPointParams,
  ConfidenceHistoryPoint,
  ConfidenceHistoryResult,
  ConfidenceHistoryTrend,
} from "./playerMomentConfidenceHistory.types";

/*
Confidence History Engine — Public API

This file exposes the stable entry points for confidence history point creation
and confidence history aggregation while keeping builder internals private.
*/

export type {
  BuildConfidenceHistoryParams,
  BuildConfidenceHistoryPointParams,
  ConfidenceHistoryPoint,
  ConfidenceHistoryResult,
  ConfidenceHistoryTrend,
} from "./playerMomentConfidenceHistory.types";

export function buildMomentConfidenceHistoryPoint(
  params: BuildConfidenceHistoryPointParams
): ConfidenceHistoryPoint {
  return buildConfidenceHistoryPoint(params);
}

export function buildMomentConfidenceHistoryResult(
  params: BuildConfidenceHistoryParams
): ConfidenceHistoryResult {
  return buildMomentConfidenceHistory(params);
}