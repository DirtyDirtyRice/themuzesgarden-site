import {
  getColorLabelText,
  getScoreLabel,
  getSourceTypeLabel,
  getVerdictLabel,
  getLoadedState,
  clampScore,
} from "./tenTrackSurfaceHelpers";
import {
  smallButtonClass,
  textareaClass,
} from "./tenTrackSurfaceStyles";
import type { TenTrackSlot } from "./tenTrackSurfaceTypes";

type ScoreKey =
  | "confidenceScore"
  | "mutationScore"
  | "arrangementScore"
  | "survivabilityScore";

type Props = {
  slot: TenTrackSlot;
  onUpdateSlot: (slotId: string, patch: Partial<TenTrackSlot>) => void;
};

export function TenTrackSlotScoring({ slot, onUpdateSlot }: Props) {
  const isLoaded = getLoadedState(slot);

  function updateScore(scoreKey: ScoreKey, value: number) {
    onUpdateSlot(slot.id, {
      [scoreKey]: clampScore(value),
    } as Partial<TenTrackSlot>);
  }

  return (
    <>
      <div className="mt-4 grid gap-3 xl:grid-cols-4">
        <label>
          <span className="text-xs font-black text-white/70">
            Confidence: {slot.confidenceScore}% -{" "}
            {getScoreLabel(slot.confidenceScore)}
          </span>
          <input
            type="range"
            min="0"
            max="100"
            value={slot.confidenceScore}
            onChange={(event) =>
              updateScore("confidenceScore", Number(event.target.value))
            }
            className="mt-3 w-full accent-white"
          />
        </label>

        <label>
          <span className="text-xs font-black text-white/70">
            Mutation: {slot.mutationScore}% - {getScoreLabel(slot.mutationScore)}
          </span>
          <input
            type="range"
            min="0"
            max="100"
            value={slot.mutationScore}
            onChange={(event) =>
              updateScore("mutationScore", Number(event.target.value))
            }
            className="mt-3 w-full accent-white"
          />
        </label>

        <label>
          <span className="text-xs font-black text-white/70">
            Arrangement: {slot.arrangementScore}% -{" "}
            {getScoreLabel(slot.arrangementScore)}
          </span>
          <input
            type="range"
            min="0"
            max="100"
            value={slot.arrangementScore}
            onChange={(event) =>
              updateScore("arrangementScore", Number(event.target.value))
            }
            className="mt-3 w-full accent-white"
          />
        </label>

        <label>
          <span className="text-xs font-black text-white/70">
            Survivability: {slot.survivabilityScore}% -{" "}
            {getScoreLabel(slot.survivabilityScore)}
          </span>
          <input
            type="range"
            min="0"
            max="100"
            value={slot.survivabilityScore}
            onChange={(event) =>
              updateScore("survivabilityScore", Number(event.target.value))
            }
            className="mt-3 w-full accent-white"
          />
        </label>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-[260px_1fr]">
        <label>
          <span className="text-xs font-black text-white/70">
            Volume: {slot.volume}%
          </span>
          <input
            type="range"
            min="0"
            max="100"
            value={slot.volume}
            onChange={(event) =>
              onUpdateSlot(slot.id, {
                volume: Number(event.target.value),
              })
            }
            className="mt-3 w-full accent-white"
          />
        </label>

        <div className="rounded-2xl border border-white/20 bg-black p-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-white/50">
                Audio Transport Placeholder
              </p>
              <p className="mt-1 text-sm font-bold text-white/70">
                Play, pause, seek, and real waveform audio will wire here later.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button type="button" className={smallButtonClass}>
                Play
              </button>
              <button type="button" className={smallButtonClass}>
                Pause
              </button>
              <button type="button" className={smallButtonClass}>
                Stop
              </button>
              <button type="button" className={smallButtonClass}>
                Loop
              </button>
            </div>
          </div>

          <div className="mt-3 h-14 rounded-xl border border-white/20 bg-black p-2">
            <div className="flex h-full items-center gap-1">
              {Array.from({ length: 36 }, (_, index) => (
                <div
                  key={`${slot.id}-wave-${index}`}
                  className="w-full rounded-full border border-white/20 bg-black"
                  style={{
                    height: `${
                      18 + ((index * 13 + slot.slotNumber * 7) % 28)
                    }px`,
                  }}
                />
              ))}
            </div>
          </div>

          <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-black text-white/70">
            <span className="rounded-lg border border-white/20 px-2 py-1">
              Waveform Lane Placeholder
            </span>
            <span className="rounded-lg border border-white/20 px-2 py-1">
              File: {slot.audioFileName || "No file loaded"}
            </span>
            <span className="rounded-lg border border-white/20 px-2 py-1">
              Source: {getSourceTypeLabel(slot.sourceType)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/20 bg-black p-3">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-white/50">
            Handoff Status
          </p>

          <div className="mt-3 grid gap-2 text-sm font-bold text-white">
            <div className="rounded-xl border border-white/20 bg-black p-3">
              Keeper Bank:{" "}
              <span className="text-white/70">{slot.keeperBankStatus}</span>
            </div>

            <div className="rounded-xl border border-white/20 bg-black p-3">
              Strongest Idea:{" "}
              <span className="text-white/70">{slot.strongestIdeaStatus}</span>
            </div>
          </div>
        </div>

        <label>
          <span className="text-xs font-black text-white/70">Notes</span>
          <textarea
            value={slot.notes}
            onChange={(event) =>
              onUpdateSlot(slot.id, { notes: event.target.value })
            }
            className={`${textareaClass} mt-1`}
            placeholder="What works? What fails? Best riff? Best chorus? Keeper section?"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-black text-white">
        <span className="rounded-xl border border-white/25 bg-black px-2 py-1">
          {getVerdictLabel(slot.verdict)}
        </span>

        <span className="rounded-xl border border-white/25 bg-black px-2 py-1">
          RANK #{slot.rank}
        </span>

        <span className="rounded-xl border border-white/25 bg-black px-2 py-1">
          CONF {slot.confidenceScore}%
        </span>

        <span className="rounded-xl border border-white/25 bg-black px-2 py-1">
          MUTATION {slot.mutationScore}%
        </span>

        <span className="rounded-xl border border-white/25 bg-black px-2 py-1">
          ARRANGE {slot.arrangementScore}%
        </span>

        <span className="rounded-xl border border-white/25 bg-black px-2 py-1">
          SURVIVE {slot.survivabilityScore}%
        </span>

        <span className="rounded-xl border border-white/25 bg-black px-2 py-1">
          {getColorLabelText(slot.colorLabel)}
        </span>

        {slot.muted ? (
          <span className="rounded-xl border border-white/25 bg-black px-2 py-1">
            MUTED
          </span>
        ) : null}

        {slot.soloed ? (
          <span className="rounded-xl border border-white/25 bg-black px-2 py-1">
            SOLO
          </span>
        ) : null}

        {slot.selected ? (
          <span className="rounded-xl border border-white/25 bg-black px-2 py-1">
            SELECTED
          </span>
        ) : null}

        {isLoaded ? (
          <span className="rounded-xl border border-white/25 bg-black px-2 py-1">
            LOADED
          </span>
        ) : (
          <span className="rounded-xl border border-white/25 bg-black px-2 py-1 text-white/70">
            EMPTY
          </span>
        )}
      </div>
    </>
  );
}
