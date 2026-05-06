import Link from "next/link";

type MetadataRecordNotFoundProps = {
  slug: string;
};

function looksLikeTrackId(slug: string) {
  return slug.length > 20;
}

export default function MetadataRecordNotFound({
  slug,
}: MetadataRecordNotFoundProps) {
  const cleanSlug = String(slug ?? "").trim();
  const possibleTrackId = looksLikeTrackId(cleanSlug);

  return (
    <main className="min-h-screen bg-black px-4 py-6 text-white md:px-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <section className="rounded-3xl border border-white/15 bg-black p-6 shadow-2xl shadow-black/30">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
            Metadata record
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-white">
            Record not found
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
            The metadata record does not exist in the database or the seed
            library. Use the buttons below to return to a safe metadata page.
          </p>

          <div className="mt-5 rounded-2xl border border-white/15 bg-white/[0.03] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
              Requested slug
            </p>

            <p className="mt-2 break-all text-sm font-semibold text-white">
              {cleanSlug || "No slug provided"}
            </p>

            {possibleTrackId ? (
              <p className="mt-3 text-sm leading-6 text-white/55">
                This looks like a long track id. If this was supposed to open
                track metadata, the empty-track state should handle it before
                this fallback appears.
              </p>
            ) : null}
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/metadata/library"
              className="rounded-xl border border-white bg-white px-4 py-3 text-sm font-bold text-black transition hover:bg-white/85"
            >
              Back to Metadata Library
            </Link>

            <Link
              href="/metadata"
              className="rounded-xl border border-white/20 bg-black px-4 py-3 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/[0.04]"
            >
              Metadata Home
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}