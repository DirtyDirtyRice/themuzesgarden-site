export type ProjectKind = "music" | "education" | "game" | "experiment" | "collab";

export type ProjectVisibility = "private" | "shared" | "public";

export type ProjectSearchMode = "title" | "kind" | "visibility" | "all";

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