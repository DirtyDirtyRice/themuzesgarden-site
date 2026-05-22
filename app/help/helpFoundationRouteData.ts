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
    title: "Search the Library",
    summary: "Use this when you know part of a track name, tag, source, mood, or sound idea.",
    start: "Title Bar",
    finish: "Filtered Library results",
    steps: ["Title Bar", "Library", "Search Box", "Type Keyword", "Review Matching Tracks"],
    verified: true,
  },
  {
    title: "Find tracks by tag",
    summary: "Use this when you remember a tag but not the track title.",
    start: "Title Bar",
    finish: "Tagged Library tracks",
    steps: ["Title Bar", "Library", "Search Box", "Type Tag", "Review Tag Matches"],
    verified: true,
  },
  {
    title: "Clear a Library search",
    summary: "Use this when the Library looks empty because a search or filter is still active.",
    start: "Library",
    finish: "Full Library list",
    steps: ["Library", "Search Box", "Clear Text", "Review Full Track List"],
    verified: true,
  },
  {
    title: "Play a track from Library",
    summary: "Use this when you want to start listening from the Library page.",
    start: "Title Bar",
    finish: "Player starts selected track",
    steps: ["Title Bar", "Library", "Find Track", "Press Track Play Control", "Check Player"],
    verified: true,
  },
  {
    title: "Check a track source",
    summary: "Use this when you need to know whether a track is uploaded, seeded, stored, or project-linked.",
    start: "Title Bar",
    finish: "Track source label",
    steps: ["Title Bar", "Library", "Find Track", "Open Track Details", "Read Source"],
    verified: false,
  },
  {
    title: "Open a project",
    summary: "Use this when you need to return to an existing project.",
    start: "Title Bar",
    finish: "Project overview",
    steps: ["Title Bar", "Projects", "Choose Project Card", "Open Project"],
    verified: true,
  },
  {
    title: "Find project overview",
    summary: "Use this when you need the main project summary page.",
    start: "Projects",
    finish: "Project overview panel",
    steps: ["Projects", "Open Project", "Overview"],
    verified: true,
  },
  {
    title: "Find project tracks",
    summary: "Use this when you need to see which tracks belong to a project.",
    start: "Projects",
    finish: "Project track list",
    steps: ["Projects", "Open Project", "Tracks"],
    verified: true,
  },
  {
    title: "Find project top tracks",
    summary: "Use this when you need the project ranking or featured track area.",
    start: "Projects",
    finish: "Top Tracks panel",
    steps: ["Projects", "Open Project", "Overview", "Top Tracks"],
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
    title: "Use the project player",
    summary: "Use this when you want to play music from inside a project.",
    start: "Projects",
    finish: "Project track playing",
    steps: ["Projects", "Open Project", "Project Player", "Choose Track", "Play"],
    verified: false,
  },
  {
    title: "Find project metadata",
    summary: "Use this when you need notes, details, or future metadata connections for a project.",
    start: "Projects",
    finish: "Project metadata area",
    steps: ["Projects", "Open Project", "Metadata"],
    verified: false,
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
    title: "Load Track A",
    summary: "Use this when you need to choose the first song for Track Matcher.",
    start: "Title Bar",
    finish: "Track A loaded",
    steps: ["Title Bar", "Track Matcher", "Load Track A", "Choose Source Track"],
    verified: true,
  },
  {
    title: "Load Track B",
    summary: "Use this when you need to choose the second song for Track Matcher.",
    start: "Title Bar",
    finish: "Track B loaded",
    steps: ["Title Bar", "Track Matcher", "Load Track B", "Choose Comparison Track"],
    verified: true,
  },
  {
    title: "Analyze a Track Matcher pair",
    summary: "Use this when two tracks are loaded and you need comparison details.",
    start: "Track Matcher",
    finish: "Analysis panels",
    steps: ["Track Matcher", "Load Track A", "Load Track B", "Analyze", "Review Panels"],
    verified: true,
  },
  {
    title: "Find Track Matcher lane registry",
    summary: "Use this when you need to understand the lane architecture or available analysis lanes.",
    start: "Title Bar",
    finish: "Lane Registry panel",
    steps: ["Title Bar", "Track Matcher", "Lane Registry"],
    verified: true,
  },
  {
    title: "Find Track Matcher lane relationships",
    summary: "Use this when you need to see how comparison lanes connect.",
    start: "Track Matcher",
    finish: "Lane Relationships panel",
    steps: ["Track Matcher", "Lane Relationships"],
    verified: true,
  },
  {
    title: "Find Track Matcher intelligence panels",
    summary: "Use this when you need deeper comparison summaries, diagnostics, or planned intelligence areas.",
    start: "Track Matcher",
    finish: "Intelligence panels",
    steps: ["Track Matcher", "Analyze", "Intelligence Panels"],
    verified: false,
  },
  {
    title: "Find key and BPM analysis",
    summary: "Use this when you need tempo, pitch, or key comparison details.",
    start: "Track Matcher",
    finish: "Key and BPM information",
    steps: ["Track Matcher", "Load Tracks", "Analyze", "Key And BPM"],
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
    title: "Open Metadata Library",
    summary: "Use this when you need the main knowledge library.",
    start: "Title Bar",
    finish: "Metadata Library",
    steps: ["Title Bar", "Metadata", "Library"],
    verified: true,
  },
  {
    title: "Find metadata shelves",
    summary: "Use this when you need the top-level groups in the metadata system.",
    start: "Metadata",
    finish: "Metadata shelves",
    steps: ["Metadata", "Library", "Shelves"],
    verified: true,
  },
  {
    title: "Find metadata sections",
    summary: "Use this when you need the smaller groups inside a metadata shelf.",
    start: "Metadata",
    finish: "Metadata sections",
    steps: ["Metadata", "Library", "Open Shelf", "Sections"],
    verified: true,
  },
  {
    title: "Open a metadata record",
    summary: "Use this when you need one detailed metadata reference page.",
    start: "Metadata",
    finish: "Metadata record",
    steps: ["Metadata", "Library", "Open Shelf", "Open Section", "Open Record"],
    verified: true,
  },
  {
    title: "Find metadata relationships",
    summary: "Use this when you need linked records or related knowledge.",
    start: "Metadata",
    finish: "Record relationships",
    steps: ["Metadata", "Library", "Open Record", "Relationships"],
    verified: true,
  },
  {
    title: "Find More Information for a metadata record",
    summary: "Use this when a card summary is not enough and you need deeper explanation.",
    start: "Metadata",
    finish: "More Information view",
    steps: ["Metadata", "Library", "Open Record", "More Information"],
    verified: false,
  },
  {
    title: "Find the C Major record",
    summary: "Use this when you need the C Major music theory reference.",
    start: "Title Bar",
    finish: "C Major metadata record",
    steps: ["Title Bar", "Metadata", "Library", "Records", "C Major"],
    verified: false,
  },
  {
    title: "Find Now Playing",
    summary: "Use this when you need to know which track is currently selected or playing.",
    start: "Player",
    finish: "Now Playing information",
    steps: ["Player", "Now Playing"],
    verified: true,
  },
  {
    title: "Use playback controls",
    summary: "Use this when you need play, pause, or listening controls.",
    start: "Player",
    finish: "Playback changed",
    steps: ["Player", "Playback Controls", "Play Or Pause"],
    verified: true,
  },
  {
    title: "Find track information in the player",
    summary: "Use this when you need title, source, or details for the current track.",
    start: "Player",
    finish: "Current track information",
    steps: ["Player", "Now Playing", "Track Information"],
    verified: false,
  },
  {
    title: "Switch the playing track",
    summary: "Use this when you want another song to become the active player track.",
    start: "Library or Projects",
    finish: "New active track",
    steps: ["Library Or Projects", "Choose Track", "Press Play", "Check Player"],
    verified: false,
  },
  {
    title: "Use Help Find It",
    summary: "Use this when you know what you need but not where it lives.",
    start: "Title Bar",
    finish: "Find It answer card",
    steps: ["Title Bar", "Help", "Find It", "Search Or Choose Category", "Read Route"],
    verified: true,
  },
  {
    title: "Use Help Route Maps",
    summary: "Use this when you want a literal step-by-step path through the app.",
    start: "Title Bar",
    finish: "Route Map steps",
    steps: ["Title Bar", "Help", "Route Maps", "Choose Route", "Follow Steps"],
    verified: true,
  },
  {
    title: "Use Help Quick Answers",
    summary: "Use this when you need a short answer to a common confusion.",
    start: "Title Bar",
    finish: "Quick answer",
    steps: ["Title Bar", "Help", "Quick Answers", "Read Answer"],
    verified: true,
  },
  {
    title: "Use Help Glossary",
    summary: "Use this when a word or feature name needs a plain-language definition.",
    start: "Title Bar",
    finish: "Glossary definition",
    steps: ["Title Bar", "Help", "Glossary", "Find Term"],
    verified: true,
  },
  {
    title: "Find What's New",
    summary: "Use this when you need recent or planned Help Foundation updates.",
    start: "Title Bar",
    finish: "What's New section",
    steps: ["Title Bar", "Help", "What's New"],
    verified: true,
  },
  {
    title: "Use How Do I workflows",
    summary: "Use this when you need a workflow instead of a single route card.",
    start: "Title Bar",
    finish: "How Do I workflow",
    steps: ["Title Bar", "Help", "How Do I", "Choose Workflow"],
    verified: true,
  },
  {
    title: "Search Help",
    summary: "Use this when you are on Help but do not know which section contains the answer.",
    start: "Help",
    finish: "Matching Help guidance",
    steps: ["Help", "Find It", "Search Box", "Type Keyword", "Read Matching Cards"],
    verified: true,
  },
  {
    title: "Find projects workspace",
    summary: "Use this when you need the main workspace area for projects.",
    start: "Title Bar",
    finish: "Projects workspace",
    steps: ["Title Bar", "Projects"],
    verified: true,
  },
  {
    title: "Find future workspace areas",
    summary: "Use this when you are looking for planned organization areas beyond Projects.",
    start: "Workspace",
    finish: "Future workspace planning",
    steps: ["Workspace", "Future Areas"],
    verified: false,
  },
  {
    title: "Find Upload",
    summary: "Use this when you need to add music files to the app.",
    start: "Title Bar",
    finish: "Upload page",
    steps: ["Title Bar", "Upload"],
    verified: true,
  },
  {
    title: "Use the title bar",
    summary: "Use this when you need to move between major pages.",
    start: "Any page",
    finish: "Chosen major page",
    steps: ["Title Bar", "Choose Player, Library, Projects, Metadata, Track Matcher, Upload, Or Help"],
    verified: true,
  },
  {
    title: "Return to the main player page",
    summary: "Use this when you want to get back to the main listening area.",
    start: "Title Bar",
    finish: "Player page",
    steps: ["Title Bar", "Player"],
    verified: false,
  },
  {
    title: "Recover when you feel lost",
    summary: "Use this when you do not know where you are or what to click next.",
    start: "Any page",
    finish: "A clear next route",
    steps: ["Title Bar", "Help", "Find It", "Search What You Need", "Follow Route"],
    verified: true,
  },
  {
    title: "Find future global search",
    summary: "Use this when you want one future search path for tracks, projects, metadata, and help.",
    start: "Future",
    finish: "Global search",
    steps: ["Future", "Global Search", "Search Everything"],
    verified: false,
  },
  {
    title: "Find future project relationships",
    summary: "Use this when you want projects connected to tracks, metadata, notes, or other projects.",
    start: "Projects",
    finish: "Future project relationship map",
    steps: ["Projects", "Open Project", "Future Relationships"],
    verified: false,
  },
  {
    title: "Find future track relationships",
    summary: "Use this when you want to connect versions, similar tracks, references, or Track Matcher results.",
    start: "Library",
    finish: "Future track relationship map",
    steps: ["Library", "Open Track", "Future Track Relationships"],
    verified: false,
  },
];

export const verifiedHelpFoundationRoutes = helpFoundationRouteMaps.filter(
  (route) => route.verified,
);

export const foundationHelpFoundationRoutes = helpFoundationRouteMaps.filter(
  (route) => !route.verified,
);

export function getHelpFoundationRouteMaps() {
  return helpFoundationRouteMaps;
}

export function getVerifiedHelpFoundationRoutes() {
  return verifiedHelpFoundationRoutes;
}

export function getFoundationHelpFoundationRoutes() {
  return foundationHelpFoundationRoutes;
}

export function searchHelpFoundationRouteMaps(query: string) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return helpFoundationRouteMaps;
  }

  return helpFoundationRouteMaps.filter((route) => {
    const searchableText = [
      route.title,
      route.summary,
      route.start,
      route.finish,
      route.steps.join(" "),
      route.verified ? "verified" : "foundation planned future",
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(normalized);
  });
}