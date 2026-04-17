type ShelfOption = {
  id: string;
  key?: string;
  label: string;
  description: string;
  sections: {
    id: string;
    key?: string;
    label: string;
  }[];
};

export default function MetadataCreateSidebar({
  activeShelfLabel,
  activeSectionLabel,
  recordType,
  visibility,
  title,
  generatedSlug,
  summary,
  belongsReason,
  relationshipPreviewLabel,
  shelfOptions,
}: {
  activeShelfLabel: string;
  activeSectionLabel: string;
  recordType: string;
  visibility: string;
  title: string;
  generatedSlug: string;
  summary: string;
  belongsReason: string;
  relationshipPreviewLabel: string;
  shelfOptions: ShelfOption[];
}) {
  return (
    <div className="flex flex-col gap-6">
      <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
          Live Preview
        </p>
        <h2 className="mt-1 text-2xl font-semibold text-white">
          Record Snapshot
        </h2>

        <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-white/10 px-2 py-1 text-white/70">
                {recordType}
              </span>
              <span className="rounded-full border border-white/10 px-2 py-1 text-white/70">
                {activeShelfLabel || "No shelf"}
              </span>
              <span className="rounded-full border border-white/10 px-2 py-1 text-white/70">
                {activeSectionLabel || "No section"}
              </span>
              <span className="rounded-full border border-white/10 px-2 py-1 text-white/70">
                {visibility}
              </span>
              <span className="rounded-full border border-white/10 px-2 py-1 text-white/70">
                draft
              </span>
            </div>

            <h3 className="text-xl font-semibold text-white">
              {title || "Untitled record"}
            </h3>

            <div className="rounded-lg border border-white/10 bg-black px-3 py-2 text-sm text-white/70">
              {generatedSlug ? `/metadata/${generatedSlug}` : "/metadata/"}
            </div>

            <p className="text-sm leading-6 text-white/70">
              {summary ||
                "No explanation yet. This record still needs real content before it should move forward."}
            </p>

            <div className="rounded-xl border border-white/10 bg-black p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                Placement intent
              </p>
              <p className="mt-2 text-sm leading-6 text-white/70">
                {belongsReason ||
                  "No placement reason yet. This should explain why the selected shelf and section are the correct home for the record."}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-black p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                Starter relationship
              </p>
              <p className="mt-2 text-sm leading-6 text-white/70">
                {relationshipPreviewLabel}
              </p>
            </div>
          </div>
        </div>
      </article>

      <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
          Help
        </p>
        <h2 className="mt-1 text-2xl font-semibold text-white">
          Explanation Hooks
        </h2>

        <div className="mt-4 flex flex-col gap-3">
          <div className="rounded-xl border border-white/10 bg-black/30 p-4">
            <h3 className="text-sm font-semibold text-white">
              Why add visibility now?
            </h3>
            <p className="mt-2 text-sm leading-6 text-white/70">
              Visibility becomes part of the record identity early, so the
              system can later support public library knowledge, private
              knowledge, and selective sharing.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/30 p-4">
            <h3 className="text-sm font-semibold text-white">
              Why show the slug?
            </h3>
            <p className="mt-2 text-sm leading-6 text-white/70">
              Because names turn into paths. Slug preview helps keep the system
              orderly before records are created for real.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/30 p-4">
            <h3 className="text-sm font-semibold text-white">
              Why ask why it belongs here?
            </h3>
            <p className="mt-2 text-sm leading-6 text-white/70">
              Because correct placement is part of the intelligence of the
              system. This prevents loose, lazy hierarchy from spreading.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/30 p-4">
            <h3 className="text-sm font-semibold text-white">
              Why only a starter relationship?
            </h3>
            <p className="mt-2 text-sm leading-6 text-white/70">
              Because the relationship system should grow carefully. One clean
              starting connection is better than dumping a chaotic network on
              the user too early.
            </p>
          </div>
        </div>
      </article>

      <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
          Current Library
        </p>
        <h2 className="mt-1 text-2xl font-semibold text-white">
          Available Shelves
        </h2>

        <div className="mt-4 flex flex-col gap-3">
          {shelfOptions.map((shelf) => (
            <div
              key={shelf.id}
              className="rounded-xl border border-white/10 bg-black/30 p-4"
            >
              <h3 className="text-sm font-semibold text-white">
                {shelf.label}
              </h3>
              <p className="mt-2 text-sm leading-6 text-white/70">
                {shelf.description}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {shelf.sections.map((section) => (
                  <span
                    key={section.id}
                    className="rounded-full border border-white/10 px-2 py-1 text-xs text-white/70"
                  >
                    {section.label}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </article>
    </div>
  );
}