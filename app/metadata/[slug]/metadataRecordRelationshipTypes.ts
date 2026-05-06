export type MetadataRelationshipLike = {
  id?: string | number | null;
  type?: string | null;
  relationshipType?: string | null;
  label?: string | null;
  targetRecordId: string;
  targetSlug?: string;
  targetTitle?: string | null;
  targetLabel?: string | null;
  detail?: string | null;
  note?: string | null;
  reason?: string | null;
  whyItMatters?: string | null;
  usageHint?: string | null;
  reasonSnapshot?: string | null;
  source?: string | null;
  strength?: string | number | null;
};

export type ResolvedRelationship = MetadataRelationshipLike & {
  targetSlug: string;
  displayType: string;
  displayTarget: string;
  displayNote: string;
  displayDetail: string;
  displayStrength: string;
  displaySource: string;
  typeAnchor: string;
};

export type RelationshipTypeSummary = {
  type: string;
  anchor: string;
  count: number;
  firstTarget: string;
};

export type RemoveRelationshipAction = (formData: FormData) => Promise<void>;

export function cleanRelationshipText(value: unknown, fallback = "") {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return fallback;
}

export function normalizeRelationshipAnchor(value: string) {
  const anchor = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return anchor || "relationship-type";
}

export function formatRelationshipLabel(
  value: unknown,
  fallback = "Related Record",
) {
  const text = cleanRelationshipText(value, fallback);

  return text
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getRelationshipType(value: Record<string, unknown>) {
  return cleanRelationshipText(
    value.type ?? value.relationshipType ?? value.label,
    "related_record",
  );
}

function getRelationshipTargetLabel(value: Record<string, unknown>) {
  return cleanRelationshipText(
    value.targetLabel ?? value.targetTitle,
    "Untitled related record",
  );
}

export function asMetadataRelationship(value: unknown): MetadataRelationshipLike {
  if (value && typeof value === "object") {
    const relationship = value as Record<string, unknown>;

    const targetRecordId = cleanRelationshipText(
      relationship.targetRecordId,
      "",
    );

    return {
      id:
        typeof relationship.id === "string" ||
        typeof relationship.id === "number"
          ? relationship.id
          : null,
      type: getRelationshipType(relationship),
      relationshipType: cleanRelationshipText(relationship.relationshipType),
      label: cleanRelationshipText(relationship.label),
      targetRecordId,
      targetSlug: cleanRelationshipText(relationship.targetSlug),
      targetTitle: cleanRelationshipText(relationship.targetTitle),
      targetLabel: getRelationshipTargetLabel(relationship),
      detail: cleanRelationshipText(relationship.detail),
      note: cleanRelationshipText(relationship.note),
      reason: cleanRelationshipText(relationship.reason),
      whyItMatters: cleanRelationshipText(relationship.whyItMatters),
      usageHint: cleanRelationshipText(relationship.usageHint),
      reasonSnapshot: cleanRelationshipText(relationship.reasonSnapshot),
      source: cleanRelationshipText(relationship.source),
      strength: cleanRelationshipText(relationship.strength),
    };
  }

  return {
    type: "related_record",
    relationshipType: "related_record",
    label: "Related Record",
    targetRecordId: "",
    targetSlug: "",
    targetTitle: "Untitled related record",
    targetLabel: "Untitled related record",
    detail: "",
    note: "",
    reason: "",
    whyItMatters: "",
    usageHint: "",
    reasonSnapshot: "",
    source: "",
    strength: "",
  };
}

export function ensureValidSlug(
  relationship: MetadataRelationshipLike,
): string {
  const slug = cleanRelationshipText(relationship.targetSlug);

  if (slug) return slug;

  const fallback = cleanRelationshipText(relationship.targetRecordId);

  if (fallback) return fallback;

  return "missing-target";
}

export function getRelationshipId(
  relationship: MetadataRelationshipLike,
  index: number,
) {
  const id = cleanRelationshipText(relationship.id);
  if (id) return id;
  return `relationship-${index}`;
}

export function getRelationshipDetail(relationship: MetadataRelationshipLike) {
  const parts = [
    relationship.detail,
    relationship.reason,
    relationship.whyItMatters,
    relationship.usageHint,
    relationship.reasonSnapshot,
    relationship.note,
  ]
    .map((p) => cleanRelationshipText(p))
    .filter((p) => p.length > 0);

  if (parts.length > 0) {
    return parts.join(" ");
  }

  return "No extra detail has been added yet.";
}

export function getRelationshipNote(relationship: MetadataRelationshipLike) {
  const note = cleanRelationshipText(relationship.note);
  return note || "No note added yet.";
}

export function getRelationshipStrength(relationship: MetadataRelationshipLike) {
  const strength = cleanRelationshipText(relationship.strength);
  return strength ? formatRelationshipLabel(strength) : "Normal";
}

export function getRelationshipSource(relationship: MetadataRelationshipLike) {
  const source = cleanRelationshipText(relationship.source);
  return source ? formatRelationshipLabel(source) : "Metadata";
}

export function buildResolvedRelationship(
  relationship: MetadataRelationshipLike,
): ResolvedRelationship {
  const displayType = formatRelationshipLabel(
    relationship.type ?? relationship.relationshipType ?? relationship.label,
    "Related Record",
  );

  const displayTarget = cleanRelationshipText(
    relationship.targetLabel ?? relationship.targetTitle,
    "Untitled related record",
  );

  const typeAnchor = normalizeRelationshipAnchor(displayType);

  return {
    ...relationship,
    targetSlug: ensureValidSlug(relationship),
    displayType,
    displayTarget,
    displayNote: getRelationshipNote(relationship),
    displayDetail: getRelationshipDetail(relationship),
    displayStrength: getRelationshipStrength(relationship),
    displaySource: getRelationshipSource(relationship),
    typeAnchor,
  };
}

export function groupRelationshipsByType(
  relationships: ResolvedRelationship[],
) {
  return relationships.reduce<Record<string, ResolvedRelationship[]>>(
    (groups, relationship) => {
      const key = relationship.displayType || "Related Record";

      if (!groups[key]) {
        groups[key] = [];
      }

      groups[key].push(relationship);
      return groups;
    },
    {},
  );
}

export function getRelationshipTypeSummaries(
  groupedRelationships: Record<string, ResolvedRelationship[]>,
): RelationshipTypeSummary[] {
  return Object.entries(groupedRelationships)
    .map(([type, list]) => {
      const first = list[0];

      return {
        type,
        anchor: first?.typeAnchor ?? normalizeRelationshipAnchor(type),
        count: list.length,
        firstTarget: first?.displayTarget ?? "None",
      };
    })
    .filter((entry) => entry.count > 0);
}

export function getPrimaryRelationship(
  relationships: ResolvedRelationship[],
) {
  return relationships.length > 0 ? relationships[0] : null;
}