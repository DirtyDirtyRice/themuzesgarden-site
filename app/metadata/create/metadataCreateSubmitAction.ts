import type {
  MetadataCreatePayload,
  MetadataRecord,
  MetadataRelationship,
} from "@/lib/metadata/metadataLibraryTypes";
import type { MetadataRelationshipInput } from "@/lib/metadata/metadataRelationshipEngine";
import type { MetadataRelationshipMutationClient } from "@/lib/metadata/metadataRelationshipMutations";
import {
  createRelationshipsThroughService,
} from "@/lib/metadata/metadataRelationshipService";
import { requireMetadataSupabase } from "@/lib/metadata/metadataSupabase";

type MetadataSupabaseError = {
  message?: string;
  details?: string | null;
  hint?: string | null;
  code?: string;
};

type ExistingRecordCheck = {
  id?: string | null;
  slug?: string | null;
};

type RelationshipExtraShape = {
  relationshipType?: unknown;
  targetTitle?: unknown;
  detail?: unknown;
  reason?: unknown;
  whyItMatters?: unknown;
};

export type MetadataCreateSubmitResult =
  | {
      ok: true;
      createdRecord: MetadataRecord;
      message: string;
    }
  | {
      ok: false;
      message: string;
    };

function cleanCreateText(value: unknown, fallback = "") {
  if (typeof value !== "string") return fallback;
  const cleaned = value.trim();
  return cleaned || fallback;
}

function formatSupabaseError(
  fallback: string,
  error: MetadataSupabaseError | null,
) {
  if (!error) return fallback;

  const message = cleanCreateText(error.message);
  const details = cleanCreateText(error.details);
  const hint = cleanCreateText(error.hint);
  const code = cleanCreateText(error.code);

  const parts = [message, details, hint, code ? `Code: ${code}` : ""].filter(Boolean);

  if (parts.length < 1) return fallback;

  return `${fallback} ${parts.join(" ")}`;
}

function validateCreateRecord(record: MetadataRecord) {
  const id = cleanCreateText(record.id);
  const slug = cleanCreateText(record.slug);
  const title = cleanCreateText(record.title);

  if (!id) return "Record id is missing.";
  if (!slug) return "Record slug is missing.";
  if (!title) return "Record title is missing.";

  return "";
}

function getRelationshipMutationClient() {
  return requireMetadataSupabase() as unknown as MetadataRelationshipMutationClient;
}

function getExtra(relationship: MetadataRelationship): RelationshipExtraShape {
  return relationship as unknown as RelationshipExtraShape;
}

function buildRelationshipInput(
  record: MetadataRecord,
  relationship: MetadataRelationship,
): MetadataRelationshipInput {
  const extra = getExtra(relationship);

  const sourceTitle = cleanCreateText(record.title, "Untitled Record");
  const targetRecordId = cleanCreateText(relationship.targetRecordId);
  const targetSlug = cleanCreateText(relationship.targetSlug, targetRecordId);
  const targetTitle = cleanCreateText(
    relationship.targetLabel ?? extra.targetTitle,
    "Selected record",
  );

  const type = cleanCreateText(
    relationship.type ?? extra.relationshipType,
    "related_to",
  );

  const detail = cleanCreateText(
    extra.detail ??
      relationship.note ??
      extra.reason ??
      extra.whyItMatters,
    `${sourceTitle} is connected to ${targetTitle}.`,
  );

  return {
    sourceRecordId: cleanCreateText(record.id),
    sourceSlug: cleanCreateText(record.slug),
    sourceTitle,
    targetRecordId,
    targetSlug,
    targetTitle,
    type,
    label: type,
    detail,
    note: cleanCreateText(relationship.note),
    reason: cleanCreateText(extra.reason, detail),
    strength: "normal",
    direction: "outgoing",
    source: "metadata-create",
  };
}

function buildRelationshipInputs(record: MetadataRecord): MetadataRelationshipInput[] {
  const relationships = Array.isArray(record.relationships)
    ? record.relationships
    : [];

  return relationships.map((rel) => buildRelationshipInput(record, rel));
}

async function saveCreateRelationships(record: MetadataRecord) {
  const inputs = buildRelationshipInputs(record);

  if (inputs.length === 0) {
    return {
      ok: true,
      savedCount: 0,
      message: "",
    };
  }

  const result = await createRelationshipsThroughService({
    client: getRelationshipMutationClient(),
    inputs,
  });

  if (!result.ok) {
    return {
      ok: false,
      savedCount: 0,
      message: "Record saved, but relationship table save failed.",
    };
  }

  return {
    ok: true,
    savedCount: inputs.length,
    message: " Relationship saved to metadata_relationships.",
  };
}

async function findExistingRecordByColumn(
  column: "id" | "slug",
  value: string,
): Promise<{
  existingRecord: ExistingRecordCheck | null;
  errorMessage: string;
}> {
  const supabase = requireMetadataSupabase();

  const { data, error } = await supabase
    .from("metadata_records")
    .select("id, slug")
    .eq(column, value)
    .maybeSingle();

  if (error) {
    return {
      existingRecord: null,
      errorMessage: formatSupabaseError(
        `Failed to check existing records by ${column}.`,
        error,
      ),
    };
  }

  return {
    existingRecord: data,
    errorMessage: "",
  };
}

async function findExistingRecord(record: MetadataRecord) {
  const id = cleanCreateText(record.id);
  const slug = cleanCreateText(record.slug);

  const idCheck = await findExistingRecordByColumn("id", id);

  if (idCheck.errorMessage) return idCheck;
  if (idCheck.existingRecord) return idCheck;

  return findExistingRecordByColumn("slug", slug);
}

export async function executeMetadataCreateSubmit(
  payload: MetadataCreatePayload,
): Promise<MetadataCreateSubmitResult> {
  if (!payload.readyForCreate) {
    return {
      ok: false,
      message: "Record is not ready for create yet.",
    };
  }

  const supabase = requireMetadataSupabase();
  const record = payload.record;

  const validationError = validateCreateRecord(record);
  if (validationError) {
    return { ok: false, message: validationError };
  }

  const existingCheck = await findExistingRecord(record);

  if (existingCheck.errorMessage) {
    return { ok: false, message: existingCheck.errorMessage };
  }

  if (existingCheck.existingRecord) {
    return {
      ok: false,
      message: "Record with this id or slug already exists.",
    };
  }

  const { error: insertError } = await supabase.from("metadata_records").insert([
    {
      id: record.id,
      slug: record.slug,
      title: record.title,
      shelf: record.shelf,
      section: record.section,
      visibility: record.visibility,
      excerpt: record.excerpt,
      description: record.description,
      fields: record.fields,
    },
  ]);

  if (insertError) {
    return {
      ok: false,
      message: formatSupabaseError(
        "Failed to insert record into database.",
        insertError,
      ),
    };
  }

  const relationshipResult = await saveCreateRelationships(record);

  if (!relationshipResult.ok) {
    return {
      ok: false,
      message: relationshipResult.message,
    };
  }

  return {
    ok: true,
    createdRecord: {
      ...record,
      relationships: [],
    },
    message: `Record "${record.title}" saved to database.${relationshipResult.message}`,
  };
}