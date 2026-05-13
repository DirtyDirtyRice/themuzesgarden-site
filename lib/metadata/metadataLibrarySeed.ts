import type { MetadataRecordSummary } from "./metadataLibraryTypes";
import { metadataLibrarySeed } from "./metadataLibrarySeedData";
import { cloneLibrary, cloneRecord } from "./metadataSeedCloners";
import { metadataRecordSeed } from "./metadataRecordSeedData";
import { findMetadataMeaningForSearch } from "./metadataSeedSearchController";

export function getMetadataLibrary() {
  return cloneLibrary(metadataLibrarySeed);
}

export function getMetadataRecords() {
  return metadataRecordSeed.map(cloneRecord);
}

export function getMetadataRecordSummaries(): MetadataRecordSummary[] {
  return metadataRecordSeed.map(
    ({ id, slug, title, shelf, section, visibility, excerpt }) => ({
      id,
      slug,
      title,
      shelf,
      section,
      visibility,
      excerpt,
    }),
  );
}

export function getMetadataRecordBySlug(slug: string) {
  const cleanSlug = slug.trim().toLowerCase();
  const record = metadataRecordSeed.find((item) => item.slug === cleanSlug);

  return record ? cloneRecord(record) : null;
}

export function getMetadataMeaningForSearch(query: string) {
  return findMetadataMeaningForSearch(query, metadataRecordSeed);
}

export { metadataLibrarySeed } from "./metadataLibrarySeedData";
export { metadataRecordSeed } from "./metadataRecordSeedData";