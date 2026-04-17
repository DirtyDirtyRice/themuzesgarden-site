import Link from "next/link";
import {
  getMetadataRecordBySlugFromDb,
  getMetadataRelationshipTargetSlugFromDb,
} from "@/lib/metadata/metadataFetch";

type MetadataRecordPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function formatLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function renderFieldValue(value: string | number | boolean | string[]) {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  return String(value);
}

export default async function MetadataRecordPage({
  params,
}: MetadataRecordPageProps) {
  const { slug } = await params;
  const record = await getMetadataRecordBySlugFromDb(slug);

  if (!record) {
    return (
      <main className="min-h-screen bg-black px-4 py-6 text-white md:px-6">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-white/45">
              Metadata Record
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-white">
              Record Not Found
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">
              The metadata record you tried to open does not exist in the current
              database dataset.
            </p>

            <div className="mt-5">
              <Link
                href="/metadata"
                className="inline-flex rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Back to Metadata Library
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-4 py-6 text-white md:px-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-white/10 px-2 py-1 text-white/70">
                {formatLabel(record.shelf)}
              </span>
              <span className="rounded-full border border-white/10 px-2 py-1 text-white/70">
                {formatLabel(record.section)}
              </span>
              <span className="rounded-full border border-white/10 px-2 py-1 text-white/70">
                {formatLabel(record.visibility)}
              </span>
            </div>

            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
              Metadata Record
            </p>

            <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
              {record.title}
            </h1>

            <p className="max-w-3xl text-sm leading-6 text-white/70 md:text-base">
              {record.description}
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/metadata"
                className="inline-flex rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Back to Metadata Library
              </Link>

              <Link
                href={`/metadata/${record.slug}/more`}
                className="inline-flex rounded-md border border-blue-400/30 bg-blue-500/10 px-3 py-2 text-sm font-medium text-blue-200 transition hover:bg-blue-500/20"
              >
                More Information
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
              Fields
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-white">
              Record Details
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {record.fields.map((field) => (
              <article
                key={field.id}
                className="rounded-2xl border border-white/10 bg-black/30 p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                  {field.label}
                </p>
                <p className="mt-2 text-sm leading-6 text-white/80">
                  {renderFieldValue(field.value)}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
              Relationships
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-white">
              Connected Records
            </h2>
          </div>

          <div className="grid gap-4">
            {record.relationships.length ? (
              await Promise.all(
                record.relationships.map(async (relationship) => {
                  const targetSlug =
                    await getMetadataRelationshipTargetSlugFromDb(relationship);

                  return (
                    <article
                      key={relationship.id}
                      className="rounded-2xl border border-white/10 bg-black/30 p-4"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                        {formatLabel(relationship.type)}
                      </p>

                      {targetSlug ? (
                        <Link
                          href={`/metadata/${targetSlug}`}
                          className="mt-2 block text-base font-semibold text-blue-300 hover:underline"
                        >
                          {relationship.targetLabel}
                        </Link>
                      ) : (
                        <p className="mt-2 text-base font-semibold text-white">
                          {relationship.targetLabel}
                        </p>
                      )}

                      {relationship.note ? (
                        <p className="mt-2 text-sm leading-6 text-white/70">
                          {relationship.note}
                        </p>
                      ) : null}
                    </article>
                  );
                })
              )
            ) : (
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/70">
                No connected records yet.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}