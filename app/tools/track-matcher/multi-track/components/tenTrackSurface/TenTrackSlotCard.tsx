import {
  getColorLabelText,
  getVerdictLabel,
} from "./tenTrackSurfaceHelpers";
import {
  checkboxClass,
  smallButtonClass,
} from "./tenTrackSurfaceStyles";
import { TenTrackSlotFields } from "./TenTrackSlotFields";
import { TenTrackSlotScoring } from "./TenTrackSlotScoring";
import type { TenTrackSlot } from "./tenTrackSurfaceTypes";

type Props = {
  slot: TenTrackSlot;
  onUpdateSlot: (slotId: string, patch: Partial<TenTrackSlot>) => void;
  onClearSlot: (slotId: string) => void;
  onLoadFromLibrary: (slotId: string) => void;
  onCopyFromTrackA: (slotId: string) => void;
  onCopyFromTrackB: (slotId: string) => void;
  onPromoteSlotToKeeperBank: (slotId: string) => void;
  onPromoteSlotToStrongestIdeaPool: (slotId: string) => void;
};

export function TenTrackSlotCard({
  slot,
  onUpdateSlot,
  onClearSlot,
  onLoadFromLibrary,
  onCopyFromTrackA,
  onCopyFromTrackB,
  onPromoteSlotToKeeperBank,
  onPromoteSlotToStrongestIdeaPool,
}: Props) {
  return (
    <div className="rounded-2xl border border-white/20 bg-black p-4">
      <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-start 2xl:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 rounded-xl border border-white/20 bg-black px-3 py-2">
            <input
              type="checkbox"
              checked={slot.selected}
              onChange={(event) =>
                onUpdateSlot(slot.id, {
                  selected: event.target.checked,
                })
              }
              className={checkboxClass}
            />
            <span className="text-xs font-black text-white">SELECT</span>
          </label>

          <div className="rounded-xl border border-white/20 bg-black px-3 py-2">
            <div className="text-[11px] font-black uppercase tracking-[0.22em] text-white/50">
              Slot
            </div>
            <div className="mt-1 text-xl font-black text-white">
              {slot.slotNumber}
            </div>
          </div>

          <div className="rounded-xl border border-white/20 bg-black px-3 py-2">
            <div className="text-[11px] font-black uppercase tracking-[0.22em] text-white/50">
              Rank
            </div>
            <div className="mt-1 text-xl font-black text-white">
              #{slot.rank}
            </div>
          </div>

          <div className="rounded-xl border border-white/20 bg-black px-3 py-2">
            <div className="text-[11px] font-black uppercase tracking-[0.22em] text-white/50">
              Verdict
            </div>
            <div className="mt-1 text-sm font-black text-white">
              {getVerdictLabel(slot.verdict)}
            </div>
          </div>

          <div className="rounded-xl border border-white/20 bg-black px-3 py-2">
            <div className="text-[11px] font-black uppercase tracking-[0.22em] text-white/50">
              Color
            </div>
            <div className="mt-1 text-sm font-black text-white">
              {getColorLabelText(slot.colorLabel)}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={smallButtonClass}
            onClick={() => onLoadFromLibrary(slot.id)}
          >
            Load From Library
          </button>

          <button
            type="button"
            className={smallButtonClass}
            onClick={() => onCopyFromTrackA(slot.id)}
          >
            Copy Track A
          </button>

          <button
            type="button"
            className={smallButtonClass}
            onClick={() => onCopyFromTrackB(slot.id)}
          >
            Copy Track B
          </button>

          <button
            type="button"
            className={smallButtonClass}
            onClick={() => onPromoteSlotToKeeperBank(slot.id)}
          >
            Keeper Bank
          </button>

          <button
            type="button"
            className={smallButtonClass}
            onClick={() => onPromoteSlotToStrongestIdeaPool(slot.id)}
          >
            Strongest Idea
          </button>

          <button
            type="button"
            className={smallButtonClass}
            onClick={() => onUpdateSlot(slot.id, { muted: !slot.muted })}
          >
            {slot.muted ? "Unmute" : "Mute"}
          </button>

          <button
            type="button"
            className={smallButtonClass}
            onClick={() => onUpdateSlot(slot.id, { soloed: !slot.soloed })}
          >
            {slot.soloed ? "Unsolo" : "Solo"}
          </button>

          <button
            type="button"
            className={smallButtonClass}
            onClick={() => onClearSlot(slot.id)}
          >
            Clear
          </button>
        </div>
      </div>

      <TenTrackSlotFields slot={slot} onUpdateSlot={onUpdateSlot} />
      <TenTrackSlotScoring slot={slot} onUpdateSlot={onUpdateSlot} />
    </div>
  );
}
