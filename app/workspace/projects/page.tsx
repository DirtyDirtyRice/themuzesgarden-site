"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../components/AuthProvider";
import { getSupabaseProjects } from "../../../lib/getSupabaseProjects";
import { createSupabaseProject } from "../../../lib/createSupabaseProject";
import {
  createDownloadStamp,
  downloadJsonFile,
  slugifyDownloadFileName,
} from "../../shared/downloads/downloadFileHelpers";
import { downloadFolderManifest } from "../../shared/downloads/downloadFolderHelpers";
import { ProjectCreatePanel } from "./ProjectCreatePanel";
import { ProjectDetailsPanel } from "./ProjectDetailsPanel";
import { ProjectListPanel } from "./ProjectListPanel";
import {
  buttonClass,
  eyebrowClass,
  inputClass,
  panelClass,
  selectClass,
} from "./projectPageStyles";
import type {
  Project,
  ProjectKind,
  ProjectSearchMode,
  ProjectVisibility,
} from "./projectPageTypes";
import {
  clampTitle,
  createProjectDownloadPayload,
  projectMatchesSearch,
} from "./projectPageHelpers";

export default function WorkspaceProjectsPage() {
  const { user, loading } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showProjectDetails, setShowProjectDetails] = useState(false);
  const [searchMode, setSearchMode] = useState<ProjectSearchMode>("title");
  const [searchValue, setSearchValue] = useState("");

  const selectedProjects = useMemo(
    () => projects.filter((project) => selectedIds.includes(project.id)),
    [projects, selectedIds],
  );

  const filteredProjects = useMemo(
    () =>
      projects.filter((project) =>
        projectMatchesSearch(project, searchMode, searchValue),
      ),
    [projects, searchMode, searchValue],
  );

  const musicProjectCount = useMemo(
    () => projects.filter((project) => project.kind === "music").length,
    [projects],
  );

  const sharedOrPublicProjectCount = useMemo(
    () => projects.filter((project) => project.visibility !== "private").length,
    [projects],
  );

  const hasSelectedProjects = selectedProjects.length > 0;

  function goToProject(id: string) {
    if (!id) return;
    window.location.href = `/workspace/projects/${id}`;
  }

  function toggleSelectedProject(id: string) {
    setSelectedIds((currentIds) =>
      currentIds.includes(id)
        ? currentIds.filter((currentId) => currentId !== id)
        : [...currentIds, id],
    );
  }

  function selectAllFilteredProjects() {
    setSelectedIds(filteredProjects.map((project) => project.id));
  }

  function clearSelectedProjects() {
    setSelectedIds([]);
  }

  function downloadProject(project: Project) {
    downloadJsonFile({
      fileName: `${slugifyDownloadFileName(project.title)}-${project.id}.json`,
      payload: createProjectDownloadPayload([project]),
    });
  }

  function downloadProjectFolder(project: Project) {
    downloadFolderManifest({
      folderName: project.title,
      files: [
        {
          path: "Project Info/project.json",
          payload: project,
        },
        {
          path: "Tracks/tracks.json",
          payload: [],
        },
        {
          path: "Lyrics/lyrics.json",
          payload: [],
        },
        {
          path: "Notes/notes.json",
          payload: [],
        },
        {
          path: "Metadata/metadata.json",
          payload: [],
        },
      ],
    });
  }

  function downloadSelectedProjects() {
    if (selectedProjects.length === 0) return;

    downloadJsonFile({
      fileName: `muzes-garden-project-folder-${createDownloadStamp()}.json`,
      payload: createProjectDownloadPayload(selectedProjects),
    });
  }

  async function loadProjects() {
    setLoadingProjects(true);
    setErrorMsg(null);

    try {
      const rows = await getSupabaseProjects();
      setProjects(rows as Project[]);
    } catch (error: unknown) {
      setErrorMsg(
        error instanceof Error ? error.message : "Failed to load projects.",
      );
    } finally {
      setLoadingProjects(false);
    }
  }

  useEffect(() => {
    if (loading || !user) return;
    loadProjects();
  }, [loading, user?.id]);

  async function onCreate(formData: FormData) {
    const title = clampTitle(String(formData.get("title") ?? ""));
    const description = String(formData.get("description") ?? "");
    const kind = String(formData.get("kind") ?? "music") as ProjectKind;
    const visibility = String(
      formData.get("visibility") ?? "private",
    ) as ProjectVisibility;

    if (!title) return;

    setCreating(true);
    setErrorMsg(null);

    try {
      const created = await createSupabaseProject({
        title,
        description,
        kind,
        visibility,
      });

      await loadProjects();
      goToProject(created.id);
    } catch (error: unknown) {
      setErrorMsg(
        error instanceof Error ? error.message : "Failed to create project.",
      );
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black p-6 text-white">
        <p className="text-white">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-5 py-6 text-white">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <header className={panelClass}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className={eyebrowClass}>Workspace</p>
              <h1 className="mt-2 text-4xl font-black tracking-tight text-white">
                Your Projects
              </h1>
              <p className="mt-2 text-sm leading-6 text-white/70">
                {filteredProjects.length} shown of {projects.length} projects ·{" "}
                {selectedProjects.length} selected
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={buttonClass}
                onClick={() => setShowProjectDetails((current) => !current)}
              >
                {showProjectDetails ? "Hide Project Details" : "Project Details"}
              </button>

              <button
                type="button"
                className={buttonClass}
                onClick={selectAllFilteredProjects}
                disabled={filteredProjects.length === 0}
              >
                Select Shown
              </button>

              <button
                type="button"
                className={buttonClass}
                onClick={clearSelectedProjects}
                disabled={!hasSelectedProjects}
              >
                Clear
              </button>

              <button
                type="button"
                className={buttonClass}
                onClick={downloadSelectedProjects}
                disabled={!hasSelectedProjects}
              >
                Download Selected
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-[220px_1fr]">
            <select
              value={searchMode}
              onChange={(event) =>
                setSearchMode(event.target.value as ProjectSearchMode)
              }
              className={selectClass}
            >
              <option value="title">Search by title</option>
              <option value="kind">Search by kind</option>
              <option value="visibility">Search by visibility</option>
              <option value="all">Show all projects</option>
            </select>

            {searchMode === "all" ? (
              <div className="rounded-2xl border border-white/15 bg-black px-4 py-3 text-sm text-white/70">
                Showing all projects.
              </div>
            ) : (
              <input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                className={inputClass}
                placeholder="Search projects..."
              />
            )}
          </div>
        </header>

        {showProjectDetails ? (
          <ProjectDetailsPanel
            projectCount={projects.length}
            selectedCount={selectedProjects.length}
            musicProjectCount={musicProjectCount}
            sharedOrPublicProjectCount={sharedOrPublicProjectCount}
            loadingProjects={loadingProjects}
            hasSelectedProjects={hasSelectedProjects}
            onRefresh={loadProjects}
            onDownloadSelected={downloadSelectedProjects}
          />
        ) : null}

        {errorMsg ? (
          <section className={panelClass}>
            <p className="font-black text-white">Project message</p>
            <p className="mt-2 text-sm text-white/70">{errorMsg}</p>
          </section>
        ) : null}

        <section className="grid gap-5 lg:grid-cols-[360px_1fr]">
          <ProjectCreatePanel creating={creating} onCreate={onCreate} />

          <ProjectListPanel
            projects={projects}
            filteredProjects={filteredProjects}
            selectedIds={selectedIds}
            selectedCount={selectedProjects.length}
            loadingProjects={loadingProjects}
            onOpenProject={goToProject}
            onToggleSelected={toggleSelectedProject}
            onDownloadProject={downloadProject}
            onDownloadProjectFolder={downloadProjectFolder}
          />
        </section>
      </section>
    </main>
  );
}