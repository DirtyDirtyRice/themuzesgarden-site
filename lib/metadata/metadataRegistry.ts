import type { MetadataEntry } from "./metadataTypes";

export const METADATA_REGISTRY: MetadataEntry[] = [
  {
    id: "tag-music-theory",
    targetType: "tag",
    targetId: "music-theory",
    kind: "reference",
    label: "Music Theory",
    value: "music-theory",
    description:
      "The study of how music works, including harmony, rhythm, melody, and structure.",
    createdAt: new Date().toISOString(),
    tags: ["category", "theory", "music"],
  },

  {
    id: "tag-harmony",
    targetType: "tag",
    targetId: "harmony",
    kind: "reference",
    label: "Harmony",
    value: "harmony",
    description:
      "Harmony describes how chords and notes combine to create musical texture and emotional color.",
    parentId: "tag-music-theory",
    createdAt: new Date().toISOString(),
    tags: ["category", "harmony", "music-theory"],
  },

  {
    id: "tag-instruments",
    targetType: "tag",
    targetId: "instruments",
    kind: "reference",
    label: "Instruments",
    value: "instruments",
    description:
      "Musical tools used to produce sound, each with unique tonal qualities and expressive capabilities.",
    createdAt: new Date().toISOString(),
    tags: ["category", "instruments"],
  },

  {
    id: "instrument-piano-reference",
    targetType: "instrument",
    targetId: "piano",
    kind: "reference",
    label: "Piano",
    value: "piano",
    description:
      "A keyboard instrument that produces sound when hammers strike strings. Used across classical, jazz, pop, and film scoring.",
    parentId: "tag-instruments",
    createdAt: new Date().toISOString(),
    tags: ["instrument", "keyboard", "piano"],
  },

  {
    id: "instrument-piano-analysis",
    targetType: "instrument",
    targetId: "piano",
    kind: "analysis",
    label: "Piano Role",
    value: "harmonic-foundation",
    description:
      "The piano often provides harmonic foundation, voicing clarity, and compositional structure.",
    parentId: "instrument-piano-reference",
    createdAt: new Date().toISOString(),
    tags: ["analysis", "instrument", "harmony"],
  },

  {
    id: "chord-cmaj7-reference",
    targetType: "chord",
    targetId: "cmaj7",
    kind: "reference",
    label: "C Major Seventh",
    value: "Cmaj7",
    description:
      "A major chord with an added major seventh. Common in jazz and cinematic harmony for a warm, open sound.",
    parentId: "tag-harmony",
    createdAt: new Date().toISOString(),
    tags: ["chord", "harmony", "jazz"],
  },

  {
    id: "chord-cmaj7-analysis",
    targetType: "chord",
    targetId: "cmaj7",
    kind: "analysis",
    label: "Cmaj7 Character",
    value: "warm-open-lush",
    description:
      "Cmaj7 is often perceived as warm, open, reflective, or emotionally spacious depending on context and voicing.",
    parentId: "chord-cmaj7-reference",
    createdAt: new Date().toISOString(),
    tags: ["analysis", "emotion", "harmony", "chord"],
  },

  {
    id: "track-rocker-keeper-reference",
    targetType: "track",
    targetId:
      "sb:audio:uploads/danny da destroyer2 ROCKER KEEPER - Copy-c60c9a62-59f1-49f5-8246-eeeaa27dcb29.mp3",
    kind: "reference",
    label: "Rocker Keeper",
    value: "rocker-keeper",
    description:
      "High-energy rock track with aggressive tone and driving rhythm. Likely a core performance piece.",
    createdAt: new Date().toISOString(),
    tags: ["track", "rock", "energy", "keeper"],
  },

  {
    id: "track-rocker-keeper-analysis",
    targetType: "track",
    targetId:
      "sb:audio:uploads/danny da destroyer2 ROCKER KEEPER - Copy-c60c9a62-59f1-49f5-8246-eeeaa27dcb29.mp3",
    kind: "analysis",
    label: "Performance Feel",
    value: "driving-aggressive",
    description:
      "This track presents a forceful, high-momentum performance feel with strong rhythmic push.",
    parentId: "track-rocker-keeper-reference",
    createdAt: new Date().toISOString(),
    tags: ["track", "analysis", "energy", "rhythm"],
  },

  {
    id: "track-rocker-keeper-structure",
    targetType: "track",
    targetId:
      "sb:audio:uploads/danny da destroyer2 ROCKER KEEPER - Copy-c60c9a62-59f1-49f5-8246-eeeaa27dcb29.mp3",
    kind: "structure",
    label: "Arrangement Shape",
    value: "high-energy-rock-form",
    description:
      "The arrangement suggests a rock-oriented structure built around sustained momentum and impact.",
    parentId: "track-rocker-keeper-reference",
    createdAt: new Date().toISOString(),
    tags: ["track", "structure", "rock", "arrangement"],
  },

  {
    id: "track-break-da-hold-reference",
    targetType: "track",
    targetId: "sb:audio:Break_Da_Hold HARD ROCK1 FUNKY 4 06.mp3",
    kind: "reference",
    label: "Break Da Hold",
    value: "break-da-hold",
    description:
      "A hard-rock/funky track seed with strong groove identity and performance-forward energy.",
    createdAt: new Date().toISOString(),
    tags: ["track", "rock", "funk", "groove", "energy"],
  },

  {
    id: "track-break-da-hold-analysis",
    targetType: "track",
    targetId: "sb:audio:Break_Da_Hold HARD ROCK1 FUNKY 4 06.mp3",
    kind: "analysis",
    label: "Groove Profile",
    value: "hard-rock-funk-drive",
    description:
      "This track blends rock punch with funky rhythmic movement, suggesting a tight groove emphasis with aggressive drive.",
    parentId: "track-break-da-hold-reference",
    createdAt: new Date().toISOString(),
    tags: ["track", "analysis", "groove", "rock", "funk", "rhythm"],
  },

  {
    id: "track-break-da-hold-structure",
    targetType: "track",
    targetId: "sb:audio:Break_Da_Hold HARD ROCK1 FUNKY 4 06.mp3",
    kind: "structure",
    label: "Energy Shape",
    value: "groove-driven-rock-form",
    description:
      "The track appears structured around sustained rhythmic impact, hook-friendly momentum, and performance energy.",
    parentId: "track-break-da-hold-reference",
    createdAt: new Date().toISOString(),
    tags: ["track", "structure", "groove", "energy", "arrangement"],
  },
];