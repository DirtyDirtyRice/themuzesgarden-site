import { createClient } from "@supabase/supabase-js";
import type {
  MetadataRelationshipDisplayRecord,
  MetadataRelationshipRecord,
} from "./metadataRelationshipTypes";

type MetadataRecordLookupRow = {
  id: string;
  title: string | null;
  slug: string | null;
  shelf_key: string | null;
  section_key: string | null;
};

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL.");
  }

  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

export async function getOutgoingMetadataRelationships(
  recordId: string
): Promise<MetadataRelationshipDisplayRecord[]> {
  const safeRecordId = cleanText(recordId);

  if (!safeRecordId) {
    return [];
  }

  const supabase = getSupabaseAdminClient();

  const { data: relationshipRows, error: relationshipError } = await supabase
    .from("metadata_relationships")
    .select("id, source_record_id, target_record_id, relationship_type, notes, created_at")
    .eq("source_record_id", safeRecordId)
    .order("created_at", { ascending: true });

  if (relationshipError) {
    throw new Error(
      relationshipError.message || "Failed to load metadata relationships."
    );
  }

  const safeRelationshipRows = Array.isArray(relationshipRows)
    ? (relationshipRows as MetadataRelationshipRecord[])
    : [];

  if (!safeRelationshipRows.length) {
    return [];
  }

  const targetIds = Array.from(
    new Set(
      safeRelationshipRows
        .map((row) => cleanText(row.target_record_id))
        .filter(Boolean)
    )
  );

  if (!targetIds.length) {
    return [];
  }

  const { data: targetRows, error: targetError } = await supabase
    .from("metadata_records")
    .select("id, title, slug, shelf_key, section_key")
    .in("id", targetIds);

  if (targetError) {
    throw new Error(
      targetError.message || "Failed to load related metadata records."
    );
  }

  const targetMap = new Map<string, MetadataRecordLookupRow>();

  for (const row of Array.isArray(targetRows)
    ? (targetRows as MetadataRecordLookupRow[])
    : []) {
    const id = cleanText(row.id);

    if (!id) {
      continue;
    }

    targetMap.set(id, {
      id,
      title: row.title ?? null,
      slug: row.slug ?? null,
      shelf_key: row.shelf_key ?? null,
      section_key: row.section_key ?? null,
    });
  }

  const displayRows: MetadataRelationshipDisplayRecord[] = [];

  for (const row of safeRelationshipRows) {
    const targetId = cleanText(row.target_record_id);
    const target = targetMap.get(targetId);

    if (!target) {
      continue;
    }

    displayRows.push({
      id: cleanText(row.id),
      sourceRecordId: cleanText(row.source_record_id),
      targetRecordId: targetId,
      relationshipType: cleanText(row.relationship_type),
      notes: row.notes ?? null,
      createdAt: cleanText(row.created_at),
      targetTitle: cleanText(target.title) || "Untitled record",
      targetSlug: cleanText(target.slug),
      targetShelf: target.shelf_key ?? null,
      targetSection: target.section_key ?? null,
    });
  }

  return displayRows;
}