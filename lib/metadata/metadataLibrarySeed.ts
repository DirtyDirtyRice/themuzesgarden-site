import type {
  MetadataLibrary,
  MetadataRecord,
  MetadataRecordSummary,
} from "./metadataLibraryTypes";

export const metadataLibrarySeed: MetadataLibrary = {
  id: "muzes-garden-library",
  label: "The Muzes Garden Metadata Library",
  description:
    "Structured foundation for music knowledge, project context, relationships, and future search layers.",
  shelves: [
    {
      id: "shelf-music-theory",
      key: "music_theory",
      label: "Music Theory",
      description: "Harmony, rhythm, notes, scales, keys, chords, and structure.",
      sections: [
        {
          id: "section-theory-concepts",
          key: "concepts",
          label: "Concepts",
          description: "Core music theory ideas and definitions.",
        },
        {
          id: "section-theory-structures",
          key: "structures",
          label: "Structures",
          description: "Song forms, progressions, and structural patterns.",
        },
      ],
    },
    {
      id: "shelf-songwriting",
      key: "songwriting",
      label: "Songwriting",
      description: "Lyrics, themes, storytelling, hooks, and writing choices.",
      sections: [
        {
          id: "section-songwriting-techniques",
          key: "techniques",
          label: "Techniques",
          description: "Methods for shaping songs and lyrical direction.",
        },
        {
          id: "section-songwriting-notes",
          key: "notes",
          label: "Notes",
          description: "Creative notes, observations, and development ideas.",
        },
      ],
    },
    {
      id: "shelf-artists",
      key: "artists",
      label: "Artists",
      description: "Artist records, influence chains, and connected references.",
      sections: [
        {
          id: "section-artists-people",
          key: "people",
          label: "People",
          description: "Artist and creator entries.",
        },
        {
          id: "section-artists-references",
          key: "references",
          label: "References",
          description: "Associated inspirations and contextual references.",
        },
      ],
    },
    {
      id: "shelf-projects",
      key: "projects",
      label: "Projects",
      description: "Project-specific knowledge, ownership, linked materials, and context.",
      sections: [
        {
          id: "section-projects-works",
          key: "works",
          label: "Works",
          description: "Project records and major work items.",
        },
        {
          id: "section-projects-notes",
          key: "notes",
          label: "Notes",
          description: "Supporting context and internal project notes.",
        },
      ],
    },
  ],
};

export const metadataRecordSeed: MetadataRecord[] = [
  {
    id: "record-c-major",
    slug: "c-major",
    title: "C Major",
    shelf: "music_theory",
    section: "concepts",
    visibility: "public",
    excerpt: "A foundational key often used for teaching and reference.",
    description:
      "C Major is a foundational musical key with no sharps or flats in its basic scale form.",
    fields: [
      { id: "field-c-major-type", label: "Type", type: "text", value: "Major key" },
      {
        id: "field-c-major-notes",
        label: "Scale Notes",
        type: "list",
        value: ["C", "D", "E", "F", "G", "A", "B"],
      },
      {
        id: "field-c-major-use",
        label: "Use Case",
        type: "textarea",
        value: "Reference point for theory explanations and simple harmonic examples.",
      },
    ],
    relationships: [
      {
        id: "rel-c-major-song-structure",
        type: "related_to",
        targetRecordId: "record-verse-chorus",
        targetLabel: "Verse / Chorus Form",
        note: "Frequently discussed together in beginner songwriting contexts.",
      },
    ],
  },
  {
    id: "record-verse-chorus",
    slug: "verse-chorus-form",
    title: "Verse / Chorus Form",
    shelf: "songwriting",
    section: "techniques",
    visibility: "public",
    excerpt: "A common song structure built around repeating choruses and changing verses.",
    description:
      "Verse / Chorus Form is one of the most common structural blueprints in modern songwriting.",
    fields: [
      {
        id: "field-verse-chorus-category",
        label: "Category",
        type: "text",
        value: "Song structure",
      },
      {
        id: "field-verse-chorus-strength",
        label: "Strength",
        type: "textarea",
        value: "Supports repetition, contrast, and memorable hooks.",
      },
    ],
    relationships: [
      {
        id: "rel-verse-chorus-c-major",
        type: "related_to",
        targetRecordId: "record-c-major",
        targetLabel: "C Major",
      },
    ],
  },
  {
    id: "record-project-metadata-foundation",
    slug: "metadata-foundation-phase",
    title: "Metadata Foundation Phase",
    shelf: "projects",
    section: "works",
    visibility: "shared",
    excerpt: "Scaffolding phase for the Muzes Garden metadata knowledge system.",
    description:
      "This record tracks the initial foundation work for the Metadata Library System.",
    fields: [
      {
        id: "field-metadata-phase-status",
        label: "Status",
        type: "text",
        value: "Foundation",
      },
      {
        id: "field-metadata-phase-focus",
        label: "Focus",
        type: "textarea",
        value:
          "Create structured types, page shells, and entry points before advanced UI systems.",
      },
    ],
    relationships: [
      {
        id: "rel-metadata-phase-verse-chorus",
        type: "references",
        targetRecordId: "record-verse-chorus",
        targetLabel: "Verse / Chorus Form",
        note: "Example starter record for future metadata navigation.",
      },
    ],
  },
];

export function getMetadataLibrary(): MetadataLibrary {
  return metadataLibrarySeed;
}

export function getMetadataRecords(): MetadataRecord[] {
  return metadataRecordSeed;
}

export function getMetadataRecordSummaries(): MetadataRecordSummary[] {
  return metadataRecordSeed.map(
    ({ id, slug, title, shelf, section, visibility, excerpt }) => ({
      id,
      slug,
      title,
      shelf,
      section,
      visibility,
      excerpt,
    })
  );
}

export function getMetadataRecordBySlug(slug: string): MetadataRecord | null {
  return metadataRecordSeed.find((record) => record.slug === slug) ?? null;
}