import type {
  MetadataRelationshipLayerKey,
  MetadataRelationshipScore,
  MetadataRelationshipSnapshot,
} from "./MetadataLibraryRelationshipIntelligence";
import type { MetadataLibraryRecordSummary } from "./MetadataLibraryPageTypes";

export type MetadataLibraryRelationshipStrength =
  | "strong"
  | "medium"
  | "light";

export type MetadataLibraryRelationshipSource = "shelf" | "section";

export type MetadataLibraryRelationshipContextRecord =
  MetadataLibraryRecordSummary & {
    __relationshipContext?: {
      strength: MetadataLibraryRelationshipStrength;
      source: MetadataLibraryRelationshipSource;
      fromId: string;
      fromTitle: string;
      fromRecord: MetadataLibraryRecordSummary;
      reason: string;
      trailLabel: string;
      score: number;
      clickedLayer: MetadataRelationshipLayerKey;
      reasonSnapshot: string;
      whyItMatters: string;
      meaningPotential?: string;
      usagePotential?: string;
      crossLayerHint?: string;
    };
  };

export type MetadataLibraryScoredRelationshipRecord = {
  record: MetadataLibraryRecordSummary;
  score: MetadataRelationshipScore;
};

export type MetadataLibraryStructureRelationshipsPanelProps = {
  activeQuery: string;
  openRecord: MetadataLibraryRecordSummary;
  visibleRelatedByShelf: MetadataLibraryRecordSummary[];
  visibleRelatedBySection: MetadataLibraryRecordSummary[];
  hiddenRelatedByShelfCount: number;
  hiddenRelatedBySectionCount: number;
  relationshipSnapshot: MetadataRelationshipSnapshot;
  onOpenRelatedRecord: (record: MetadataLibraryRecordSummary) => void;
};

export type MetadataLibraryRelationshipCardProps = {
  activeQuery: string;
  record: MetadataLibraryRecordSummary;
  strength: MetadataLibraryRelationshipStrength;
  source: MetadataLibraryRelationshipSource;
  openRecord: MetadataLibraryRecordSummary;
  score: MetadataRelationshipScore;
  onOpenRelatedRecord: (record: MetadataLibraryRecordSummary) => void;
};