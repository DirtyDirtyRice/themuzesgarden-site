import type {
  MetadataCreatePayload,
  MetadataRecord,
} from "@/lib/metadata/metadataLibraryTypes";

import { requireMetadataSupabase } from "@/lib/metadata/metadataSupabase";

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

export async function executeMetadataCreateSubmit(
  payload: MetadataCreatePayload
): Promise<MetadataCreateSubmitResult> {
  if (!payload.readyForCreate) {
    return {
      ok: false,
      message: "Record is not ready for create yet.",
    };
  }

  const supabase = requireMetadataSupabase();
  const record = payload.record;

  // 🔒 Check duplicates
  const { data: existing, error: checkError } = await supabase
    .from("metadata_records")
    .select("id, slug")
    .or(`id.eq.${record.id},slug.eq.${record.slug}`)
    .limit(1);

  if (checkError) {
    return {
      ok: false,
      message: "Failed to check existing records.",
    };
  }

  if (existing && existing.length > 0) {
    return {
      ok: false,
      message: "Record with this id or slug already exists.",
    };
  }

  // 💾 Insert into DB
  const { error: insertError } = await supabase
    .from("metadata_records")
    .insert([
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
        relationships: record.relationships,
      },
    ]);

  if (insertError) {
    return {
      ok: false,
      message: "Failed to insert record into database.",
    };
  }

  return {
    ok: true,
    createdRecord: record,
    message: `Record "${record.title}" saved to database.`,
  };
}