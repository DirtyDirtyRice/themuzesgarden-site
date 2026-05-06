import Link from "next/link";
import type { MetadataRelationshipDisplayRecord } from "../../../lib/metadata/metadataRelationshipTypes";

type MetadataRelationshipListProps = {
  relationships: MetadataRelationshipDisplayRecord[];
};

function formatRelationshipType(value: string) {
  return String(value ?? "")
    .trim()
    .split("_")
    .map((part) => {
      if (!part) return "";
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(" ");
}

export default function MetadataRelationshipList({
  relationships,
}: MetadataRelationshipListProps) {
  if (!relationships.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-black p-4 text-sm text-white/70">
        No relationships yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {relationships.map((relationship) => (
        <div
          key={relationship.id}
          className="rounded-xl border border-white/10 bg-black p-4"
        >
          <div className="mb-2 text-xs uppercase tracking-[0.2em] text-white/50">
            {formatRelationshipType(relationship.relationshipType)}
          </div>

          <Link
            href={`/metadata/${relationship.targetSlug}`}
            className="text-base font-semibold text-white underline-offset-4 hover:underline"
          >
            {relationship.targetTitle}
          </Link>

          {(relationship.targetShelf || relationship.targetSection) && (
            <div className="mt-2 text-xs text-white/60">
              {relationship.targetShelf ? relationship.targetShelf : "unknown shelf"}
              {" / "}
              {relationship.targetSection
                ? relationship.targetSection
                : "unknown section"}
            </div>
          )}

          {relationship.notes ? (
            <div className="mt-3 text-sm text-white/80">{relationship.notes}</div>
          ) : null}
        </div>
      ))}
    </div>
  );
}