import { StatusPill } from "../MultiTrackShared";
import { buttonClass } from "./tenTrackSurfaceStyles";

type Props = {
  onSelectAllLoaded: () => void;
  onClearSelected: () => void;
  onResetAllSlots: () => void;
};

export function TenTrackSurfaceHeader({
  onSelectAllLoaded,
  onClearSelected,
  onResetAllSlots,
}: Props) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-white/50">
          10 Track Editing Surface
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">
          Multi-Track Analysis Workstation
        </h2>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-white/70">
          Compare up to ten song versions, rank the strongest ideas, mark
          keepers, reject weak takes, score survivability, and prepare future
          handoffs into Keeper Bank, Strongest Idea, arrangement, waveform, and
          render systems.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <StatusPill label="10 Slots" />
          <StatusPill label="Selection" />
          <StatusPill label="Ranking" />
          <StatusPill label="Keeper Bank" />
          <StatusPill label="Strongest Idea" />
          <StatusPill label="Future Waveform Wiring" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" className={buttonClass} onClick={onSelectAllLoaded}>
          Select Loaded
        </button>

        <button type="button" className={buttonClass} onClick={onClearSelected}>
          Clear Selected
        </button>

        <button type="button" className={buttonClass} onClick={onResetAllSlots}>
          Reset 10 Slots
        </button>
      </div>
    </div>
  );
}
