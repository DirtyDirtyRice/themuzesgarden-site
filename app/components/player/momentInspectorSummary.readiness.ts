import type { ReadinessStatus } from "./momentInspectorSummary.types";

export function getMomentInspectorReadinessLabel(args: {
  sectionsCount: number;
  sectionsWithTags: number;
  sectionsWithDescription: number;
  sectionsWithStart: number;
  warningCount: number;
}): ReadinessStatus {
  const {
    sectionsCount,
    sectionsWithTags,
    sectionsWithDescription,
    sectionsWithStart,
    warningCount,
  } = args;

  if (sectionsCount <= 0) {
    return {
      label: "No Data",
      chipClass: "border-zinc-200 bg-zinc-100 text-zinc-700",
    };
  }

  const tagRatio = sectionsCount > 0 ? sectionsWithTags / sectionsCount : 0;
  const descriptionRatio =
    sectionsCount > 0 ? sectionsWithDescription / sectionsCount : 0;
  const startRatio = sectionsCount > 0 ? sectionsWithStart / sectionsCount : 0;

  if (warningCount === 0 && tagRatio >= 0.8 && descriptionRatio >= 0.7 && startRatio >= 0.9) {
    return {
      label: "Database Ready",
      chipClass: "border-emerald-200 bg-emerald-50 text-emerald-800",
    };
  }

  if (warningCount <= 1 && tagRatio >= 0.6 && descriptionRatio >= 0.5 && startRatio >= 0.75) {
    return {
      label: "Strong",
      chipClass: "border-blue-200 bg-blue-50 text-blue-800",
    };
  }

  if (tagRatio >= 0.35 || descriptionRatio >= 0.35 || startRatio >= 0.5) {
    return {
      label: "Needs Enrichment",
      chipClass: "border-amber-200 bg-amber-50 text-amber-800",
    };
  }

  return {
    label: "Early Stage",
    chipClass: "border-zinc-200 bg-zinc-100 text-zinc-700",
  };
}