import type { MetadataLibraryRecordSummary } from "./MetadataLibraryPageTypes";
import type {
  ExplorerStep,
  RelationshipExplorerStatus,
} from "./relationshipExplorerTypes";
import { getTrailInsight } from "./relationshipExplorerHeaderUtils";
import { findRecordForExplorerStep } from "./relationshipExplorerUtils";
import { ExplorerStatusPill } from "./RelationshipExplorerHeaderBadges";

type Props = {
  allRecords: MetadataLibraryRecordSummary[];
  status: RelationshipExplorerStatus;
  uniqueHistory: ExplorerStep[];
  onOpenRecordInExplorer: (record: MetadataLibraryRecordSummary) => void;
  onResetToOriginal: () => void;
};

function TrailButton({
  step,
  active,
  onClick,
}: {
  step: ExplorerStep;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full border px-2.5 py-1 text-xs transition",
        active
          ? "border-white bg-white text-black"
          : "border-white/35 text-white/70 hover:border-white hover:text-white",
      ].join(" ")}
    >
      {step.title}
    </button>
  );
}

function TrailIntelligenceBox({
  uniqueHistory,
  status,
}: {
  uniqueHistory: ExplorerStep[];
  status: RelationshipExplorerStatus;
}) {
  const insight = getTrailInsight(uniqueHistory.length);

  return (
    <div className="rounded-lg border border-white/15 bg-black p-3">
      <p className="text-[10px] uppercase tracking-[0.16em] text-white/40">
        Trail intelligence
      </p>

      <div className="mt-2 flex flex-wrap gap-1.5">
        <ExplorerStatusPill label={insight.depthLabel} />
        <ExplorerStatusPill
          label={status.isViewingOriginal ? "source position" : "related position"}
        />
        <ExplorerStatusPill
          label={`${insight.hopCount} hop${insight.hopCount === 1 ? "" : "s"}`}
        />
        <ExplorerStatusPill label={insight.returnLabel} />
      </div>

      <p className="mt-2 text-xs leading-5 text-white/45">
        {insight.depthDetail}
      </p>

      <p className="mt-1 text-[10px] leading-4 text-white/35">
        {insight.returnDetail}
      </p>
    </div>
  );
}

function EmptyTrailNote() {
  return (
    <div className="mt-4 rounded-lg border border-white/15 bg-black p-3">
      <p className="text-xs uppercase tracking-[0.16em] text-white/45">
        Trail
      </p>

      <p className="mt-1 text-xs leading-5 text-white/40">
        Open a related record to start a relationship trail.
      </p>
    </div>
  );
}

export default function RelationshipExplorerTrail({
  allRecords,
  status,
  uniqueHistory,
  onOpenRecordInExplorer,
  onResetToOriginal,
}: Props) {
  return (
    <div className="mt-4">
      <TrailIntelligenceBox uniqueHistory={uniqueHistory} status={status} />

      {uniqueHistory.length > 1 ? (
        <div className="mt-4 rounded-lg border border-white/25 bg-black p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-white/50">
                Trail
              </p>

              <p className="mt-1 text-xs leading-5 text-white/40">
                Jump back to any record you already opened in this explorer
                session.
              </p>
            </div>

            {!status.isViewingOriginal ? (
              <button
                type="button"
                onClick={onResetToOriginal}
                className="rounded-full border border-white/30 px-2.5 py-1 text-xs text-white/60 transition hover:border-white hover:text-white"
              >
                Reset trail
              </button>
            ) : null}
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            {uniqueHistory.map((step) => {
              const active =
                step.slug === status.activeRecordSlug ||
                step.title === status.activeRecordLabel;

              return (
                <TrailButton
                  key={`${step.id}-${step.slug}`}
                  step={step}
                  active={active}
                  onClick={() => {
                    const nextRecord = findRecordForExplorerStep(
                      allRecords,
                      step
                    );

                    if (nextRecord) onOpenRecordInExplorer(nextRecord);
                  }}
                />
              );
            })}
          </div>
        </div>
      ) : (
        <EmptyTrailNote />
      )}
    </div>
  );
}