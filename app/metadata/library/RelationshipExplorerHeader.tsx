import type { MetadataLibraryRecordSummary } from "./MetadataLibraryPageTypes";
import type {
  ExplorerStep,
  RelationshipExplorerStats,
  RelationshipExplorerStatus,
} from "./relationshipExplorerTypes";
import {
  ActiveRecordStatusBadges,
  RelationshipStatCard,
} from "./RelationshipExplorerHeaderBadges";
import RelationshipExplorerHeaderBadges from "./RelationshipExplorerHeaderBadges";
import RelationshipExplorerMapSummary from "./RelationshipExplorerMapSummary";
import RelationshipExplorerTrail from "./RelationshipExplorerTrail";
import { getHeaderStatCards } from "./relationshipExplorerHeaderUtils";

type Props = {
  activeRecord: MetadataLibraryRecordSummary | null;
  allRecords: MetadataLibraryRecordSummary[];
  status: RelationshipExplorerStatus;
  stats: RelationshipExplorerStats;
  uniqueHistory: ExplorerStep[];
  onOpenRecordInExplorer: (record: MetadataLibraryRecordSummary) => void;
  onResetToOriginal: () => void;
};

export default function RelationshipExplorerHeader({
  activeRecord,
  allRecords,
  status,
  stats,
  uniqueHistory,
  onOpenRecordInExplorer,
  onResetToOriginal,
}: Props) {
  const statCards = getHeaderStatCards(stats);

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.2em] text-white/55">
            Relationship Explorer
          </p>

          <h3 className="mt-2 text-lg font-semibold text-white">
            {status.activeRecordLabel}
          </h3>

          <p className="mt-2 text-sm leading-6 text-white/70">
            Explore structure, meaning, usage, cross-layer signals, and related
            record cards without leaving this record page.
          </p>

          <ActiveRecordStatusBadges status={status} />
        </div>

        <RelationshipExplorerHeaderBadges
          activeRecord={activeRecord}
          status={status}
          stats={stats}
        />
      </div>

      <RelationshipExplorerMapSummary stats={stats} />

      <div className="mt-4 grid gap-2 md:grid-cols-4">
        {statCards.map((card) => (
          <RelationshipStatCard
            key={card.label}
            label={card.label}
            value={card.value}
            detail={card.detail}
          />
        ))}
      </div>

      <RelationshipExplorerTrail
        allRecords={allRecords}
        status={status}
        uniqueHistory={uniqueHistory}
        onOpenRecordInExplorer={onOpenRecordInExplorer}
        onResetToOriginal={onResetToOriginal}
      />
    </>
  );
}