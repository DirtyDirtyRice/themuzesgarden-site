import { getFieldStatusMessage } from "./metadataCreateUtils";

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

function RequiredStar() {
  return <span className="ml-1 text-2xl font-bold text-yellow-300">*</span>;
}

export default function MetadataCreatePlacementSection({
  selectedShelfId,
  onShelfChange,
  selectedSectionId,
  onSectionChange,
  shelfOptions,
  activeShelfDescription,
  activeSections,
  belongsReason,
  onBelongsReasonChange,
  belongsReady,
}: {
  selectedShelfId: string;
  onShelfChange: (value: string) => void;
  selectedSectionId: string;
  onSectionChange: (value: string) => void;
  shelfOptions: ShelfOption[];
  activeShelfDescription: string;
  activeSections: { id: string; key?: string; label: string }[];
  belongsReason: string;
  onBelongsReasonChange: (value: string) => void;
  belongsReady: boolean;
}) {
  const belongsNeedsAttention = !belongsReady;

  return (
    <>
      <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <label
              htmlFor="record-shelf"
              className="text-xl font-semibold text-white"
            >
              Shelf
              <RequiredStar />
            </label>

            <p className="text-lg leading-7 text-white/80">
              Choose the larger parent area where this record belongs.
            </p>

            <select
              id="record-shelf"
              value={selectedShelfId}
              onChange={(event) => onShelfChange(event.target.value)}
              className="rounded-xl border border-white/10 bg-black px-4 py-4 text-lg text-white outline-none transition focus:border-white/30"
            >
              {shelfOptions.map((shelf) => (
                <option key={shelf.id} value={shelf.id}>
                  {shelf.label}
                </option>
              ))}
            </select>

            <p className="text-base leading-6 text-white/70">
              Selected shelf description:{" "}
              <span className="text-white/85">
                {activeShelfDescription || "No shelf selected."}
              </span>
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <label
              htmlFor="record-section"
              className="text-xl font-semibold text-white"
            >
              Section
              <RequiredStar />
            </label>

            <p className="text-lg leading-7 text-white/80">
              Choose the more specific area inside the selected shelf.
            </p>

            <select
              id="record-section"
              value={selectedSectionId}
              onChange={(event) => onSectionChange(event.target.value)}
              className="rounded-xl border border-white/10 bg-black px-4 py-4 text-lg text-white outline-none transition focus:border-white/30"
            >
              {activeSections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.label}
                </option>
              ))}
            </select>

            <p className="text-base leading-6 text-white/70">
              Section gives the record a real structural home and feeds the
              final output model.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-black p-4">
            <p className="text-base font-semibold uppercase tracking-[0.18em] text-white/65">
              Shelf guidance
            </p>

            <p className="mt-2 text-lg leading-7 text-white/80">
              Shelves should stay broad and stable. Pick the larger knowledge
              family, not the smallest possible detail.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-black p-4">
            <p className="text-base font-semibold uppercase tracking-[0.18em] text-white/65">
              Section guidance
            </p>

            <p className="mt-2 text-lg leading-7 text-white/80">
              Sections narrow the placement. They help this record earn a
              precise home without cluttering the top-level structure.
            </p>
          </div>
        </div>
      </div>

      <div
        className={[
          "rounded-2xl border p-4 transition",
          belongsNeedsAttention
            ? "border-yellow-300/50 bg-yellow-300/10 shadow-[0_0_0_1px_rgba(253,224,71,0.16)]"
            : "border-white/10 bg-black/30",
        ].join(" ")}
      >
        <div className="flex flex-col gap-4">
          <label
            htmlFor="record-belongs-reason"
            className="text-xl font-semibold text-white"
          >
            Why this belongs here
            <RequiredStar />
          </label>

          <p className="text-lg leading-7 text-white/80">
            Explain why this record belongs in this shelf and section. This is
            your intention layer and helps prevent messy growth later.
          </p>

          <textarea
            id="record-belongs-reason"
            value={belongsReason}
            onChange={(event) => onBelongsReasonChange(event.target.value)}
            placeholder="Explain why this record belongs in the selected shelf and section."
            rows={4}
            className="rounded-xl border border-white/10 bg-black px-4 py-4 text-lg text-white outline-none transition placeholder:text-white/35 focus:border-white/30"
          />

          <p
            className={[
              "text-xl font-semibold",
              belongsReady ? "text-emerald-200" : "text-yellow-200",
            ].join(" ")}
          >
            {getFieldStatusMessage(
              belongsReady,
              "Placement reason is strong enough to justify the location.",
              "Finish required field first: Why this belongs here *"
            )}
          </p>
        </div>
      </div>
    </>
  );
}