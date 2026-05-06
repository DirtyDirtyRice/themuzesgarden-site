import {
  normalizeMetadataRelationship,
  normalizeRelationshipDirection,
  normalizeRelationshipSource,
  normalizeRelationshipStrength,
} from "./metadataRelationshipEngine";
import type {
  MetadataRelationshipDirection,
  MetadataRelationshipInput,
  MetadataRelationshipSource,
  NormalizedMetadataRelationship,
} from "./metadataRelationshipEngine";

export type MetadataRelationshipDbRow = {
  id?: string | number | null;
  source_record_id?: string | null;
  source_slug?: string | null;
  source_title?: string | null;
  target_record_id?: string | null;
  target_slug?: string | null;
  target_title?: string | null;
  relationship_type?: string | null;
  type?: string | null;
  label?: string | null;
  detail?: string | null;
  note?: string | null;
  reason?: string | null;
  strength?: string | number | null;
  direction?: string | null;
  source?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type LegacyMetadataRelationshipJson = {
  id?: unknown;
  sourceRecordId?: unknown;
  sourceSlug?: unknown;
  sourceTitle?: unknown;
  targetRecordId?: unknown;
  targetSlug?: unknown;
  targetTitle?: unknown;
  targetLabel?: unknown;
  type?: unknown;
  relationshipType?: unknown;
  label?: unknown;
  detail?: unknown;
  note?: unknown;
  reason?: unknown;
  strength?: unknown;
  direction?: unknown;
  source?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type MetadataRelationshipDbInsertPayload = {
  source_record_id: string;
  source_slug: string;
  source_title: string;
  target_record_id: string;
  target_slug: string;
  target_title: string;
  relationship_type: string;
  label: string;
  detail: string | null;
  note: string | null;
  reason: string | null;
  strength: string;
  direction: MetadataRelationshipDirection;
  source: MetadataRelationshipSource;
};

export type MetadataRelationshipDbUpdatePayload = Partial<
  MetadataRelationshipDbInsertPayload
> & {
  updated_at?: string;
};

export type UiCompatibleMetadataRelationship = {
  id: string;
  targetRecordId: string;
  targetSlug: string;
  targetLabel: string;
  type: string;
  label: string;
  detail: string;
  note: string;
  reason: string;
  strength: string;
  direction: MetadataRelationshipDirection;
  source: MetadataRelationshipSource;
};

function cleanDbText(value: unknown, fallback = "") {
  if (typeof value === "number") return String(value);
  if (typeof value !== "string") return fallback;

  const cleaned = value.trim().replace(/\s+/g, " ");
  return cleaned.length > 0 ? cleaned : fallback;
}

function nullableDbText(value: unknown) {
  const cleaned = cleanDbText(value);
  return cleaned.length > 0 ? cleaned : null;
}

function cleanDbStrength(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return value;
  return null;
}

function getDbRelationshipType(row: MetadataRelationshipDbRow) {
  return cleanDbText(row.relationship_type ?? row.type, "related");
}

function getDbRelationshipId(row: MetadataRelationshipDbRow) {
  return cleanDbText(row.id);
}

function getLegacyRelationshipType(relationship: LegacyMetadataRelationshipJson) {
  return cleanDbText(
    relationship.relationshipType ?? relationship.type,
    "related",
  );
}

function getLegacyTargetTitle(relationship: LegacyMetadataRelationshipJson) {
  return cleanDbText(
    relationship.targetTitle ?? relationship.targetLabel,
    "Untitled relationship target",
  );
}

export function metadataRelationshipInputFromDbRow(
  row: MetadataRelationshipDbRow,
): MetadataRelationshipInput {
  return {
    id: getDbRelationshipId(row),
    sourceRecordId: cleanDbText(row.source_record_id),
    sourceSlug: cleanDbText(row.source_slug),
    sourceTitle: cleanDbText(row.source_title),
    targetRecordId: cleanDbText(row.target_record_id),
    targetSlug: cleanDbText(row.target_slug),
    targetTitle: cleanDbText(row.target_title),
    type: getDbRelationshipType(row),
    label: cleanDbText(row.label),
    detail: cleanDbText(row.detail),
    note: cleanDbText(row.note),
    reason: cleanDbText(row.reason),
    strength: row.strength ?? null,
    direction: cleanDbText(row.direction),
    source: cleanDbText(row.source),
    createdAt: cleanDbText(row.created_at),
    updatedAt: cleanDbText(row.updated_at),
  };
}

export function metadataRelationshipInputFromLegacyJsonRelationship({
  relationship,
  sourceRecordId = "",
  sourceSlug = "",
  sourceTitle = "",
}: {
  relationship: LegacyMetadataRelationshipJson;
  sourceRecordId?: string;
  sourceSlug?: string;
  sourceTitle?: string;
}): MetadataRelationshipInput {
  return {
    id: cleanDbText(relationship.id),
    sourceRecordId: cleanDbText(relationship.sourceRecordId, sourceRecordId),
    sourceSlug: cleanDbText(relationship.sourceSlug, sourceSlug),
    sourceTitle: cleanDbText(relationship.sourceTitle, sourceTitle),
    targetRecordId: cleanDbText(relationship.targetRecordId),
    targetSlug: cleanDbText(relationship.targetSlug),
    targetTitle: getLegacyTargetTitle(relationship),
    type: getLegacyRelationshipType(relationship),
    label: cleanDbText(relationship.label),
    detail: cleanDbText(relationship.detail),
    note: cleanDbText(relationship.note),
    reason: cleanDbText(relationship.reason),
    strength: cleanDbStrength(relationship.strength),
    direction: cleanDbText(relationship.direction),
    source: cleanDbText(relationship.source, "manual"),
    createdAt: cleanDbText(relationship.createdAt),
    updatedAt: cleanDbText(relationship.updatedAt),
  };
}

export function normalizeMetadataRelationshipDbRow(
  row: MetadataRelationshipDbRow,
): NormalizedMetadataRelationship {
  return normalizeMetadataRelationship(metadataRelationshipInputFromDbRow(row));
}

export function normalizeMetadataRelationshipDbRows(
  rows: MetadataRelationshipDbRow[],
): NormalizedMetadataRelationship[] {
  return rows.map((row) => normalizeMetadataRelationshipDbRow(row));
}

export function metadataRelationshipInputFromUnknownDbRow(
  value: unknown,
): MetadataRelationshipInput {
  if (!value || typeof value !== "object") {
    return metadataRelationshipInputFromDbRow({});
  }

  return metadataRelationshipInputFromDbRow(value as MetadataRelationshipDbRow);
}

export function normalizeUnknownMetadataRelationshipDbRows(
  values: unknown[],
): NormalizedMetadataRelationship[] {
  return values
    .filter((value): value is MetadataRelationshipDbRow => {
      return Boolean(value && typeof value === "object");
    })
    .map((row) => normalizeMetadataRelationshipDbRow(row));
}

export function normalizeLegacyJsonRelationships({
  relationships,
  sourceRecordId = "",
  sourceSlug = "",
  sourceTitle = "",
}: {
  relationships: unknown[];
  sourceRecordId?: string;
  sourceSlug?: string;
  sourceTitle?: string;
}): NormalizedMetadataRelationship[] {
  return relationships
    .filter((relationship): relationship is LegacyMetadataRelationshipJson => {
      return Boolean(relationship && typeof relationship === "object");
    })
    .map((relationship) =>
      normalizeMetadataRelationship(
        metadataRelationshipInputFromLegacyJsonRelationship({
          relationship,
          sourceRecordId,
          sourceSlug,
          sourceTitle,
        }),
      ),
    );
}

export function metadataRelationshipToDbInsertPayload(
  relationship: NormalizedMetadataRelationship,
): MetadataRelationshipDbInsertPayload {
  return {
    source_record_id: relationship.sourceRecordId,
    source_slug: relationship.sourceSlug,
    source_title: relationship.sourceTitle,
    target_record_id: relationship.targetRecordId,
    target_slug: relationship.targetSlug,
    target_title: relationship.targetTitle,
    relationship_type: relationship.type,
    label: relationship.label,
    detail: nullableDbText(relationship.detail),
    note: nullableDbText(relationship.note),
    reason: nullableDbText(relationship.reason),
    strength: relationship.strength,
    direction: normalizeRelationshipDirection(relationship.direction),
    source: normalizeRelationshipSource(relationship.source),
  };
}

export function metadataRelationshipToDbUpdatePayload(
  relationship: NormalizedMetadataRelationship,
): MetadataRelationshipDbUpdatePayload {
  return {
    ...metadataRelationshipToDbInsertPayload(relationship),
    updated_at: new Date().toISOString(),
  };
}

export function metadataRelationshipInputToDbInsertPayload(
  input: MetadataRelationshipInput,
): MetadataRelationshipDbInsertPayload {
  return metadataRelationshipToDbInsertPayload(
    normalizeMetadataRelationship(input),
  );
}

export function metadataRelationshipInputToDbUpdatePayload(
  input: MetadataRelationshipInput,
): MetadataRelationshipDbUpdatePayload {
  return metadataRelationshipToDbUpdatePayload(
    normalizeMetadataRelationship(input),
  );
}

export function normalizedRelationshipToUiCompatibleRelationship(
  relationship: NormalizedMetadataRelationship,
): UiCompatibleMetadataRelationship {
  return {
    id: relationship.id,
    targetRecordId: relationship.targetRecordId,
    targetSlug: relationship.targetSlug,
    targetLabel: relationship.targetTitle || relationship.label,
    type: relationship.type,
    label: relationship.label,
    detail: relationship.detail,
    note: relationship.note,
    reason: relationship.reason,
    strength: relationship.strength,
    direction: normalizeRelationshipDirection(relationship.direction),
    source: normalizeRelationshipSource(relationship.source),
  };
}

export function normalizedRelationshipsToUiCompatibleRelationships(
  relationships: NormalizedMetadataRelationship[],
): UiCompatibleMetadataRelationship[] {
  return relationships.map((relationship) =>
    normalizedRelationshipToUiCompatibleRelationship(relationship),
  );
}

export function buildRelationshipDeleteFilter(
  relationship: Pick<NormalizedMetadataRelationship, "id">,
) {
  return {
    id: relationship.id,
  };
}

export function buildRelationshipTargetLookupFilter(
  relationship: Pick<NormalizedMetadataRelationship, "targetSlug">,
) {
  return {
    target_slug: relationship.targetSlug,
  };
}

export function buildRelationshipSourceLookupFilter(
  relationship: Pick<NormalizedMetadataRelationship, "sourceSlug">,
) {
  return {
    source_slug: relationship.sourceSlug,
  };
}

export function validateRelationshipDbPayload(
  payload: MetadataRelationshipDbInsertPayload,
) {
  const missingFields = [
    ["source_record_id", payload.source_record_id],
    ["source_slug", payload.source_slug],
    ["source_title", payload.source_title],
    ["target_record_id", payload.target_record_id],
    ["target_slug", payload.target_slug],
    ["target_title", payload.target_title],
    ["relationship_type", payload.relationship_type],
    ["label", payload.label],
  ].filter(([, value]) => cleanDbText(value).length === 0);

  return {
    valid: missingFields.length === 0,
    missingFields: missingFields.map(([field]) => field),
  };
}

export function coerceRelationshipStrengthForDb(value: unknown) {
  return normalizeRelationshipStrength(value);
}

export function createDbPayloadFromUnknownRelationship(
  value: unknown,
): MetadataRelationshipDbInsertPayload {
  const input = metadataRelationshipInputFromUnknownDbRow(value);
  return metadataRelationshipInputToDbInsertPayload(input);
}

export function createDbPayloadsFromLegacyJsonRelationships({
  relationships,
  sourceRecordId = "",
  sourceSlug = "",
  sourceTitle = "",
}: {
  relationships: unknown[];
  sourceRecordId?: string;
  sourceSlug?: string;
  sourceTitle?: string;
}): MetadataRelationshipDbInsertPayload[] {
  return normalizeLegacyJsonRelationships({
    relationships,
    sourceRecordId,
    sourceSlug,
    sourceTitle,
  }).map((relationship) => metadataRelationshipToDbInsertPayload(relationship));
}