export type TrackSection = {
  id: string;
  start: number;
  end: number;
  tags?: string[];
  description?: string;
};

export type AnyTrack = {
  id: string;
  title?: string;
  artist?: string;
  url?: string;
  path?: string;
  tags?: string[];
  sections?: TrackSection[];
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

  // future-ready playback targeting
  currentSectionId?: string | null;
  sectionStartTime?: number | null;
};