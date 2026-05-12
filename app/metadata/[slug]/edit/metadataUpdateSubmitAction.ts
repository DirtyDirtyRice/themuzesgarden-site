import type { MetadataRecord } from "@/lib/metadata/metadataLibraryTypes";
import type { MetadataRelationshipInput } from "@/lib/metadata/metadataRelationshipEngine";
import type { MetadataRelationshipMutationClient } from "@/lib/metadata/metadataRelationshipMutations";
import {
  createRelationshipsThroughService,
} from "@/lib/metadata/metadataRelationshipService";
import { requireMetadataSupabase } from "@/lib/metadata/metadataSupabase";

export type MetadataUpdateRelationshipDraft = {
  sourceRecordId: string;
  sourceSlug: string;
  sourceTitle: string;
  targetRecordId: string;
  targetSlug: string;
  targetTitle: string;
  relationshipType: string;
  detail: string;
  note: string;
  reason: string;
};

export type MetadataUpdateSubmitInput = {
  originalRecordId: string;
  originalSlug: string;
  updatedRecord: MetadataRecord;
  readyForUpdate: boolean;
  relationshipDraft?: MetadataUpdateRelationshipDraft | null;
};

export type MetadataUpdateSubmitResult =
  | {
      ok: true;
      updatedRecord: MetadataRecord;
      message: string;
    }
  | {
      ok: false;
      message: string;
    };

function cleanSubmitText(value: unknown, fallback = "") {
  if (typeof value === "number") return String(value);
  if (typeof value !== "string") return fallback;

  const cleaned = value.trim().replace(/\s+/g, " ");
  return cleaned.length > 0 ? cleaned : fallback;
}

function getRelationshipMutationClient() {
  return requireMetadataSupabase() as unknown as MetadataRelationshipMutationClient;
}

function hasRelationshipDraft(
  draft: MetadataUpdateRelationshipDraft | null | undefined,
): draft is MetadataUpdateRelationshipDraft {
  if (!draft) return false;

  return Boolean(
    cleanSubmitText(draft.sourceRecordId) &&
      cleanSubmitText(draft.sourceSlug) &&
      cleanSubmitText(draft.sourceTitle) &&
      cleanSubmitText(draft.targetRecordId) &&
      cleanSubmitText(draft.targetSlug) &&
      cleanSubmitText(draft.targetTitle) &&
      cleanSubmitText(draft.relationshipType),
  );
}

function buildRelationshipInput(
  draft: MetadataUpdateRelationshipDraft,
): MetadataRelationshipInput {
  const relationshipType = cleanSubmitText(draft.relationshipType, "related_to");
  const sourceTitle = cleanSubmitText(draft.sourceTitle, "This record");
  const targetTitle = cleanSubmitText(draft.targetTitle, "Selected record");
  const detail = cleanSubmitText(
    draft.detail,
    `${sourceTitle} is connected to ${targetTitle}.`,
  );

  return {
    sourceRecordId: cleanSubmitText(draft.sourceRecordId),
    sourceSlug: cleanSubmitText(draft.sourceSlug),
    sourceTitle,
    targetRecordId: cleanSubmitText(draft.targetRecordId),
    targetSlug: cleanSubmitText(draft.targetSlug),
    targetTitle,
    type: relationshipType,
    label: relationshipType,
    detail,
    note: cleanSubmitText(draft.note),
    reason: cleanSubmitText(draft.reason, detail),
    strength: "normal",
    direction: "outgoing",
    source: "metadata-edit",
  };
}

async function createRelationshipIfPresent(
  relationshipDraft: MetadataUpdateRelationshipDraft | null | undefined,
) {
  if (!hasRelationshipDraft(relationshipDraft)) {
    return { ok: true, created: false, message: "" };
  }

  const input = buildRelationshipInput(relationshipDraft);

  const result = await createRelationshipsThroughService({
    client: getRelationshipMutationClient(),
    inputs: [input], // batch even for single
  });

  if (!result.ok) {
    return {
      ok: false,
      created: false,
      message: "Failed to create relationship in database.",
    };
  }

  return {
    ok: true,
    created: true,
    message: " Relationship saved to metadata_relationships.",
  };
}

export async function executeMetadataUpdateSubmit({
  originalRecordId,
  originalSlug,
  updatedRecord,
  readyForUpdate,
  relationshipDraft,
}: MetadataUpdateSubmitInput): Promise<MetadataUpdateSubmitResult> {
  if (!readyForUpdate) {
    return {
      ok: false,
      message: "Record is not ready to update yet.",
    };
  }

  const supabase = requireMetadataSupabase();

  const nextSlug = cleanSubmitText(updatedRecord.slug);
  const previousSlug = cleanSubmitText(originalSlug);

  if (nextSlug && nextSlug !== previousSlug) {
    const { data: existingSlugRow, error: slugCheckError } = await supabase
      .from("metadata_records")
      .select("id, slug")
      .eq("slug", nextSlug)
      .neq("id", originalRecordId)
      .limit(1);

    if (slugCheckError) {
      return {
        ok: false,
        message: "Failed to check slug uniqueness during update.",
      };
    }

    if (Array.isArray(existingSlugRow) && existingSlugRow.length > 0) {
      return {
        ok: false,
        message: `Another record already uses slug "${nextSlug}".`,
      };
    }
  }

  const { error: updateError } = await supabase
    .from("metadata_records")
    .update({
      slug: updatedRecord.slug,
      title: updatedRecord.title,
      shelf: updatedRecord.shelf,
      section: updatedRecord.section,
      visibility: updatedRecord.visibility,
      excerpt: updatedRecord.excerpt,
      description: updatedRecord.description,
      fields: updatedRecord.fields,
    })
    .eq("id", originalRecordId);

  if (updateError) {
    return {
      ok: false,
      message: "Failed to update record in database.",
    };
  }

  const relationshipResult = await createRelationshipIfPresent(relationshipDraft);

  if (!relationshipResult.ok) {
    return {
      ok: false,
      message: relationshipResult.message,
    };
  }

  return {
    ok: true,
    updatedRecord: {
      ...updatedRecord,
      relationships: [],
    },
    message: `Record "${updatedRecord.title}" was updated successfully.${relationshipResult.message}`,
  };
}