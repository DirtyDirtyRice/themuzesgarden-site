import type { HelpCard } from "./helpFoundationTypes";

export const whatIsThisCards: HelpCard[] = [
  {
    title: "Project",
    body: "A project is where uploaded Library tracks become an organized working collection with playback, setlist order, notes, metadata, and future relationships.",
    status: "verified",
  },
  {
    title: "Library",
    body: "The Library is the main place where tracks live after upload. From there, tracks can be searched, filtered, played, and sent into projects.",
    status: "verified",
  },
  {
    title: "Upload",
    body: "Upload brings audio from the computer into the app. The verified folder route sends songs into the Library first.",
    status: "verified",
  },
  {
    title: "Player",
    body: "The Player is the listening area. It shows what is playing, gives playback controls, and helps confirm which track is active.",
    status: "verified",
  },
  {
    title: "Metadata",
    body: "Metadata is not just tags. It is the app knowledge system for libraries, shelves, sections, records, relationships, and explanations.",
    status: "foundation",
  },
  {
    title: "Track Matcher",
    body: "Track Matcher is the audio intelligence workspace for comparing, preparing, and eventually matching musical material.",
    status: "foundation",
  },
  {
    title: "Setlist",
    body: "The setlist is the ordered track list inside a project. It controls project playback order and helps arrange songs.",
    status: "foundation",
  },
  {
    title: "Find It",
    body: "Find It is the navigation encyclopedia. Use it when you know what you need but do not know where that thing lives in the app.",
    status: "verified",
  },
  {
    title: "Route Maps",
    body: "Route Maps are literal click paths. Use them when you need step-by-step navigation instead of a general explanation.",
    status: "verified",
  },
  {
    title: "How Do I",
    body: "How Do I cards explain the action workflow: uploading, finding, comparing, organizing, playing, and recovering when lost.",
    status: "verified",
  },
  {
    title: "Quick Answers",
    body: "Quick Answers are short Help answers for common confusion. They should be fast to scan and not overloaded with technical detail.",
    status: "verified",
  },
  {
    title: "Glossary",
    body: "The Glossary explains app words in plain language so a user does not have to guess what a feature name means.",
    status: "verified",
  },
  {
    title: "Workspace",
    body: "Workspace means the organized working areas of the app. Projects are the current main workspace, with future workspace areas planned.",
    status: "foundation",
  },
  {
    title: "Relationships",
    body: "Relationships are links between records, tracks, projects, notes, lanes, and future intelligence results. They help the app explain how things connect.",
    status: "foundation",
  },
  {
    title: "Search",
    body: "Search is the path for narrowing information. It currently appears in focused areas like Library and Help, with future global search planned.",
    status: "foundation",
  },
];

export const trackMatcherCards: HelpCard[] = [
  {
    title: "What is Track Matcher?",
    body: "Track Matcher is the workspace for deeper audio comparison and future intelligence tools. It should explain what a track is doing and how pieces may relate.",
    route: ["TitleBar", "Track Matcher ▼", "Open Tool"],
    status: "foundation",
  },
  {
    title: "How do I use Track Matcher?",
    body: "Start by opening Track Matcher from the TitleBar. Load Track A and Track B, then use the verified comparison and analysis areas.",
    route: ["TitleBar", "Track Matcher", "Load Track A", "Load Track B", "Compare"],
    status: "verified",
  },
  {
    title: "Why is it separate from Library?",
    body: "Library stores and filters tracks. Track Matcher is for analysis, preparation, and matching workflows that are bigger than simple storage.",
    status: "foundation",
  },
  {
    title: "Track A",
    body: "Track A is the first track in a comparison. It is usually the source, reference, or first song you want to test.",
    route: ["Track Matcher", "Load Track A"],
    status: "verified",
  },
  {
    title: "Track B",
    body: "Track B is the second track in a comparison. It is usually the candidate, match, or second song you want to compare against Track A.",
    route: ["Track Matcher", "Load Track B"],
    status: "verified",
  },
  {
    title: "Lane Registry",
    body: "The Lane Registry explains the available Track Matcher lanes and keeps lane architecture easier to understand as the system grows.",
    route: ["Track Matcher", "Lane Registry"],
    status: "verified",
  },
  {
    title: "Lane Relationships",
    body: "Lane Relationships explain how Track Matcher lanes connect, support each other, and prepare the app for richer future intelligence.",
    route: ["Track Matcher", "Lane Relationships"],
    status: "verified",
  },
  {
    title: "Intelligence Panels",
    body: "Intelligence panels are the places where analysis summaries, comparison clues, diagnostics, and future AI-assisted results can live.",
    route: ["Track Matcher", "Analyze", "Intelligence Panels"],
    status: "foundation",
  },
  {
    title: "Key and BPM",
    body: "Key and BPM information helps compare musical compatibility, tempo, pitch, and future transition or matching options.",
    route: ["Track Matcher", "Analyze", "Key And BPM"],
    status: "foundation",
  },
  {
    title: "Future Stem Tools",
    body: "Future stem tools may compare vocals, drums, bass, instruments, and other separated audio parts once those workflows are built.",
    route: ["Track Matcher", "Future Stem Tools"],
    status: "planned",
  },
];

export const metadataCards: HelpCard[] = [
  {
    title: "What is Metadata?",
    body: "Metadata is not just tags. It is the app knowledge system: libraries, shelves, sections, records, relationships, and explanations.",
    route: ["TitleBar", "Metadata ▼", "Open Metadata"],
    status: "foundation",
  },
  {
    title: "How do I use Metadata?",
    body: "Use Metadata when you need meaning, notes, relationships, or detailed information attached to a musical object.",
    route: ["TitleBar", "Metadata", "Library", "Open Record"],
    status: "foundation",
  },
  {
    title: "Metadata versus tags",
    body: "Tags are quick labels. Metadata is deeper information that explains what something is, how it connects, and why it matters.",
    status: "foundation",
  },
  {
    title: "Metadata Library",
    body: "The Metadata Library is the main knowledge area where shelves, sections, and records can be browsed.",
    route: ["TitleBar", "Metadata", "Library"],
    status: "verified",
  },
  {
    title: "Shelves",
    body: "Shelves are top-level groups inside Metadata. They keep large knowledge areas separated and easier to browse.",
    route: ["Metadata", "Library", "Shelves"],
    status: "verified",
  },
  {
    title: "Sections",
    body: "Sections live inside shelves. They break a shelf into smaller groups so records do not become one giant pile.",
    route: ["Metadata", "Library", "Open Shelf", "Sections"],
    status: "verified",
  },
  {
    title: "Records",
    body: "Records are individual metadata knowledge pages. A record can explain a key, concept, relationship, sound idea, or future music object.",
    route: ["Metadata", "Library", "Open Record"],
    status: "verified",
  },
  {
    title: "Record Details",
    body: "Record Details are the deeper view for one metadata record. Use details when the short summary does not explain enough.",
    route: ["Metadata", "Library", "Open Record", "Details"],
    status: "verified",
  },
  {
    title: "Metadata Relationships",
    body: "Metadata Relationships show how records connect to other records, concepts, tracks, projects, or future knowledge objects.",
    route: ["Metadata", "Record", "Relationships"],
    status: "foundation",
  },
  {
    title: "More Information",
    body: "More Information is the deeper explanation path planned for records, cards, and pages that need more context than a small panel can hold.",
    route: ["Metadata", "Record", "More Information"],
    status: "foundation",
  },
];

export const setlistCards: HelpCard[] = [
  {
    title: "What is a setlist?",
    body: "A setlist is the ordered list of tracks inside a project. It helps decide what plays first, next, and last.",
    status: "foundation",
  },
  {
    title: "How do I reorder a setlist?",
    body: "Use the project Setlist area when the order needs to change. Keep Help instructions literal after the exact controls are verified.",
    route: ["Projects", "Open Project", "Setlist", "Move Track"],
    status: "foundation",
  },
  {
    title: "Why setlist order matters",
    body: "Project playback, review flow, and future live/listening tools can all depend on the order chosen in the setlist.",
    status: "foundation",
  },
  {
    title: "Move Up",
    body: "Move Up means the selected song should happen earlier in the project order.",
    route: ["Projects", "Open Project", "Setlist", "Move Up"],
    status: "foundation",
  },
  {
    title: "Move Down",
    body: "Move Down means the selected song should happen later in the project order.",
    route: ["Projects", "Open Project", "Setlist", "Move Down"],
    status: "foundation",
  },
  {
    title: "Project playback order",
    body: "Project playback order should follow the setlist when the project player is using the organized project sequence.",
    route: ["Projects", "Open Project", "Setlist", "Project Player"],
    status: "foundation",
  },
];

export const playerCards: HelpCard[] = [
  {
    title: "What is the Player?",
    body: "The Player is where the app confirms the current track and gives listening controls like play and pause.",
    route: ["TitleBar", "Player"],
    status: "verified",
  },
  {
    title: "Now Playing",
    body: "Now Playing tells you which track is currently selected or active. Check this first when you are not sure what song is playing.",
    route: ["Player", "Now Playing"],
    status: "verified",
  },
  {
    title: "Playback Controls",
    body: "Playback controls are the play, pause, and listening controls attached to the current track or player area.",
    route: ["Player", "Playback Controls"],
    status: "verified",
  },
  {
    title: "Track Information",
    body: "Track information includes the current track title, source, and related details shown near the player or track row.",
    route: ["Player", "Track Information"],
    status: "foundation",
  },
  {
    title: "Switching Tracks",
    body: "Switching tracks usually starts from Library or Projects. Choose another track, press play, and confirm the Player updates.",
    route: ["Library Or Projects", "Choose Track", "Press Play", "Check Player"],
    status: "foundation",
  },
];

export const libraryCards: HelpCard[] = [
  {
    title: "Uploaded Tracks",
    body: "Uploaded Tracks are songs brought into the app from the computer. They should be findable from the Library after upload.",
    route: ["TitleBar", "Library", "Uploaded Tracks"],
    status: "verified",
  },
  {
    title: "Library Search",
    body: "Library Search narrows tracks by title, tag, source, mood, or keyword so the user does not have to scan the whole Library.",
    route: ["TitleBar", "Library", "Search"],
    status: "verified",
  },
  {
    title: "Filters",
    body: "Filters narrow the Library to a smaller set of tracks. If the list looks wrong, clear the search or filter before assuming tracks are missing.",
    route: ["TitleBar", "Library", "Filters"],
    status: "verified",
  },
  {
    title: "Tags",
    body: "Tags are quick labels attached to tracks. They are useful for fast filtering, but they are not the same as deeper Metadata records.",
    route: ["TitleBar", "Library", "Tags"],
    status: "verified",
  },
  {
    title: "Track Details",
    body: "Track Details show extra information about one track, such as title, source, tags, or future metadata links.",
    route: ["TitleBar", "Library", "Track", "Details"],
    status: "foundation",
  },
  {
    title: "Audio Source",
    body: "Audio Source explains where a track came from: uploaded file, seed data, storage, project link, or future source type.",
    route: ["TitleBar", "Library", "Track", "Audio Source"],
    status: "foundation",
  },
];

export const projectCards: HelpCard[] = [
  {
    title: "Project Overview",
    body: "Project Overview is the main summary for a project. It should help the user understand the project before opening deeper areas.",
    route: ["TitleBar", "Projects", "Open Project", "Overview"],
    status: "verified",
  },
  {
    title: "Project Tracks",
    body: "Project Tracks are the songs connected to one project. This area explains what belongs to the project.",
    route: ["TitleBar", "Projects", "Open Project", "Tracks"],
    status: "verified",
  },
  {
    title: "Top Tracks",
    body: "Top Tracks are highlighted or ranked tracks inside a project. They help identify important songs quickly.",
    route: ["Projects", "Open Project", "Overview", "Top Tracks"],
    status: "verified",
  },
  {
    title: "Project Player",
    body: "The Project Player is the playback area for music inside a project. It should make project listening feel separate from simple Library browsing.",
    route: ["Projects", "Open Project", "Project Player"],
    status: "foundation",
  },
  {
    title: "Project Metadata",
    body: "Project Metadata is the project-level information, notes, or future relationships connected to a project.",
    route: ["Projects", "Open Project", "Metadata"],
    status: "foundation",
  },
  {
    title: "Future Project Relationships",
    body: "Future Project Relationships will connect projects to tracks, metadata, notes, and other projects.",
    route: ["Projects", "Open Project", "Future Relationships"],
    status: "planned",
  },
];

export const helpCards: HelpCard[] = [
  {
    title: "Find It",
    body: "Find It answers the question: where is this thing in the app?",
    route: ["TitleBar", "Help", "Find It"],
    status: "verified",
  },
  {
    title: "Route Maps",
    body: "Route Maps answer the question: what exact path do I click to get there?",
    route: ["TitleBar", "Help", "Route Maps"],
    status: "verified",
  },
  {
    title: "How Do I",
    body: "How Do I answers the question: what workflow should I follow to do the task?",
    route: ["TitleBar", "Help", "How Do I"],
    status: "verified",
  },
  {
    title: "What Is This",
    body: "What Is This explains app areas and feature names in plain language.",
    route: ["TitleBar", "Help", "What Is This"],
    status: "verified",
  },
  {
    title: "Tips",
    body: "Tips are small reminders that prevent common workflow mistakes.",
    route: ["TitleBar", "Help", "Tips"],
    status: "verified",
  },
  {
    title: "What's New",
    body: "What's New explains recent or planned Help Foundation improvements.",
    route: ["TitleBar", "Help", "What's New"],
    status: "verified",
  },
];

export const tipCards: HelpCard[] = [
  {
    title: "Folder upload",
    body: "Use Choose Folder when you want to upload a whole song folder. Use Choose Files when you only want one or a few selected files.",
    status: "verified",
  },
  {
    title: "Project workflow",
    body: "Uploading songs does not automatically mean they are inside a project. Upload first, then send tracks from Library into the project.",
    status: "verified",
  },
  {
    title: "Metadata focus",
    body: "Use Metadata when you only want to focus the metadata panel. Use Inspect when you want to preview and focus metadata together.",
    status: "foundation",
  },
  {
    title: "Help versus Navigation",
    body: "Navigation should answer where can I go. Help should answer how do I get there and what does it mean.",
    status: "foundation",
  },
  {
    title: "Search first",
    body: "When a page has too many cards or tracks, search first. A short word is often better than a long exact phrase.",
    status: "verified",
  },
  {
    title: "Clear search before panic",
    body: "If something appears missing, clear the search box or filters before assuming the data is gone.",
    status: "verified",
  },
  {
    title: "Use Find It when lost",
    body: "Find It is the safe restart point when the user knows the goal but not the app location.",
    status: "verified",
  },
  {
    title: "Use Route Maps for clicks",
    body: "Route Maps should be used when the user needs exact click order, not just the name of a page.",
    status: "verified",
  },
  {
    title: "Use Metadata for meaning",
    body: "Metadata should explain what something means, what it connects to, and why it matters.",
    status: "foundation",
  },
  {
    title: "Use Track Matcher for comparison",
    body: "Track Matcher should be used when the question is about comparing, matching, analyzing, or preparing tracks.",
    status: "foundation",
  },
];

export const helpFoundationAreaCardGroups = [
  {
    title: "Core Areas",
    cards: whatIsThisCards,
  },
  {
    title: "Library",
    cards: libraryCards,
  },
  {
    title: "Projects",
    cards: projectCards,
  },
  {
    title: "Track Matcher",
    cards: trackMatcherCards,
  },
  {
    title: "Metadata",
    cards: metadataCards,
  },
  {
    title: "Setlists",
    cards: setlistCards,
  },
  {
    title: "Player",
    cards: playerCards,
  },
  {
    title: "Help",
    cards: helpCards,
  },
  {
    title: "Tips",
    cards: tipCards,
  },
];

export function getHelpFoundationAreaCardGroups() {
  return helpFoundationAreaCardGroups;
}

export function getAllHelpFoundationAreaCards() {
  return helpFoundationAreaCardGroups.flatMap((group) => group.cards);
}

export function searchHelpFoundationAreaCards(query: string) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return getAllHelpFoundationAreaCards();
  }

  return getAllHelpFoundationAreaCards().filter((card) => {
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