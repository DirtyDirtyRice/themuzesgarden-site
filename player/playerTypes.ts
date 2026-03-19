export type SectionReason = "moment-tag" | "section-description";

export type TrackMomentMeta = {
  duration?: number | null;

  label?: string;
  notes?: string;
  confidence?: number | null;
  source?: string | null;

  instruments?: string[];
  moods?: string[];
  textures?: string[];

  energy?: number | null;
  intensity?: number | null;

  isLoop?: boolean | null;
  isTransition?: boolean | null;
  isImpact?: boolean | null;

  searchableText?: string;
};

export type TrackSection = {
  id: string;
  start: number;
  end: number;

  tags?: string[];
  description?: string;

  // current/future-ready metadata
  label?: string;
  notes?: string;
  confidence?: number | null;
  source?: string | null;

  // richer moment-search foundation
  meta?: TrackMomentMeta;
};

export type AnyTrack = {
  id: string;

  title?: string;
  artist?: string;
  url?: string;
  path?: string;
  tags?: string[];

  sections?: TrackSection[];

  // future-ready track metadata
  duration?: number | null;
  bucket?: string;
  updatedAt?: string;
};

export type PlayerTab = "project" | "search";

export type Persisted = {
  tab?: PlayerTab;
  lastProjectId?: string;

  nowId?: string | null;
  volume?: number;
  currentTime?: number;

  shuffle?: boolean;
  loop?: boolean;
  projectOrder?: Record<string, string[]>;

  // current playback targeting
  currentSectionId?: string | null;
  sectionStartTime?: number | null;

  // future-ready playback targeting / search continuity
  lastSearchQuery?: string;
  lastMatchedSectionId?: string | null;
  lastMatchedSectionStartTime?: number | null;
};