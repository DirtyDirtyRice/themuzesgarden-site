import {
  buildMetadataRelationshipGraph,
  groupMetadataRelationshipsByType,
  normalizeMetadataRelationships,
  summarizeMetadataRelationships,
} from "@/lib/metadata/metadataRelationshipEngine";
import type { MetadataRelationshipInput } from "@/lib/metadata/metadataRelationshipEngine";

import MetadataRecordRelationshipInteractivePanel from "./MetadataRecordRelationshipInteractivePanel";
import {
  asMetadataRelationship,
  buildResolvedRelationship,
  cleanRelationshipText,
  getPrimaryRelationship,
  getRelationshipTypeSummaries,
  groupRelationshipsByType,
} from "./metadataRecordRelationshipTypes";
import type {
  RemoveRelationshipAction,
  ResolvedRelationship,
} from "./metadataRecordRelationshipTypes";

type Props = {
  relationships: unknown[];
  onRemove: RemoveRelationshipAction;
};

type RelationshipStatCard = {
  label: string;
  value: string;
  detail: string;
};

type RelationshipMapRow = {
  id: string;
  sourceLabel: string;
  relationshipLabel: string;
  targetLabel: string;
  detail: string;
  strength: string;
  source: string;
};

type RelationshipEngineSnapshot = {
  totalRelationships: number;
  totalGroups: number;
  totalNodes: number;
  totalEdges: number;
  strongestTarget: string;
  strongestStrength: string;
  averageStrengthScore: number;
};

function resolveRelationship(item: unknown): ResolvedRelationship {
  return buildResolvedRelationship(asMetadataRelationship(item));
}

function resolveRelationships(relationships: unknown[]): ResolvedRelationship[] {
  const safeRelationships = Array.isArray(relationships) ? relationships : [];
  return safeRelationships.map((item) => resolveRelationship(item));
}

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return count === 1 ? singular : plural;
}

function getUniqueRelationshipGroups(relationships: ResolvedRelationship[]) {
  const groups = new Set<string>();

  relationships.forEach((relationship) => {
    const label = cleanRelationshipText(relationship.displayType);
    if (label) groups.add(label);
  });

  return groups.size;
}

function toRelationshipEngineInputs(
  relationships: ResolvedRelationship[],
): MetadataRelationshipInput[] {
  return relationships.map((relationship, index) => ({
    id: cleanRelationshipText(
      relationship.id,
      `${relationship.typeAnchor}-${relationship.targetSlug || index}`,
    ),
    sourceRecordId: "this-record",
    sourceSlug: "this-record",
    sourceTitle: "This record",
    targetRecordId: cleanRelationshipText(
      relationship.targetRecordId,
      relationship.targetSlug || `target-${index + 1}`,
    ),
    targetSlug: cleanRelationshipText(relationship.targetSlug),
    targetTitle: cleanRelationshipText(
      relationship.displayTarget,
      "Untitled related record",
    ),
    type: cleanRelationshipText(relationship.type, relationship.displayType),
    label: cleanRelationshipText(relationship.displayType, "Connected to"),
    detail: cleanRelationshipText(relationship.displayDetail),
    note: cleanRelationshipText(relationship.displayNote),
    reason: cleanRelationshipText(relationship.displayDetail),
    strength: cleanRelationshipText(relationship.displayStrength),
    source: cleanRelationshipText(relationship.displaySource),
  }));
}

function getRelationshipEngineSnapshot(
  relationships: ResolvedRelationship[],
): RelationshipEngineSnapshot {
  const normalizedRelationships = normalizeMetadataRelationships(
    toRelationshipEngineInputs(relationships),
  );
  const groupedRelationships = groupMetadataRelationshipsByType(
    normalizedRelationships,
  );
  const relationshipGraph = buildMetadataRelationshipGraph(normalizedRelationships);
  const relationshipSummary = summarizeMetadataRelationships(
    normalizedRelationships,
  );
  const totalStrengthScore = normalizedRelationships.reduce(
    (total, relationship) => total + relationship.strengthScore,
    0,
  );
  const averageStrengthScore =
    normalizedRelationships.length > 0
      ? Math.round(totalStrengthScore / normalizedRelationships.length)
      : 0;

  return {
    totalRelationships: relationshipSummary.totalRelationships,
    totalGroups: groupedRelationships.length,
    totalNodes: relationshipGraph.nodes.length,
    totalEdges: relationshipGraph.edges.length,
    strongestTarget:
      relationshipSummary.strongestRelationship?.targetTitle ??
      "No strongest connection yet",
    strongestStrength:
      relationshipSummary.strongestRelationship?.strength ?? "unknown",
    averageStrengthScore,
  };
}

function getRelationshipStats(
  relationships: ResolvedRelationship[],
  primaryRelationship: ResolvedRelationship | null,
  engineSnapshot: RelationshipEngineSnapshot,
): RelationshipStatCard[] {
  const totalCount = relationships.length;
  const groupCount = getUniqueRelationshipGroups(relationships);
  const primaryTarget = cleanRelationshipText(
    primaryRelationship?.displayTarget,
    "No primary connection yet",
  );

  return [
    {
      label: "Total",
      value: String(totalCount),
      detail: `${totalCount} ${pluralize(totalCount, "saved connection")}`,
    },
    {
      label: "Primary",
      value: primaryTarget,
      detail: cleanRelationshipText(
        primaryRelationship?.displayType,
        "Add one relationship to create a primary scan target.",
      ),
    },
    {
      label: "Groups",
      value: String(groupCount),
      detail:
        groupCount > 0
          ? `${groupCount} ${pluralize(groupCount, "group")} ready to filter`
          : "No relationship groups yet",
    },
    {
      label: "Graph Nodes",
      value: String(engineSnapshot.totalNodes),
      detail: `${engineSnapshot.totalEdges} ${pluralize(
        engineSnapshot.totalEdges,
        "engine edge",
      )} prepared for map view`,
    },
    {
      label: "Strongest",
      value: engineSnapshot.strongestTarget,
      detail: `Engine strength: ${engineSnapshot.strongestStrength}`,
    },
    {
      label: "Avg Strength",
      value: String(engineSnapshot.averageStrengthScore),
      detail: "Normalized relationship-engine score",
    },
  ];
}

function getRelationshipMapRows(
  relationships: ResolvedRelationship[],
): RelationshipMapRow[] {
  return relationships.map((relationship, index) => ({
    id: `${relationship.typeAnchor}-${relationship.targetSlug || index}`,
    sourceLabel: "This record",
    relationshipLabel: cleanRelationshipText(
      relationship.displayType,
      "Connected to",
    ),
    targetLabel: cleanRelationshipText(
      relationship.displayTarget,
      "Untitled related record",
    ),
    detail: cleanRelationshipText(
      relationship.displayDetail,
      "This connection is saved, but it does not have extra detail yet.",
    ),
    strength: cleanRelationshipText(relationship.displayStrength, "Unrated"),
    source: cleanRelationshipText(relationship.displaySource, "Saved metadata"),
  }));
}

function RelationshipStatCards({ stats }: { stats: RelationshipStatCard[] }) {
  return (
    <div className="mb-3 grid gap-2 lg:grid-cols-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-white/20 bg-white/[0.04] p-3"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/70">
            {stat.label}
          </p>

          <p className="mt-1 text-base font-black text-white/95">
            {stat.value}
          </p>

          <p className="mt-1 text-xs leading-5 text-white/70">{stat.detail}</p>
        </div>
      ))}
    </div>
  );
}

function RelationshipScanGuide() {
  return (
    <div className="mb-3 rounded-xl border border-white/15 bg-white/[0.03] p-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">
        Scan order
      </p>

      <div className="mt-2 grid gap-2 text-xs font-semibold text-white/75 lg:grid-cols-3">
        <p className="rounded-lg border border-white/10 bg-black px-3 py-2">
          1. Read the primary card.
        </p>

        <p className="rounded-lg border border-white/10 bg-black px-3 py-2">
          2. Read the map preview.
        </p>

        <p className="rounded-lg border border-white/10 bg-black px-3 py-2">
          3. Open details last.
        </p>
      </div>
    </div>
  );
}

function RelationshipMapPreview({ rows }: { rows: RelationshipMapRow[] }) {
  if (rows.length === 0) return null;

  return (
    <div className="mb-3 rounded-xl border border-white/15 bg-white/[0.03] p-3">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">
          Relationship map preview
        </p>

        <p className="text-sm leading-6 text-white/75">
          This shows the first readable map shape: this record, the connection
          type, and the target record it points toward.
        </p>
      </div>

      <div className="mt-3 grid gap-3">
        {rows.map((row) => (
          <div
            key={row.id}
            className="rounded-xl border border-white/15 bg-black px-3 py-3"
          >
            <div className="grid gap-2 text-sm font-semibold text-white md:grid-cols-[1fr_auto_1fr] md:items-center">
              <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                {row.sourceLabel}
              </div>

              <div className="rounded-full border border-white/20 px-3 py-2 text-center text-xs uppercase tracking-[0.16em] text-white/75">
                → {row.relationshipLabel} →
              </div>

              <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                {row.targetLabel}
              </div>
            </div>

            <div className="mt-3 grid gap-2 text-xs leading-5 text-white/65 md:grid-cols-3">
              <p className="rounded-lg border border-white/10 bg-black px-3 py-2">
                Detail: {row.detail}
              </p>

              <p className="rounded-lg border border-white/10 bg-black px-3 py-2">
                Strength: {row.strength}
              </p>

              <p className="rounded-lg border border-white/10 bg-black px-3 py-2">
                Source: {row.source}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RelationshipEmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-white/25 bg-white/[0.03] p-4">
      <p className="text-sm font-black text-white/90">
        No relationships are connected yet.
      </p>

      <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">
        When relationships are added, this area becomes the first scan zone for
        connected records. Fields stay lower on the page so the record brain
        stays relationship-first.
      </p>
    </div>
  );
}

function RelationshipSectionHeader({
  count,
  groupCount,
  engineSnapshot,
}: {
  count: number;
  groupCount: number;
  engineSnapshot: RelationshipEngineSnapshot;
}) {
  const countLabel = `${count} ${pluralize(count, "connected record")}`;
  const groupLabel = `${groupCount} ${pluralize(groupCount, "group")}`;
  const graphLabel = `${engineSnapshot.totalNodes} ${pluralize(
    engineSnapshot.totalNodes,
    "graph node",
  )}`;

  return (
    <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/70">
          Relationships
        </p>

        <h2 className="mt-1 text-2xl font-black tracking-[-0.03em] text-white/95">
          Explore connected records first
        </h2>

        <p className="mt-1 max-w-3xl text-sm leading-6 text-white/80">
          This is the main record brain. Start here, use group buttons only when
          needed, and keep the lower fields as supporting reference details.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="rounded-xl border border-white/20 px-3 py-2 text-xs font-bold text-white/85">
          {countLabel}
        </span>

        <span className="rounded-xl border border-white/20 px-3 py-2 text-xs font-bold text-white/85">
          {groupLabel}
        </span>

        <span className="rounded-xl border border-white/20 px-3 py-2 text-xs font-bold text-white/85">
          {graphLabel}
        </span>
      </div>
    </div>
  );
}

export default function MetadataRecordRelationshipsSection({
  relationships,
  onRemove,
}: Props) {
  const resolvedRelationships = resolveRelationships(relationships);
  const groupedRelationships = groupRelationshipsByType(resolvedRelationships);
  const typeSummaries = getRelationshipTypeSummaries(groupedRelationships);
  const primaryRelationship = getPrimaryRelationship(resolvedRelationships);
  const groupCount = getUniqueRelationshipGroups(resolvedRelationships);
  const engineSnapshot = getRelationshipEngineSnapshot(resolvedRelationships);
  const relationshipStats = getRelationshipStats(
    resolvedRelationships,
    primaryRelationship,
    engineSnapshot,
  );
  const relationshipMapRows = getRelationshipMapRows(resolvedRelationships);

  return (
    <section
      id="relationships"
      className="rounded-2xl border border-white/20 bg-black p-4 text-white"
    >
      <RelationshipSectionHeader
        count={resolvedRelationships.length}
        groupCount={groupCount}
        engineSnapshot={engineSnapshot}
      />

      <RelationshipStatCards stats={relationshipStats} />

      <RelationshipScanGuide />

      <RelationshipMapPreview rows={relationshipMapRows} />

      {resolvedRelationships.length > 0 ? (
        <MetadataRecordRelationshipInteractivePanel
          totalCount={resolvedRelationships.length}
          primaryRelationship={primaryRelationship}
          typeSummaries={typeSummaries}
          groupedRelationships={groupedRelationships}
          onRemove={onRemove}
        />
      ) : (
        <RelationshipEmptyState />
      )}
    </section>
  );
}