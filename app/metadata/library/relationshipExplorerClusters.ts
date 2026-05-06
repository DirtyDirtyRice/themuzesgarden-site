import type { MetadataLibraryRecordSummary } from "./MetadataLibraryPageTypes";
import type {
  RelatedRecordSignal,
  RelationshipClusterGroup,
  RelationshipClusterKind,
  RelationshipClusters,
  RelationshipClusterSummary,
} from "./relationshipExplorerTypes";

import { getRelationshipReasonBreakdown } from "./relationshipExplorerUtils";

function cleanClusterKey(value: unknown, fallback: string) {
  const key = String(value ?? "").trim();
  return key || fallback;
}

function getClusterLabel(kind: RelationshipClusterKind, key: string) {
  if (key === "unknown") return `Unknown ${kind}`;
  if (key === "loose") return "Loose language";
  return key;
}

function getClusterSummaryText({
  kind,
  label,
  count,
}: {
  kind: RelationshipClusterKind;
  label: string;
  count: number;
}) {
  const recordText = count === 1 ? "record" : "records";

  if (kind === "shelf") {
    return `${count} ${recordText} grouped by shelf: ${label}.`;
  }

  if (kind === "section") {
    return `${count} ${recordText} grouped by section: ${label}.`;
  }

  return `${count} ${recordText} grouped by shared language: ${label}.`;
}

function createClusterGroup({
  key,
  kind,
  records,
}: {
  key: string;
  kind: RelationshipClusterKind;
  records: MetadataLibraryRecordSummary[];
}): RelationshipClusterGroup {
  const label = getClusterLabel(kind, key);

  return {
    key,
    label,
    kind,
    count: records.length,
    records,
    summary: getClusterSummaryText({
      kind,
      label,
      count: records.length,
    }),
  };
}

function sortClusters(
  clusters: RelationshipClusterGroup[]
): RelationshipClusterGroup[] {
  return clusters.slice().sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.label.localeCompare(b.label);
  });
}

function groupRecordsByKey({
  records,
  kind,
  getKey,
}: {
  records: MetadataLibraryRecordSummary[];
  kind: RelationshipClusterKind;
  getKey: (record: MetadataLibraryRecordSummary) => string;
}) {
  const map = new Map<string, MetadataLibraryRecordSummary[]>();

  records.forEach((record) => {
    const key = cleanClusterKey(getKey(record), "unknown");

    if (!map.has(key)) {
      map.set(key, []);
    }

    map.get(key)!.push(record);
  });

  return sortClusters(
    Array.from(map.entries()).map(([key, groupedRecords]) =>
      createClusterGroup({
        key,
        kind,
        records: groupedRecords,
      })
    )
  );
}

function buildShelfClusters(
  signals: RelatedRecordSignal[]
): RelationshipClusterGroup[] {
  return groupRecordsByKey({
    records: signals.map((signal) => signal.record),
    kind: "shelf",
    getKey: (record) => String(record.shelf ?? "unknown"),
  });
}

function buildSectionClusters(
  signals: RelatedRecordSignal[]
): RelationshipClusterGroup[] {
  return groupRecordsByKey({
    records: signals.map((signal) => signal.record),
    kind: "section",
    getKey: (record) => String(record.section ?? "unknown"),
  });
}

function getLanguageClusterKey({
  activeRecord,
  signal,
}: {
  activeRecord: MetadataLibraryRecordSummary;
  signal: RelatedRecordSignal;
}) {
  const breakdown = getRelationshipReasonBreakdown(
    activeRecord,
    signal.record
  );

  const words = breakdown.matchedWords
    .map((word) => word.trim())
    .filter(Boolean)
    .slice(0, 2);

  return words.length > 0 ? words.join(", ") : "loose";
}

function buildLanguageClusters(
  signals: RelatedRecordSignal[],
  activeRecord: MetadataLibraryRecordSummary
): RelationshipClusterGroup[] {
  const map = new Map<string, MetadataLibraryRecordSummary[]>();

  signals.forEach((signal) => {
    const key = getLanguageClusterKey({
      activeRecord,
      signal,
    });

    if (!map.has(key)) {
      map.set(key, []);
    }

    map.get(key)!.push(signal.record);
  });

  return sortClusters(
    Array.from(map.entries()).map(([key, records]) =>
      createClusterGroup({
        key,
        kind: "language",
        records,
      })
    )
  );
}

export function buildRelationshipClusters(
  signals: RelatedRecordSignal[],
  activeRecord: MetadataLibraryRecordSummary
): RelationshipClusters {
  return {
    shelfClusters: buildShelfClusters(signals),
    sectionClusters: buildSectionClusters(signals),
    languageClusters: buildLanguageClusters(signals, activeRecord),
  };
}

export function getTopCluster(
  clusters: RelationshipClusterGroup[]
): RelationshipClusterGroup | null {
  if (!clusters.length) return null;
  return clusters[0];
}

function getStrongestCluster(
  clusters: RelationshipClusters
): RelationshipClusterGroup | null {
  const allClusters = [
    ...clusters.shelfClusters,
    ...clusters.sectionClusters,
    ...clusters.languageClusters,
  ];

  return getTopCluster(sortClusters(allClusters));
}

export function getClusterSummary(
  clusters: RelationshipClusters
): RelationshipClusterSummary {
  const topShelf = getTopCluster(clusters.shelfClusters);
  const topSection = getTopCluster(clusters.sectionClusters);
  const topLanguage = getTopCluster(clusters.languageClusters);
  const strongest = getStrongestCluster(clusters);

  return {
    shelf: topShelf?.label ?? "none",
    section: topSection?.label ?? "none",
    language: topLanguage?.label ?? "none",
    strongestKind: strongest?.kind ?? "none",
    strongestLabel: strongest?.label ?? "none",
    strongestCount: strongest?.count ?? 0,
  };
}

export function getClusterInsightText(
  clusters: RelationshipClusters
) {
  const summary = getClusterSummary(clusters);

  if (summary.strongestKind === "none") {
    return "No relationship clusters are available yet.";
  }

  return `Strongest cluster: ${summary.strongestLabel} (${summary.strongestCount}) from ${summary.strongestKind}.`;
}