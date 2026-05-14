import type { NavigationSearchResult } from "@/lib/navigation/navigationSearch";

import type {
  FindItResultSource,
  FindItResultSourceSummary,
} from "./FindItSearchControllerTypes";

export function getFindItDominantSource({
  metadataCount,
  navigationCount,
}: {
  metadataCount: number;
  navigationCount: number;
}): FindItResultSource {
  if (metadataCount > navigationCount) {
    return "metadata";
  }

  if (navigationCount > metadataCount) {
    return "navigation";
  }

  return "merged";
}

export function getFindItSourceSummary({
  matches,
  metadataMatches,
  navigationMatches,
}: {
  matches: NavigationSearchResult[];
  metadataMatches: NavigationSearchResult[];
  navigationMatches: NavigationSearchResult[];
}): FindItResultSourceSummary {
  const navigationCount = navigationMatches.length;
  const metadataCount = metadataMatches.length;
  const mergedCount = matches.length;

  return {
    navigationCount,
    metadataCount,
    mergedCount,
    hasNavigationMatches: navigationCount > 0,
    hasMetadataMatches: metadataCount > 0,
    dominantSource: getFindItDominantSource({
      metadataCount,
      navigationCount,
    }),
  };
}