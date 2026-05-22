import type { HelpSectionContent } from "./helpFoundationTypes";

export const helpFoundationLibrarySections: HelpSectionContent[] = [
  {
    id: "library-help",
    eyebrow: "Library",
    title: "Find songs, search tags, and manage uploaded tracks",
    body:
      "Library is the main place to find songs after they are uploaded or added to the app.",
    cards: [
      {
        title: "I uploaded songs but cannot find them",
        body:
          "Uploaded songs should appear in Library first. Use search, uploaded tracks, or filters to narrow the list.",
        route: ["Title Bar", "Library", "Search", "Uploaded Tracks"],
        status: "verified",
      },
      {
        title: "I want to search for a song",
        body:
          "Open Library and use the search box. Try song title, tag, style, project clue, or artist clue.",
        route: ["Library", "Search Box", "Type Search", "Review Results"],
        status: "verified",
      },
      {
        title: "I want to use tags",
        body:
          "Tags help group tracks by sound, mood, purpose, or workflow. Click a tag or search for it.",
        route: ["Library", "Track Row", "Tag Chip", "Filtered Results"],
        status: "foundation",
      },
      {
        title: "I want to send a song somewhere",
        body:
          "Select the track in Library, choose the destination project, then use Send To when available.",
        route: ["Library", "Select Track", "Choose Project", "Send To"],
        status: "foundation",
      },
      {
        title: "I want better Library organization later",
        body:
          "Future Help should explain uploads, generated tracks, project tracks, favorites, search modes, and saved filters.",
        route: ["Library", "Future Organization"],
        status: "planned",
      },
    ],
  },
];

export const libraryHelpCards = helpFoundationLibrarySections.flatMap((section) => section.cards);