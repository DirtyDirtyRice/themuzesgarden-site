import type { AnyTrack } from "./playerTypes";
import {
  getMomentDensityChipClass,
  getMomentDensityLabel,
  getTrackMomentCoverageLabel,
} from "./projectTabHelpers";

export default function ProjectSelectedTrackPanel(props: {
  selectedTrack: AnyTrack;
  selectedTrackSectionCount: number;
  trackTagCount: number;
  sectionTagCount: number;
}) {
  const {
    selectedTrack,
    selectedTrackSectionCount,
    trackTagCount,
    sectionTagCount,
  } = props;

  return (
    <div className="rounded-xl border bg-zinc-50 px-3 py-2 text-[11px] text-zinc-700">
      <div className="font-medium">Selected: {selectedTrack.title ?? "Untitled"}</div>

      <div className="mt-1 flex flex-wrap gap-1">
        <span
          className={[
            "rounded border px-2 py-0.5 text-[10px]",
            getMomentDensityChipClass(selectedTrackSectionCount),
          ].join(" ")}
        >
          {getMomentDensityLabel(selectedTrackSectionCount)}
        </span>

        <span className="rounded border bg-white px-2 py-0.5 text-[10px] text-zinc-500">
          {getTrackMomentCoverageLabel(
            selectedTrackSectionCount,
            trackTagCount,
            sectionTagCount
          )}
        </span>

        <span className="rounded border bg-white px-2 py-0.5 text-[10px] text-zinc-500">
          Track tags {trackTagCount}
        </span>

        <span className="rounded border bg-white px-2 py-0.5 text-[10px] text-zinc-500">
          Moment tags {sectionTagCount}
        </span>
      </div>

      <div className="mt-1 text-zinc-600">
        Enter = continue from here • Space = play track
        {selectedTrackSectionCount > 0 ? " • M = play first moment" : ""}
      </div>
    </div>
  );
}