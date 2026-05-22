import type { HelpSectionContent } from "./helpFoundationTypes";

export const helpFoundationTrackMatcherSections: HelpSectionContent[] = [
  {
    id: "track-matcher",
    eyebrow: "Track Matcher",
    title: "Compare two songs, hear differences, and prepare better matches",
    body:
      "Track Matcher is where members compare tracks, check feel, and prepare future match intelligence without guessing where the tool lives.",
    cards: [
      {
        title: "I want to compare two songs",
        body:
          "Use Track Matcher when you need to load two songs and compare how they feel together.",
        route: ["Title Bar", "Track Matcher", "Load Track A", "Load Track B", "Compare"],
        note:
          "Track A and Track B are the two main comparison lanes. Start there before looking for deeper analysis.",
        status: "verified",
      },
      {
        title: "I want to hear whether two tracks match",
        body:
          "Load both tracks, use the matcher controls, then listen for tempo, key, energy, and transition feel.",
        route: ["Track Matcher", "Load Track A", "Load Track B", "Play", "Listen"],
        status: "foundation",
      },
      {
        title: "I changed key or BPM and want to test it",
        body:
          "Use the Track Matcher controls after both tracks are loaded. Test one change at a time so the result is easier to hear.",
        route: ["Track Matcher", "Load Tracks", "Adjust Key or BPM", "Play", "Compare"],
        note:
          "If something sounds wrong, return the control close to neutral and test again.",
        status: "foundation",
      },
      {
        title: "I am lost inside Track Matcher",
        body:
          "Start at the top of the tool. Confirm both tracks are loaded, then move down through controls, matcher panels, and notes.",
        route: ["Track Matcher", "Top Controls", "Track A", "Track B", "Panels"],
        status: "foundation",
      },
      {
        title: "I want the app to explain a match later",
        body:
          "Future help should connect matcher results to plain-language explanations about why two songs do or do not work together.",
        route: ["Track Matcher", "Compare", "Future Match Explanation"],
        status: "planned",
      },
    ],
  },
];

export const trackMatcherHelpCards = helpFoundationTrackMatcherSections.flatMap((section) => section.cards)