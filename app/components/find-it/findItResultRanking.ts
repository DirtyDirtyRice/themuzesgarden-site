import type { NavigationSearchResult } from "@/lib/navigation/navigationSearch";

import type { FindItResultSource } from "./FindItSearchControllerTypes";

export function getFindItResultLabel(result: NavigationSearchResult | null) {
  return result?.node.label ?? null;
}

export function getFindItResultId(result: NavigationSearchResult | null) {
  return result?.node.id ?? null;
}

export function getComparableFindItResultScore(
  result: NavigationSearchResult,
) {
  return result.score + result.contextBoost;
}

export function getFindItResultPriority(result: NavigationSearchResult) {
  if (result.node.href?.startsWith("/metadata/")) {
    return 2;
  }

  if (result.node.href?.startsWith("/about/")) {
    return 1;
  }

  return 0;
}

export function getFindItResultSource(
  result: NavigationSearchResult,
): FindItResultSource {
  if (result.node.href?.startsWith("/metadata/")) {
    return "metadata";
  }

  return "navigation";
}

export function getFindItResultSourceWeight(source: FindItResultSource) {
  if (source === "metadata") {
    return 2;
  }

  if (source === "navigation") {
    return 1;
  }

  return 0;
}

export function shouldReplaceFindItMergedResult({
  existingResult,
  nextResult,
}: {
  existingResult: NavigationSearchResult;
  nextResult: NavigationSearchResult;
}) {
  const existingScore = getComparableFindItResultScore(existingResult);
  const nextScore = getComparableFindItResultScore(nextResult);

  if (nextScore !== existingScore) {
    return nextScore > existingScore;
  }

  if (getFindItResultPriority(nextResult) !== getFindItResultPriority(existingResult)) {
    return getFindItResultPriority(nextResult) > getFindItResultPriority(existingResult);
  }

  return (
    getFindItResultSourceWeight(getFindItResultSource(nextResult)) >
    getFindItResultSourceWeight(getFindItResultSource(existingResult))
  );
}

export function sortFindItResults(
  first: NavigationSearchResult,
  second: NavigationSearchResult,
) {
  const secondScore = getComparableFindItResultScore(second);
  const firstScore = getComparableFindItResultScore(first);

  if (secondScore !== firstScore) {
    return secondScore - firstScore;
  }

  const priorityDifference =
    getFindItResultPriority(second) - getFindItResultPriority(first);

  if (priorityDifference !== 0) {
    return priorityDifference;
  }

  const sourceDifference =
    getFindItResultSourceWeight(getFindItResultSource(second)) -
    getFindItResultSourceWeight(getFindItResultSource(first));

  if (sourceDifference !== 0) {
    return sourceDifference;
  }

  return first.node.label.localeCompare(second.node.label);
}