import type { MetadataRelationshipServiceResult } from "./metadataRelationshipServiceResults";

export type NormalizedRelationship =
  MetadataRelationshipServiceResult["relationships"][number];

export type RelationshipServiceFetchOptions = {
  cacheKey: string;
  slugs?: (string | null | undefined)[];
  includeGlobalListScope?: boolean;
  fetchResult: () => Promise<MetadataRelationshipServiceResult>;
};

export type RelationshipServicePrefetchOptions =
  RelationshipServiceFetchOptions & {
    warmRelatedRecords?: boolean;
  };