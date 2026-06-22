import type { TenTrackSlot } from "./tenTrackSurfaceTypes";

export const initialSlots: TenTrackSlot[] = Array.from(
  { length: 10 },
  (_, index) => ({
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
  })
);
