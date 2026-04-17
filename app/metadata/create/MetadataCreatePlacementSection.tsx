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
  return (
    <>
      <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="record-shelf"
              className="text-sm font-semibold text-white"
            >
              Shelf
            </label>

            <p className="text-sm leading-6 text-white/65">
              Choose the larger parent area where this record belongs.
            </p>

            <select
              id="record-shelf"
              value={selectedShelfId}
              onChange={(event) => onShelfChange(event.target.value)}
              className="rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
            >
              {shelfOptions.map((shelf) => (
                <option key={shelf.id} value={shelf.id}>
                  {shelf.label}
                </option>
              ))}
            </select>

            <p className="text-xs text-white/45">
              Selected shelf description:{" "}
              <span className="text-white/65">
                {activeShelfDescription || "No shelf selected."}
              </span>
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="record-section"
              className="text-sm font-semibold text-white"
            >
              Section
            </label>

            <p className="text-sm leading-6 text-white/65">
              Choose the more specific area inside the selected shelf.
            </p>

            <select
              id="record-section"
              value={selectedSectionId}
              onChange={(event) => onSectionChange(event.target.value)}
              className="rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
            >
              {activeSections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.label}
                </option>
              ))}
            </select>

            <p className="text-xs text-white/45">
              Section gives the record a real structural home and feeds the
              final output model.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-black p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
              Shelf guidance
            </p>
            <p className="mt-2 text-sm leading-6 text-white/70">
              Shelves should stay broad and stable. Pick the larger knowledge
              family, not the smallest possible detail.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-black p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
              Section guidance
            </p>
            <p className="mt-2 text-sm leading-6 text-white/70">
              Sections narrow the placement. They help this record earn a
              precise home without cluttering the top-level structure.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="record-belongs-reason"
            className="text-sm font-semibold text-white"
          >
            Why this belongs here
          </label>

          <p className="text-sm leading-6 text-white/65">
            Explain why this record belongs in this shelf and section. This is
            your intention layer and helps prevent messy growth later.
          </p>

          <textarea
            id="record-belongs-reason"
            value={belongsReason}
            onChange={(event) => onBelongsReasonChange(event.target.value)}
            placeholder="Explain why this record belongs in the selected shelf and section."
            rows={4}
            className="rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-white/30"
          />

          <p className="text-xs text-white/45">
            {getFieldStatusMessage(
              belongsReady,
              "Placement reason is strong enough to justify the location.",
              "Placement reason still needs more explanation to justify the location."
            )}
          </p>
        </div>
      </div>
    </>
  );
}