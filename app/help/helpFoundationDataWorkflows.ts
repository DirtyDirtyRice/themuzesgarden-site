import type { HelpCard, HelpRouteMap } from "./helpFoundationTypes";

export const howDoICards: HelpCard[] = [
  {
    title: "Upload a folder of songs",
    body: "Use this when songs are still on your computer and need to be added to The Muzes Garden.",
    route: ["Upload", "Choose Folder", "Select Folder", "Upload", "Library"],
    status: "verified",
  },
  {
    title: "Find uploaded songs after upload",
    body: "Use this when the upload finished but you do not see the song yet.",
    route: ["TitleBar", "Library", "Search", "Uploaded Tracks", "Clear Search If Needed"],
    status: "verified",
  },
  {
    title: "Search the Library",
    body: "Use this when you know a track title, tag, mood, source, or keyword and need to narrow the Library.",
    route: ["TitleBar", "Library", "Search Box", "Type Keyword", "Review Matching Tracks"],
    status: "verified",
  },
  {
    title: "Recover from an empty Library search",
    body: "Use this when the Library looks empty because a search term or filter is hiding the track list.",
    route: ["Library", "Search Box", "Clear Text", "Try Shorter Word", "Review Full Track List"],
    status: "verified",
  },
  {
    title: "Find tracks by tag",
    body: "Use this when you remember a sound idea, mood, genre, or tag but not the exact track name.",
    route: ["TitleBar", "Library", "Search Box", "Type Tag", "Review Tag Matches"],
    status: "verified",
  },
  {
    title: "Play a Library track",
    body: "Use this when you want to start listening from the Library instead of a project.",
    route: ["TitleBar", "Library", "Find Track", "Press Play", "Check Player"],
    status: "verified",
  },
  {
    title: "Check where a track came from",
    body: "Use this when you need to know whether a track is uploaded, seeded, stored, or connected to a project.",
    route: ["TitleBar", "Library", "Find Track", "Track Details", "Audio Source"],
    status: "foundation",
  },
  {
    title: "Send tracks to a project",
    body: "Use this after songs are already in your Library and you want them inside a project.",
    route: ["Library", "Select Tracks", "Choose Project", "Send To", "Project"],
    status: "verified",
  },
  {
    title: "Open a project",
    body: "Use this when you want to return to an existing project from the main navigation.",
    route: ["TitleBar", "Projects", "Choose Project Card", "Open Project"],
    status: "verified",
  },
  {
    title: "Find project overview",
    body: "Use this when you need the main summary area for a project.",
    route: ["TitleBar", "Projects", "Open Project", "Overview"],
    status: "verified",
  },
  {
    title: "Find project tracks",
    body: "Use this when you need to see which songs are currently inside a project.",
    route: ["TitleBar", "Projects", "Open Project", "Tracks"],
    status: "verified",
  },
  {
    title: "Find project top tracks",
    body: "Use this when you need ranking, favorites, or the strongest tracks inside a project.",
    route: ["Projects", "Open Project", "Overview", "Top Tracks"],
    status: "verified",
  },
  {
    title: "Play a project",
    body: "Use this when a project already has tracks linked and you want to hear the project.",
    route: ["Projects", "Open Project", "Overview", "Play Project"],
    status: "verified",
  },
  {
    title: "Use the project player",
    body: "Use this when you want project playback controls instead of only the global player.",
    route: ["Projects", "Open Project", "Project Player", "Choose Track", "Play"],
    status: "foundation",
  },
  {
    title: "Reorder a setlist",
    body: "Use the project setlist area when the project track order needs to change before playback.",
    route: ["Projects", "Open Project", "Setlist", "Move Tracks", "Save Order"],
    status: "foundation",
  },
  {
    title: "Move one setlist song up",
    body: "Use this when one song needs to play earlier in the project order.",
    route: ["Projects", "Open Project", "Setlist", "Find Song", "Move Up", "Confirm Order"],
    status: "foundation",
  },
  {
    title: "Move one setlist song down",
    body: "Use this when one song needs to play later in the project order.",
    route: ["Projects", "Open Project", "Setlist", "Find Song", "Move Down", "Confirm Order"],
    status: "foundation",
  },
  {
    title: "Find project metadata",
    body: "Use this when you need project notes, details, or future metadata connections.",
    route: ["Projects", "Open Project", "Metadata"],
    status: "foundation",
  },
  {
    title: "Edit metadata for a track",
    body: "Use this when you want the metadata panel focused on a specific track.",
    route: ["Project", "Play or Inspect", "Metadata", "Edit"],
    status: "foundation",
  },
  {
    title: "Compare two songs",
    body: "Use this when you want to hear whether two tracks work together or inspect their musical relationship.",
    route: ["TitleBar", "Track Matcher", "Load Track A", "Load Track B", "Compare"],
    status: "verified",
  },
  {
    title: "Load Track A in Track Matcher",
    body: "Use this when you need to choose the first song for comparison.",
    route: ["TitleBar", "Track Matcher", "Load Track A", "Choose Source Track"],
    status: "verified",
  },
  {
    title: "Load Track B in Track Matcher",
    body: "Use this when you need to choose the second song for comparison.",
    route: ["TitleBar", "Track Matcher", "Load Track B", "Choose Comparison Track"],
    status: "verified",
  },
  {
    title: "Analyze a Track Matcher pair",
    body: "Use this after Track A and Track B are loaded and you want analysis panels.",
    route: ["Track Matcher", "Load Track A", "Load Track B", "Analyze", "Review Panels"],
    status: "verified",
  },
  {
    title: "Find key and BPM in Track Matcher",
    body: "Use this when you need pitch, tempo, or key information for the loaded tracks.",
    route: ["Track Matcher", "Load Tracks", "Analyze", "Key And BPM"],
    status: "foundation",
  },
  {
    title: "Find the Track Matcher lane registry",
    body: "Use this when you want to understand which Track Matcher lanes exist and what they do.",
    route: ["TitleBar", "Track Matcher", "Lane Registry"],
    status: "verified",
  },
  {
    title: "Find Track Matcher lane relationships",
    body: "Use this when you want to understand how comparison lanes connect to each other.",
    route: ["TitleBar", "Track Matcher", "Lane Relationships"],
    status: "verified",
  },
  {
    title: "Find Track Matcher intelligence panels",
    body: "Use this when you want deeper analysis summaries, diagnostics, or future AI comparison panels.",
    route: ["TitleBar", "Track Matcher", "Analyze", "Intelligence Panels"],
    status: "foundation",
  },
  {
    title: "Open Metadata Library",
    body: "Use this when you need music knowledge records, shelves, sections, or deeper explanations.",
    route: ["TitleBar", "Metadata", "Library"],
    status: "verified",
  },
  {
    title: "Browse metadata shelves",
    body: "Use this when you need the top-level metadata group before choosing a record.",
    route: ["TitleBar", "Metadata", "Library", "Shelves"],
    status: "verified",
  },
  {
    title: "Browse metadata sections",
    body: "Use this when you are inside a shelf and need the smaller group that holds records.",
    route: ["Metadata", "Library", "Open Shelf", "Sections"],
    status: "verified",
  },
  {
    title: "Open a metadata record",
    body: "Use this when you need one detailed music knowledge page.",
    route: ["Metadata", "Library", "Open Shelf", "Open Section", "Open Record"],
    status: "verified",
  },
  {
    title: "Find metadata relationships",
    body: "Use this when you need connected concepts, related records, or linked music knowledge.",
    route: ["Metadata", "Library", "Open Record", "Relationships"],
    status: "verified",
  },
  {
    title: "Find More Information for a metadata record",
    body: "Use this when a short record card is not enough and you need the deeper explanation path.",
    route: ["Metadata", "Library", "Open Record", "More Information"],
    status: "foundation",
  },
  {
    title: "Find the C Major record",
    body: "Use this when you need the C Major reference page or music theory explanation.",
    route: ["TitleBar", "Metadata", "Library", "Records", "C Major"],
    status: "foundation",
  },
  {
    title: "Find Now Playing",
    body: "Use this when you need to know which track is currently selected or playing.",
    route: ["Player", "Now Playing"],
    status: "verified",
  },
  {
    title: "Use playback controls",
    body: "Use this when you need play, pause, or other listening controls.",
    route: ["Player", "Playback Controls", "Play Or Pause"],
    status: "verified",
  },
  {
    title: "Switch the playing track",
    body: "Use this when you want a different song to become the active player track.",
    route: ["Library Or Projects", "Choose Track", "Press Play", "Check Player"],
    status: "foundation",
  },
  {
    title: "Find the help page again",
    body: "Use the real TitleBar Help dropdown. Help owns Find It, How Do I, What Is This, Routes, Tips, and What's New.",
    route: ["TitleBar", "Help ▼", "How Do I?"],
    status: "verified",
  },
  {
    title: "Use Find It",
    body: "Use this when you know what you need but do not know where it lives inside the app.",
    route: ["TitleBar", "Help", "Find It", "Search Or Pick Category", "Read Route"],
    status: "verified",
  },
  {
    title: "Use Route Maps",
    body: "Use this when you need a literal click path instead of a general explanation.",
    route: ["TitleBar", "Help", "Route Maps", "Choose Route", "Follow Steps"],
    status: "verified",
  },
  {
    title: "Use Quick Answers",
    body: "Use this when you need a short answer to a common confusion.",
    route: ["TitleBar", "Help", "Quick Answers", "Read Answer"],
    status: "verified",
  },
  {
    title: "Use the Glossary",
    body: "Use this when a word, feature name, or app term needs a plain-language definition.",
    route: ["TitleBar", "Help", "Glossary", "Find Term"],
    status: "verified",
  },
  {
    title: "Find What's New",
    body: "Use this when you need recent Help Foundation updates or planned improvements.",
    route: ["TitleBar", "Help", "What's New"],
    status: "verified",
  },
  {
    title: "Recover when you feel lost",
    body: "Use this when you do not know where you are or what to click next.",
    route: ["TitleBar", "Help", "Find It", "Search What You Need", "Follow Route"],
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
    title: "Computer to Library",
    body: "Use this route when uploaded songs only need to be findable in the Library first.",
    route: ["Upload", "Choose Folder", "Upload", "Library", "Uploaded Tracks"],
    status: "verified",
  },
  {
    title: "Library to Project",
    body: "Use this shorter route when songs are already uploaded.",
    route: ["Library", "Select Tracks", "Choose Project", "Send To", "Project"],
    status: "verified",
  },
  {
    title: "Library Search to Player",
    body: "Use this route when you need to find one track and start playback.",
    route: ["Library", "Search", "Find Track", "Play", "Player"],
    status: "verified",
  },
  {
    title: "Project to Metadata",
    body: "Use this when you are inside a project and want to focus metadata on one track.",
    route: ["Project", "Track Row", "Metadata or Inspect", "Metadata Panel"],
    status: "foundation",
  },
  {
    title: "Project to Setlist",
    body: "Use this when you need project song order controls.",
    route: ["Projects", "Open Project", "Setlist", "Move Tracks", "Save Order"],
    status: "foundation",
  },
  {
    title: "Project to Top Tracks",
    body: "Use this when you want to review the strongest or ranked songs in a project.",
    route: ["Projects", "Open Project", "Overview", "Top Tracks"],
    status: "verified",
  },
  {
    title: "Track Matcher Compare Route",
    body: "Use this route when you want to compare two songs from the Track Matcher page.",
    route: ["TitleBar", "Track Matcher", "Load Track A", "Load Track B", "Compare", "Analyze"],
    status: "verified",
  },
  {
    title: "Track Matcher Lane Route",
    body: "Use this route when you want the lane registry or lane relationship explanation.",
    route: ["TitleBar", "Track Matcher", "Lane Registry", "Lane Relationships"],
    status: "verified",
  },
  {
    title: "Metadata Library Route",
    body: "Use this route when you want to browse from Metadata home into records.",
    route: ["TitleBar", "Metadata", "Library", "Shelf", "Section", "Record"],
    status: "verified",
  },
  {
    title: "Metadata Relationship Route",
    body: "Use this when you need related concepts after opening a metadata record.",
    route: ["Metadata", "Record", "Relationships"],
    status: "verified",
  },
  {
    title: "TitleBar to Help",
    body: "Use this route when you need the app guide instead of guessing through page links.",
    route: ["TitleBar", "Help ▼", "Pick Section"],
    status: "verified",
  },
  {
    title: "Help to Find It",
    body: "Use this when you want the navigation encyclopedia.",
    route: ["TitleBar", "Help", "Find It", "Search", "Read Card"],
    status: "verified",
  },
  {
    title: "Help to Route Maps",
    body: "Use this when you want step-by-step app paths.",
    route: ["TitleBar", "Help", "Route Maps", "Choose Route"],
    status: "verified",
  },
  {
    title: "Help to Glossary",
    body: "Use this when you need a plain-language meaning.",
    route: ["TitleBar", "Help", "Glossary", "Find Term"],
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
    title: "Upload to Library only",
    summary: "The shorter intake path for getting songs into the app before organizing projects.",
    start: "Computer folder",
    finish: "Library uploaded tracks",
    steps: ["Upload", "Choose Folder", "Upload", "Library", "Uploaded Tracks"],
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
    title: "Library search to player",
    summary: "The listening path for finding a track and starting playback.",
    start: "Library",
    finish: "Player",
    steps: ["Library", "Search", "Find Track", "Press Play", "Check Player"],
    verified: true,
  },
  {
    title: "Project to setlist order",
    summary: "The foundation path for changing the order of songs in a project.",
    start: "Project",
    finish: "Updated setlist",
    steps: ["Projects", "Open Project", "Setlist", "Move Tracks", "Save Order"],
    verified: false,
  },
  {
    title: "Project to top tracks",
    summary: "The path for reviewing a project's strongest or featured tracks.",
    start: "Projects",
    finish: "Top Tracks",
    steps: ["Projects", "Open Project", "Overview", "Top Tracks"],
    verified: true,
  },
  {
    title: "Project to project player",
    summary: "The foundation path for playing tracks from inside a project.",
    start: "Projects",
    finish: "Project player",
    steps: ["Projects", "Open Project", "Project Player", "Choose Track", "Play"],
    verified: false,
  },
  {
    title: "Track Matcher comparison",
    summary: "The route for comparing two loaded tracks.",
    start: "TitleBar",
    finish: "Comparison analysis",
    steps: ["TitleBar", "Track Matcher", "Load Track A", "Load Track B", "Compare", "Analyze"],
    verified: true,
  },
  {
    title: "Track Matcher lane explanation",
    summary: "The route for understanding lane registry and lane relationships.",
    start: "Track Matcher",
    finish: "Lane information",
    steps: ["Track Matcher", "Lane Registry", "Lane Relationships"],
    verified: true,
  },
  {
    title: "Metadata browse route",
    summary: "The route from Metadata home to one detailed metadata record.",
    start: "TitleBar",
    finish: "Metadata record",
    steps: ["TitleBar", "Metadata", "Library", "Shelf", "Section", "Record"],
    verified: true,
  },
  {
    title: "Metadata relationship route",
    summary: "The route for finding related concepts after a metadata record is open.",
    start: "Metadata record",
    finish: "Related records",
    steps: ["Metadata", "Record", "Relationships"],
    verified: true,
  },
  {
    title: "Metadata more information route",
    summary: "The foundation route for opening deeper metadata explanations.",
    start: "Metadata record",
    finish: "More Information",
    steps: ["Metadata", "Record", "More Information"],
    verified: false,
  },
  {
    title: "Help route lookup",
    summary: "The foundation route for finding instructions without redesigning navigation.",
    start: "TitleBar",
    finish: "Help section",
    steps: ["Help ▼", "Find It or How Do I", "Jump To", "Read Route"],
    verified: true,
  },
  {
    title: "Help lost-user recovery route",
    summary: "The safe restart path when the user does not know where they are in the app.",
    start: "Any page",
    finish: "A clear next step",
    steps: ["TitleBar", "Help", "Find It", "Search What You Need", "Follow Route"],
    verified: true,
  },
  {
    title: "Future global search route",
    summary: "The planned route for one search path across tracks, projects, metadata, and help.",
    start: "Future search",
    finish: "Global result",
    steps: ["Future Global Search", "Type Keyword", "Choose Track Project Metadata Or Help Result"],
    verified: false,
  },
];

export const verifiedHowDoICards = howDoICards.filter(
  (card) => card.status === "verified",
);

export const foundationHowDoICards = howDoICards.filter(
  (card) => card.status !== "verified",
);

export const verifiedRouteCards = routeCards.filter(
  (card) => card.status === "verified",
);

export const foundationRouteCards = routeCards.filter(
  (card) => card.status !== "verified",
);

export const verifiedRouteMaps = routeMaps.filter((route) => route.verified);

export const foundationRouteMaps = routeMaps.filter((route) => !route.verified);

export function getHowDoICards() {
  return howDoICards;
}

export function getRouteCards() {
  return routeCards;
}

export function getRouteMaps() {
  return routeMaps;
}

export function searchHowDoICards(query: string) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return howDoICards;
  }

  return howDoICards.filter((card) => {
    const searchableText = [
      card.title,
      card.body,
      card.status ?? "",
      card.route?.join(" ") ?? "",
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(normalized);
  });
}

export function searchRouteCards(query: string) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return routeCards;
  }

  return routeCards.filter((card) => {
    const searchableText = [
      card.title,
      card.body,
      card.status ?? "",
      card.route?.join(" ") ?? "",
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(normalized);
  });
}

export function searchWorkflowRouteMaps(query: string) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return routeMaps;
  }

  return routeMaps.filter((route) => {
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