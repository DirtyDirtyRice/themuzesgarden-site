import type { MetadataLibraryRecordSummary } from "./MetadataLibraryPageTypes";
import type {
  RelationshipExplorerStats,
  RelationshipExplorerStatus,
} from "./relationshipExplorerTypes";
import { formatContextValue } from "./relationshipExplorerUtils";

type Props = {
  activeRecord: MetadataLibraryRecordSummary | null;
  status: RelationshipExplorerStatus;
  stats: RelationshipExplorerStats;
};

type PillProps = {
  label: string;
  strong?: boolean;
};

export function ExplorerStatusPill({ label, strong = false }: PillProps) {
  return (
    <span
      className={[
        "rounded-full border px-2 py-1 text-xs",
        strong
          ? "border-white text-white"
          : "border-white/30 text-white/55",
      ].join(" ")}
    >
      {label}
    </span>
  );
}

export function ContextBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-white/40 px-2 py-1 text-xs text-white/70">
      {label}
    </span>
  );
}

export function RelationshipStatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-white/25 bg-black p-3">
      <p className="text-xs uppercase tracking-[0.16em] text-white/50">
        {label}
      </p>

      <p className="mt-1 text-sm text-white/75">{value}</p>

      <p className="mt-1 text-[10px] leading-4 text-white/35">{detail}</p>
    </div>
  );
}

export function ActiveRecordStatusBadges({
  status,
}: {
  status: RelationshipExplorerStatus;
}) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <ExplorerStatusPill label={`Original: ${status.originalRecordLabel}`} />
      <ExplorerStatusPill label={`Active: ${status.activeRecordLabel}`} />

      {!status.isViewingOriginal ? (
        <ExplorerStatusPill label="Browsing related record" strong />
      ) : (
        <ExplorerStatusPill label="Viewing source record" />
      )}
    </div>
  );
}

export function RelationshipContextStrip({
  activeRecord,
  stats,
  status,
}: Props) {
  return (
    <div className="mt-3 rounded-lg border border-white/15 bg-black p-3">
      <p className="text-[10px] uppercase tracking-[0.16em] text-white/40">
        Active context
      </p>

      <div className="mt-2 flex flex-wrap gap-2">
        <ContextBadge
          label={`Shelf: ${formatContextValue(activeRecord?.shelf)}`}
        />

        <ContextBadge
          label={`Section: ${formatContextValue(activeRecord?.section)}`}
        />

        <ContextBadge label={`Suggested: ${stats.relatedRecordsCount}`} />
        <ContextBadge label={`${stats.relationshipCount} saved`} />
        <ContextBadge label={status.explorerHealthLabel} />
      </div>
    </div>
  );
}

export default function RelationshipExplorerHeaderBadges({
  activeRecord,
  status,
  stats,
}: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      <ContextBadge label={`Shelf: ${formatContextValue(activeRecord?.shelf)}`} />
      <ContextBadge
        label={`Section: ${formatContextValue(activeRecord?.section)}`}
      />
      <ContextBadge label={`Suggested: ${stats.relatedRecordsCount}`} />
      <ContextBadge label={`${stats.relationshipCount} saved`} />
      <ContextBadge label={status.explorerHealthLabel} />
    </div>
  );
}