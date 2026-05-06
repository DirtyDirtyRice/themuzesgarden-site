"use client";

import { useState } from "react";

import type { MetadataRelationshipInput } from "@/lib/metadata/metadataRelationshipEngine";
import type { MetadataRelationshipMutationClient } from "@/lib/metadata/metadataRelationshipMutations";
import { createRelationshipThroughService } from "@/lib/metadata/metadataRelationshipService";
import { requireMetadataSupabase } from "@/lib/metadata/metadataSupabase";

type SavePanelRecord = {
  id?: unknown;
  slug?: unknown;
  title?: unknown;
  shelf?: unknown;
  section?: unknown;
  visibility?: unknown;
  excerpt?: unknown;
  description?: unknown;
  fields?: unknown;
  relationships?: unknown;
};

type SavePanelPayload = {
  record?: SavePanelRecord;
};

type SavePanelRelationship = {
  id?: unknown;
  type?: unknown;
  relationshipType?: unknown;
  targetRecordId?: unknown;
  targetSlug?: unknown;
  targetLabel?: unknown;
  targetTitle?: unknown;
  note?: unknown;
  reason?: unknown;
  detail?: unknown;
};

export default function MetadataCreateSavePanel({
  payload,
}: {
  payload: SavePanelPayload;
}) {
  const [status, setStatus] = useState<string>("");

  function cleanPanelText(value: unknown, fallback = "") {
    if (typeof value !== "string") return fallback;

    const cleaned = value.trim();
    return cleaned || fallback;
  }

  function getRelationshipMutationClient() {
    return requireMetadataSupabase() as unknown as MetadataRelationshipMutationClient;
  }

  function getRecordRelationships(record: SavePanelRecord) {
    return Array.isArray(record.relationships)
      ? (record.relationships as SavePanelRelationship[])
      : [];
  }

  function buildRelationshipInput(
    record: SavePanelRecord,
    relationship: SavePanelRelationship,
  ): MetadataRelationshipInput {
    const sourceTitle = cleanPanelText(record.title, "Untitled Record");
    const targetRecordId = cleanPanelText(relationship.targetRecordId);
    const targetSlug = cleanPanelText(relationship.targetSlug, targetRecordId);
    const targetTitle = cleanPanelText(
      relationship.targetLabel ?? relationship.targetTitle,
      "Selected record",
    );
    const type = cleanPanelText(
      relationship.type ?? relationship.relationshipType,
      "related_to",
    );
    const detail = cleanPanelText(
      relationship.detail ?? relationship.note ?? relationship.reason,
      `${sourceTitle} is connected to ${targetTitle}.`,
    );

    return {
      sourceRecordId: cleanPanelText(record.id),
      sourceSlug: cleanPanelText(record.slug),
      sourceTitle,
      targetRecordId,
      targetSlug,
      targetTitle,
      type,
      label: type,
      detail,
      note: cleanPanelText(relationship.note),
      reason: cleanPanelText(relationship.reason, detail),
      strength: "normal",
      direction: "outgoing",
      source: "metadata-create-simple-save",
    };
  }

  async function saveRelationships(record: SavePanelRecord) {
    const relationships = getRecordRelationships(record);

    for (const relationship of relationships) {
      const result = await createRelationshipThroughService({
        client: getRelationshipMutationClient(),
        input: buildRelationshipInput(record, relationship),
      });

      if (!result.ok) {
        throw new Error("Record saved, but relationship table save failed.");
      }
    }

    return relationships.length;
  }

  async function handleSimpleCreate() {
    setStatus("Saving...");

    try {
      const supabase = requireMetadataSupabase();
      const record = payload.record;

      if (!record) {
        setStatus("❌ Failed: record payload is missing.");
        return;
      }

      const { error } = await supabase.from("metadata_records").insert([
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

      if (error) {
        setStatus("❌ Failed: " + error.message);
        return;
      }

      const savedRelationshipCount = await saveRelationships(record);

      if (savedRelationshipCount > 0) {
        setStatus("✅ Record and relationship saved successfully");
        return;
      }

      setStatus("✅ Record saved successfully");
    } catch (err: unknown) {
      setStatus(
        "❌ Error: " +
          (err instanceof Error ? err.message : "Unknown save error."),
      );
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
      <h2 className="mb-4 text-lg font-semibold text-white">
        Simple Save (New Button)
      </h2>

      <button
        onClick={handleSimpleCreate}
        className="rounded-xl border border-white/20 bg-white/90 px-5 py-2 text-sm font-medium text-black"
      >
        Save Record (New)
      </button>

      {status ? <p className="mt-4 text-sm text-white/70">{status}</p> : null}
    </div>
  );
}