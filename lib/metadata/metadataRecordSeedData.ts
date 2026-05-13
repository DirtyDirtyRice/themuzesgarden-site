import type { MetadataRecord } from "./metadataLibraryTypes";

export const metadataRecordSeed: MetadataRecord[] = [
  {
    id: "record-c-major",
    slug: "c-major",
    title: "C Major",
    shelf: "music_theory",
    section: "concepts",
    visibility: "public",
    excerpt:
      "A simple major key with no sharps or flats, useful as a clean theory reference point.",
    description:
      "C Major is a starter reference record for the metadata system. It gives the app a stable music theory page to use when testing metadata routing, library shelves, relationship cards, and Find It results.",
    fields: [
      {
        id: "field-c-major-key-signature",
        label: "Key signature",
        type: "text",
        value: "No sharps or flats",
      },
      {
        id: "field-c-major-scale",
        label: "Scale notes",
        type: "list",
        value: ["C", "D", "E", "F", "G", "A", "B"],
      },
    ],
    relationships: [
      {
        id: "relationship-c-major-major-scale",
        type: "related_to",
        targetRecordId: "record-major-scale",
        targetLabel: "Major Scale",
        targetSlug: "major-scale",
        note: "C Major is a clear example of the major scale pattern.",
      },
    ],
  },
  {
    id: "record-major-scale",
    slug: "major-scale",
    title: "Major Scale",
    shelf: "music_theory",
    section: "concepts",
    visibility: "public",
    excerpt:
      "The whole-step and half-step pattern that creates the familiar major sound.",
    description:
      "The Major Scale record is a reusable theory reference for explaining keys, melodies, chords, and tonal relationships across the metadata library.",
    fields: [
      {
        id: "field-major-scale-pattern",
        label: "Step pattern",
        type: "text",
        value: "Whole, whole, half, whole, whole, whole, half",
      },
      {
        id: "field-major-scale-use",
        label: "Common use",
        type: "textarea",
        value:
          "Useful for mapping melody notes, chord construction, and key relationships.",
      },
    ],
    relationships: [
      {
        id: "relationship-major-scale-c-major",
        type: "related_to",
        targetRecordId: "record-c-major",
        targetLabel: "C Major",
        targetSlug: "c-major",
        note: "C Major is the easiest visual example because it uses only natural notes.",
      },
    ],
  },
  {
    id: "record-find-it",
    slug: "find-it",
    title: "Find It",
    shelf: "technical",
    section: "tools",
    visibility: "public",
    excerpt:
      "The app navigation helper that shows users how to get from where they are to what they need.",
    description:
      "Find It is the ADD-friendly navigation helper for The Muzes Garden. It should help users search for a target, understand where they are, and see a clear path to the destination.",
    fields: [
      {
        id: "field-find-it-purpose",
        label: "Purpose",
        type: "textarea",
        value:
          "Help users locate pages, systems, metadata records, and app features without needing to remember where they live.",
      },
      {
        id: "field-find-it-location",
        label: "Primary location",
        type: "text",
        value: "Title bar",
      },
    ],
    relationships: [],
  },
];