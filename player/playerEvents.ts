export const MUZES_SEARCH_TAG_EVENT = "muzesgarden-search-tag";
export const MUZES_PLAYBACK_TARGET_EVENT = "muzesgarden-playback-target";
export const MUZES_ACTIVITY_TRACK_JUMP_EVENT = "muzesgarden-activity-track-jump";

export type MuzesSearchTagDetail = {
  tag: string;
};

export type MuzesPlaybackTargetDetail = {
  trackId: string;
  sectionId?: string | null;
  startTime?: number | null;
  preferProjectTab?: boolean;
};

export type MuzesActivityTrackJumpDetail = {
  projectId?: string;
  trackId?: string;
};