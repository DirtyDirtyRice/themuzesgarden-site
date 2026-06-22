"use client";

import { useMemo, useState } from "react";
import { InfoCard, StatusPill, panelClass } from "./MultiTrackShared";

type TrackVerdict = "undecided" | "keeper" | "reject" | "review";

type TrackSourceType =
  | "empty"
  | "library"
  | "upload"
  | "track-a"
  | "track-b"
  | "suno"
  | "stem"
  | "manual";

type TrackColorLabel =
  | "white"
  | "blue"
  | "green"
  | "yellow"
  | "orange"
  | "purple"
  | "red"
  | "pink";

type TenTrackSlot = {
  id: string;
  slotNumber: number;
  selected: boolean;
  title: string;
  versionName: string;
  audioFileName: string;
  source: string;
  sourceType: TrackSourceType;
  bpm: string;
  musicalKey: string;
  volume: number;
  muted: boolean;
  soloed: boolean;
  verdict: TrackVerdict;
  rank: number;
  confidenceScore: number;
  mutationScore: number;
  arrangementScore: number;
  survivabilityScore: number;
  colorLabel: TrackColorLabel;
  keeperBankStatus: string;
  strongestIdeaStatus: string;
  notes: string;
};

const initialSlots: TenTrackSlot[] = Array.from({ length: 10 }, (_, index) => ({
  id: `track-slot-${index + 1}`,
  slotNumber: index + 1,
  selected: false,
  title: "",
  versionName: "",
  audioFileName: "",
  source: "",
  sourceType: "empty",
  bpm: "",
  musicalKey: "",
  volume: 80,
  muted: false,
  soloed: false,
  verdict: "undecided",
  rank: index + 1,
  confidenceScore: 50,
  mutationScore: 50,
  arrangementScore: 50,
  survivabilityScore: 50,
  colorLabel: "white",
  keeperBankStatus: "Not promoted",
  strongestIdeaStatus: "Not promoted",
  notes: "",
}));

const buttonClass =
  "rounded-xl border border-white/25 bg-black px-3 py-2 text-xs font-black text-white transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98] disabled:cursor-not-allowed disabled:text-white/50 disabled:hover:scale-100";

const smallButtonClass =
  "rounded-lg border border-white/25 bg-black px-2 py-1 text-[11px] font-black text-white transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98] disabled:cursor-not-allowed disabled:text-white/50 disabled:hover:scale-100";

const inputClass =
  "min-h-10 w-full rounded-xl border border-white/25 bg-black px-3 py-2 text-sm font-bold text-white outline-none placeholder:text-white/50 focus:border-white";

const textareaClass =
  "min-h-20 w-full resize-none rounded-xl border border-white/25 bg-black px-3 py-2 text-sm font-bold text-white outline-none placeholder:text-white/50 focus:border-white";

const selectClass =
  "min-h-10 w-full rounded-xl border border-white/25 bg-black px-3 py-2 text-sm font-bold text-white outline-none focus:border-white";

const checkboxClass =
  "h-5 w-5 rounded border border-white/25 bg-black accent-white";

function getVerdictLabel(verdict: TrackVerdict) {
  if (verdict === "keeper") return "KEEPER";
  if (verdict === "reject") return "REJECT";
  if (verdict === "review") return "REVIEW";
  return "UNDECIDED";
}

function getLoadedState(slot: TenTrackSlot) {
  return (
    slot.title.trim().length > 0 ||
    slot.versionName.trim().length > 0 ||
    slot.audioFileName.trim().length > 0
  );
}

function getAverageScore(slots: TenTrackSlot[], key: keyof TenTrackSlot) {
  const loadedSlots = slots.filter(getLoadedState);

  if (loadedSlots.length === 0) return 0;

  const total = loadedSlots.reduce((sum, slot) => {
    const value = slot[key];
    return typeof value === "number" ? sum + value : sum;
  }, 0);

  return Math.round(total / loadedSlots.length);
}

function getScoreLabel(score: number) {
  if (score >= 85) return "ELITE";
  if (score >= 70) return "HIGH";
  if (score >= 50) return "MEDIUM";
  if (score >= 30) return "LOW";
  return "WEAK";
}

function getColorLabelText(colorLabel: TrackColorLabel) {
  if (colorLabel === "blue") return "BLUE";
  if (colorLabel === "green") return "GREEN";
  if (colorLabel === "yellow") return "YELLOW";
  if (colorLabel === "orange") return "ORANGE";
  if (colorLabel === "purple") return "PURPLE";
  if (colorLabel === "red") return "RED";
  if (colorLabel === "pink") return "PINK";
  return "WHITE";
}

function getSourceTypeLabel(sourceType: TrackSourceType) {
  if (sourceType === "library") return "Library";
  if (sourceType === "upload") return "Upload";
  if (sourceType === "track-a") return "Track A";
  if (sourceType === "track-b") return "Track B";
  if (sourceType === "suno") return "Suno";
  if (sourceType === "stem") return "Stem";
  if (sourceType === "manual") return "Manual";
  return "Empty";
}

function clampScore(value: number) {
  if (Number.isNaN(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

export default function MultiTrackTenTrackEditingSurface() {
  const [slots, setSlots] = useState<TenTrackSlot[]>(initialSlots);

  const loadedCount = useMemo(
    () => slots.filter(getLoadedState).length,
    [slots]
  );

  const keeperCount = useMemo(
    () => slots.filter((slot) => slot.verdict === "keeper").length,
    [slots]
  );

  const rejectCount = useMemo(
    () => slots.filter((slot) => slot.verdict === "reject").length,
    [slots]
  );

  const reviewCount = useMemo(
    () => slots.filter((slot) => slot.verdict === "review").length,
    [slots]
  );

  const selectedCount = useMemo(
    () => slots.filter((slot) => slot.selected).length,
    [slots]
  );

  const soloCount = useMemo(
    () => slots.filter((slot) => slot.soloed).length,
    [slots]
  );

  const averageConfidence = useMemo(
    () => getAverageScore(slots, "confidenceScore"),
    [slots]
  );

  const averageArrangementScore = useMemo(
    () => getAverageScore(slots, "arrangementScore"),
    [slots]
  );

  const averageMutationScore = useMemo(
    () => getAverageScore(slots, "mutationScore"),
    [slots]
  );

  const topRankedSlot = useMemo(() => {
    const loadedSlots = slots.filter(getLoadedState);

    if (loadedSlots.length === 0) return null;

    return [...loadedSlots].sort((a, b) => a.rank - b.rank)[0] || null;
  }, [slots]);

  function updateSlot(slotId: string, patch: Partial<TenTrackSlot>) {
    setSlots((currentSlots) =>
      currentSlots.map((slot) =>
        slot.id === slotId ? { ...slot, ...patch } : slot
      )
    );
  }

  function updateScore(
    slotId: string,
    scoreKey:
      | "confidenceScore"
      | "mutationScore"
      | "arrangementScore"
      | "survivabilityScore",
    value: number
  ) {
    updateSlot(slotId, {
      [scoreKey]: clampScore(value),
    } as Partial<TenTrackSlot>);
  }

  function clearSlot(slotId: string) {
    setSlots((currentSlots) =>
      currentSlots.map((slot) =>
        slot.id === slotId
          ? {
              ...slot,
              selected: false,
              title: "",
              versionName: "",
              audioFileName: "",
              source: "",
              sourceType: "empty",
              bpm: "",
              musicalKey: "",
              volume: 80,
              muted: false,
              soloed: false,
              verdict: "undecided",
              confidenceScore: 50,
              mutationScore: 50,
              arrangementScore: 50,
              survivabilityScore: 50,
              colorLabel: "white",
              keeperBankStatus: "Not promoted",
              strongestIdeaStatus: "Not promoted",
              notes: "",
            }
          : slot
      )
    );
  }

  function resetAllSlots() {
    setSlots(initialSlots);
  }

  function selectAllLoaded() {
    setSlots((currentSlots) =>
      currentSlots.map((slot) => ({
        ...slot,
        selected: getLoadedState(slot),
      }))
    );
  }

  function clearSelected() {
    setSlots((currentSlots) =>
      currentSlots.map((slot) => ({
        ...slot,
        selected: false,
      }))
    );
  }

  function setAllVerdicts(verdict: TrackVerdict) {
    setSlots((currentSlots) =>
      currentSlots.map((slot) => ({
        ...slot,
        verdict: getLoadedState(slot) ? verdict : slot.verdict,
      }))
    );
  }

  function clearAllVerdicts() {
    setSlots((currentSlots) =>
      currentSlots.map((slot) => ({
        ...slot,
        verdict: "undecided",
      }))
    );
  }

  function promoteSelectedToKeeperBank() {
    setSlots((currentSlots) =>
      currentSlots.map((slot) =>
        slot.selected
          ? {
              ...slot,
              verdict: "keeper",
              keeperBankStatus: "Queued for Keeper Bank",
            }
          : slot
      )
    );
  }

  function promoteSelectedToStrongestIdeaPool() {
    setSlots((currentSlots) =>
      currentSlots.map((slot) =>
        slot.selected
          ? {
              ...slot,
              strongestIdeaStatus: "Queued for Strongest Idea Pool",
            }
          : slot
      )
    );
  }

  function promoteSlotToKeeperBank(slotId: string) {
    updateSlot(slotId, {
      verdict: "keeper",
      keeperBankStatus: "Queued for Keeper Bank",
    });
  }

  function promoteSlotToStrongestIdeaPool(slotId: string) {
    updateSlot(slotId, {
      strongestIdeaStatus: "Queued for Strongest Idea Pool",
    });
  }

  function copyFromTrackA(slotId: string) {
    updateSlot(slotId, {
      title: "Copied From Track A",
      versionName: "Track A Version",
      audioFileName: "track-a-placeholder.wav",
      source: "Track Matcher A",
      sourceType: "track-a",
      notes: "Placeholder handoff from Track A. Real audio wiring comes later.",
    });
  }

  function copyFromTrackB(slotId: string) {
    updateSlot(slotId, {
      title: "Copied From Track B",
      versionName: "Track B Version",
      audioFileName: "track-b-placeholder.wav",
      source: "Track Matcher B",
      sourceType: "track-b",
      notes: "Placeholder handoff from Track B. Real audio wiring comes later.",
    });
  }

  function loadFromLibrary(slotId: string) {
    updateSlot(slotId, {
      title: "Library Track Placeholder",
      versionName: "Library Version",
      audioFileName: "library-track-placeholder.wav",
      source: "Library",
      sourceType: "library",
      notes:
        "Placeholder library load. Later this will connect to selected Library files.",
    });
  }

  return (
    <section className={panelClass}>
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
          <button type="button" className={buttonClass} onClick={selectAllLoaded}>
            Select Loaded
          </button>

          <button type="button" className={buttonClass} onClick={clearSelected}>
            Clear Selected
          </button>

          <button type="button" className={buttonClass} onClick={resetAllSlots}>
            Reset 10 Slots
          </button>
        </div>
      </div>

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
              onClick={() => setAllVerdicts("keeper")}
            >
              Mark All Keeper
            </button>

            <button
              type="button"
              className={buttonClass}
              onClick={() => setAllVerdicts("review")}
            >
              Mark All Review
            </button>

            <button
              type="button"
              className={buttonClass}
              onClick={() => setAllVerdicts("reject")}
            >
              Mark All Reject
            </button>

            <button
              type="button"
              className={buttonClass}
              onClick={clearAllVerdicts}
            >
              Clear Verdicts
            </button>

            <button
              type="button"
              className={buttonClass}
              disabled={selectedCount === 0}
              onClick={promoteSelectedToKeeperBank}
            >
              Promote Selected Keeper Bank
            </button>

            <button
              type="button"
              className={buttonClass}
              disabled={selectedCount === 0}
              onClick={promoteSelectedToStrongestIdeaPool}
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

      <div className="mt-5 grid gap-4">
        {slots.map((slot) => {
          const isLoaded = getLoadedState(slot);

          return (
            <div
              key={slot.id}
              className="rounded-2xl border border-white/20 bg-black p-4"
            >
              <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-start 2xl:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 rounded-xl border border-white/20 bg-black px-3 py-2">
                    <input
                      type="checkbox"
                      checked={slot.selected}
                      onChange={(event) =>
                        updateSlot(slot.id, {
                          selected: event.target.checked,
                        })
                      }
                      className={checkboxClass}
                    />
                    <span className="text-xs font-black text-white">
                      SELECT
                    </span>
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
                    onClick={() => loadFromLibrary(slot.id)}
                  >
                    Load From Library
                  </button>

                  <button
                    type="button"
                    className={smallButtonClass}
                    onClick={() => copyFromTrackA(slot.id)}
                  >
                    Copy Track A
                  </button>

                  <button
                    type="button"
                    className={smallButtonClass}
                    onClick={() => copyFromTrackB(slot.id)}
                  >
                    Copy Track B
                  </button>

                  <button
                    type="button"
                    className={smallButtonClass}
                    onClick={() => promoteSlotToKeeperBank(slot.id)}
                  >
                    Keeper Bank
                  </button>

                  <button
                    type="button"
                    className={smallButtonClass}
                    onClick={() => promoteSlotToStrongestIdeaPool(slot.id)}
                  >
                    Strongest Idea
                  </button>

                  <button
                    type="button"
                    className={smallButtonClass}
                    onClick={() => updateSlot(slot.id, { muted: !slot.muted })}
                  >
                    {slot.muted ? "Unmute" : "Mute"}
                  </button>

                  <button
                    type="button"
                    className={smallButtonClass}
                    onClick={() => updateSlot(slot.id, { soloed: !slot.soloed })}
                  >
                    {slot.soloed ? "Unsolo" : "Solo"}
                  </button>

                  <button
                    type="button"
                    className={smallButtonClass}
                    onClick={() => clearSlot(slot.id)}
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-3 xl:grid-cols-4">
                <label>
                  <span className="text-xs font-black text-white/70">
                    Track Title
                  </span>
                  <input
                    value={slot.title}
                    onChange={(event) =>
                      updateSlot(slot.id, { title: event.target.value })
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
                      updateSlot(slot.id, { versionName: event.target.value })
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
                      updateSlot(slot.id, { audioFileName: event.target.value })
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
                      updateSlot(slot.id, { source: event.target.value })
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
                      updateSlot(slot.id, {
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
                      updateSlot(slot.id, { bpm: event.target.value })
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
                      updateSlot(slot.id, { musicalKey: event.target.value })
                    }
                    className={`${inputClass} mt-1`}
                    placeholder="Am"
                  />
                </label>

                <label>
                  <span className="text-xs font-black text-white/70">
                    Verdict
                  </span>
                  <select
                    value={slot.verdict}
                    onChange={(event) =>
                      updateSlot(slot.id, {
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
                  <span className="text-xs font-black text-white/70">
                    Rank 1-10
                  </span>
                  <select
                    value={slot.rank}
                    onChange={(event) =>
                      updateSlot(slot.id, { rank: Number(event.target.value) })
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
                      updateSlot(slot.id, {
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
                      updateScore(
                        slot.id,
                        "confidenceScore",
                        Number(event.target.value)
                      )
                    }
                    className="mt-3 w-full accent-white"
                  />
                </label>

                <label>
                  <span className="text-xs font-black text-white/70">
                    Mutation: {slot.mutationScore}% -{" "}
                    {getScoreLabel(slot.mutationScore)}
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={slot.mutationScore}
                    onChange={(event) =>
                      updateScore(
                        slot.id,
                        "mutationScore",
                        Number(event.target.value)
                      )
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
                      updateScore(
                        slot.id,
                        "arrangementScore",
                        Number(event.target.value)
                      )
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
                      updateScore(
                        slot.id,
                        "survivabilityScore",
                        Number(event.target.value)
                      )
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
                      updateSlot(slot.id, {
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
                        Play, pause, seek, and real waveform audio will wire here
                        later.
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
                            height: `${18 + ((index * 13 + slot.slotNumber * 7) % 28)}px`,
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
                      <span className="text-white/70">
                        {slot.keeperBankStatus}
                      </span>
                    </div>

                    <div className="rounded-xl border border-white/20 bg-black p-3">
                      Strongest Idea:{" "}
                      <span className="text-white/70">
                        {slot.strongestIdeaStatus}
                      </span>
                    </div>
                  </div>
                </div>

                <label>
                  <span className="text-xs font-black text-white/70">
                    Notes
                  </span>
                  <textarea
                    value={slot.notes}
                    onChange={(event) =>
                      updateSlot(slot.id, { notes: event.target.value })
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
            </div>
          );
        })}
      </div>
    </section>
  );
}