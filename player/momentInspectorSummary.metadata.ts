import type {
  MetadataSummary,
  SummaryStatus,
} from "./momentInspectorSummary.types";

export function getMomentInspectorMetadataStatus(
  summary?: MetadataSummary | null
): SummaryStatus | null {
  if (!summary) return null;

  const totalLinks = Number(summary.totalLinks ?? 0);
  const unresolvedCount = Number(summary.unresolvedCount ?? 0);
  const highPriorityCount = Number(summary.highPriorityCount ?? 0);

  if (totalLinks <= 0) return null;

  if (totalLinks >= 8 && unresolvedCount === 0 && highPriorityCount === 0) {
    return {
      label: "Dense Metadata",
      chipClass: "border-emerald-200 bg-emerald-50 text-emerald-800",
    };
  }

  if (totalLinks >= 3) {
    return {
      label: "Metadata Linked",
      chipClass: "border-teal-200 bg-teal-50 text-teal-800",
    };
  }

  return {
    label: "Metadata Started",
    chipClass: "border-cyan-200 bg-cyan-50 text-cyan-800",
  };
}