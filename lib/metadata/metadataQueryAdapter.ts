import { getMetadataRecords } from "./metadataLibrarySeed";
import type { MetadataRecord } from "./metadataLibraryTypes";
import type {
  MetadataEntry,
  MetadataKind,
  MetadataLink,
  MetadataRelationship,
  MetadataTargetType,
} from "./metadataTypes";

type MetadataQueryDataset = {
  entries: MetadataEntry[];
  links: MetadataLink[];
};

function mapShelfToTargetType(shelf: string): MetadataTargetType {
  if (shelf === "projects") {
    return "project";
  }

  if (shelf === "artists") {
    return "tag";
  }

  if (shelf === "songwriting") {
    return "lyric";
  }

  return "section";
}

function mapFieldTypeToKind(fieldType: string): MetadataKind {
  switch (fieldType) {
    case "text":
      return "description";
    case "textarea":
      return "analysis";
    case "list":
      return "structure";
    default:
      return "reference";
  }
}

function mapRelationshipType(value: string): MetadataRelationship {
  switch (value) {
    case "references":
      return "references";
    case "contains":
      return "contains";
    case "uses":
      return "uses";
    case "example":
      return "example";
    case "related":
      return "related";
    case "variation":
      return "variation";
    case "explains":
      return "explains";
    case "resolves-to":
      return "resolves-to";
    case "derived-from":
      return "derived-from";
    case "related_to":
      return "related";
    default:
      return "related";
  }
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);
}

function recordToEntries(record: MetadataRecord): MetadataEntry[] {
  const targetType = mapShelfToTargetType(String(record.shelf));
  const targetId = String(record.id);
  const createdAt = new Date().toISOString();

  const entries: MetadataEntry[] = [
    {
      id: `${record.id}__title`,
      targetType,
      targetId,
      kind: "description",
      label: String(record.title),
      value: String(record.excerpt ?? ""),
      description: String(record.description ?? ""),
      createdAt,
      tags: [
        String(record.shelf),
        String(record.section),
        String(record.visibility),
      ].filter(Boolean),
      ...( { slug: record.slug } as any ),
    },
  ];

  if (String(record.excerpt ?? "").trim()) {
    entries.push({
      id: `${record.id}__excerpt`,
      targetType,
      targetId,
      kind: "description",
      label: "Excerpt",
      value: String(record.excerpt),
      description: `Excerpt for ${record.title}`,
      createdAt,
      tags: [String(record.shelf), String(record.section)].filter(Boolean),
      ...( { slug: record.slug } as any ),
    });
  }

  if (String(record.description ?? "").trim()) {
    entries.push({
      id: `${record.id}__description`,
      targetType,
      targetId,
      kind: "analysis",
      label: "Description",
      value: String(record.description),
      description: `Description for ${record.title}`,
      createdAt,
      tags: [String(record.shelf), String(record.section)].filter(Boolean),
      ...( { slug: record.slug } as any ),
    });
  }

  const fields = Array.isArray(record.fields) ? record.fields : [];

  for (const field of fields) {
    const rawValue = Array.isArray(field?.value)
      ? toStringArray(field.value).join(", ")
      : String(field?.value ?? "").trim();

    entries.push({
      id: String(field?.id ?? `${record.id}__field__${entries.length}`),
      targetType,
      targetId,
      kind: mapFieldTypeToKind(String(field?.type ?? "")),
      label: String(field?.label ?? "Field"),
      value: rawValue,
      description: `${String(field?.type ?? "field")} field on ${record.title}`,
      createdAt,
      tags: [
        String(record.shelf),
        String(record.section),
        String(field?.type ?? ""),
      ].filter(Boolean),
      ...( { slug: record.slug } as any ),
    });
  }

  const relationships = Array.isArray(record.relationships)
    ? record.relationships
    : [];

  for (const relationship of relationships) {
    const relationshipLabel = String(relationship?.targetLabel ?? "").trim();
    const relationshipNote = String(relationship?.note ?? "").trim();
    const relationshipType = String(relationship?.type ?? "").trim();

    entries.push({
      id: String(
        relationship?.id ?? `${record.id}__relationship__${entries.length}`
      ),
      targetType,
      targetId,
      kind: "reference",
      label: relationshipLabel || "Relationship",
      value: relationshipType || "related",
      description:
        relationshipNote ||
        `Relationship from ${record.title} to ${String(
          relationship?.targetRecordId ?? ""
        )}`,
      createdAt,
      tags: [
        String(record.shelf),
        String(record.section),
        "relationship",
        relationshipType,
      ].filter(Boolean),
      ...( { slug: record.slug } as any ),
    });
  }

  return entries;
}

function recordToLinks(record: MetadataRecord): MetadataLink[] {
  const relationships = Array.isArray(record.relationships)
    ? record.relationships
    : [];

  const links: MetadataLink[] = [];

  for (const relationship of relationships) {
    const sourceId = String(record.id ?? "").trim();
    const targetId = String(relationship?.targetRecordId ?? "").trim();

    if (!sourceId || !targetId) {
      continue;
    }

    links.push({
      id: String(relationship?.id ?? `${sourceId}__link__${targetId}`),
      sourceId,
      targetId,
      relationship: mapRelationshipType(String(relationship?.type ?? "")),
      createdAt: new Date().toISOString(),
    });
  }

  return links;
}

export function getMetadataQueryDataset(): MetadataQueryDataset {
  const records = getMetadataRecords();

  const entries = records.flatMap((record) => recordToEntries(record));
  const links = records.flatMap((record) => recordToLinks(record));

  return {
    entries,
    links,
  };
}