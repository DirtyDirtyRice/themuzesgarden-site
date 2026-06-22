"use client";

import { useMemo, useState } from "react";
import { panelClass } from "./MultiTrackShared";
import { TenTrackSurfaceBatchControls } from "./tenTrackSurface/TenTrackSurfaceBatchControls";
import { TenTrackSlotCard } from "./tenTrackSurface/TenTrackSlotCard";
import { TenTrackSurfaceHeader } from "./tenTrackSurface/TenTrackSurfaceHeader";
import { TenTrackSurfaceSummaryCards } from "./tenTrackSurface/TenTrackSurfaceSummaryCards";
import { getAverageScore, getLoadedState } from "./tenTrackSurface/tenTrackSurfaceHelpers";
import { initialSlots } from "./tenTrackSurface/tenTrackSurfaceSeed";
import type { TenTrackSlot, TrackVerdict } from "./tenTrackSurface/tenTrackSurfaceTypes";

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
      <TenTrackSurfaceHeader
        onSelectAllLoaded={selectAllLoaded}
        onClearSelected={clearSelected}
        onResetAllSlots={resetAllSlots}
      />

      <TenTrackSurfaceSummaryCards
        loadedCount={loadedCount}
        selectedCount={selectedCount}
        keeperCount={keeperCount}
        reviewCount={reviewCount}
        rejectCount={rejectCount}
        averageConfidence={averageConfidence}
        averageArrangementScore={averageArrangementScore}
        topRankedSlot={topRankedSlot}
      />

      <TenTrackSurfaceBatchControls
        selectedCount={selectedCount}
        averageMutationScore={averageMutationScore}
        soloCount={soloCount}
        topRankedSlot={topRankedSlot}
        onSetAllVerdicts={setAllVerdicts}
        onClearAllVerdicts={clearAllVerdicts}
        onPromoteSelectedToKeeperBank={promoteSelectedToKeeperBank}
        onPromoteSelectedToStrongestIdeaPool={
          promoteSelectedToStrongestIdeaPool
        }
      />

      <div className="mt-5 grid gap-4">
        {slots.map((slot) => (
          <TenTrackSlotCard
            key={slot.id}
            slot={slot}
            onUpdateSlot={updateSlot}
            onClearSlot={clearSlot}
            onLoadFromLibrary={loadFromLibrary}
            onCopyFromTrackA={copyFromTrackA}
            onCopyFromTrackB={copyFromTrackB}
            onPromoteSlotToKeeperBank={promoteSlotToKeeperBank}
            onPromoteSlotToStrongestIdeaPool={
              promoteSlotToStrongestIdeaPool
            }
          />
        ))}
      </div>
    </section>
  );
}
