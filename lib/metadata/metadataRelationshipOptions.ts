import { METADATA_RELATIONSHIP_TYPES } from "./metadataRelationshipTypes";

function toRelationshipLabel(value: string) {
  return value
    .split("_")
    .map((part) => {
      if (!part) return "";
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(" ");
}

export const metadataRelationshipOptions = METADATA_RELATIONSHIP_TYPES.map(
  (value) => ({
    value,
    label: toRelationshipLabel(value),
  })
);