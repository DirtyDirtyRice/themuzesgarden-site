import type {
  LyricsVersionAction,
  LyricsVersionEntry,
  LyricsVersionPanelSection,
} from "./LyricsVersionTypes";

export const LYRICS_VERSION_STARTER_VERSION: LyricsVersionEntry = {
  id: "version-starter-14-days-original",
  lyricEntryId: "starter-14-days",
  parentVersionId: null,
  title: "14 Days",
  artist: "The Muzes Garden",
  tags: "starter, lyrics, demo, version-original",
  body:
    "Paste your real lyrics here.\n\nThis starter entry proves the Lyrics page is working.\n\nLater this can connect to WAV, MP3, project, and metadata records.",
  kind: "original",
  status: "active",
  source: "starter",
  priority: "medium",
  focus: "full-song",
  readiness: "ready",
  createdAt: "Starter",
  updatedAt: "Starter",
  notes: "Starter version seeded from the locked Lyrics Library starter entry.",
  changeSummary: "Original starter version.",
  lineChanges: [],
  sectionScores: [
    {
      section: "full-song",
      score: 60,
      reason: "Starter lyric exists and can be used to verify version tracking.",
    },
    {
      section: "hook",
      score: 20,
      reason: "No dedicated hook has been identified yet.",
    },
    {
      section: "chorus",
      score: 20,
      reason: "No dedicated chorus has been identified yet.",
    },
  ],
};

export const LYRICS_VERSION_PANEL_SECTIONS: LyricsVersionPanelSection[] = [
  {
    id: "version-overview",
    title: "Version Overview",
    detail:
      "Shows how many lyric versions exist, which ones need review, and which ones are keeper candidates.",
    count: 0,
  },
  {
    id: "rewrite-lane",
    title: "Rewrite Lane",
    detail:
      "Tracks rewrite passes for verses, choruses, hooks, bridges, and full-song cleanup.",
    count: 0,
  },
  {
    id: "comparison-lane",
    title: "Comparison Lane",
    detail:
      "Compares original lyrics against rewritten versions and summarizes what changed.",
    count: 0,
  },
  {
    id: "keeper-lane",
    title: "Keeper Lane",
    detail:
      "Highlights versions that are ready to keep, perform, export, or connect to music projects.",
    count: 0,
  },
];

export const LYRICS_VERSION_ACTIONS: LyricsVersionAction[] = [
  {
    id: "create-original",
    label: "Create Original Version",
    detail:
      "Capture the current lyric as the first tracked version before rewriting.",
    actionType: "create-original",
  },
  {
    id: "create-rewrite",
    label: "Create Rewrite Pass",
    detail:
      "Duplicate the lyric into a new rewrite version for safe editing later.",
    actionType: "create-rewrite",
  },
  {
    id: "mark-keeper",
    label: "Mark Keeper",
    detail:
      "Promote the strongest version so it can become the working lyric.",
    actionType: "mark-keeper",
  },
  {
    id: "compare",
    label: "Compare Versions",
    detail:
      "Compare two versions and count changed, added, removed, and unchanged lines.",
    actionType: "compare",
  },
  {
    id: "archive",
    label: "Archive Weak Version",
    detail:
      "Move versions out of the active lane without deleting the lyric history.",
    actionType: "archive",
  },
  {
    id: "review",
    label: "Review Candidate",
    detail:
      "Flag versions with missing lyrics, missing parents, or unclear changes.",
    actionType: "review",
  },
];

export const LYRICS_VERSION_EMPTY_STATE_LINES = [
  "No extra lyric versions have been created yet.",
  "The engine can still show starter version readiness from existing lyrics.",
  "Next layer can persist versions once the browser storage shape is approved.",
];

export const LYRICS_VERSION_KIND_LABELS = {
  original: "Original",
  rewrite: "Rewrite",
  "verse-pass": "Verse Pass",
  "chorus-pass": "Chorus Pass",
  "bridge-pass": "Bridge Pass",
  "hook-pass": "Hook Pass",
  "keeper-pass": "Keeper Pass",
  "suno-prompt-pass": "Suno Prompt Pass",
  "performance-pass": "Performance Pass",
  "archive-pass": "Archive Pass",
} as const;

export const LYRICS_VERSION_STATUS_LABELS = {
  draft: "Draft",
  active: "Active",
  review: "Review",
  keeper: "Keeper",
  rejected: "Rejected",
  archived: "Archived",
} as const;

export const LYRICS_VERSION_PRIORITY_LABELS = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
} as const;

export const LYRICS_VERSION_FOCUS_LABELS = {
  "full-song": "Full Song",
  intro: "Intro",
  verse: "Verse",
  "pre-chorus": "Pre-Chorus",
  chorus: "Chorus",
  bridge: "Bridge",
  hook: "Hook",
  outro: "Outro",
  notes: "Notes",
} as const;

export const LYRICS_VERSION_READINESS_LABELS = {
  ready: "Ready",
  "needs-review": "Needs Review",
  "missing-lyrics": "Missing Lyrics",
  "missing-parent": "Missing Parent",
  "needs-comparison": "Needs Comparison",
  archived: "Archived",
} as const;

export const LYRICS_VERSION_VERDICT_LABELS = {
  stronger: "Stronger",
  weaker: "Weaker",
  different: "Different",
  same: "Same",
  "needs-listen": "Needs Listen",
  "not-compared": "Not Compared",
} as const;
