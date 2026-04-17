import type {
  MetadataRecord,
  MetadataRecordSummary,
} from "./metadataLibraryTypes";
import { requireMetadataSupabase } from "./metadataSupabase";

function mapRowToMetadataRecord(row: any): MetadataRecord {
  return {
    id: String(row?.id ?? ""),
    slug: String(row?.slug ?? ""),
    title: String(row?.title ?? ""),
    shelf: row?.shelf,
    section: row?.section,
    visibility: row?.visibility,
    excerpt: String(row?.excerpt ?? ""),
    description: String(row?.description ?? ""),
    fields: Array.isArray(row?.fields) ? row.fields : [],
    relationships: Array.isArray(row?.relationships) ? row.relationships : [],
  };
}

export async function getMetadataRecordSummariesFromDb(): Promise<
  MetadataRecordSummary[]
> {
  const supabase = requireMetadataSupabase();

  const { data, error } = await supabase
    .from("metadata_records")
    .select("id, slug, title, shelf, section, visibility, excerpt")
    .order("created_at", { ascending: false });

  if (error || !Array.isArray(data)) {
    return [];
  }

  return data.map((row: any) => ({
    id: String(row?.id ?? ""),
    slug: String(row?.slug ?? ""),
    title: String(row?.title ?? ""),
    shelf: row?.shelf,
    section: row?.section,
    visibility: row?.visibility,
    excerpt: String(row?.excerpt ?? ""),
  }));
}

export async function getMetadataRecordBySlugFromDb(
  slug: string
): Promise<MetadataRecord | null> {
  const supabase = requireMetadataSupabase();

  const { data, error } = await supabase
    .from("metadata_records")
    .select(
      "id, slug, title, shelf, section, visibility, excerpt, description, fields, relationships"
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapRowToMetadataRecord(data);
}

export async function getMetadataRelationshipTargetSlugFromDb(
  relationship: { targetRecordId: string; targetSlug?: string } | null | undefined
): Promise<string | null> {
  if (!relationship) {
    return null;
  }

  const explicitSlug = String(relationship.targetSlug ?? "").trim();
  if (explicitSlug) {
    return explicitSlug;
  }

  const supabase = requireMetadataSupabase();

  const { data, error } = await supabase
    .from("metadata_records")
    .select("slug")
    .eq("id", relationship.targetRecordId)
    .maybeSingle();

  if (error || !data?.slug) {
    return null;
  }

  return String(data.slug);
}