"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../components/AuthProvider";
import { getSupabaseProjects } from "../../../lib/getSupabaseProjects";
import { createSupabaseProject } from "../../../lib/createSupabaseProject";
import { supabase } from "../../../lib/supabaseClient";
import {
  getSupabaseTracks,
  type SupabaseTrack,
} from "../../../lib/getSupabaseTracks";
import {
  createDownloadStamp,
  downloadJsonFile,
} from "../../shared/downloads/downloadFileHelpers";
import {
  summarizeUploadResult,
  uploadProjectAudioFiles,
} from "../../shared/uploads/projectUploadHelpers";
import { ProjectCreatePanel } from "./ProjectCreatePanel";
import { ProjectDetailsPanel } from "./ProjectDetailsPanel";
import { ProjectSearchPanel } from "./ProjectSearchPanel";
import { buttonClass, eyebrowClass, panelClass } from "./projectPageStyles";
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

type ProjectAudioDownloadItem = {
  id: string;
  title: string;
  url: string;
};

function slugifyDownloadName(value: string) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "project-song"
  );
}

function downloadAudioUrl(url: string, fileName: string) {
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.rel = "noreferrer";

  document.body.appendChild(link);
  link.click();
  link.remove();
}

function downloadAudioItems(items: ProjectAudioDownloadItem[]) {
  items.forEach((item, index) => {
    window.setTimeout(() => {
      downloadAudioUrl(item.url, slugifyDownloadName(item.title));
    }, index * 300);
  });
}

function buildDownloadItemsFromTracks(
  linkedIds: Set<string>,
  tracks: SupabaseTrack[],
): ProjectAudioDownloadItem[] {
  return tracks
    .filter((track) => linkedIds.has(String(track.id)))
    .filter((track) => Boolean(track.url))
    .map((track) => ({
      id: track.id,
      title: track.title || "project-song",
      url: track.url,
    }));
}

export default function WorkspaceProjectsPage() {
  const { user, loading } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showProjectDetails, setShowProjectDetails] = useState(false);
  const [showProjectsHowTo, setShowProjectsHowTo] = useState(false);
  const [searchMode, setSearchMode] = useState<ProjectSearchMode>("title");
  const [searchValue, setSearchValue] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [uploadingProjectId, setUploadingProjectId] = useState<string | null>(
    null,
  );
  const [downloadingProjectId, setDownloadingProjectId] = useState<
    string | null
  >(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  const selectedProjects = useMemo(
    () => projects.filter((project) => selectedIds.includes(project.id)),
    [projects, selectedIds],
  );

  const searchedProjects = useMemo(
    () =>
      projects.filter((project) =>
        projectMatchesSearch(project, searchMode, searchValue),
      ),
    [projects, searchMode, searchValue],
  );

  const selectedDropdownProject = useMemo(
    () =>
      selectedProjectId
        ? projects.find((project) => project.id === selectedProjectId) || null
        : null,
    [projects, selectedProjectId],
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

  function openSelectedDropdownProject() {
    if (!selectedProjectId) return;
    goToProject(selectedProjectId);
  }

  function clearSelectedProjects() {
    setSelectedIds([]);
    setSelectedProjectId("");
  }

  function downloadSelectedProjects() {
    if (selectedProjects.length === 0) return;

    downloadJsonFile({
      fileName: `muzes-garden-project-folder-${createDownloadStamp()}.json`,
      payload: createProjectDownloadPayload(selectedProjects),
    });
  }

  async function getProjectAudioItems(projectId: string) {
    const { data, error } = await supabase
      .from("project_tracks")
      .select("track_id")
      .eq("project_id", projectId);

    if (error) {
      throw new Error(error.message);
    }

    const linkedIds = new Set<string>(
      (data ?? []).map((row: any) => String(row.track_id)),
    );

    if (linkedIds.size === 0) {
      return [];
    }

    const tracks = await getSupabaseTracks();

    return buildDownloadItemsFromTracks(linkedIds, tracks);
  }

  async function downloadProjectAudioFiles(project: Project) {
    setDownloadingProjectId(project.id);
    setErrorMsg(null);
    setUploadMessage(`Preparing downloads for ${project.title}...`);

    try {
      const items = await getProjectAudioItems(project.id);

      if (items.length === 0) {
        setUploadMessage(
          `No downloadable audio files found for ${project.title}.`,
        );
        return;
      }

      downloadAudioItems(items);
      setUploadMessage(
        `Started ${items.length} download${items.length === 1 ? "" : "s"} for ${
          project.title
        }.`,
      );
    } catch (error: unknown) {
      setErrorMsg(
        error instanceof Error
          ? error.message
          : "Failed to download project audio.",
      );
      setUploadMessage(null);
    } finally {
      setDownloadingProjectId(null);
    }
  }

  async function downloadProjectAudioFolder(project: Project) {
    await downloadProjectAudioFiles(project);
  }

  async function uploadFilesToProject(projectId: string, files: File[]) {
    if (!projectId || files.length === 0 || uploadingProjectId) return;

    setUploadingProjectId(projectId);
    setErrorMsg(null);
    setUploadMessage(
      `Uploading ${files.length} file${files.length === 1 ? "" : "s"}...`,
    );

    try {
      const result = await uploadProjectAudioFiles({
        files,
        visibility: "shared",
        userId: user?.id ?? null,
      });

      for (const item of result.uploadedItems) {
        const { error } = await supabase.from("project_tracks").insert({
          project_id: projectId,
          track_id: item.trackId,
        });

        if (error) {
          throw new Error(error.message);
        }
      }

      setUploadMessage(summarizeUploadResult(result));
      setSelectedProjectId(projectId);
      setSelectedIds([projectId]);
      await loadProjects();
    } catch (error: unknown) {
      setErrorMsg(
        error instanceof Error
          ? error.message
          : "Failed to upload project files.",
      );
      setUploadMessage(null);
    } finally {
      setUploadingProjectId(null);
    }
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

  useEffect(() => {
    if (!selectedDropdownProject) return;
    setSelectedIds([selectedDropdownProject.id]);
  }, [selectedDropdownProject]);

  useEffect(() => {
    if (loadingProjects || projects.length === 0) return;

    const projectId = new URLSearchParams(window.location.search).get("edit");
    if (!projectId || !projects.some((project) => project.id === projectId)) {
      return;
    }

    setSearchMode("all");
    setSearchValue("");
    setSelectedProjectId(projectId);
    setSelectedIds([projectId]);

    window.requestAnimationFrame(() => {
      document.getElementById("project-editor")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, [loadingProjects, projects]);

  async function renameProject(project: Project, nextTitle: string) {
    const title = nextTitle.trim();

    if (!project.id || !title || title === project.title) return;

    const updatedAt = new Date().toISOString();

    setErrorMsg(null);
    setUploadMessage(`Renaming ${project.title}...`);

    try {
      const { error } = await supabase
        .from("projects")
        .update({ title, updated_at: updatedAt })
        .eq("id", project.id);

      if (error) throw new Error(error.message);

      setProjects((current) =>
        current.map((item) =>
          item.id === project.id
            ? { ...item, title, updated_at: updatedAt }
            : item
        )
      );

      setUploadMessage(`Renamed project to "${title}".`);
    } catch (error: unknown) {
      setErrorMsg(
        error instanceof Error ? error.message : "Failed to rename project."
      );
      setUploadMessage(null);
    }
  }
  async function changeProjectVisibility(project: Project) {
    if (!user?.id || !project.id) return;

    const nextVisibility: ProjectVisibility =
      project.visibility === "public" ? "private" : "public";

    if (nextVisibility === "public") {
      const confirmed = window.confirm(
        `Make "${project.title}" public? Every song linked to this project will be available in All Public Songs.`,
      );
      if (!confirmed) return;
    }

    const updatedAt = new Date().toISOString();
    setErrorMsg(null);
    setUploadMessage(`Changing ${project.title} to ${nextVisibility}...`);

    try {
      const { data, error } = await supabase
        .from("projects")
        .update({ visibility: nextVisibility, updated_at: updatedAt })
        .eq("id", project.id)
        .eq("owner_id", user.id)
        .select("id, visibility")
        .single();

      if (error) throw new Error(error.message);
      if (data?.visibility !== nextVisibility) {
        throw new Error("Supabase did not confirm the privacy change.");
      }

      setProjects((current) =>
        current.map((item) =>
          item.id === project.id
            ? { ...item, visibility: nextVisibility, updated_at: updatedAt }
            : item,
        ),
      );
      setUploadMessage(
        `${project.title} is now ${nextVisibility}. Refresh the Library to update public songs.`,
      );
    } catch (error: unknown) {
      setErrorMsg(
        error instanceof Error
          ? error.message
          : "Failed to change project privacy.",
      );
      setUploadMessage(null);
    }
  }
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
                {searchedProjects.length} matching of {projects.length} projects
                Â· {selectedProjects.length} selected
              </p>

              {uploadMessage ? (
                <p className="mt-2 text-sm leading-6 text-white/70">
                  {uploadMessage}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2 lg:justify-end">
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
        </header>

        {showProjectsHowTo ? (
          <section className={panelClass}>
            <p className={eyebrowClass}>Projects Page Help</p>
            <h2 className="mt-2 text-2xl font-black text-white">How to use Projects</h2>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-white/75">
              <li><span className="font-black text-white">Choose a project</span> from the dropdown, then click <span className="font-black text-white">Open Selected</span>.</li>
              <li><span className="font-black text-white">Show All Projects</span> opens every project card, even when the search box has text.</li>
              <li><span className="font-black text-white">Rename</span> changes the project name from the project card.</li>
              <li><span className="font-black text-white">Upload File</span> or <span className="font-black text-white">Upload Folder</span> adds new audio into that project.</li>
              <li><span className="font-black text-white">Project Liaison</span> sends existing Library songs into projects.</li>
              <li>After opening a project, click <span className="font-black text-white">Library</span> to see the songs/files inside it.</li>
            </ol>
          </section>
        ) : null}
        <section className="grid gap-5 lg:grid-cols-[360px_1fr]">
          <ProjectCreatePanel creating={creating} onCreate={onCreate} />

          <div id="project-editor" className="scroll-mt-28">
            <ProjectSearchPanel
            projects={projects}
            filteredProjects={searchedProjects}
            searchMode={searchMode}
            searchValue={searchValue}
            selectedProjectId={selectedProjectId}
            uploadingProjectId={uploadingProjectId}
            downloadingProjectId={downloadingProjectId}
            onSearchModeChange={(mode) => {
              setSearchMode(mode);
              setSelectedProjectId("");
              setSelectedIds([]);
            }}
            onSearchValueChange={(value) => {
              setSearchValue(value);
              setSelectedProjectId("");
              setSelectedIds([]);
            }}
            onSelectedProjectChange={setSelectedProjectId}
            onOpenSelectedProject={openSelectedDropdownProject}
            onRenameProject={renameProject}
            onChangeProjectVisibility={changeProjectVisibility}
            onUploadFilesToProject={uploadFilesToProject}
            onDownloadProjectFiles={downloadProjectAudioFiles}
            onDownloadProjectFolder={downloadProjectAudioFolder}
          />
          </div>
        </section>

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

        {loadingProjects ? (
          <section className={panelClass}>
            <p className="text-white">Loading projects...</p>
          </section>
        ) : null}
      </section>
    </main>
  );
}