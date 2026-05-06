import type {
  LayeredMetadataEntry,
  MetadataConfidenceStrength,
  MetadataEntry,
  MetadataTargetType,
} from "../lib/metadata/metadataTypes";

export type MetadataItemLike = {
  id: string;
  label?: string | null;
  description?: string | null;
  kind?: string | null;
  value?: string | number | boolean | null;
  tags?: string[] | null;
  parentId?: string | null;
  targetType?: MetadataTargetType;
  targetId?: string | null;
  score?: number;
  _confidence?: number;
  _strength?: MetadataConfidenceStrength;
};

export type MetadataPanelEntryLike = MetadataEntry | LayeredMetadataEntry;

export type MetadataPanelProps = {
  targetType: MetadataTargetType;
  targetId: string;
  onMetadataSelect?: (entry: MetadataEntry) => void;
};