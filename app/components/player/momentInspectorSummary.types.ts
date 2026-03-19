export type DensityStats = {
  taggedRatio: number;
  describedRatio: number;
  startRatio: number;
  averageMomentTagsPerSection: number;
};

export type HealthTone = {
  label: string;
  chipClass: string;
};

export type DiscoverySummary = {
  matchedMomentCount: number;
  clusterCount: number;
  primaryHeat: number;
  matchedTagCount: number;
};

export type MetadataSummary = {
  totalLinks: number;
  lyricWordLinks: number;
  musicalLinks: number;
  sectionLinks: number;
  momentLinks: number;
  trackLinks: number;
  unresolvedCount: number;
  highPriorityCount: number;
};

export type ReadinessStatus = {
  label: string;
  chipClass: string;
};

export type SummaryStatus = {
  label: string;
  chipClass: string;
};

export type MomentInspectorSummaryProps = {
  selectedTrackLabel: string;
  selectedTrackId: string;
  selectedTrackPath: string;
  healthTone: HealthTone;
  healthScore: number;
  trackTagsCount: number;
  momentTagsCount: number;
  descriptionsCount: number;
  sectionsCount: number;
  sectionsWithTags: number;
  sectionsWithDescription: number;
  sectionsWithStart: number;
  densityStats: DensityStats;
  dataWarnings: string[];
  discoverySummary?: DiscoverySummary | null;
  metadataSummary?: MetadataSummary | null;
};