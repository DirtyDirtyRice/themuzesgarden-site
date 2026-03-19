import type {
  DiscoverySummary,
  SummaryStatus,
} from "./momentInspectorSummary.types";

export function getMomentInspectorDiscoveryStatus(
  summary?: DiscoverySummary | null
): SummaryStatus | null {
  if (!summary) return null;

  const matchedMomentCount = Number(summary.matchedMomentCount ?? 0);
  const clusterCount = Number(summary.clusterCount ?? 0);
  const primaryHeat = Number(summary.primaryHeat ?? 0);
  const matchedTagCount = Number(summary.matchedTagCount ?? 0);

  if (
    matchedMomentCount <= 0 &&
    clusterCount <= 0 &&
    primaryHeat <= 0 &&
    matchedTagCount <= 0
  ) {
    return null;
  }

  if (primaryHeat >= 100 || clusterCount >= 3) {
    return {
      label: "High Activity",
      chipClass: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-800",
    };
  }

  if (matchedMomentCount >= 3 || matchedTagCount >= 2) {
    return {
      label: "Discovery Active",
      chipClass: "border-purple-200 bg-purple-50 text-purple-800",
    };
  }

  return {
    label: "Discovery Ready",
    chipClass: "border-indigo-200 bg-indigo-50 text-indigo-800",
  };
}