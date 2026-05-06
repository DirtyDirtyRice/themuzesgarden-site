import type {
  MetadataRecord,
  MetadataRecordSummary,
} from "./metadataLibraryTypes";
import { requireMetadataSupabase } from "./metadataSupabase";

type MetadataRecordRow = {
  id?: unknown;
  slug?: unknown;
  title?: unknown;
  shelf?: unknown;
  section?: unknown;
  visibility?: unknown;
  excerpt?: unknown;
  description?: unknown;
  fields?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
};

type MetadataRelationshipLookup = {
  targetRecordId: string;
  targetSlug?: string;
} | null | undefined;

type TrackMetadataLinkRow = {
  id?: unknown;
};

const METADATA_RECORD_SUMMARY_SELECT =
  "id, slug, title, shelf, section, visibility, excerpt";

const METADATA_RECORD_FULL_SELECT =
  "id, slug, title, shelf, section, visibility, excerpt, description, fields";

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function cleanJsonArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function isUsefulSummary(summary: MetadataRecordSummary) {
  return Boolean(summary.id && summary.slug && summary.title);
}

function normalizeMetadataRecordSummary(
  row: MetadataRecordRow,
): MetadataRecordSummary {
  return {
    id: cleanText(row.id),
    slug: cleanText(row.slug),
    title: cleanText(row.title),

    shelf: (cleanText(row.shelf) || "projects") as MetadataRecordSummary["shelf"],
    section: (cleanText(row.section) || "notes") as MetadataRecordSummary["section"],
    visibility: (cleanText(row.visibility) || "public") as MetadataRecordSummary["visibility"],

    excerpt: cleanText(row.excerpt),
  };
}

function mapRowToMetadataRecord(row: MetadataRecordRow): MetadataRecord {
  const summary = normalizeMetadataRecordSummary(row);

  return {
    ...summary,
    description: cleanText(row.description),
    fields: cleanJsonArray(row.fields),
    relationships: [],
  };
}

function hasSupabaseReadError(error: unknown) {
  return Boolean(error);
}

export async function getMetadataRecordSummariesFromDb(): Promise<
  MetadataRecordSummary[]
> {
  const supabase = requireMetadataSupabase();

  const { data, error } = await supabase
    .from("metadata_records")
    .select(METADATA_RECORD_SUMMARY_SELECT)
    .order("created_at", { ascending: false });

  if (hasSupabaseReadError(error) || !Array.isArray(data)) {
    return [];
  }

  return data
    .map((row) => normalizeMetadataRecordSummary(row as MetadataRecordRow))
    .filter(isUsefulSummary);
}

export async function getMetadataRecordBySlugFromDb(
  slug: string,
): Promise<MetadataRecord | null> {
  const cleanSlug = cleanText(slug);

  if (!cleanSlug) {
    return null;
  }

  const supabase = requireMetadataSupabase();

  const { data, error } = await supabase
    .from("metadata_records")
    .select(METADATA_RECORD_FULL_SELECT)
    .eq("slug", cleanSlug)
    .maybeSingle();

  if (hasSupabaseReadError(error) || !data) {
    return null;
  }

  const record = mapRowToMetadataRecord(data as MetadataRecordRow);
  return record.id && record.slug ? record : null;
}

export async function getMetadataRelationshipTargetSlugFromDb(
  relationship: MetadataRelationshipLookup,
): Promise<string | null> {
  if (!relationship) {
    return null;
  }

  const explicitSlug = cleanText(relationship.targetSlug);
  if (explicitSlug) {
    return explicitSlug;
  }

  const cleanTargetRecordId = cleanText(relationship.targetRecordId);
  if (!cleanTargetRecordId) {
    return null;
  }

  const supabase = requireMetadataSupabase();

  const { data, error } = await supabase
    .from("metadata_records")
    .select("slug")
    .eq("id", cleanTargetRecordId)
    .maybeSingle();

  if (hasSupabaseReadError(error) || !data) {
    return null;
  }

  const slug = cleanText((data as { slug?: unknown }).slug);
  return slug || null;
}

export async function attachMetadataRecordToTrackInDb(
  trackId: string,
  metadataRecordId: string,
): Promise<boolean> {
  const cleanTrackId = cleanText(trackId);
  const cleanMetadataRecordId = cleanText(metadataRecordId);

  if (!cleanTrackId || !cleanMetadataRecordId) {
    return false;
  }

  const supabase = requireMetadataSupabase();

  const { data: existing, error: existingError } = await supabase
    .from("track_metadata_links")
    .select("id")
    .eq("track_id", cleanTrackId)
    .eq("metadata_record_id", cleanMetadataRecordId)
    .maybeSingle();

  if (hasSupabaseReadError(existingError)) {
    return false;
  }

  if ((existing as TrackMetadataLinkRow | null)?.id) {
    return true;
  }

  const { error: insertError } = await supabase
    .from("track_metadata_links")
    .insert({
      track_id: cleanTrackId,
      metadata_record_id: cleanMetadataRecordId,
    });

  return !insertError;
}

export async function removeMetadataRelationshipFromRecordInDb(
  recordId: string,
  relationshipId: string,
): Promise<boolean> {
  const cleanRecordId = cleanText(recordId);
  const cleanRelationshipId = cleanText(relationshipId);

  return Boolean(cleanRecordId && cleanRelationshipId);
}

export async function metadataRecordSlugExistsInDb(
  slug: string,
): Promise<boolean> {
  const cleanSlug = cleanText(slug);

  if (!cleanSlug) {
    return false;
  }

  const supabase = requireMetadataSupabase();

  const { data, error } = await supabase
    .from("metadata_records")
    .select("id")
    .eq("slug", cleanSlug)
    .maybeSingle();

  if (hasSupabaseReadError(error) || !data) {
    return false;
  }

  return Boolean((data as { id?: unknown }).id);
}

export async function getMetadataRecordSummaryByIdFromDb(
  recordId: string,
): Promise<MetadataRecordSummary | null> {
  const cleanRecordId = cleanText(recordId);

  if (!cleanRecordId) {
    return null;
  }

  const supabase = requireMetadataSupabase();

  const { data, error } = await supabase
    .from("metadata_records")
    .select(METADATA_RECORD_SUMMARY_SELECT)
    .eq("id", cleanRecordId)
    .maybeSingle();

  if (hasSupabaseReadError(error) || !data) {
    return null;
  }

  const summary = normalizeMetadataRecordSummary(data as MetadataRecordRow);
  return isUsefulSummary(summary) ? summary : null;
}