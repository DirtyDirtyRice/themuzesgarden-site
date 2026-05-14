import type { NavigationSearchResult } from "@/lib/navigation/navigationSearch";

import { MAX_FIND_IT_RESULTS } from "./FindItSearchControllerConstants";
import {
  shouldReplaceFindItMergedResult,
  sortFindItResults,
} from "./findItResultRanking";
import type { FindItMatchGroups } from "./FindItSearchControllerTypes";

export function mergeFindItResultGroups({
  metadataMatches,
  navigationMatches,
}: FindItMatchGroups) {
  const resultsByNodeId = new Map<string, NavigationSearchResult>();

  [...navigationMatches, ...metadataMatches].forEach((result) => {
    const existingResult = resultsByNodeId.get(result.node.id);

    if (!existingResult) {
      resultsByNodeId.set(result.node.id, result);
      return;
    }

    if (
      shouldReplaceFindItMergedResult({
        existingResult,
        nextResult: result,
      })
    ) {
      resultsByNodeId.set(result.node.id, result);
    }
  });

  return [...resultsByNodeId.values()]
    .sort(sortFindItResults)
    .slice(0, MAX_FIND_IT_RESULTS);
}