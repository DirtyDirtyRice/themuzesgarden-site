import type { HelpRouteMap } from "./helpFoundationTypes";

export const helpFoundationRouteMaps: HelpRouteMap[] = [
  {
    title: "Find uploaded songs",
    summary: "Use this when a song was uploaded but you do not know where it went.",
    start: "Upload",
    finish: "Library uploaded tracks",
    steps: ["Upload", "Library", "Search", "Uploaded Tracks"],
    verified: true,
  },
  {
    title: "Compare two songs",
    summary: "Use this when you want to hear whether two tracks work together.",
    start: "Title Bar",
    finish: "Track Matcher comparison",
    steps: ["Title Bar", "Track Matcher", "Load Track A", "Load Track B", "Compare"],
    verified: true,
  },
  {
    title: "Reorder songs in a project",
    summary: "Use this when a project setlist is in the wrong order.",
    start: "Projects",
    finish: "Updated setlist order",
    steps: ["Projects", "Open Project", "Setlist", "Move Up / Move Down"],
    verified: false,
  },
  {
    title: "Open Metadata",
    summary: "Use this when you want explanations, records, shelves, or deeper music information.",
    start: "Title Bar",
    finish: "Metadata home",
    steps: ["Title Bar", "Metadata", "Open Shelf", "Open Record"],
    verified: true,
  },
  {
    title: "Open Help",
    summary: "Use this when you are lost and need plain-language guidance.",
    start: "Title Bar",
    finish: "Help page",
    steps: ["Title Bar", "Help", "Jump To", "Choose Section"],
    verified: true,
  },
];

export const verifiedHelpFoundationRoutes = helpFoundationRouteMaps.filter((route) => route.verified);
export const foundationHelpFoundationRoutes = helpFoundationRouteMaps.filter((route) => !route.verified);