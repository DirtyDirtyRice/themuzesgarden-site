import type { HelpCard, HelpRouteMap } from "./helpFoundationTypes";

export const howDoICards: HelpCard[] = [
  {
    title: "Upload a folder of songs",
    body: "Use this when songs are still on your computer and need to be added to The Muzes Garden.",
    route: ["Upload", "Choose Folder", "Select Folder", "Upload", "Library"],
    status: "verified",
  },
  {
    title: "Send tracks to a project",
    body: "Use this after songs are already in your Library and you want them inside a project.",
    route: ["Library", "Select Tracks", "Choose Project", "Send To", "Project"],
    status: "verified",
  },
  {
    title: "Play a project",
    body: "Use this when a project already has tracks linked and you want to hear the project.",
    route: ["Projects", "Open Project", "Overview", "Play Project"],
    status: "verified",
  },
  {
    title: "Edit metadata for a track",
    body: "Use this when you want the metadata panel focused on a specific track.",
    route: ["Project", "Play or Inspect", "Metadata", "Edit"],
    status: "foundation",
  },
  {
    title: "Reorder a setlist",
    body: "Use the project setlist area when the project track order needs to change before playback.",
    route: ["Projects", "Open Project", "Setlist", "Move Tracks", "Save Order"],
    status: "foundation",
  },
  {
    title: "Find the help page again",
    body: "Use the real TitleBar Help dropdown. Help owns Find It, How Do I, What Is This, Routes, Tips, and What's New.",
    route: ["TitleBar", "Help ▼", "How Do I?"],
    status: "verified",
  },
];

export const routeCards: HelpCard[] = [
  {
    title: "Computer to Project",
    body: "Use this full route when starting with songs on your computer.",
    route: ["Upload", "Choose Folder", "Library", "Select Tracks", "Choose Project", "Send To", "Project", "Play"],
    status: "verified",
  },
  {
    title: "Library to Project",
    body: "Use this shorter route when songs are already uploaded.",
    route: ["Library", "Select Tracks", "Choose Project", "Send To", "Project"],
    status: "verified",
  },
  {
    title: "Project to Metadata",
    body: "Use this when you are inside a project and want to focus metadata on one track.",
    route: ["Project", "Track Row", "Metadata or Inspect", "Metadata Panel"],
    status: "foundation",
  },
  {
    title: "TitleBar to Help",
    body: "Use this route when you need the app guide instead of guessing through page links.",
    route: ["TitleBar", "Help ▼", "Pick Section"],
    status: "verified",
  },
];

export const routeMaps: HelpRouteMap[] = [
  {
    title: "Upload to playable project",
    summary: "The full verified song intake path from computer files to project playback.",
    start: "Computer folder",
    finish: "Project player",
    steps: ["Upload", "Choose Folder", "Library", "Select Track", "Choose Project", "Send To", "Project", "Play"],
    verified: true,
  },
  {
    title: "Library track to working project",
    summary: "The verified route for songs that are already inside the Library.",
    start: "Library",
    finish: "Project",
    steps: ["Library", "Select Track", "Choose Project", "Send To", "Project"],
    verified: true,
  },
  {
    title: "Help route lookup",
    summary: "The foundation route for finding instructions without redesigning navigation.",
    start: "TitleBar",
    finish: "Help section",
    steps: ["Help ▼", "Find It or How Do I", "Jump To", "Read Route"],
    verified: true,
  },
];
