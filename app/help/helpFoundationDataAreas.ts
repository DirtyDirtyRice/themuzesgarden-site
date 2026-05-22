import type { HelpCard } from "./helpFoundationTypes";

export const whatIsThisCards: HelpCard[] = [
  {
    title: "Project",
    body: "A project is where uploaded Library tracks become an organized working collection with playback, setlist order, notes, metadata, and future relationships.",
    status: "verified",
  },
  {
    title: "Library",
    body: "The Library is the main place where tracks live after upload. From there, tracks can be selected and sent into projects.",
    status: "verified",
  },
  {
    title: "Upload",
    body: "Upload brings audio from the computer into the app. The verified folder route sends songs into the Library first.",
    status: "verified",
  },
  {
    title: "Metadata",
    body: "Metadata is the knowledge layer attached to tracks, moments, sections, notes, relationships, and musical ideas.",
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
    body: "Start by opening Track Matcher from the TitleBar. Use verified controls only as they become stable; this Help page should not pretend unfinished workflows are done.",
    route: ["Track Matcher ▼", "Choose Area", "Load or Inspect Audio"],
    status: "planned",
  },
  {
    title: "Why is it separate from Library?",
    body: "Library stores and filters tracks. Track Matcher is for analysis, preparation, and matching workflows that are bigger than simple storage.",
    status: "foundation",
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
    route: ["Project", "Track", "Metadata", "Read or Edit"],
    status: "foundation",
  },
  {
    title: "Metadata versus tags",
    body: "Tags are quick labels. Metadata is deeper information that explains what something is, how it connects, and why it matters.",
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
];
