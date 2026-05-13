import type { NavigationSearchResult } from "@/lib/navigation/navigationSearch";

const MAX_SEARCH_TOKENS = 6;

export function getSearchTokens(searchValue: string) {
  return searchValue
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2)
    .slice(0, MAX_SEARCH_TOKENS);
}

export function getFindItResultSourceLabel(result: NavigationSearchResult) {
  if (result.node.href?.startsWith("/metadata")) {
    return "Metadata";
  }

  return "Navigation";
}

export function getFindItResultSourceTone(result: NavigationSearchResult) {
  const sourceLabel = getFindItResultSourceLabel(result);

  if (sourceLabel === "Metadata") {
    return "metadata";
  }

  return "navigation";
}

export function getMatchedTokenCount(label: string, tokens: string[]) {
  const cleanLabel = label.toLowerCase();

  return tokens.filter((token) => cleanLabel.includes(token)).length;
}

export function getResultMatchScore(
  result: NavigationSearchResult,
  tokens: string[],
) {
  const label = result.node.label.toLowerCase();
  const kind = result.node.kind.toLowerCase();
  const href = result.node.href?.toLowerCase() ?? "";
  const searchableText = `${label} ${kind} ${href}`;
  const matchedTokens = tokens.filter((token) => searchableText.includes(token));
  const labelHits = tokens.filter((token) => label.includes(token)).length;
  const startsWithHits = tokens.filter((token) => label.startsWith(token)).length;
  const hrefHits = tokens.filter((token) => href.includes(token)).length;

  return matchedTokens.length + labelHits + hrefHits + startsWithHits * 2;
}

export function getCategoryMatchScore(
  matches: NavigationSearchResult[],
  tokens: string[],
) {
  return matches.reduce(
    (score, result) => score + getResultMatchScore(result, tokens),
    0,
  );
}

function splitHighlightedSegments(label: string, tokens: string[]) {
  const cleanTokens = [...new Set(tokens)]
    .filter((token) => token.length > 0)
    .sort((a, b) => b.length - a.length);

  if (cleanTokens.length === 0) {
    return [{ text: label, matched: false }];
  }

  const ranges: Array<{ start: number; end: number }> = [];
  const lowerLabel = label.toLowerCase();

  cleanTokens.forEach((token) => {
    let searchFrom = 0;

    while (searchFrom < lowerLabel.length) {
      const foundIndex = lowerLabel.indexOf(token, searchFrom);

      if (foundIndex === -1) {
        break;
      }

      ranges.push({
        start: foundIndex,
        end: foundIndex + token.length,
      });
      searchFrom = foundIndex + token.length;
    }
  });

  const mergedRanges = ranges
    .sort((a, b) => a.start - b.start || b.end - a.end)
    .reduce<Array<{ start: number; end: number }>>((merged, range) => {
      const previous = merged[merged.length - 1];

      if (!previous || range.start > previous.end) {
        merged.push({ ...range });
        return merged;
      }

      previous.end = Math.max(previous.end, range.end);
      return merged;
    }, []);

  if (mergedRanges.length === 0) {
    return [{ text: label, matched: false }];
  }

  const segments: Array<{ text: string; matched: boolean }> = [];
  let cursor = 0;

  mergedRanges.forEach((range) => {
    if (cursor < range.start) {
      segments.push({
        text: label.slice(cursor, range.start),
        matched: false,
      });
    }

    segments.push({
      text: label.slice(range.start, range.end),
      matched: true,
    });
    cursor = range.end;
  });

  if (cursor < label.length) {
    segments.push({
      text: label.slice(cursor),
      matched: false,
    });
  }

  return segments;
}

export function HighlightedResultLabel({
  label,
  tokens,
}: {
  label: string;
  tokens: string[];
}) {
  const segments = splitHighlightedSegments(label, tokens);

  return (
    <>
      {segments.map((segment, index) =>
        segment.matched ? (
          <mark
            key={`${segment.text}-${index}`}
            className="rounded bg-amber-200/20 px-1 text-amber-50"
          >
            {segment.text}
          </mark>
        ) : (
          <span key={`${segment.text}-${index}`}>{segment.text}</span>
        ),
      )}
    </>
  );
}