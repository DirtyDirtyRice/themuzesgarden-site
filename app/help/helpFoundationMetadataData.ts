import type { HelpSectionContent } from "./helpFoundationTypes";

export const helpFoundationMetadataSections: HelpSectionContent[] = [
  {
    id: "metadata-help",
    eyebrow: "Metadata",
    title: "Understand the library knowledge system",
    body:
      "Metadata is the deeper knowledge layer for songs, projects, sounds, relationships, and explanations. It is not just a tag list.",
    cards: [
      {
        title: "What is Metadata?",
        body:
          "Metadata is structured information that explains what something is, where it belongs, and how it connects to other things.",
        route: ["Title Bar", "Metadata"],
        note:
          "Think Library > Shelves > Sections > Records > Relationships.",
        status: "foundation",
      },
      {
        title: "I want more information about something",
        body:
          "Use Metadata when a page needs a deeper explanation, relationship, definition, or future More Information entry.",
        route: ["Page", "More Information", "Metadata Record"],
        status: "planned",
      },
      {
        title: "Is Metadata the same as tags?",
        body:
          "No. Tags help search and filter. Metadata explains meaning, structure, relationships, and context.",
        route: ["Metadata", "Record", "Relationships"],
        status: "foundation",
      },
      {
        title: "Where should music theory explanations live?",
        body:
          "Theory explanations should eventually live in Metadata records so they can connect to songs, notes, chords, keys, and examples.",
        route: ["Metadata", "Library", "Music Theory", "Record"],
        status: "planned",
      },
      {
        title: "Where should app explanations live?",
        body:
          "App explanations should connect Help and Metadata. Help tells members what to do; Metadata explains what the thing means.",
        route: ["Help", "What Is This?", "Metadata"],
        status: "foundation",
      },
    ],
  },
];

export const metadataHelpCards = helpFoundationMetadataSections.flatMap((section) => section.cards);