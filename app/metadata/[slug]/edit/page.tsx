import Link from "next/link";
import {
  getMetadataRecordBySlugFromDb,
  getMetadataRecordSummariesFromDb,
} from "@/lib/metadata/metadataFetch";
import { getMetadataRecordBySlug } from "@/lib/metadata/metadataLibrarySeed";
import type { MetadataRecordSummary } from "@/lib/metadata/metadataLibraryTypes";

import MetadataRecordEditClient from "./MetadataRecordEditClient";

type MetadataRecordEditPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type EditRecordSource =
  | {
      kind: "database";
      label: "Database record";
      canEdit: true;
    }
  | {
      kind: "seed";
      label: "Seed fallback record";
      canEdit: false;
    }
  | {
      kind: "missing";
      label: "Missing record";
      canEdit: false;
    };

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function isUsefulSummary(summary: MetadataRecordSummary) {
  return Boolean(
    cleanText(summary.id) &&
      cleanText(summary.slug) &&
      cleanText(summary.title),
  );
}

function dedupeSummariesById(summaries: MetadataRecordSummary[]) {
  const seenIds = new Set<string>();

  return summaries.filter((summary) => {
    const id = cleanText(summary.id);

    if (!id || seenIds.has(id)) {
      return false;
    }

    seenIds.add(id);
    return isUsefulSummary(summary);
  });
}

function BackToLibraryLink() {
  return (
    <Link
      href="/metadata/library"
      className="inline-flex rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:opacity-85 active:scale-[0.98]"
    >
      Back to Metadata Library
    </Link>
  );
}

function EditStatusCard({
  source,
  slug,
}: {
  source: EditRecordSource;
  slug: string;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <p className="text-sm uppercase tracking-[0.2em] text-white/45">
        Metadata Edit
      </p>

      <h1 className="mt-2 text-3xl font-semibold text-white">
        {source.kind === "missing"
          ? "Record Not Found"
          : "Database Edit Required"}
      </h1>

      <div className="mt-4 rounded-xl border border-white/10 bg-black px-3 py-2 text-sm text-white/70">
        <span className="text-white/45">Source: </span>
        <span className="font-semibold text-white">{source.label}</span>
      </div>

      <p className="mt-4 max-w-2xl text-sm leading-6 text-white/70">
        {source.kind === "missing"
          ? "The metadata record you tried to edit does not exist in the database."
          : "This record exists only in the seed fallback dataset. Editing is locked to database records so saves do not pretend to work on starter data."}
      </p>

      {source.kind === "seed" ? (
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
          To edit this record later, create or migrate it into the database
          first. The current slug is{" "}
          <span className="font-semibold text-white">{slug}</span>.
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        <BackToLibraryLink />

        {source.kind === "seed" ? (
          <Link
            href={`/metadata/${encodeURIComponent(slug)}`}
            className="inline-flex rounded-md border border-white bg-white px-3 py-2 text-sm font-medium text-black transition hover:opacity-85 active:scale-[0.98]"
          >
            View Seed Record
          </Link>
        ) : null}
      </div>
    </section>
  );
}

export default async function MetadataRecordEditPage({
  params,
}: MetadataRecordEditPageProps) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  const dbRecord = await getMetadataRecordBySlugFromDb(decodedSlug);

  if (!dbRecord) {
    const seedRecord = getMetadataRecordBySlug(decodedSlug);
    const source: EditRecordSource = seedRecord
      ? {
          kind: "seed",
          label: "Seed fallback record",
          canEdit: false,
        }
      : {
          kind: "missing",
          label: "Missing record",
          canEdit: false,
        };

    return (
      <main className="min-h-screen bg-black px-4 py-6 text-white md:px-6">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
          <EditStatusCard source={source} slug={decodedSlug} />
        </div>
      </main>
    );
  }

  const dbRecordSummaries = await getMetadataRecordSummariesFromDb();
  const recordSummaries = dedupeSummariesById(dbRecordSummaries);

  return (
    <MetadataRecordEditClient
      record={dbRecord}
      recordSummaries={recordSummaries}
    />
  );
}