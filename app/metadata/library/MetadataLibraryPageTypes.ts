export type MetadataLibraryPanel = "shelves" | "records";

export type RecordFilterOption = {
  label: string;
  value: string;
};

export type MetadataLibraryRecordSummary = {
  id: string;
  slug: string;
  title: string;
  shelf: string;
  section: string;
  visibility: string;
  excerpt: string;
};

export type MetadataLibrarySection = {
  id: string;
  key: string;
  label: string;
  description: string;
};

export type MetadataLibraryShelf = {
  id: string;
  key: string;
  label: string;
  description: string;
  sections: MetadataLibrarySection[];
};

export type MetadataLibraryShape = {
  label: string;
  description: string;
  shelves: MetadataLibraryShelf[];
};