import MetadataRecordRelationshipCard from "./MetadataRecordRelationshipCard";
import type {
  RelationshipTypeSummary,
  RemoveRelationshipAction,
  ResolvedRelationship,
} from "./metadataRecordRelationshipTypes";
import { getRelationshipId } from "./metadataRecordRelationshipTypes";

type RelationshipGroupsProps = {
  typeSummaries: RelationshipTypeSummary[];
  groupedRelationships: Record<string, ResolvedRelationship[]>;
  activeType: string | null;
  openCardId: string | null;
  onOpenCardChange: (cardId: string) => void;
  onTypeFilterChange: (type: string) => void;
  onRemove: RemoveRelationshipAction;
};

type RelationshipGroupTone = "primary" | "balanced" | "single";

type RelationshipGroupHeaderModel = {
  eyebrow: string;
  countLabel: string;
  densityLabel: string;
  openLabel: string;
  tone: RelationshipGroupTone;
};

function getRelationshipCountLabel(count: number) {
  return count === 1 ? "1 connected record" : `${count} connected records`;
}

function getRelationshipDensityLabel(count: number) {
  if (count <= 0) {
    return "No cards in this group yet";
  }

  if (count === 1) {
    return "Single focused link";
  }

  if (count <= 3) {
    return "Quick scan group";
  }

  return "Dense group";
}

function getOpenCardLabel({
  openCardId,
  relationships,
}: {
  openCardId: string | null;
  relationships: ResolvedRelationship[];
}) {
  if (!openCardId) {
    return "All details closed";
  }

  const openIndex = relationships.findIndex((relationship, index) => {
    return getRelationshipId(relationship, index) === openCardId;
  });

  if (openIndex < 0) {
    return "Another group open";
  }

  return `Card ${openIndex + 1} open`;
}

function getRelationshipGroupTone(count: number): RelationshipGroupTone {
  if (count === 1) {
    return "single";
  }

  if (count <= 3) {
    return "balanced";
  }

  return "primary";
}

function getRelationshipGroupHeaderModel({
  type,
  relationships,
  openCardId,
}: {
  type: string;
  relationships: ResolvedRelationship[];
  openCardId: string | null;
}): RelationshipGroupHeaderModel {
  const count = relationships.length;

  return {
    eyebrow: `${type} group`,
    countLabel: getRelationshipCountLabel(count),
    densityLabel: getRelationshipDensityLabel(count),
    openLabel: getOpenCardLabel({ openCardId, relationships }),
    tone: getRelationshipGroupTone(count),
  };
}

function getGroupToneClass(tone: RelationshipGroupTone) {
  if (tone === "primary") {
    return "border-white/25 bg-white/[0.04]";
  }

  if (tone === "balanced") {
    return "border-white/18 bg-white/[0.03]";
  }

  return "border-white/15 bg-white/[0.02]";
}

function getGroupHeaderToneClass(tone: RelationshipGroupTone) {
  if (tone === "primary") {
    return "border-white/20 bg-black/40";
  }

  if (tone === "balanced") {
    return "border-white/15 bg-black/30";
  }

  return "border-white/10 bg-black/20";
}

function RelationshipGroupStatPill({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <span className="rounded-full border border-white/15 bg-white/[0.04] px-2.5 py-1 text-[11px] font-bold text-white/80">
      <span className="text-white/55">{label}: </span>
      <span className="text-white/95">{value}</span>
    </span>
  );
}

function RelationshipGroupBackLink() {
  return (
    <a
      href="#relationship-dashboard"
      className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-black text-white/85 transition hover:border-white/40 hover:bg-white/[0.08] hover:text-white"
    >
      Back to dashboard
    </a>
  );
}

function RelationshipGroupFilterButton({
  type,
  isActive,
  onTypeFilterChange,
}: {
  type: string;
  isActive: boolean;
  onTypeFilterChange: (type: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onTypeFilterChange(type)}
      className={`rounded-lg border px-3 py-1.5 text-xs font-black transition ${
        isActive
          ? "border-white bg-white text-black hover:bg-white/90"
          : "border-white/20 text-white/85 hover:border-white/40 hover:bg-white/[0.08]"
      }`}
    >
      {isActive ? "Showing this group" : "Show only this group"}
    </button>
  );
}

function RelationshipTypeGroupHeader({
  type,
  model,
  isActive,
  onTypeFilterChange,
}: {
  type: string;
  model: RelationshipGroupHeaderModel;
  isActive: boolean;
  onTypeFilterChange: (type: string) => void;
}) {
  return (
    <div
      className={`mb-2 rounded-lg border px-3 py-2 ${getGroupHeaderToneClass(
        model.tone,
      )}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/55">
            {model.eyebrow}
          </p>

          <h3 className="mt-0.5 truncate text-sm font-black text-white">
            {type}
          </h3>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <RelationshipGroupFilterButton
            type={type}
            isActive={isActive}
            onTypeFilterChange={onTypeFilterChange}
          />

          <RelationshipGroupBackLink />
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <RelationshipGroupStatPill label="Count" value={model.countLabel} />
        <RelationshipGroupStatPill label="Scan" value={model.densityLabel} />
        <RelationshipGroupStatPill label="Open" value={model.openLabel} />
      </div>
    </div>
  );
}

function RelationshipTypeGroup({
  type,
  anchor,
  relationships,
  activeType,
  openCardId,
  onOpenCardChange,
  onTypeFilterChange,
  onRemove,
}: {
  type: string;
  anchor: string;
  relationships: ResolvedRelationship[];
  activeType: string | null;
  openCardId: string | null;
  onOpenCardChange: (cardId: string) => void;
  onTypeFilterChange: (type: string) => void;
  onRemove: RemoveRelationshipAction;
}) {
  const headerModel = getRelationshipGroupHeaderModel({
    type,
    relationships,
    openCardId,
  });
  const isActive = activeType === type;

  return (
    <section
      id={anchor}
      aria-label={`${type} relationships`}
      className={`scroll-mt-24 rounded-xl border p-2 ${getGroupToneClass(
        headerModel.tone,
      )}`}
    >
      <RelationshipTypeGroupHeader
        type={type}
        model={headerModel}
        isActive={isActive}
        onTypeFilterChange={onTypeFilterChange}
      />

      <div className="grid gap-2">
        {relationships.map((relationship, index) => {
          const relationshipId = getRelationshipId(relationship, index);

          return (
            <MetadataRecordRelationshipCard
              key={`${anchor}-${relationshipId}`}
              relationship={relationship}
              relationshipId={relationshipId}
              isOpen={openCardId === relationshipId}
              onOpenChange={onOpenCardChange}
              onRemove={onRemove}
            />
          );
        })}
      </div>
    </section>
  );
}

function EmptyRelationshipsState({ activeType }: { activeType: string | null }) {
  return (
    <div className="rounded-xl border border-white/20 bg-white/[0.04] p-4">
      <p className="text-sm font-black text-white">
        {activeType ? `No ${activeType} relationships shown.` : "No connected records yet."}
      </p>

      <p className="mt-2 max-w-2xl text-sm leading-6 text-white/82">
        {activeType
          ? "Clear the active filter to return to the full relationship map."
          : "Relationship buttons, groups, and expandable detail cards will appear here after this record has saved connections."}
      </p>

      <div className="mt-3 rounded-lg border border-white/15 bg-black/30 px-3 py-2">
        <p className="text-xs font-bold leading-5 text-white/75">
          When connections are added, this area becomes the fast-scan group map
          below the dashboard.
        </p>
      </div>
    </div>
  );
}

export default function MetadataRecordRelationshipGroups({
  typeSummaries,
  groupedRelationships,
  activeType,
  openCardId,
  onOpenCardChange,
  onTypeFilterChange,
  onRemove,
}: RelationshipGroupsProps) {
  return (
    <div id="relationship-list" className="grid gap-2">
      {typeSummaries.length > 0 ? (
        typeSummaries.map((summary) => (
          <RelationshipTypeGroup
            key={summary.anchor}
            type={summary.type}
            anchor={summary.anchor}
            relationships={groupedRelationships[summary.type] ?? []}
            activeType={activeType}
            openCardId={openCardId}
            onOpenCardChange={onOpenCardChange}
            onTypeFilterChange={onTypeFilterChange}
            onRemove={onRemove}
          />
        ))
      ) : (
        <EmptyRelationshipsState activeType={activeType} />
      )}
    </div>
  );
}