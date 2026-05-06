import type { RelatedRecordSignal } from "./relationshipExplorerTypes";

export type SignalFilter = "all" | "strong" | "shelf" | "section" | "language";

export type FilterOption = {
  key: SignalFilter;
  label: string;
  description: string;
};

export const FILTER_OPTIONS: FilterOption[] = [
  {
    key: "all",
    label: "All",
    description: "Show every visible relationship suggestion.",
  },
  {
    key: "strong",
    label: "Strong",
    description: "Show records with stronger combined relationship scores.",
  },
  {
    key: "shelf",
    label: "Shelf",
    description: "Show records connected by the same metadata shelf.",
  },
  {
    key: "section",
    label: "Section",
    description: "Show records connected by the same metadata section.",
  },
  {
    key: "language",
    label: "Language",
    description: "Show records connected by title, preview, or slug language.",
  },
];

export function getFilteredSignals(
  signals: RelatedRecordSignal[],
  filter: SignalFilter
) {
  if (filter === "strong") {
    return signals.filter((signal) => signal.score >= 55);
  }

  if (filter === "shelf") {
    return signals.filter((signal) => signal.shelfMatch);
  }

  if (filter === "section") {
    return signals.filter((signal) => signal.sectionMatch);
  }

  if (filter === "language") {
    return signals.filter((signal) => signal.titleMatch);
  }

  return signals;
}

export function getSignalCount(
  signals: RelatedRecordSignal[],
  filter: SignalFilter
) {
  return getFilteredSignals(signals, filter).length;
}

export function getRelationshipSignalSummary(signals: RelatedRecordSignal[]) {
  const strongCount = signals.filter((signal) => signal.score >= 55).length;
  const veryStrongCount = signals.filter((signal) => signal.score >= 90).length;
  const shelfCount = signals.filter((signal) => signal.shelfMatch).length;
  const sectionCount = signals.filter((signal) => signal.sectionMatch).length;
  const languageCount = signals.filter((signal) => signal.titleMatch).length;

  return {
    strongCount,
    veryStrongCount,
    shelfCount,
    sectionCount,
    languageCount,
  };
}

export function getActiveFilterDescription(filter: SignalFilter) {
  return (
    FILTER_OPTIONS.find((option) => option.key === filter)?.description ??
    "Show relationship suggestions."
  );
}

export function getFilterEmptyMessage(filter: SignalFilter) {
  if (filter === "strong") {
    return "No strong suggestions are visible yet. Try All or Show more.";
  }

  if (filter === "shelf") {
    return "No visible suggestions share this shelf yet. Try Section or All.";
  }

  if (filter === "section") {
    return "No visible suggestions share this section yet. Try Shelf or All.";
  }

  if (filter === "language") {
    return "No visible suggestions share language signals yet. Try All.";
  }

  return "No quick suggestions match this filter yet. Try Show more or open another related record.";
}