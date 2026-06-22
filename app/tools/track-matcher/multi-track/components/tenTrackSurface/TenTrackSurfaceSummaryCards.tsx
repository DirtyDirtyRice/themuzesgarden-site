import { InfoCard } from "../MultiTrackShared";
import { getScoreLabel } from "./tenTrackSurfaceHelpers";
import type { TenTrackSlot } from "./tenTrackSurfaceTypes";

type Props = {
  loadedCount: number;
  selectedCount: number;
  keeperCount: number;
  reviewCount: number;
  rejectCount: number;
  averageConfidence: number;
  averageArrangementScore: number;
  topRankedSlot: TenTrackSlot | null;
};

export function TenTrackSurfaceSummaryCards({
  loadedCount,
  selectedCount,
  keeperCount,
  reviewCount,
  rejectCount,
  averageConfidence,
  averageArrangementScore,
  topRankedSlot,
}: Props) {
  return (
    <div className="mt-5 grid gap-3 md:grid-cols-4 xl:grid-cols-8">
      <InfoCard
        label="Loaded"
        value={`${loadedCount} / 10`}
        detail="Slots with track data."
      />
      <InfoCard
        label="Selected"
        value={String(selectedCount)}
        detail="Ready for batch handoff."
      />
      <InfoCard
        label="Keepers"
        value={String(keeperCount)}
        detail="Marked as keeper."
      />
      <InfoCard
        label="Review"
        value={String(reviewCount)}
        detail="Needs another pass."
      />
      <InfoCard
        label="Rejected"
        value={String(rejectCount)}
        detail="Weak versions."
      />
      <InfoCard
        label="Avg Confidence"
        value={`${averageConfidence}%`}
        detail={getScoreLabel(averageConfidence)}
      />
      <InfoCard
        label="Avg Arrangement"
        value={`${averageArrangementScore}%`}
        detail={getScoreLabel(averageArrangementScore)}
      />
      <InfoCard
        label="Top Rank"
        value={topRankedSlot ? `#${topRankedSlot.rank}` : "-"}
        detail={topRankedSlot?.title || "No loaded track yet."}
      />
    </div>
  );
}
