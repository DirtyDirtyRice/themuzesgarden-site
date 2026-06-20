import type {
  Project,
  ProjectKind,
  ProjectSearchMode,
} from "./projectPageTypes";

export function formatKind(kind: ProjectKind) {
  switch (kind) {
    case "music":
      return "Music";
    case "education":
      return "Education";
    case "game":
      return "Game";
    case "experiment":
      return "Experiment";
    case "collab":
      return "Collaboration";
    default:
      return "Project";
  }
}

export function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function clampTitle(value: string) {
  return value.trim().slice(0, 120);
}

export function createProjectDownloadPayload(projects: Project[]) {
  return {
    exportedAtIso: new Date().toISOString(),
    source: "The Muzes Garden",
    downloadKind:
      projects.length === 1
        ? "single-project"
        : "project-folder",
    totalProjects: projects.length,
    projects,
  };
}

export function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

export function projectMatchesSearch(
  project: Project,
  searchMode: ProjectSearchMode,
  searchValue: string,
) {
  if (searchMode === "all") return true;

  const search = normalizeSearch(searchValue);

  if (!search) return true;

  if (searchMode === "title") {
    return normalizeSearch(project.title).includes(search);
  }

  if (searchMode === "kind") {
    return normalizeSearch(formatKind(project.kind)).includes(search);
  }

  if (searchMode === "visibility") {
    return normalizeSearch(project.visibility).includes(search);
  }

  return true;
}