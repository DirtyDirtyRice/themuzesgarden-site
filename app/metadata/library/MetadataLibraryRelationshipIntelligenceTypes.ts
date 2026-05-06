import type { MetadataLibraryRecordSummary } from "./MetadataLibraryPageTypes";

export type MetadataRelationshipLayerKey = "structure" | "meaning" | "usage";

export type MetadataRelationshipStrength = "strong" | "medium" | "light";

export type MetadataRelationshipSource = "shelf" | "section";

export type MetadataRelationshipContext = {
  strength: MetadataRelationshipStrength;
  source: MetadataRelationshipSource;
  fromId: string;
  fromTitle: string;
  fromRecord: MetadataLibraryRecordSummary;
  reason?: string;
  trailLabel?: string;
  score?: number;
  clickedLayer?: MetadataRelationshipLayerKey;
  reasonSnapshot?: string;
  whyItMatters?: string;
  meaningPotential?: string;
  usagePotential?: string;
  crossLayerHint?: string;
};

export type MetadataRelationshipRecordWithContext =
  MetadataLibraryRecordSummary & {
    __relationshipContext?: MetadataRelationshipContext;
  };

export type MetadataRelationshipSnapshot = {
  layerLabel: string;
  layerPurpose: string;
  layerMemoryLabel: string;
  structureSignal: string;
  meaningSignal: string;
  usageSignal: string;
  crossLayerBridge: string;
  relationshipReadiness: string;
  querySignal: string;
};

export type MetadataRelationshipMemoryItem = {
  label: string;
  value: string;
  detail: string;
};

export type MetadataRelationshipScore = {
  structureScore: number;
  meaningScore: number;
  usageScore: number;
  confidenceScore: number;
  confidenceLabel: string;
  confidenceDetail: string;
  whyItMatters: string;
  meaningPotential: string;
  usagePotential: string;
  crossLayerHint: string;
};

export type MetadataRelationshipInsightSummary = {
  topTitle: string;
  topScore: number;
  scoreRange: string;
  recommendation: string;
};

export type MetadataRelationshipScoredRecord = {
  record: MetadataLibraryRecordSummary;
  score: MetadataRelationshipScore;
};