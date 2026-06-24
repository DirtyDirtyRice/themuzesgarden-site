// app/tools/islands/IslandVisionSeed.ts

import type {
  IslandVisionWorkspace,
} from "./IslandVisionTypes";

export const islandVisionWorkspaceSeed: IslandVisionWorkspace = {
  title: "Island Workspace",
  subtitle: "A place where ideas are allowed to grow.",

  principles: [
    {
      title: "Blank Is The Default",
      description:
        "Every Island begins as a blank space full of possibility.",
    },
    {
      title: "Borrow Ideas, Not Limits",
      description:
        "Templates and blueprints are starting points, not restrictions.",
    },
    {
      title: "Start Small, Grow Naturally",
      description:
        "One page can eventually become an entire world.",
    },
    {
      title: "Show Me The Tools",
      description:
        "Creators often arrive with ideas and simply need tools.",
    },
    {
      title: "One Page, Infinite Depth",
      description:
        "Keep the workspace simple while allowing unlimited expansion.",
    },
  ],

  quickLinks: [
    {
      label: "Create",
      destination: "future-create-workspace",
    },
    {
      label: "Tools",
      destination: "future-tool-center",
    },
    {
      label: "Blueprints",
      destination: "future-blueprints",
    },
    {
      label: "Community",
      destination: "future-community",
    },
  ],

  toolCategories: [
    {
      title: "Music Tools",
      description: "Song creation and music intelligence.",
      tools: [
        "Lyrics",
        "Projects",
        "Library",
        "Metadata",
        "Track Matcher",
        "Multi-Track",
        "Song Evolution",
        "Version Analysis",
        "Hybrid Builder",
        "Keeper Bank",
      ],
    },
    {
      title: "Writing Tools",
      description: "Stories, journals, books, and notes.",
      tools: [
        "Stories",
        "Journal",
        "Notes",
        "Research",
      ],
    },
    {
      title: "Media Tools",
      description: "Photos, video, audio, and collections.",
      tools: [
        "Photos",
        "Videos",
        "Audio",
        "Documents",
        "Collections",
      ],
    },
    {
      title: "Protection Tools",
      description: "Ownership and copyright planning.",
      tools: [
        "Permissions",
        "Version History",
        "Ownership Records",
        "Copyright Information",
      ],
    },
  ],

  sections: [
    {
      title: "Creator Philosophy",
      summary:
        "An Island is not a website. It is a place where ideas are allowed to grow.",
      groups: [],
    },
    {
      title: "Community Philosophy",
      summary:
        "Learn from others and share what you discover.",
      groups: [],
    },
  ],
};