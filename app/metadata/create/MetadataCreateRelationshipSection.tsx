import { RELATIONSHIP_OPTIONS } from "./metadataCreateConfig";
import { getRelationshipLabel } from "./metadataCreateUtils";

type RelationshipType = (typeof RELATIONSHIP_OPTIONS)[number]["value"];

type RelationshipOption = {
  id: string;
  title: string;
  slug: string;
};

function OptionalMarker() {
  return (
    <span className="ml-2 rounded-full border border-white/15 px-2 py-0.5 text-sm font-semibold text-white/60">
      optional
    </span>
  );
}

export default function MetadataCreateRelationshipSection({
  relationshipType,
  onRelationshipTypeChange,
  relatedRecordId,
  onRelatedRecordChange,
  relationshipOptions,
}: {
  relationshipType: RelationshipType;
  onRelationshipTypeChange: (value: RelationshipType) => void;
  relatedRecordId: string;
  onRelatedRecordChange: (value: string) => void;
  relationshipOptions: RelationshipOption[];
}) {
  const relationshipPreview = relationshipOptions.find((record) => {
    return record.id === relatedRecordId;
  });

  const hasSelectedRelationship = Boolean(relationshipPreview);

  function handleRemoveRelationship() {
    onRelatedRecordChange("");
  }

  return (
    <>
      <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
        <div className="mb-4">
          <p className="text-xl font-semibold text-white">
            Relationship starter
            <OptionalMarker />
          </p>

          <p className="mt-2 text-lg leading-7 text-white/80">
            Pick both fields to create a starter connection. This step is
            optional, but adding a relationship helps the metadata brain
            understand how records connect.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <label
              htmlFor="relationship-type"
              className="text-xl font-semibold text-white"
            >
              Relationship type
              <OptionalMarker />
            </label>

            <select
              id="relationship-type"
              value={relationshipType}
              onChange={(event) =>
                onRelationshipTypeChange(event.target.value as RelationshipType)
              }
              className="rounded-xl border border-white/10 bg-black px-4 py-4 text-lg text-white outline-none transition focus:border-white/30"
            >
              {RELATIONSHIP_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <p className="text-base leading-6 text-white/70">
              Choose how this record connects to the related record.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <label
              htmlFor="related-record"
              className="text-xl font-semibold text-white"
            >
              Related record
              <OptionalMarker />
            </label>

            <select
              id="related-record"
              value={relatedRecordId}
              onChange={(event) => onRelatedRecordChange(event.target.value)}
              className="rounded-xl border border-white/10 bg-black px-4 py-4 text-lg text-white outline-none transition focus:border-white/30"
            >
              <option value="">No relationship selected yet</option>
              {relationshipOptions.map((record) => (
                <option key={record.id} value={record.id}>
                  {record.title}
                </option>
              ))}
            </select>

            <p className="text-base leading-6 text-white/70">
              Pick a target record, or leave this empty to skip the optional
              relationship step.
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-black p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-base font-semibold uppercase tracking-[0.18em] text-white/65">
                Relationship preview
              </p>

              <p className="mt-2 text-lg leading-7 text-white/80">
                {relationshipPreview
                  ? `This draft record would start with a "${getRelationshipLabel(relationshipType)}" connection to "${relationshipPreview.title}".`
                  : "No related record selected yet. This is optional, but picking one helps show how records will connect."}
              </p>
            </div>

            {hasSelectedRelationship ? (
              <button
                type="button"
                onClick={handleRemoveRelationship}
                className="inline-flex rounded-md border border-white/10 bg-white/5 px-4 py-3 text-base font-medium text-white transition hover:opacity-85 hover:scale-[0.98]"
              >
                Remove link
              </button>
            ) : null}
          </div>

          {relationshipPreview ? (
            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex flex-col gap-3">
                <p className="text-lg font-semibold text-white">
                  Active link target
                </p>

                <div className="rounded-lg border border-white/10 bg-black/80 px-3 py-3 text-base text-white/75">
                  <span className="text-white">
                    {relationshipPreview.title}
                  </span>
                </div>

                <div className="rounded-lg border border-white/10 bg-black/80 px-3 py-3 text-base text-white/75">
                  Target slug preview:{" "}
                  <span className="text-white">
                    /metadata/{relationshipPreview.slug}
                  </span>
                </div>

                <div className="rounded-lg border border-white/10 bg-black/80 px-3 py-3 text-base text-white/75">
                  Link type:{" "}
                  <span className="text-white">
                    {getRelationshipLabel(relationshipType)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-white/10 bg-black/60 px-4 py-3 text-base leading-6 text-white/65">
              No active link yet. Pick a related record above to create the first
              metadata link for this record, or press Next to continue without
              one.
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
        <p className="text-xl font-semibold text-white">Future children rule</p>

        <p className="mt-2 text-lg leading-7 text-white/80">
          This record does not automatically become a father just because it
          exists. It only earns children later if it develops enough real
          connected content to justify deeper structure.
        </p>

        <div className="mt-4 rounded-xl border border-white/10 bg-black p-4">
          <p className="text-base font-semibold uppercase tracking-[0.18em] text-white/65">
            Current implication
          </p>

          <p className="mt-2 text-lg leading-7 text-white/80">
            Right now, you are creating a real child record. Father status is not
            assumed. It must be earned through later growth and connected
            knowledge.
          </p>
        </div>
      </div>
    </>
  );
}