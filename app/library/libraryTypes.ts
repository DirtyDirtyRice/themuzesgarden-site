export type TrackLike = {
  id: string;
  title: string;
  artist: string;
  url?: string;
  mp3?: string;
  path?: string;
  storage_path?: string;
  file_path?: string;
  tags?: string[];
  createdAt?: string;
  sourceProjectTitle?: string;
  sourceProjectId?: string;
  visibility?: string;
  ownerUserId?: string;
};