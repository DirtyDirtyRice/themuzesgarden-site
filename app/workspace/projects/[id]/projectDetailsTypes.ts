import type { MetadataTargetType } from "../../../../lib/metadata/metadataTypes";

export type ProjectKind = "music" | "education" | "game" | "experiment" | "collab";

export type ProjectVisibility = "private" | "shared" | "public";

export type Tab = "overview" | "notes" | "library" | "activity";

export type LoopMode = "off" | "track" | "setlist";

export type { MetadataTargetType };

export type Project = {
  id: string;
  owner_id: string;
  title: string;
  description?: string | null;
  kind: ProjectKind;
  visibility: ProjectVisibility;
  created_at: string;
  updated_at: string;
};

export type Note = {
  id: string;
  project_id: string;
  owner_id: string;
  title: string;
  body: string;
  pinned: boolean;
  created_at: string;
  updated_at: string;
};

export type ProjectPlayerBridgeState = {
  projectId: string;
  projectTitle: string;
  trackIds: string[];
  trackCount: number;
  updatedAt: string;
  source: "project-page";
};

export type PlaybackTrackLike = {
  id: string;
  title?: string | null;
  artist?: string | null;
  url?: string | null;
  publicUrl?: string | null;
  public_url?: string | null;
  signedUrl?: string | null;
  signed_url?: string | null;
  src?: string | null;
  mp3?: string | null;
  path?: string | null;
  storage_path?: string | null;
  storagePath?: string | null;
  file_path?: string | null;
  filePath?: string | null;
  bucket?: string | null;
};

export type PlaybackNextTrackOptions = {
  wrapIfSetlistLoop?: boolean;
};

export type SaveActiveNoteOptions = {
  silent?: boolean;
};

export type LoadNotesOptions = {
  autoOpenNewest?: boolean;
};