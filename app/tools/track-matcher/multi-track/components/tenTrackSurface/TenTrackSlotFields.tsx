import { inputClass, selectClass } from "./tenTrackSurfaceStyles";
import type {
  TenTrackSlot,
  TrackColorLabel,
  TrackSourceType,
  TrackVerdict,
} from "./tenTrackSurfaceTypes";

type Props = {
  slot: TenTrackSlot;
  onUpdateSlot: (slotId: string, patch: Partial<TenTrackSlot>) => void;
};

export function TenTrackSlotFields({ slot, onUpdateSlot }: Props) {
  return (
    <>
      <div className="mt-4 grid gap-3 xl:grid-cols-4">
        <label>
          <span className="text-xs font-black text-white/70">
            Track Title
          </span>
          <input
            value={slot.title}
            onChange={(event) =>
              onUpdateSlot(slot.id, { title: event.target.value })
            }
            className={`${inputClass} mt-1`}
            placeholder={`Track ${slot.slotNumber} title`}
          />
        </label>

        <label>
          <span className="text-xs font-black text-white/70">
            Version Name
          </span>
          <input
            value={slot.versionName}
            onChange={(event) =>
              onUpdateSlot(slot.id, { versionName: event.target.value })
            }
            className={`${inputClass} mt-1`}
            placeholder="Version 1 / Chorus pass / Suno v4"
          />
        </label>

        <label>
          <span className="text-xs font-black text-white/70">
            Audio File Name
          </span>
          <input
            value={slot.audioFileName}
            onChange={(event) =>
              onUpdateSlot(slot.id, { audioFileName: event.target.value })
            }
            className={`${inputClass} mt-1`}
            placeholder="song-version.wav"
          />
        </label>

        <label>
          <span className="text-xs font-black text-white/70">
            Source Name
          </span>
          <input
            value={slot.source}
            onChange={(event) =>
              onUpdateSlot(slot.id, { source: event.target.value })
            }
            className={`${inputClass} mt-1`}
            placeholder="Library / Suno / Upload"
          />
        </label>
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-6">
        <label>
          <span className="text-xs font-black text-white/70">
            Source Type
          </span>
          <select
            value={slot.sourceType}
            onChange={(event) =>
              onUpdateSlot(slot.id, {
                sourceType: event.target.value as TrackSourceType,
              })
            }
            className={`${selectClass} mt-1`}
          >
            <option value="empty">Empty</option>
            <option value="library">Library</option>
            <option value="upload">Upload</option>
            <option value="track-a">Track A</option>
            <option value="track-b">Track B</option>
            <option value="suno">Suno</option>
            <option value="stem">Stem</option>
            <option value="manual">Manual</option>
          </select>
        </label>

        <label>
          <span className="text-xs font-black text-white/70">BPM</span>
          <input
            value={slot.bpm}
            onChange={(event) =>
              onUpdateSlot(slot.id, { bpm: event.target.value })
            }
            className={`${inputClass} mt-1`}
            placeholder="120"
          />
        </label>

        <label>
          <span className="text-xs font-black text-white/70">Key</span>
          <input
            value={slot.musicalKey}
            onChange={(event) =>
              onUpdateSlot(slot.id, { musicalKey: event.target.value })
            }
            className={`${inputClass} mt-1`}
            placeholder="Am"
          />
        </label>

        <label>
          <span className="text-xs font-black text-white/70">Verdict</span>
          <select
            value={slot.verdict}
            onChange={(event) =>
              onUpdateSlot(slot.id, {
                verdict: event.target.value as TrackVerdict,
              })
            }
            className={`${selectClass} mt-1`}
          >
            <option value="undecided">Undecided</option>
            <option value="keeper">Keeper</option>
            <option value="review">Review</option>
            <option value="reject">Reject</option>
          </select>
        </label>

        <label>
          <span className="text-xs font-black text-white/70">Rank 1-10</span>
          <select
            value={slot.rank}
            onChange={(event) =>
              onUpdateSlot(slot.id, { rank: Number(event.target.value) })
            }
            className={`${selectClass} mt-1`}
          >
            {Array.from({ length: 10 }, (_, index) => (
              <option key={index + 1} value={index + 1}>
                Rank {index + 1}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="text-xs font-black text-white/70">
            Color Label
          </span>
          <select
            value={slot.colorLabel}
            onChange={(event) =>
              onUpdateSlot(slot.id, {
                colorLabel: event.target.value as TrackColorLabel,
              })
            }
            className={`${selectClass} mt-1`}
          >
            <option value="white">White</option>
            <option value="blue">Blue</option>
            <option value="green">Green</option>
            <option value="yellow">Yellow</option>
            <option value="orange">Orange</option>
            <option value="purple">Purple</option>
            <option value="red">Red</option>
            <option value="pink">Pink</option>
          </select>
        </label>
      </div>
    </>
  );
}
