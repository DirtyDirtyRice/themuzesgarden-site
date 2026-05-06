import { redirect } from "next/navigation";

import {
  attachMetadataRecordToTrackInDb,
  getMetadataRecordBySlugFromDb,
} from "@/lib/metadata/metadataFetch";
import { getMetadataRecords } from "@/lib/metadata/metadataLibrarySeed";
import { requireMetadataSupabase } from "@/lib/metadata/metadataSupabase";
import { normalizedRelationshipsToUiCompatibleRelationships } from "@/lib/metadata/metadataRelationshipAdapter";
import {
  deleteRelationshipThroughService,
  getMetadataRelationshipsTableOnlyForRecord,
} from "@/lib/metadata/metadataRelationshipService";
import type { MetadataRelationshipMutationClient } from "@/lib/metadata/metadataRelationshipMutations";
import type { MetadataRelationshipQueryClient } from "@/lib/metadata/metadataRelationshipQueries";

import MetadataRecordActionsSection from "./MetadataRecordActionsSection";
import MetadataRecordFieldsSection from "./MetadataRecordFieldsSection";
import MetadataRecordNotFound from "./MetadataRecordNotFound";
import MetadataRecordPageHeader from "./MetadataRecordPageHeader";
import MetadataRecordRelationshipsSection from "./MetadataRecordRelationshipsSection";
import TrackMetadataEmptyState from "./TrackMetadataEmptyState";

type MetadataRecordPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    attachTrackId?: string;
    attached?: string;
  }>;
};

type PageRecord = {
  id?: string | number | null;
  slug?: string | null;
  title?: string | null;
  description?: string | null;
  excerpt?: string | null;
  fields?: unknown[];
  relationships?: unknown[];
};

function getSeedRecordBySlug(slug: string) {
  const records = getMetadataRecords();
  return records.find((r) => r.slug === slug) || null;
}

function looksLikeTrackId(slug: string) {
  return slug.length > 20;
}

function getRecordDescription(record: {
  description?: string | null;
  excerpt?: string | null;
}) {
  return String(record.description ?? record.excerpt ?? "").trim();
}

function getRecordId(record: PageRecord) {
  return String(record.id ?? "").trim();
}

function getRecordSlug(record: PageRecord) {
  return String(record.slug ?? "").trim();
}

function getSafeFields(record: PageRecord) {
  return Array.isArray(record.fields) ? record.fields : [];
}

function getRelationshipClient() {
  return requireMetadataSupabase() as unknown as MetadataRelationshipQueryClient;
}

function getRelationshipMutationClient() {
  return requireMetadataSupabase() as unknown as MetadataRelationshipMutationClient;
}

async function getDisplayRelationshipsForRecord(record: PageRecord) {
  const recordSlug = getRecordSlug(record);

  if (!recordSlug) {
    return [];
  }

  const result = await getMetadataRelationshipsTableOnlyForRecord({
    client: getRelationshipClient(),
    recordSlug,
  });

  if (!result.ok || result.relationships.length === 0) {
    return [];
  }

  return normalizedRelationshipsToUiCompatibleRelationships(result.relationships);
}

function MetadataRecordNavigationPath({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border border-white/20 bg-white/[0.03] p-4">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/60">
        How to get here
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-white/85">
        <span className="rounded-lg border border-white/15 px-3 py-1">
          Home
        </span>
        <span>→</span>
        <span className="rounded-lg border border-white/15 px-3 py-1">
          Metadata
        </span>
        <span>→</span>
        <span className="rounded-lg border border-white/15 px-3 py-1">
          Library
        </span>
        <span>→</span>
        <span className="rounded-lg border border-white/15 px-3 py-1">
          Open record
        </span>
        <span>→</span>
        <span className="rounded-lg border border-white/15 bg-white/10 px-3 py-1 font-semibold text-white">
          {title || "This record"}
        </span>
      </div>

      <p className="mt-3 text-xs leading-5 text-white/60">
        You are viewing a single metadata record. Use Library to find it again,
        or use Create to build a new one.
      </p>
    </div>
  );
}

export default async function MetadataRecordPage({
  params,
  searchParams,
}: MetadataRecordPageProps) {
  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const decodedSlug = decodeURIComponent(slug);
  const attachTrackId = String(resolvedSearchParams?.attachTrackId ?? "").trim();
  const attached = String(resolvedSearchParams?.attached ?? "").trim() === "1";

  let record = (await getMetadataRecordBySlugFromDb(decodedSlug)) as PageRecord | null;

  if (!record) {
    record = getSeedRecordBySlug(decodedSlug) as PageRecord | null;
  }

  if (!record && looksLikeTrackId(decodedSlug)) {
    return (
      <main className="min-h-screen bg-black px-4 py-6 md:px-6">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
          <TrackMetadataEmptyState key={decodedSlug} trackId={decodedSlug} />
        </div>
      </main>
    );
  }

  if (!record) {
    return <MetadataRecordNotFound slug={decodedSlug} />;
  }

  async function attachToTrackAction() {
    "use server";

    const cleanTrackId = String(attachTrackId ?? "").trim();
    const cleanRecordId = getRecordId(record as PageRecord);
    const cleanSlug = getRecordSlug(record as PageRecord);

    if (!cleanTrackId || !cleanRecordId || !cleanSlug) {
      return;
    }

    await attachMetadataRecordToTrackInDb(cleanTrackId, cleanRecordId);

    redirect(
      `/metadata/${encodeURIComponent(cleanSlug)}?attachTrackId=${encodeURIComponent(
        cleanTrackId,
      )}&attached=1`,
    );
  }

  async function removeRelationshipAction(formData: FormData) {
    "use server";

    const cleanSlug = getRecordSlug(record as PageRecord);
    const relationshipId = String(formData.get("relationshipId") ?? "").trim();

    if (!cleanSlug || !relationshipId) {
      return;
    }

    await deleteRelationshipThroughService({
      client: getRelationshipMutationClient(),
      relationshipId,
    });

    redirect(`/metadata/${encodeURIComponent(cleanSlug)}`);
  }

  const relationships = await getDisplayRelationshipsForRecord(record);
  const fields = getSafeFields(record);
  const recordDescription = getRecordDescription(record);

  return (
    <main
      id="top"
      className="min-h-screen bg-black px-4 py-6 text-white md:px-6"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <MetadataRecordNavigationPath title={String(record.title ?? "")} />

        <MetadataRecordPageHeader
          record={{
            ...record,
            relationships,
            description: recordDescription,
          }}
          attachTrackId={attachTrackId}
          attached={attached}
        />

        <MetadataRecordActionsSection
          recordId={record.id}
          attachTrackId={attachTrackId}
          attached={attached}
          onAttach={attachToTrackAction}
        />

        <MetadataRecordRelationshipsSection
          relationships={relationships}
          onRemove={removeRelationshipAction}
        />

        <MetadataRecordFieldsSection fields={fields} />
      </div>
    </main>
  );
}