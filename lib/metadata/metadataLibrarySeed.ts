import type {
  MetadataLibrary,
  MetadataRecord,
  MetadataRecordSummary,
} from "./metadataLibraryTypes";

const metadataLibrarySeed: MetadataLibrary = {
  id: "muzes-garden-metadata-library",
  label: "The Muzes Garden Metadata Library",
  description:
    "A starter knowledge library for organizing music ideas, lyrics, production notes, projects, instruments, genres, and technical references.",
  shelves: [
    {
      id: "shelf-music-theory",
      key: "music_theory",
      label: "Music Theory",
      description:
        "Concepts, structures, and references that explain how music is built.",
      sections: [
        {
          id: "section-music-theory-concepts",
          key: "concepts",
          label: "Concepts",
          description: "Core theory ideas such as keys, scales, chords, and harmony.",
        },
        {
          id: "section-music-theory-structures",
          key: "structures",
          label: "Structures",
          description: "Song forms, progressions, and repeatable musical patterns.",
        },
        {
          id: "section-music-theory-references",
          key: "references",
          label: "References",
          description: "Helpful theory reference material for later lookup.",
        },
      ],
    },
    {
      id: "shelf-songwriting",
      key: "songwriting",
      label: "Songwriting",
      description:
        "Lyric, melody, arrangement, and emotional intent notes for building songs.",
      sections: [
        {
          id: "section-songwriting-techniques",
          key: "techniques",
          label: "Techniques",
          description: "Reusable writing methods and creative moves.",
        },
        {
          id: "section-songwriting-terms",
          key: "terms",
          label: "Terms",
          description: "Definitions for songwriting language and structure.",
        },
        {
          id: "section-songwriting-notes",
          key: "notes",
          label: "Notes",
          description: "Loose songwriting notes that can become records later.",
        },
      ],
    },
    {
      id: "shelf-production",
      key: "production",
      label: "Production",
      description:
        "Sound design, mixing, arrangement, effects, and studio workflow knowledge.",
      sections: [
        {
          id: "section-production-techniques",
          key: "techniques",
          label: "Techniques",
          description: "Production moves, workflows, and repeatable sound choices.",
        },
        {
          id: "section-production-tools",
          key: "tools",
          label: "Tools",
          description: "Software, plugins, gear, and production utilities.",
        },
        {
          id: "section-production-references",
          key: "references",
          label: "References",
          description: "Production reference notes for later comparison.",
        },
      ],
    },
    {
      id: "shelf-artists",
      key: "artists",
      label: "Artists",
      description:
        "Artist references, influence notes, style studies, and performance context.",
      sections: [
        {
          id: "section-artists-people",
          key: "people",
          label: "People",
          description: "Musicians, writers, producers, and collaborators.",
        },
        {
          id: "section-artists-works",
          key: "works",
          label: "Works",
          description: "Songs, albums, performances, and other artist works.",
        },
        {
          id: "section-artists-references",
          key: "references",
          label: "References",
          description: "Artist reference material for creative direction.",
        },
      ],
    },
    {
      id: "shelf-genres",
      key: "genres",
      label: "Genres",
      description:
        "Genre traits, reference sounds, arrangement habits, and style boundaries.",
      sections: [
        {
          id: "section-genres-concepts",
          key: "concepts",
          label: "Concepts",
          description: "Genre ideas and sound identity notes.",
        },
        {
          id: "section-genres-terms",
          key: "terms",
          label: "Terms",
          description: "Genre vocabulary and naming references.",
        },
        {
          id: "section-genres-references",
          key: "references",
          label: "References",
          description: "Genre examples and comparison material.",
        },
      ],
    },
    {
      id: "shelf-instruments",
      key: "instruments",
      label: "Instruments",
      description:
        "Instrument roles, tones, ranges, playing styles, and arrangement uses.",
      sections: [
        {
          id: "section-instruments-concepts",
          key: "concepts",
          label: "Concepts",
          description: "Instrument role and behavior notes.",
        },
        {
          id: "section-instruments-techniques",
          key: "techniques",
          label: "Techniques",
          description: "Playing techniques, articulations, and performance details.",
        },
        {
          id: "section-instruments-references",
          key: "references",
          label: "References",
          description: "Instrument examples and listening references.",
        },
      ],
    },
    {
      id: "shelf-projects",
      key: "projects",
      label: "Projects",
      description:
        "Project-level knowledge for songs, experiments, albums, and generated audio.",
      sections: [
        {
          id: "section-projects-works",
          key: "works",
          label: "Works",
          description: "Songs, demos, project drafts, and larger creative works.",
        },
        {
          id: "section-projects-notes",
          key: "notes",
          label: "Notes",
          description: "Project notes, decisions, and work-in-progress details.",
        },
        {
          id: "section-projects-references",
          key: "references",
          label: "References",
          description: "Project references and comparison material.",
        },
      ],
    },
    {
      id: "shelf-lyrics",
      key: "lyrics",
      label: "Lyrics",
      description:
        "Words, phrasing, pronunciation, meaning, sections, and lyric revision notes.",
      sections: [
        {
          id: "section-lyrics-terms",
          key: "terms",
          label: "Terms",
          description: "Lyric terms, pronunciation helpers, and meaning notes.",
        },
        {
          id: "section-lyrics-structures",
          key: "structures",
          label: "Structures",
          description: "Verse, chorus, bridge, and lyric section structures.",
        },
        {
          id: "section-lyrics-notes",
          key: "notes",
          label: "Notes",
          description: "Draft lyric notes and revision details.",
        },
      ],
    },
    {
      id: "shelf-technical",
      key: "technical",
      label: "Technical",
      description:
        "Technical app, database, prompt, model, and workflow notes for the system.",
      sections: [
        {
          id: "section-technical-tools",
          key: "tools",
          label: "Tools",
          description: "Technical tools, app systems, and developer utilities.",
        },
        {
          id: "section-technical-references",
          key: "references",
          label: "References",
          description: "Technical references and implementation notes.",
        },
        {
          id: "section-technical-notes",
          key: "notes",
          label: "Notes",
          description: "Loose technical notes for future development.",
        },
      ],
    },
  ],
};

const metadataRecordSeed: MetadataRecord[] = [
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

function cloneLibrary(): MetadataLibrary {
  return {
    ...metadataLibrarySeed,
    shelves: metadataLibrarySeed.shelves.map((shelf) => ({
      ...shelf,
      sections: shelf.sections.map((section) => ({ ...section })),
    })),
  };
}

function cloneRecord(record: MetadataRecord): MetadataRecord {
  return {
    ...record,
    fields: record.fields.map((field) => ({ ...field })),
    relationships: record.relationships.map((relationship) => ({
      ...relationship,
    })),
  };
}

export function getMetadataLibrary(): MetadataLibrary {
  return cloneLibrary();
}

export function getMetadataRecords(): MetadataRecord[] {
  return metadataRecordSeed.map(cloneRecord);
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
    }),
  );
}

export function getMetadataRecordBySlug(slug: string): MetadataRecord | null {
  const cleanSlug = slug.trim().toLowerCase();
  const record = metadataRecordSeed.find((item) => item.slug === cleanSlug);

  return record ? cloneRecord(record) : null;
}

export { metadataLibrarySeed, metadataRecordSeed };