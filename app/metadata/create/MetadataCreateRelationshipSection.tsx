import { RELATIONSHIP_OPTIONS } from "./metadataCreateConfig";
import { getRelationshipLabel } from "./metadataCreateUtils";

type RelationshipType = (typeof RELATIONSHIP_OPTIONS)[number]["value"];

type RelationshipOption = {
  id: string;
  title: string;
  slug: string;
};

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
  const relationshipPreview = relationshipOptions.find(
    (record) => record.id === relatedRecordId
  );

  return (
    <>
      <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
        <div className="mb-3">
          <p className="text-sm font-semibold text-white">
            Relationship starter
          </p>
          <p className="mt-2 text-sm leading-6 text-white/65">
            This is not the full relationship system yet. It is the first
            controlled way to say this record connects to another record in the
            library and to show how that structure will appear in the final
            record output.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="relationship-type"
              className="text-sm font-semibold text-white"
            >
              Relationship type
            </label>

            <select
              id="relationship-type"
              value={relationshipType}
              onChange={(event) =>
                onRelationshipTypeChange(event.target.value as RelationshipType)
              }
              className="rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
            >
              {RELATIONSHIP_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="related-record"
              className="text-sm font-semibold text-white"
            >
              Related record
            </label>

            <select
              id="related-record"
              value={relatedRecordId}
              onChange={(event) => onRelatedRecordChange(event.target.value)}
              className="rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
            >
              <option value="">No relationship selected yet</option>
              {relationshipOptions.map((record) => (
                <option key={record.id} value={record.id}>
                  {record.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-black p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
            Relationship preview
          </p>
          <p className="mt-2 text-sm leading-6 text-white/75">
            {relationshipPreview
              ? `This draft record would start with a "${getRelationshipLabel(relationshipType)}" connection to "${relationshipPreview.title}".`
              : "No related record selected yet. This is optional for now, but it helps show how records will connect."}
          </p>

          {relationshipPreview ? (
            <div className="mt-3 rounded-lg border border-white/10 bg-black/80 px-3 py-2 text-sm text-white/70">
              Target slug preview:{" "}
              <span className="text-white">
                /metadata/{relationshipPreview.slug}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
        <p className="text-sm font-semibold text-white">Future children rule</p>
        <p className="mt-2 text-sm leading-6 text-white/65">
          This record does not automatically become a father just because it
          exists. It only earns children later if it develops enough real
          connected content to justify deeper structure.
        </p>

        <div className="mt-4 rounded-xl border border-white/10 bg-black p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
            Current implication
          </p>
          <p className="mt-2 text-sm leading-6 text-white/70">
            Right now, you are creating a real child record. Father status is
            not assumed. It must be earned through later growth and connected
            knowledge.
          </p>
        </div>
      </div>
    </>
  );
}