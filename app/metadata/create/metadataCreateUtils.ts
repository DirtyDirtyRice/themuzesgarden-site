import { RELATIONSHIP_OPTIONS } from "./metadataCreateConfig";

export function normalizeText(value: string) {
  return value.trim();
}

export function slugify(value: string) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function getRelationshipLabel(value: string) {
  return (
    RELATIONSHIP_OPTIONS.find((option) => option.value === value)?.label ??
    "Related To"
  );
}

export function getFieldStatusMessage(ready: boolean, ok: string, notOk: string) {
  return ready ? ok : notOk;
}