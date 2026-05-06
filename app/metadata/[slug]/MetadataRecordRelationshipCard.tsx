import Link from "next/link";

import type {
  RemoveRelationshipAction,
  ResolvedRelationship,
} from "./metadataRecordRelationshipTypes";

type SignalTone = "strong" | "balanced" | "light";

function getSignalTone(strength: string): SignalTone {
  const value = strength.toLowerCase();

  if (value.includes("strong") || value.includes("primary")) {
    return "strong";
  }

  if (value.includes("medium") || value.includes("balanced")) {
    return "balanced";
  }

  return "light";
}

function getSignalToneClass(tone: SignalTone) {
  if (tone === "strong") {
    return "border-white/40 bg-white/[0.12] text-white";
  }

  if (tone === "balanced") {
    return "border-white/25 bg-white/[0.08] text-white/90";
  }

  return "border-white/15 bg-white/[0.05] text-white/80";
}

function SignalPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full border border-white/15 bg-white/[0.04] px-2.5 py-1 text-[11px] font-bold text-white/80">
      <span className="text-white/55">{label}: </span>
      <span className="text-white/95">{value}</span>
    </span>
  );
}

function RelationshipRoutePill({ targetSlug }: { targetSlug: string }) {
  if (!targetSlug) return null;

  return (
    <span className="rounded-lg border border-white/20 bg-white/[0.04] px-2 py-1 text-[11px] font-bold text-white/80">
      /metadata/{targetSlug}
    </span>
  );
}

function RelationshipDetailMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-white/15 bg-black px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/70">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-black text-white/95">
        {value}
      </p>
    </div>
  );
}

function RelationshipDetailGrid({
  relationship,
}: {
  relationship: ResolvedRelationship;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      <RelationshipDetailMetric
        label="Strength"
        value={relationship.displayStrength}
      />

      <RelationshipDetailMetric
        label="Source"
        value={relationship.displaySource}
      />

      <RelationshipDetailMetric
        label="Route"
        value={relationship.targetSlug ? "Openable" : "No slug"}
      />
    </div>
  );
}

function RemoveRelationshipButton({
  relationshipId,
  onRemove,
}: {
  relationshipId: string;
  onRemove: RemoveRelationshipAction;
}) {
  return (
    <form action={onRemove}>
      <input type="hidden" name="relationshipId" value={relationshipId} />

      <button
        type="submit"
        className="rounded-lg border border-white/25 px-3 py-2 text-xs font-bold text-white/85 transition hover:border-white/45 hover:bg-white/[0.06]"
      >
        Remove
      </button>
    </form>
  );
}

function RelationshipOpenButton({ targetSlug }: { targetSlug: string }) {
  if (!targetSlug) return null;

  return (
    <Link
      href={`/metadata/${encodeURIComponent(targetSlug)}`}
      className="rounded-lg border border-white bg-white px-3 py-2 text-xs font-black text-black transition hover:bg-white/85"
    >
      Open record
    </Link>
  );
}

function RelationshipCardTitle({
  relationship,
}: {
  relationship: ResolvedRelationship;
}) {
  if (relationship.targetSlug) {
    return (
      <Link
        href={`/metadata/${encodeURIComponent(relationship.targetSlug)}`}
        className="block truncate text-base font-black text-white hover:underline"
      >
        {relationship.displayTarget}
      </Link>
    );
  }

  return (
    <p className="truncate text-base font-black text-white">
      {relationship.displayTarget}
    </p>
  );
}

function RelationshipCardPreview({
  relationship,
}: {
  relationship: ResolvedRelationship;
}) {
  const tone = getSignalTone(relationship.displayStrength);

  return (
    <div className="mt-1 flex flex-wrap items-center gap-2">
      <span
        className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${getSignalToneClass(
          tone,
        )}`}
      >
        {relationship.displayStrength}
      </span>

      <SignalPill label="Type" value={relationship.displayType} />
      <SignalPill label="Source" value={relationship.displaySource} />
    </div>
  );
}

function RelationshipCardSummary({
  relationship,
  isOpen,
  onOpen,
}: {
  relationship: ResolvedRelationship;
  isOpen: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      aria-expanded={isOpen}
      onClick={onOpen}
      className="flex w-full cursor-pointer flex-wrap items-start justify-between gap-3 text-left"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/65">
            Relationship
          </p>

          <RelationshipRoutePill targetSlug={relationship.targetSlug} />
        </div>

        <RelationshipCardTitle relationship={relationship} />

        <RelationshipCardPreview relationship={relationship} />
      </div>

      <div className="flex flex-col items-end gap-2">
        <span
          className={`rounded-lg border px-3 py-1.5 text-[11px] font-black transition ${
            isOpen
              ? "border-white/40 bg-white/[0.1] text-white"
              : "border-white/20 text-white/85 group-hover:border-white/40 group-hover:bg-white/[0.08]"
          }`}
        >
          {isOpen ? "Close details" : "Open details"}
        </span>

        <span
          className={`text-base font-black text-white/80 transition ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          ↓
        </span>
      </div>
    </button>
  );
}

function RelationshipCardDetails({
  relationship,
  relationshipId,
  onRemove,
}: {
  relationship: ResolvedRelationship;
  relationshipId: string;
  onRemove: RemoveRelationshipAction;
}) {
  return (
    <div className="mt-3 grid gap-3 border-t border-white/15 pt-3">
      <p className="text-sm leading-6 text-white/85">
        {relationship.displayDetail}
      </p>

      <RelationshipDetailGrid relationship={relationship} />

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-white/10 pt-2">
        <RelationshipOpenButton targetSlug={relationship.targetSlug} />

        <RemoveRelationshipButton
          relationshipId={relationshipId}
          onRemove={onRemove}
        />
      </div>
    </div>
  );
}

export default function MetadataRecordRelationshipCard({
  relationship,
  relationshipId,
  isOpen,
  onOpenChange,
  onRemove,
}: {
  relationship: ResolvedRelationship;
  relationshipId: string;
  isOpen: boolean;
  onOpenChange: (relationshipId: string) => void;
  onRemove: RemoveRelationshipAction;
}) {
  return (
    <article
      className={`group rounded-lg border px-3 py-2 transition ${
        isOpen
          ? "border-white/30 bg-white/[0.08]"
          : "border-white/20 bg-white/[0.05]"
      }`}
    >
      <RelationshipCardSummary
        relationship={relationship}
        isOpen={isOpen}
        onOpen={() => onOpenChange(relationshipId)}
      />

      {isOpen ? (
        <RelationshipCardDetails
          relationship={relationship}
          relationshipId={relationshipId}
          onRemove={onRemove}
        />
      ) : null}
    </article>
  );
}