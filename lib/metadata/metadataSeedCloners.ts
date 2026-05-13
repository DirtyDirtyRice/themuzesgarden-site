import type { MetadataLibrary, MetadataRecord } from "./metadataLibraryTypes";

export function cloneLibrary(library: MetadataLibrary): MetadataLibrary {
  return {
    ...library,
    shelves: library.shelves.map((shelf) => ({
      ...shelf,
      sections: shelf.sections.map((section) => ({ ...section })),
    })),
  };
}

export function cloneRecord(record: MetadataRecord): MetadataRecord {
  return {
    ...record,
    fields: record.fields.map((field) => ({ ...field })),
    relationships: record.relationships.map((relationship) => ({
      ...relationship,
    })),
  };
}