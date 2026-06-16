import type { LyricEntry } from "./lyricsTypes";

export type LyricsTrackLinkStatus =
  | "linked"
  | "unlinked"
  | "needs-review"
  | "archived";

export type LyricsTrackLinkSource =
  | "manual"
  | "auto-match"
  | "import"
  | "starter";

export type LyricsTrackLinkConfidence =
  | "verified"
  | "strong"
  | "moderate"
  | "weak";

export type LyricsTrackLink = {
  id: string;

  trackId: string;
  trackTitle: string;
  trackArtist: string;

  lyricId: string;
  lyricTitle: string;

  status: LyricsTrackLinkStatus;
  source: LyricsTrackLinkSource;
  confidence: LyricsTrackLinkConfidence;

  createdAt: string;
  updatedAt: string;

  notes: string;
};

export type LyricsTrackLinkCandidate = {
  trackId: string;
  trackTitle: string;
  lyric: LyricEntry;
  score: number;
  reasons: string[];
};

export type LyricsTrackLinkStats = {
  totalLinks: number;
  linkedTracks: number;
  unlinkedTracks: number;
  needsReviewCount: number;
};

export type LyricsTrackLinkWorkspace = {
  links: LyricsTrackLink[];
  candidates: LyricsTrackLinkCandidate[];
  stats: LyricsTrackLinkStats;
  warnings: string[];
};