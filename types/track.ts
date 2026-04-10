export type TrackVisibility = "private" | "shared" | "public";

export type Track = {
  id: string;
  title: string;
  artist?: string;
  url: string;
  tags: string[];
  createdAt: string;

  // 🔥 NEW
  visibility?: TrackVisibility;

  // 🔥 OWNER (for permissions)
  ownerId?: string;

  // 🔥 SHARING (future system)
  sharedWith?: string[];
};