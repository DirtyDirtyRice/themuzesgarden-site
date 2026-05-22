import type { HelpGlossaryItem, HelpJumpLink, HelpQuickAnswer } from "./helpFoundationTypes";

export const helpJumpLinks: HelpJumpLink[] = [
  { label: "How Do I?", href: "#how-do-i", detail: "Step-by-step workflows" },
  { label: "Quick Answers", href: "#quick-answers", detail: "Fast answers for common confusion" },
  { label: "What Is This?", href: "#what-is-this", detail: "Plain-language explanations" },
  { label: "Routes", href: "#routes", detail: "How to get from here to there" },
  { label: "Track Matcher", href: "#track-matcher", detail: "Foundation help for Track Matcher" },
  { label: "Metadata", href: "#metadata-help", detail: "Foundation help for Metadata" },
  { label: "Setlists", href: "#setlists", detail: "Foundation help for project setlists" },
  { label: "Tips", href: "#tips", detail: "Small reminders" },
  { label: "What's New?", href: "#whats-new", detail: "Recent additions" },
];

export const quickAnswers: HelpQuickAnswer[] = [
  {
    question: "Why is an uploaded song not in my project yet?",
    answer:
      "Upload puts the song into the Library first. After that, select it in Library, choose the project, and use Send To.",
    route: ["Upload", "Library", "Select Track", "Choose Project", "Send To"],
  },
  {
    question: "Where do I go when I want to hear the project?",
    answer:
      "Open Projects, choose the project, then use the project player or track row play controls.",
    route: ["Projects", "Open Project", "Overview", "Play"],
  },
  {
    question: "Where should Find It live?",
    answer:
      "Find It belongs under Help because it answers how to locate a page, tool, or workflow.",
    route: ["Help", "Find It"],
  },
  {
    question: "Should Help explain unverified features?",
    answer:
      "Help can name planned areas, but step-by-step instructions should stay based on verified workflows.",
  },
];

export const glossaryItems: HelpGlossaryItem[] = [
  {
    term: "Help",
    meaning:
      "The member guide for how to use the app, what things mean, and how to get from one place to another.",
    useWhen: "Use Help when the question starts with how, what, where, or why.",
  },
  {
    term: "Navigation",
    meaning:
      "The title bar and dropdowns that show where a member can go inside the app.",
    useWhen: "Use Navigation when the question is about moving to a page.",
  },
  {
    term: "Route",
    meaning:
      "A route is a visible click path through the app, written step by step.",
    useWhen: "Use Routes when a member needs a literal path from one area to another.",
  },
  {
    term: "Verified Workflow",
    meaning:
      "A workflow that has been tested in the real app and should be safe to document.",
    useWhen: "Use verified workflow labels when Help content is based on real testing.",
  },
];
