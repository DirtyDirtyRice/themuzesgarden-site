import type { MetadataLibrary } from "./metadataLibraryTypes";

export const metadataLibrarySeed: MetadataLibrary = {
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
          description:
            "Core theory ideas such as keys, scales, chords, and harmony.",
        },
        {
          id: "section-music-theory-structures",
          key: "structures",
          label: "Structures",
          description:
            "Song forms, progressions, and repeatable musical patterns.",
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
          description:
            "Production moves, workflows, and repeatable sound choices.",
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
          description:
            "Playing techniques, articulations, and performance details.",
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
          description:
            "Project notes, decisions, and work-in-progress details.",
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