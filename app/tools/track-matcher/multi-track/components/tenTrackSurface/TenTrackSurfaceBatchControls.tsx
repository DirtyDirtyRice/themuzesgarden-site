import { InfoCard } from "../MultiTrackShared";
import { buttonClass } from "./tenTrackSurfaceStyles";
import type { TenTrackSlot, TrackVerdict } from "./tenTrackSurfaceTypes";

type Props = {
  selectedCount: number;
  averageMutationScore: number;
  soloCount: number;
  topRankedSlot: TenTrackSlot | null;
  onSetAllVerdicts: (verdict: TrackVerdict) => void;
  onClearAllVerdicts: () => void;
  onPromoteSelectedToKeeperBank: () => void;
  onPromoteSelectedToStrongestIdeaPool: () => void;
};

export function TenTrackSurfaceBatchControls({
  selectedCount,
  averageMutationScore,
  soloCount,
  topRankedSlot,
  onSetAllVerdicts,
  onClearAllVerdicts,
  onPromoteSelectedToKeeperBank,
  onPromoteSelectedToStrongestIdeaPool,
}: Props) {
  return (
    <div className="mt-5 rounded-2xl border border-white/20 bg-black p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">
            Batch Controls
          </p>
          <h3 className="mt-1 text-lg font-black text-white">
            Work Multiple Versions At Once
          </h3>
          <p className="mt-2 text-sm leading-6 text-white/70">
            These are isolated workstation controls. They prepare state inside
            this surface only and do not touch the library, engines, or
            controller yet.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={buttonClass}
            onClick={() => onSetAllVerdicts("keeper")}
          >
            Mark All Keeper
          </button>

          <button
            type="button"
            className={buttonClass}
            onClick={() => onSetAllVerdicts("review")}
          >
            Mark All Review
          </button>

          <button
            type="button"
            className={buttonClass}
            onClick={() => onSetAllVerdicts("reject")}
          >
            Mark All Reject
          </button>

          <button
            type="button"
            className={buttonClass}
            onClick={onClearAllVerdicts}
          >
            Clear Verdicts
          </button>

          <button
            type="button"
            className={buttonClass}
            disabled={selectedCount === 0}
            onClick={onPromoteSelectedToKeeperBank}
          >
            Promote Selected Keeper Bank
          </button>

          <button
            type="button"
            className={buttonClass}
            disabled={selectedCount === 0}
            onClick={onPromoteSelectedToStrongestIdeaPool}
          >
            Promote Selected Strongest Idea
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <InfoCard
          label="Average Mutation"
          value={`${averageMutationScore}%`}
          detail="How much the versions changed."
        />
        <InfoCard
          label="Solo Active"
          value={String(soloCount)}
          detail="Slots currently soloed."
        />
        <InfoCard
          label="Strongest Candidate"
          value={topRankedSlot?.versionName || topRankedSlot?.title || "-"}
          detail="Lowest rank number among loaded tracks."
        />
      </div>
    </div>
  );
}
