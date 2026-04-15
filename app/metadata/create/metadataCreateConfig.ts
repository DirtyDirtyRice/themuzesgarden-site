export const VISIBILITY_OPTIONS = [
  { value: "public", label: "Public" },
  { value: "private", label: "Private" },
  { value: "shared", label: "Shared" },
] as const;

export const RECORD_TYPE_OPTIONS = [
  { value: "concept", label: "Concept" },
  { value: "person", label: "Person" },
  { value: "work", label: "Work" },
  { value: "tool", label: "Tool" },
  { value: "technique", label: "Technique" },
  { value: "structure", label: "Structure" },
  { value: "reference", label: "Reference" },
] as const;

export const RELATIONSHIP_OPTIONS = [
  { value: "related_to", label: "Related To" },
  { value: "references", label: "References" },
  { value: "part_of", label: "Part Of" },
  { value: "contains", label: "Contains" },
  { value: "influences", label: "Influences" },
  { value: "uses", label: "Uses" },
] as const;