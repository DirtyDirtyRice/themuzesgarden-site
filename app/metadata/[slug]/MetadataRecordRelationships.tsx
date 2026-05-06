import { getOutgoingMetadataRelationships } from "../../../lib/metadata/metadataRelationshipFetch";
import MetadataRelationshipList from "./MetadataRelationshipList";

type MetadataRecordRelationshipsProps = {
  recordId: string;
};

export default async function MetadataRecordRelationships({
  recordId,
}: MetadataRecordRelationshipsProps) {
  const relationships = await getOutgoingMetadataRelationships(recordId);

  return (
    <section className="rounded-2xl border border-white/10 bg-black p-5">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white">Relationships</h2>
        <p className="mt-1 text-sm text-white/60">
          Connected metadata records linked from this record.
        </p>
      </div>

      <MetadataRelationshipList relationships={relationships} />
    </section>
  );
}