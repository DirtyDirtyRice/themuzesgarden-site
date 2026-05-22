export type FindItEntry = {
  id: string;
  title: string;
  problem: string;
  answer: string;
  route: string[];
  keywords: string[];
  category:
    | "library"
    | "projects"
    | "track-matcher"
    | "metadata"
    | "workspace"
    | "general"
    | "player"
    | "search"
    | "relationships"
    | "help";
};

export type FindItCategory = {
  id: string;
  title: string;
  description: string;
};

export const FIND_IT_CATEGORIES: FindItCategory[] = [
  {
    id: "library",
    title: "Library",
    description: "Finding tracks, uploaded music, tags, filters, and track details.",
  },
  {
    id: "projects",
    title: "Projects",
    description: "Opening projects, reviewing tracks, managing setlists, and project playback.",
  },
  {
    id: "track-matcher",
    title: "Track Matcher",
    description: "Comparing, loading, analyzing, and reviewing track intelligence.",
  },
  {
    id: "metadata",
    title: "Metadata",
    description: "Finding shelves, sections, records, details, and knowledge relationships.",
  },
  {
    id: "workspace",
    title: "Workspace",
    description: "Project organization areas and future workspace navigation.",
  },
  {
    id: "general",
    title: "General",
    description: "Common navigation questions and app-wide orientation.",
  },
  {
    id: "player",
    title: "Player",
    description: "Now playing, playback controls, and track information.",
  },
  {
    id: "search",
    title: "Search",
    description: "Library, metadata, project, help, and future global search paths.",
  },
  {
    id: "relationships",
    title: "Relationships",
    description: "Linked records, future project links, and future track relationships.",
  },
  {
    id: "help",
    title: "Help",
    description: "Find It, Route Maps, Quick Answers, Glossary, and What's New.",
  },
];

export const FIND_IT_ENTRIES: FindItEntry[] = [
  {
    id: "uploaded-tracks",
    title: "I uploaded songs but cannot find them",
    problem: "Uploaded tracks appear missing.",
    answer: "Open Library and view Uploaded Tracks.",
    route: ["Title Bar", "Library", "Uploaded Tracks"],
    keywords: ["upload", "uploaded", "song", "track", "missing", "library"],
    category: "library",
  },
  {
    id: "library-search",
    title: "Find a song using Library search",
    problem: "Need to locate a track quickly.",
    answer: "Use Library search and type a track name, tag, source, mood, or keyword.",
    route: ["Title Bar", "Library", "Search"],
    keywords: ["search", "track", "library", "find", "song", "keyword"],
    category: "library",
  },
  {
    id: "library-filters",
    title: "Use Library filters",
    problem: "Need to narrow the Library down to a smaller track group.",
    answer: "Open Library and use filters or search terms to narrow the track list.",
    route: ["Title Bar", "Library", "Filters"],
    keywords: ["filter", "filters", "library", "narrow", "tracks", "list"],
    category: "library",
  },
  {
    id: "library-tags",
    title: "Find tracks by tag",
    problem: "Need to find tracks connected to a tag or sound idea.",
    answer: "Open Library and search for the tag, or click a visible tag chip when available.",
    route: ["Title Bar", "Library", "Tags"],
    keywords: ["tag", "tags", "chip", "library", "sound", "mood", "genre"],
    category: "library",
  },
  {
    id: "library-track-details",
    title: "View track details",
    problem: "Need more information about a track.",
    answer: "Open Library and use the track row or details area to inspect track information.",
    route: ["Title Bar", "Library", "Track", "Details"],
    keywords: ["details", "track details", "information", "library", "track"],
    category: "library",
  },
  {
    id: "library-audio-source",
    title: "Check where a track came from",
    problem: "Need to know whether a track is uploaded, seeded, stored, or project-linked.",
    answer: "Open Library and inspect the track source or source label when available.",
    route: ["Title Bar", "Library", "Track", "Audio Source"],
    keywords: ["audio source", "source", "supabase", "upload", "seed", "project"],
    category: "library",
  },
  {
    id: "library-play-track",
    title: "Play a track from Library",
    problem: "Need to start listening from the Library page.",
    answer: "Open Library, find the track, then use the track play control.",
    route: ["Title Bar", "Library", "Track", "Play"],
    keywords: ["play", "listen", "library", "track", "audio"],
    category: "library",
  },
  {
    id: "library-no-results",
    title: "Library search has no results",
    problem: "Typed a search but nothing appears.",
    answer: "Clear the search, try a shorter word, or search by title, tag, source, or mood.",
    route: ["Title Bar", "Library", "Search", "Clear Search"],
    keywords: ["no results", "empty", "search", "clear", "library"],
    category: "library",
  },
  {
    id: "project-open",
    title: "Open a project",
    problem: "Need to locate an existing project.",
    answer: "Go to Projects and select the project card.",
    route: ["Title Bar", "Projects", "Open Project"],
    keywords: ["project", "open", "workspace", "card"],
    category: "projects",
  },
  {
    id: "project-overview",
    title: "Find the project overview",
    problem: "Need the main summary for a project.",
    answer: "Open a project and use the Overview area.",
    route: ["Title Bar", "Projects", "Open Project", "Overview"],
    keywords: ["project", "overview", "summary", "dashboard"],
    category: "projects",
  },
  {
    id: "project-tracks",
    title: "Find tracks inside a project",
    problem: "Need to see which songs belong to a project.",
    answer: "Open the project and look for its tracks area.",
    route: ["Title Bar", "Projects", "Open Project", "Tracks"],
    keywords: ["project tracks", "songs", "tracks", "project", "list"],
    category: "projects",
  },
  {
    id: "project-top-tracks",
    title: "Find Top Tracks",
    problem: "Need project ranking information.",
    answer: "Open project overview and view Top Tracks.",
    route: ["Projects", "Open Project", "Overview", "Top Tracks"],
    keywords: ["top", "tracks", "ranking", "favorite", "best"],
    category: "projects",
  },
  {
    id: "project-setlist",
    title: "Reorder songs in a setlist",
    problem: "Need to change song order.",
    answer: "Open the project and use Setlist controls.",
    route: ["Projects", "Open Project", "Setlist", "Move Up", "Move Down"],
    keywords: ["setlist", "reorder", "move", "song", "up", "down"],
    category: "projects",
  },
  {
    id: "project-player",
    title: "Use the project player",
    problem: "Need to play tracks from inside a project.",
    answer: "Open a project and use the project player or now-playing controls.",
    route: ["Title Bar", "Projects", "Open Project", "Project Player"],
    keywords: ["project player", "play", "project", "song", "listen"],
    category: "projects",
  },
  {
    id: "project-now-playing",
    title: "Find the current project song",
    problem: "Need to know what is playing in the project area.",
    answer: "Open the project and check the Now Playing or project player panel.",
    route: ["Title Bar", "Projects", "Open Project", "Now Playing"],
    keywords: ["now playing", "current song", "project", "player"],
    category: "projects",
  },
  {
    id: "project-metadata",
    title: "Find project metadata",
    problem: "Need project information, notes, or future metadata connections.",
    answer: "Open a project and inspect the metadata workspace when available.",
    route: ["Title Bar", "Projects", "Open Project", "Metadata"],
    keywords: ["project metadata", "metadata", "notes", "project", "details"],
    category: "projects",
  },
  {
    id: "track-matcher-compare",
    title: "Compare two songs",
    problem: "Need to compare tracks.",
    answer: "Load Track A and Track B in Track Matcher.",
    route: ["Title Bar", "Track Matcher", "Load Track A", "Load Track B", "Compare"],
    keywords: ["compare", "track matcher", "track a", "track b", "songs"],
    category: "track-matcher",
  },
  {
    id: "track-matcher-load-a",
    title: "Load Track A",
    problem: "Need to choose the first track for comparison.",
    answer: "Open Track Matcher and use the Track A loading control.",
    route: ["Title Bar", "Track Matcher", "Load Track A"],
    keywords: ["track a", "load a", "first track", "compare", "matcher"],
    category: "track-matcher",
  },
  {
    id: "track-matcher-load-b",
    title: "Load Track B",
    problem: "Need to choose the second track for comparison.",
    answer: "Open Track Matcher and use the Track B loading control.",
    route: ["Title Bar", "Track Matcher", "Load Track B"],
    keywords: ["track b", "load b", "second track", "compare", "matcher"],
    category: "track-matcher",
  },
  {
    id: "track-matcher-analysis",
    title: "Analyze a mix",
    problem: "Need analysis tools.",
    answer: "Open Track Matcher, load source tracks, then review the analysis panels.",
    route: ["Track Matcher", "Load Tracks", "Analyze"],
    keywords: ["analysis", "mix", "matcher", "analyze", "tools"],
    category: "track-matcher",
  },
  {
    id: "track-matcher-lane-registry",
    title: "Find the lane registry",
    problem: "Need to understand the Track Matcher lane system.",
    answer: "Open Track Matcher and review the lane registry panel.",
    route: ["Title Bar", "Track Matcher", "Lane Registry"],
    keywords: ["lane registry", "lanes", "registry", "track matcher", "architecture"],
    category: "track-matcher",
  },
  {
    id: "track-matcher-lane-relationships",
    title: "Find lane relationships",
    problem: "Need to see how Track Matcher lanes connect.",
    answer: "Open Track Matcher and review the lane relationships area.",
    route: ["Title Bar", "Track Matcher", "Lane Relationships"],
    keywords: ["lane relationships", "relationships", "lanes", "track matcher"],
    category: "track-matcher",
  },
  {
    id: "track-matcher-intelligence-panels",
    title: "Find intelligence panels",
    problem: "Need analysis summaries or deeper comparison information.",
    answer: "Open Track Matcher and inspect the intelligence panels.",
    route: ["Title Bar", "Track Matcher", "Intelligence Panels"],
    keywords: ["intelligence", "panels", "analysis", "summary", "track matcher"],
    category: "track-matcher",
  },
  {
    id: "track-matcher-key-bpm",
    title: "Find key and BPM information",
    problem: "Need musical comparison details such as key or tempo.",
    answer: "Open Track Matcher and review analysis panels for key and BPM information when available.",
    route: ["Title Bar", "Track Matcher", "Analyze", "Key And BPM"],
    keywords: ["key", "bpm", "tempo", "pitch", "analysis", "track matcher"],
    category: "track-matcher",
  },
  {
    id: "track-matcher-future-stems",
    title: "Find future stem matching tools",
    problem: "Need vocal, drum, bass, or instrument matching tools.",
    answer: "Use Track Matcher as the future home for stem-aware comparison and analysis workflows.",
    route: ["Title Bar", "Track Matcher", "Future Stem Tools"],
    keywords: ["stem", "stems", "vocal", "drums", "bass", "future", "matcher"],
    category: "track-matcher",
  },
  {
    id: "metadata-library",
    title: "Open the metadata library",
    problem: "Need the main metadata knowledge area.",
    answer: "Open Metadata from the title bar and enter the metadata library.",
    route: ["Title Bar", "Metadata", "Library"],
    keywords: ["metadata", "library", "knowledge", "records"],
    category: "metadata",
  },
  {
    id: "metadata-shelves",
    title: "Find metadata shelves",
    problem: "Need the top-level metadata grouping.",
    answer: "Open Metadata Library and browse shelves.",
    route: ["Title Bar", "Metadata", "Library", "Shelves"],
    keywords: ["shelf", "shelves", "metadata", "library", "group"],
    category: "metadata",
  },
  {
    id: "metadata-sections",
    title: "Find metadata sections",
    problem: "Need a smaller group inside a metadata shelf.",
    answer: "Open a metadata shelf and browse its sections.",
    route: ["Title Bar", "Metadata", "Library", "Shelf", "Sections"],
    keywords: ["section", "sections", "metadata", "shelf"],
    category: "metadata",
  },
  {
    id: "metadata-record",
    title: "Find a metadata record",
    problem: "Need detailed reference information.",
    answer: "Open Metadata and browse records.",
    route: ["Title Bar", "Metadata", "Library", "Record"],
    keywords: ["metadata", "record", "information", "details"],
    category: "metadata",
  },
  {
    id: "metadata-record-details",
    title: "Open record details",
    problem: "Need the detail page or explanation for a metadata record.",
    answer: "Open a metadata record and review its detail content.",
    route: ["Title Bar", "Metadata", "Library", "Record", "Details"],
    keywords: ["record details", "metadata details", "more information", "explanation"],
    category: "metadata",
  },
  {
    id: "metadata-relationship",
    title: "Find metadata relationships",
    problem: "Need linked information.",
    answer: "Open a metadata record and view relationships.",
    route: ["Metadata", "Record", "Relationships"],
    keywords: ["relationship", "link", "metadata", "related", "connections"],
    category: "metadata",
  },
  {
    id: "metadata-more-information",
    title: "Find More Information for metadata",
    problem: "Need extra explanation beyond a card summary.",
    answer: "Open Metadata, choose a record, then use the More Information path when available.",
    route: ["Title Bar", "Metadata", "Record", "More Information"],
    keywords: ["more information", "details", "metadata", "record", "explain"],
    category: "metadata",
  },
  {
    id: "metadata-c-major-record",
    title: "Find the C Major metadata record",
    problem: "Need the C Major reference page.",
    answer: "Open Metadata Library and navigate to the C Major record when available.",
    route: ["Title Bar", "Metadata", "Library", "Records", "C Major"],
    keywords: ["c major", "metadata", "record", "music theory", "key"],
    category: "metadata",
  },
  {
    id: "player-now-playing",
    title: "Find Now Playing",
    problem: "Need to know what track is currently selected or playing.",
    answer: "Check the player area for the Now Playing label and current track information.",
    route: ["Player", "Now Playing"],
    keywords: ["now playing", "current track", "player", "playing"],
    category: "player",
  },
  {
    id: "player-playback-controls",
    title: "Find playback controls",
    problem: "Need play, pause, or listening controls.",
    answer: "Use the player controls near the active track or global player area.",
    route: ["Player", "Playback Controls"],
    keywords: ["play", "pause", "controls", "player", "audio"],
    category: "player",
  },
  {
    id: "player-track-information",
    title: "Find track information in the player",
    problem: "Need the title, source, or details for the currently playing track.",
    answer: "Check the player and track detail areas for current track information.",
    route: ["Player", "Track Information"],
    keywords: ["track information", "player", "title", "source", "details"],
    category: "player",
  },
  {
    id: "player-switch-track",
    title: "Switch the playing track",
    problem: "Need to change which song is playing.",
    answer: "Use Library, Projects, or Track Matcher to select another track for the player.",
    route: ["Library Or Projects", "Choose Track", "Player Updates"],
    keywords: ["switch", "change track", "player", "song", "audio"],
    category: "player",
  },
  {
    id: "search-library",
    title: "Use Library search",
    problem: "Need to find music in the Library.",
    answer: "Open Library and type title, tag, source, mood, or keyword into search.",
    route: ["Title Bar", "Library", "Search"],
    keywords: ["library search", "search", "find track", "tag"],
    category: "search",
  },
  {
    id: "search-metadata",
    title: "Use Metadata search",
    problem: "Need to find a metadata record or concept.",
    answer: "Open Metadata and use the metadata search or browse paths when available.",
    route: ["Title Bar", "Metadata", "Search"],
    keywords: ["metadata search", "record search", "concept", "find"],
    category: "search",
  },
  {
    id: "search-project",
    title: "Search for project information",
    problem: "Need to find project tracks, setlists, or overview details.",
    answer: "Open Projects, choose a project, then use the project areas to find tracks or setlist details.",
    route: ["Title Bar", "Projects", "Open Project", "Project Areas"],
    keywords: ["project search", "find project", "tracks", "setlist", "overview"],
    category: "search",
  },
  {
    id: "search-help",
    title: "Search Help content",
    problem: "Need instructions but do not know which help section to open.",
    answer: "Open Help and use Find It or Quick Answers to locate the right guidance.",
    route: ["Title Bar", "Help", "Find It"],
    keywords: ["help search", "find it", "instructions", "answers", "guide"],
    category: "search",
  },
  {
    id: "search-future-global",
    title: "Find future global search",
    problem: "Need one search box for the whole app.",
    answer: "Future global search is planned as an app-wide path for tracks, projects, metadata, and help.",
    route: ["Future", "Global Search"],
    keywords: ["global search", "future", "all app", "search everything"],
    category: "search",
  },
  {
    id: "help-find-it",
    title: "Use Find It",
    problem: "Need to find where something lives in the app.",
    answer: "Open Help and use Find It to search navigation questions.",
    route: ["Title Bar", "Help", "Find It"],
    keywords: ["find it", "where is", "navigation", "help"],
    category: "help",
  },
  {
    id: "help-route-maps",
    title: "Find Route Maps",
    problem: "Need a step-by-step path through the app.",
    answer: "Open Help and go to Route Maps when available.",
    route: ["Title Bar", "Help", "Route Maps"],
    keywords: ["route map", "routes", "navigation", "steps", "path"],
    category: "help",
  },
  {
    id: "help-quick-answers",
    title: "Find Quick Answers",
    problem: "Need a fast answer to a common question.",
    answer: "Open Help and use Quick Answers.",
    route: ["Title Bar", "Help", "Quick Answers"],
    keywords: ["quick answers", "faq", "answer", "help"],
    category: "help",
  },
  {
    id: "help-glossary",
    title: "Find the Glossary",
    problem: "Need a plain-language definition.",
    answer: "Open Help and use the Glossary section.",
    route: ["Title Bar", "Help", "Glossary"],
    keywords: ["glossary", "definition", "meaning", "terms", "help"],
    category: "help",
  },
  {
    id: "help-whats-new",
    title: "Find What's New",
    problem: "Need to see recent or planned Help updates.",
    answer: "Open Help and review the What's New area.",
    route: ["Title Bar", "Help", "What's New"],
    keywords: ["what's new", "updates", "new", "help", "changes"],
    category: "help",
  },
  {
    id: "help-how-do-i",
    title: "Find How Do I workflows",
    problem: "Need a step-by-step workflow instead of a short answer.",
    answer: "Open Help and use the How Do I section.",
    route: ["Title Bar", "Help", "How Do I"],
    keywords: ["how do i", "workflow", "steps", "help", "guide"],
    category: "help",
  },
  {
    id: "relationship-metadata-records",
    title: "Find metadata relationships",
    problem: "Need to see how metadata records connect.",
    answer: "Open a metadata record and review its relationships.",
    route: ["Title Bar", "Metadata", "Record", "Relationships"],
    keywords: ["metadata relationships", "records", "related", "connections"],
    category: "relationships",
  },
  {
    id: "relationship-projects-future",
    title: "Find future project relationships",
    problem: "Need to connect projects to tracks, notes, metadata, or other projects.",
    answer: "Future project relationships will connect project content to the wider Muzes Garden system.",
    route: ["Projects", "Future Relationships"],
    keywords: ["project relationships", "future", "connections", "linked projects"],
    category: "relationships",
  },
  {
    id: "relationship-tracks-future",
    title: "Find future track relationships",
    problem: "Need to connect related tracks, versions, references, or similarities.",
    answer: "Future track relationships will help connect songs, versions, metadata, and Track Matcher results.",
    route: ["Library", "Future Track Relationships"],
    keywords: ["track relationships", "future", "versions", "similar", "related tracks"],
    category: "relationships",
  },
  {
    id: "relationship-track-matcher-lanes",
    title: "Find Track Matcher relationship lanes",
    problem: "Need to see how comparison lanes relate to each other.",
    answer: "Open Track Matcher and inspect lane relationship panels.",
    route: ["Title Bar", "Track Matcher", "Lane Relationships"],
    keywords: ["lane relationships", "track matcher", "relationships", "lanes"],
    category: "relationships",
  },
  {
    id: "workspace-projects",
    title: "Find all projects",
    problem: "Need project overview.",
    answer: "Open the Projects workspace.",
    route: ["Title Bar", "Projects"],
    keywords: ["projects", "workspace", "all projects"],
    category: "workspace",
  },
  {
    id: "workspace-projects-area",
    title: "Find the Projects workspace area",
    problem: "Need the workspace area where projects are organized.",
    answer: "Open Projects from the title bar.",
    route: ["Title Bar", "Projects", "Workspace"],
    keywords: ["projects workspace", "workspace", "organize", "projects"],
    category: "workspace",
  },
  {
    id: "workspace-future-areas",
    title: "Find future workspace areas",
    problem: "Need areas beyond the current project workspace.",
    answer: "Future workspace areas are planned for broader organization and workflow expansion.",
    route: ["Workspace", "Future Areas"],
    keywords: ["future workspace", "workspace areas", "planning", "organization"],
    category: "workspace",
  },
  {
    id: "workspace-track-matcher-area",
    title: "Find Track Matcher from the workspace idea",
    problem: "Need audio comparison work instead of project organization.",
    answer: "Use Track Matcher from the title bar for comparison and analysis workflows.",
    route: ["Title Bar", "Track Matcher"],
    keywords: ["workspace", "track matcher", "analysis", "comparison"],
    category: "workspace",
  },
  {
    id: "general-title-bar",
    title: "Use the title bar",
    problem: "Need to move between major pages.",
    answer: "Use the title bar to open Player, Library, Projects, Metadata, Track Matcher, Upload, or Help.",
    route: ["Title Bar"],
    keywords: ["title bar", "navigation", "pages", "main menu"],
    category: "general",
  },
  {
    id: "general-home-player",
    title: "Find the main player page",
    problem: "Need to return to the main player area.",
    answer: "Use Player in the title bar when available, or the main app route if Player is the home page.",
    route: ["Title Bar", "Player"],
    keywords: ["player", "home", "main page", "title bar"],
    category: "general",
  },
  {
    id: "general-upload",
    title: "Find Upload",
    problem: "Need to add music files.",
    answer: "Use Upload from the title bar when available.",
    route: ["Title Bar", "Upload"],
    keywords: ["upload", "add music", "files", "songs", "tracks"],
    category: "general",
  },
  {
    id: "general-route-map",
    title: "Where is Route Map",
    problem: "Need navigation guidance.",
    answer: "Open Help and select Route Maps.",
    route: ["Title Bar", "Help", "Route Maps"],
    keywords: ["route", "map", "navigation", "help"],
    category: "general",
  },
  {
    id: "general-lost",
    title: "I am lost in the app",
    problem: "Need a simple place to restart.",
    answer: "Open Help, then use Find It or Quick Answers to choose the next route.",
    route: ["Title Bar", "Help", "Find It"],
    keywords: ["lost", "confused", "where", "help", "navigation"],
    category: "general",
  },
  {
    id: "general-future-more-info",
    title: "Find More Information buttons",
    problem: "Need deeper explanation from a page or card.",
    answer: "Future More Information buttons will open deeper help and explanation for each page.",
    route: ["Page", "More Information"],
    keywords: ["more information", "details", "explain", "future", "help"],
    category: "general",
  },
];

export function getFindItEntries() {
  return FIND_IT_ENTRIES;
}

export function getFindItCategories() {
  return FIND_IT_CATEGORIES;
}

export function getFindItEntryById(id: string) {
  return FIND_IT_ENTRIES.find((entry) => entry.id === id);
}

export function searchFindItEntries(query: string) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return FIND_IT_ENTRIES;
  }

  return FIND_IT_ENTRIES.filter((entry) => {
    const routeText = entry.route.join(" ").toLowerCase();

    return (
      entry.title.toLowerCase().includes(normalized) ||
      entry.problem.toLowerCase().includes(normalized) ||
      entry.answer.toLowerCase().includes(normalized) ||
      routeText.includes(normalized) ||
      entry.category.toLowerCase().includes(normalized) ||
      entry.keywords.some((keyword) =>
        keyword.toLowerCase().includes(normalized),
      )
    );
  });
}
