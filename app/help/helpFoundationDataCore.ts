import type { HelpGlossaryItem, HelpJumpLink, HelpQuickAnswer } from "./helpFoundationTypes";

export const helpJumpLinks: HelpJumpLink[] = [
  { label: "How Do I?", href: "#how-do-i", detail: "Step-by-step workflows" },
  { label: "Quick Answers", href: "#quick-answers", detail: "Fast answers for common confusion" },
  { label: "Find It", href: "#find-it", detail: "Navigation encyclopedia for locating pages, tools, and workflows" },
  { label: "What Is This?", href: "#what-is-this", detail: "Plain-language explanations" },
  { label: "Routes", href: "#routes", detail: "How to get from here to there" },
  { label: "Library", href: "#library-help", detail: "Finding, searching, playing, and organizing tracks" },
  { label: "Projects", href: "#projects-help", detail: "Project overview, tracks, setlists, playback, and metadata" },
  { label: "Player", href: "#player-help", detail: "Now playing, playback controls, and track information" },
  { label: "Search", href: "#search-help", detail: "Library search, Help search, Metadata search, and future global search" },
  { label: "Track Matcher", href: "#track-matcher", detail: "Foundation help for Track Matcher" },
  { label: "Metadata", href: "#metadata-help", detail: "Foundation help for Metadata" },
  { label: "Relationships", href: "#relationships-help", detail: "How records, tracks, projects, and lanes connect" },
  { label: "Setlists", href: "#setlists", detail: "Foundation help for project setlists" },
  { label: "Workspace", href: "#workspace-help", detail: "Projects workspace and future workspace areas" },
  { label: "Tips", href: "#tips", detail: "Small reminders" },
  { label: "Glossary", href: "#glossary", detail: "Plain-language terms and meanings" },
  { label: "What's New?", href: "#whats-new", detail: "Recent additions" },
];

export const quickAnswers: HelpQuickAnswer[] = [
  {
    question: "Why is an uploaded song not in my project yet?",
    answer: "Upload puts the song into the Library first. After that, select it in Library, choose the project, and use Send To.",
    route: ["Upload", "Library", "Select Track", "Choose Project", "Send To"],
  },
  {
    question: "Where do I go when I want to hear the project?",
    answer: "Open Projects, choose the project, then use the project player or track row play controls.",
    route: ["Projects", "Open Project", "Overview", "Play"],
  },
  {
    question: "Where should Find It live?",
    answer: "Find It belongs under Help because it answers how to locate a page, tool, or workflow.",
    route: ["Help", "Find It"],
  },
  {
    question: "Should Help explain unverified features?",
    answer: "Help can name planned areas, but step-by-step instructions should stay based on verified workflows.",
  },
  {
    question: "What should I click when I feel lost?",
    answer: "Open Help, then use Find It. Search for the thing you want, read the route, and follow the route chips one step at a time.",
    route: ["TitleBar", "Help", "Find It", "Search", "Read Route"],
  },
  {
    question: "What is the difference between Find It and Route Maps?",
    answer: "Find It tells you where something lives. Route Maps give the literal click path to get there.",
    route: ["Help", "Find It", "Route Maps"],
  },
  {
    question: "What is the difference between How Do I and Quick Answers?",
    answer: "How Do I is for full workflows. Quick Answers are short answers for common confusion.",
    route: ["Help", "How Do I", "Quick Answers"],
  },
  {
    question: "Where do uploaded tracks live first?",
    answer: "Uploaded tracks should live in the Library first. Projects use Library tracks after they are selected and sent into a project.",
    route: ["Upload", "Library"],
  },
  {
    question: "Why does Library search show nothing?",
    answer: "A search term or filter may be too narrow. Clear the search box first, then try a shorter word, tag, source, or mood.",
    route: ["Library", "Search", "Clear Search"],
  },
  {
    question: "Where do I compare two songs?",
    answer: "Use Track Matcher. Load Track A, load Track B, then compare or analyze.",
    route: ["TitleBar", "Track Matcher", "Load Track A", "Load Track B"],
  },
  {
    question: "What are Track A and Track B?",
    answer: "Track A is the first comparison track. Track B is the second comparison track.",
    route: ["Track Matcher", "Load Track A", "Load Track B"],
  },
  {
    question: "Where do I find key and BPM information?",
    answer: "Use Track Matcher analysis areas after loading tracks. Key and BPM content belongs with comparison and analysis panels.",
    route: ["Track Matcher", "Analyze", "Key And BPM"],
  },
  {
    question: "What is the Lane Registry?",
    answer: "The Lane Registry explains the Track Matcher lanes and keeps the comparison architecture easier to understand as it grows.",
    route: ["Track Matcher", "Lane Registry"],
  },
  {
    question: "What are Lane Relationships?",
    answer: "Lane Relationships explain how Track Matcher lanes connect, support each other, and prepare for deeper intelligence.",
    route: ["Track Matcher", "Lane Relationships"],
  },
  {
    question: "What is Metadata for?",
    answer: "Metadata explains meaning, relationships, details, and knowledge. It is deeper than a quick tag.",
    route: ["TitleBar", "Metadata", "Library"],
  },
  {
    question: "What is the difference between tags and Metadata?",
    answer: "Tags are quick labels for filtering. Metadata is a deeper knowledge system with records, relationships, and explanations.",
    route: ["Library", "Tags", "Metadata"],
  },
  {
    question: "Where do I find Metadata records?",
    answer: "Open Metadata, enter the Library, choose a shelf or section, then open a record.",
    route: ["TitleBar", "Metadata", "Library", "Record"],
  },
  {
    question: "What are Metadata relationships?",
    answer: "Metadata relationships show how records connect to other records, concepts, tracks, projects, or future knowledge objects.",
    route: ["Metadata", "Record", "Relationships"],
  },
  {
    question: "What is a project?",
    answer: "A project is an organized working collection made from Library tracks, with playback, setlist order, notes, metadata, and future relationships.",
    route: ["TitleBar", "Projects"],
  },
  {
    question: "Where do I reorder project songs?",
    answer: "Open the project, then use the Setlist area. Move Up means earlier; Move Down means later.",
    route: ["Projects", "Open Project", "Setlist"],
  },
  {
    question: "Where do I find Top Tracks?",
    answer: "Open a project, go to Overview, then look for Top Tracks.",
    route: ["Projects", "Open Project", "Overview", "Top Tracks"],
  },
  {
    question: "What is the Player?",
    answer: "The Player is the listening area that shows the current track, now-playing information, and playback controls.",
    route: ["TitleBar", "Player"],
  },
  {
    question: "How do I switch the playing track?",
    answer: "Choose a different track from Library or Projects, press play, then confirm the Player updates.",
    route: ["Library Or Projects", "Choose Track", "Play", "Player"],
  },
  {
    question: "Where is Upload?",
    answer: "Use Upload from the title bar when it is available. Upload adds computer audio files into the Library first.",
    route: ["TitleBar", "Upload"],
  },
  {
    question: "What is Workspace?",
    answer: "Workspace means the organized working areas of the app. Projects are the current main workspace, with future workspace areas planned.",
    route: ["TitleBar", "Projects"],
  },
  {
    question: "What are future relationships?",
    answer: "Future relationships will connect tracks, versions, metadata records, project notes, Track Matcher results, and related ideas.",
    route: ["Metadata", "Relationships"],
  },
  {
    question: "Should Help replace the app navigation?",
    answer: "No. Navigation shows where pages are. Help explains what those pages mean and how to move through them.",
    route: ["TitleBar", "Help"],
  },
  {
    question: "What should I use for exact click instructions?",
    answer: "Use Route Maps. They are meant to show the literal path from one app area to another.",
    route: ["Help", "Route Maps"],
  },
  {
    question: "What should I use for definitions?",
    answer: "Use the Glossary or What Is This sections. They explain app words in plain language.",
    route: ["Help", "Glossary"],
  },
  {
    question: "What should I check first when something looks missing?",
    answer: "Clear search and filters before assuming data is gone. A hidden search term is often the reason.",
    route: ["Library", "Clear Search"],
  },
];

export const glossaryItems: HelpGlossaryItem[] = [
  {
    term: "Help",
    meaning: "The member guide for how to use the app, what things mean, and how to get from one place to another.",
    useWhen: "Use Help when the question starts with how, what, where, or why.",
  },
  {
    term: "Navigation",
    meaning: "The title bar and dropdowns that show where a member can go inside the app.",
    useWhen: "Use Navigation when the question is about moving to a page.",
  },
  {
    term: "Route",
    meaning: "A route is a visible click path through the app, written step by step.",
    useWhen: "Use Routes when a member needs a literal path from one area to another.",
  },
  {
    term: "Verified Workflow",
    meaning: "A workflow that has been tested in the real app and should be safe to document.",
    useWhen: "Use verified workflow labels when Help content is based on real testing.",
  },
  {
    term: "Foundation",
    meaning: "A foundation item is built enough to explain, but may still need more testing, wiring, or final UI polish.",
    useWhen: "Use foundation when the direction is real but the feature is not fully finished.",
  },
  {
    term: "Planned",
    meaning: "A planned item is a future feature or future route that should not be treated as finished.",
    useWhen: "Use planned when Help needs to name the future idea without pretending it is done.",
  },
  {
    term: "Find It",
    meaning: "The navigation encyclopedia that answers where something lives inside The Muzes Garden.",
    useWhen: "Use Find It when the user knows the goal but not the app location.",
  },
  {
    term: "Route Maps",
    meaning: "Step-by-step click paths that show how to move from one app area to another.",
    useWhen: "Use Route Maps when exact click order matters.",
  },
  {
    term: "How Do I",
    meaning: "Workflow help that explains how to complete a task, not just where a page is.",
    useWhen: "Use How Do I for actions like upload, compare, search, organize, play, or recover.",
  },
  {
    term: "Quick Answers",
    meaning: "Short answers for common confusion.",
    useWhen: "Use Quick Answers when the user needs a fast explanation, not a long workflow.",
  },
  {
    term: "What Is This",
    meaning: "Plain-language explanations of app areas, features, and labels.",
    useWhen: "Use What Is This when a user asks what a word or page means.",
  },
  {
    term: "Glossary",
    meaning: "A list of plain-language definitions for app terms.",
    useWhen: "Use the Glossary when a single term needs meaning.",
  },
  {
    term: "Library",
    meaning: "The main place where uploaded and available tracks live before or outside project organization.",
    useWhen: "Use Library to find, search, filter, tag, inspect, or play tracks.",
  },
  {
    term: "Upload",
    meaning: "The path that brings audio files from the computer into The Muzes Garden.",
    useWhen: "Use Upload when songs are still on the computer and not in the app yet.",
  },
  {
    term: "Uploaded Tracks",
    meaning: "Tracks that were brought into the app from computer files.",
    useWhen: "Use Uploaded Tracks when a song was uploaded but needs to be found in the Library.",
  },
  {
    term: "Project",
    meaning: "An organized working collection made from Library tracks, with playback, setlist order, notes, metadata, and future relationships.",
    useWhen: "Use Projects when tracks need to become an organized collection.",
  },
  {
    term: "Workspace",
    meaning: "The organized working areas of the app. Projects are the current main workspace.",
    useWhen: "Use Workspace when talking about broader app organization areas.",
  },
  {
    term: "Setlist",
    meaning: "The ordered track list inside a project.",
    useWhen: "Use Setlist when project song order matters.",
  },
  {
    term: "Top Tracks",
    meaning: "A project area for highlighted, ranked, or important tracks.",
    useWhen: "Use Top Tracks when looking for standout songs inside a project.",
  },
  {
    term: "Project Player",
    meaning: "The playback area connected to music inside a project.",
    useWhen: "Use Project Player when the user wants to listen from inside a project.",
  },
  {
    term: "Player",
    meaning: "The listening area that shows now-playing information and playback controls.",
    useWhen: "Use Player when the question is about what is playing or how to control playback.",
  },
  {
    term: "Now Playing",
    meaning: "The current track or audio item selected in the player.",
    useWhen: "Use Now Playing when a user needs to confirm the active track.",
  },
  {
    term: "Playback Controls",
    meaning: "Controls such as play and pause that affect listening.",
    useWhen: "Use Playback Controls when the user wants to start, stop, or change listening.",
  },
  {
    term: "Track Details",
    meaning: "Extra information about one track, such as title, source, tags, or future metadata links.",
    useWhen: "Use Track Details when one track needs closer inspection.",
  },
  {
    term: "Audio Source",
    meaning: "The origin of a track, such as upload, seed data, storage, project link, or future source type.",
    useWhen: "Use Audio Source when a user needs to know where a track came from.",
  },
  {
    term: "Search",
    meaning: "A way to narrow tracks, records, help cards, or future global results using words.",
    useWhen: "Use Search when a list is too large or the user knows a keyword.",
  },
  {
    term: "Filter",
    meaning: "A narrower view of content based on selected conditions or search text.",
    useWhen: "Use Filter when only certain tracks or cards should be visible.",
  },
  {
    term: "Tag",
    meaning: "A quick label used for finding and grouping tracks.",
    useWhen: "Use Tags for fast Library filtering, not deep explanation.",
  },
  {
    term: "Metadata",
    meaning: "The deeper knowledge system for libraries, shelves, sections, records, relationships, and explanations.",
    useWhen: "Use Metadata when the question is about meaning, context, or relationships.",
  },
  {
    term: "Metadata Library",
    meaning: "The main knowledge area where metadata shelves, sections, and records can be browsed.",
    useWhen: "Use Metadata Library when browsing music knowledge.",
  },
  {
    term: "Shelf",
    meaning: "A top-level group inside Metadata.",
    useWhen: "Use Shelves to keep large metadata knowledge areas separated.",
  },
  {
    term: "Section",
    meaning: "A smaller group inside a Metadata shelf.",
    useWhen: "Use Sections when a shelf needs smaller organization.",
  },
  {
    term: "Record",
    meaning: "An individual metadata knowledge page.",
    useWhen: "Use Records for one concept, key, relationship, sound idea, or future music object.",
  },
  {
    term: "Record Details",
    meaning: "The deeper view for one metadata record.",
    useWhen: "Use Record Details when the short card is not enough.",
  },
  {
    term: "Relationship",
    meaning: "A link between records, tracks, projects, notes, lanes, or future intelligence results.",
    useWhen: "Use Relationships when explaining how things connect.",
  },
  {
    term: "More Information",
    meaning: "A deeper explanation path for a card, record, page, or feature.",
    useWhen: "Use More Information when the user needs context beyond a small summary.",
  },
  {
    term: "Track Matcher",
    meaning: "The audio intelligence workspace for comparing, preparing, and eventually matching musical material.",
    useWhen: "Use Track Matcher when the task is comparison, matching, analysis, or preparation.",
  },
  {
    term: "Track A",
    meaning: "The first track loaded for Track Matcher comparison.",
    useWhen: "Use Track A for the source, reference, or first comparison song.",
  },
  {
    term: "Track B",
    meaning: "The second track loaded for Track Matcher comparison.",
    useWhen: "Use Track B for the candidate, match, or second comparison song.",
  },
  {
    term: "Lane Registry",
    meaning: "The Track Matcher area that explains which comparison lanes exist and what they do.",
    useWhen: "Use Lane Registry when the user needs the lane architecture overview.",
  },
  {
    term: "Lane Relationships",
    meaning: "The Track Matcher area that explains how lanes connect and support each other.",
    useWhen: "Use Lane Relationships when explaining how comparison systems fit together.",
  },
  {
    term: "Intelligence Panels",
    meaning: "Panels for analysis summaries, diagnostics, comparison clues, and future AI-assisted results.",
    useWhen: "Use Intelligence Panels when the user wants deeper analysis information.",
  },
  {
    term: "Key And BPM",
    meaning: "Musical comparison information about pitch key and tempo.",
    useWhen: "Use Key And BPM when matching, comparison, or transition planning needs musical compatibility details.",
  },
  {
    term: "Future Global Search",
    meaning: "A planned app-wide search path for tracks, projects, metadata, and help.",
    useWhen: "Use Future Global Search only as a planned concept until it is built.",
  },
];

export const featuredHelpTopics = [
  "Find It",
  "Route Maps",
  "How Do I",
  "Library",
  "Projects",
  "Track Matcher",
  "Metadata",
  "Player",
];

export const helpCoreSectionSummaries = [
  {
    title: "Find It",
    body: "Use Find It when the user knows what they need but not where it lives.",
    href: "#find-it",
  },
  {
    title: "Route Maps",
    body: "Use Route Maps when the user needs a literal click path.",
    href: "#routes",
  },
  {
    title: "How Do I",
    body: "Use How Do I when the user needs a complete workflow.",
    href: "#how-do-i",
  },
  {
    title: "What Is This",
    body: "Use What Is This when a page, card, or term needs plain-language explanation.",
    href: "#what-is-this",
  },
];

export function getHelpJumpLinks() {
  return helpJumpLinks;
}

export function getQuickAnswers() {
  return quickAnswers;
}

export function getGlossaryItems() {
  return glossaryItems;
}

export function getFeaturedHelpTopics() {
  return featuredHelpTopics;
}

export function getHelpCoreSectionSummaries() {
  return helpCoreSectionSummaries;
}

export function searchQuickAnswers(query: string) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return quickAnswers;
  }

  return quickAnswers.filter((item) => {
    const searchableText = [
      item.question,
      item.answer,
      item.route?.join(" ") ?? "",
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(normalized);
  });
}

export function searchGlossaryItems(query: string) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return glossaryItems;
  }

  return glossaryItems.filter((item) => {
    const searchableText = [item.term, item.meaning, item.useWhen]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(normalized);
  });
}

export function searchHelpCore(query: string) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return {
      quickAnswers,
      glossaryItems,
    };
  }

  return {
    quickAnswers: searchQuickAnswers(normalized),
    glossaryItems: searchGlossaryItems(normalized),
  };
}