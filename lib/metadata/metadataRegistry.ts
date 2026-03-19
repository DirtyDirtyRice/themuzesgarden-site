import type { MetadataEntry } from "./metadataTypes";

export const METADATA_REGISTRY: MetadataEntry[] = [
  {
    id: "category-music-theory",
    targetType: "tag",
    targetId: "music-theory",
    label: "Music Theory",
    description:
      "The study of how music works, including harmony, rhythm, melody, and structure.",
    createdAt: new Date().toISOString(),
    tags: ["category"],
  },

  {
    id: "category-harmony",
    targetType: "tag",
    targetId: "harmony",
    parentId: "category-music-theory",
    label: "Harmony",
    description:
      "Harmony describes how chords and notes combine to create musical texture and emotional color.",
    createdAt: new Date().toISOString(),
    tags: ["category", "harmony"],
  },

  {
    id: "category-instruments",
    targetType: "tag",
    targetId: "instruments",
    label: "Instruments",
    description:
      "Musical tools used to produce sound, each with unique tonal qualities and expressive capabilities.",
    createdAt: new Date().toISOString(),
    tags: ["category"],
  },

  {
    id: "instrument-piano",
    targetType: "instrument",
    targetId: "piano",
    parentId: "category-instruments",
    label: "Piano",
    description:
      "A keyboard instrument that produces sound when hammers strike strings. Used across classical, jazz, pop, and film scoring.",
    createdAt: new Date().toISOString(),
    tags: ["instrument", "keyboard"],
  },

  {
    id: "chord-cmaj7",
    targetType: "chord",
    targetId: "Cmaj7",
    parentId: "category-harmony",
    label: "C Major Seventh",
    description:
      "A major chord with an added major seventh. Common in jazz and cinematic harmony for a warm, open sound.",
    createdAt: new Date().toISOString(),
    tags: ["chord", "harmony", "jazz"],
  },
];