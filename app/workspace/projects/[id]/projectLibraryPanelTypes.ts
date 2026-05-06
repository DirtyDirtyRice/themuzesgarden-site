export type AnyTrack = {
  id: string;
  title?: string;
  artist?: string;
  path?: string;
  url?: string;
  storage_path?: string;
  file_path?: string;
  mp3?: string;
  tags?: string[];
  visibility?: "private" | "shared" | "public";
};

export type FilterMode = "all" | "linked" | "unlinked";

export type LocalVisibility = "private" | "public";