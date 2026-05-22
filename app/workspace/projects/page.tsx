"use client";

import Link from "next/link";
import { useAuth } from "../../components/AuthProvider";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseProjects } from "../../../lib/getSupabaseProjects";
import { createSupabaseProject } from "../../../lib/createSupabaseProject";

type ProjectKind = "music" | "education" | "game" | "experiment" | "collab";
type ProjectVisibility = "private" | "shared" | "public";

type Project = {
  id: string;
  owner_id: string;
  title: string;
  description?: string | null;
  kind: ProjectKind;
  visibility: ProjectVisibility;
  created_at: string;
  updated_at: string;
};

type ProjectControlCard = {
  title: string;
  eyebrow: string;
  body: string;
  actionLabel: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
};

const buttonClass =
  "inline-flex min-h-10 items-center justify-center rounded-2xl border border-white/25 bg-black px-4 py-2 text-sm font-black text-white transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";

const inputClass =
  "w-full rounded-2xl border border-white/20 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-white/70 focus:border-white";

const selectClass =
  "w-full rounded-2xl border border-white/20 bg-black px-4 py-3 text-sm text-white outline-none focus:border-white";

const panelClass = "rounded-3xl border border-white/20 bg-black p-6";
const insetPanelClass = "rounded-3xl border border-white/15 bg-black p-5";
const eyebrowClass =
  "text-sm font-black uppercase tracking-[0.24em] text-white/70";
const subTextClass = "text-sm leading-6 text-white/70";

function formatKind(kind: ProjectKind) {
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

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function clampTitle(value: string) {
  return value.trim().slice(0, 120);
}

function slugifyFileName(value: string) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 70) || "project"
  );
}

function downloadJsonFile(fileName: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function createProjectDownloadPayload(projects: Project[]) {
  return {
    exportedAtIso: new Date().toISOString(),
    source: "The Muzes Garden",
    downloadKind: projects.length === 1 ? "single-project" : "project-folder",
    totalProjects: projects.length,
    projects,
  };
}

function ProjectStatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: number | string;
  detail: string;
}) {
  return (
    <div className="rounded-3xl border border-white/15 bg-black p-4">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-white/70">
        {label}
      </p>
      <div className="mt-2 text-3xl font-black text-white">{value}</div>
      <p className="mt-2 text-sm leading-6 text-white/70">{detail}</p>
    </div>
  );
}

function ProjectControlCardView({ card }: { card: ProjectControlCard }) {
  const content = (
    <>
      <p className="text-xs font-black uppercase tracking-[0.22em] text-white/70">
        {card.eyebrow}
      </p>

      <h3 className="mt-2 text-xl font-black text-white">{card.title}</h3>

      <p className="mt-3 text-sm leading-6 text-white/70">{card.body}</p>

      <span className={`${buttonClass} mt-4`}>{card.actionLabel}</span>
    </>
  );

  if (card.href) {
    return (
      <Link href={card.href} className="block rounded-3xl transition-transform hover:-translate-y-0.5">
        <article className={insetPanelClass}>{content}</article>
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={card.onClick}
      disabled={card.disabled}
      className="block w-full rounded-3xl text-left transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <article className={insetPanelClass}>{content}</article>
    </button>
  );
}

function ProjectControlCenter({
  projectCount,
  selectedCount,
  hasProjects,
  hasSelectedProjects,
  loadingProjects,
  onRefresh,
  onDownloadSelected,
}: {
  projectCount: number;
  selectedCount: number;
  hasProjects: boolean;
  hasSelectedProjects: boolean;
  loadingProjects: boolean;
  onRefresh: () => void;
  onDownloadSelected: () => void;
}) {
  const cards: ProjectControlCard[] = [
    {
      eyebrow: "Continue work",
      title: "Open Existing Project",
      body: "Use the project list below to open a saved workspace, review tracks, and continue work.",
      actionLabel: hasProjects ? "Go To Project List" : "Create First Project",
      href: "#project-list",
    },
    {
      eyebrow: "Start new",
      title: "Create New Project",
      body: "Use the create panel to start a fresh music, education, game, experiment, or collaboration project.",
      actionLabel: "Go To Create",
      href: "#create-project",
    },
    {
      eyebrow: "Export",
      title: "Download Selected",
      body: "Select one or more project records, then download them as one project-folder JSON package.",
      actionLabel: hasSelectedProjects ? "Download Selected" : "Select Projects First",
      onClick: onDownloadSelected,
      disabled: !hasSelectedProjects,
    },
    {
      eyebrow: "Recovery path",
      title: "Need Project Help?",
      body: "Open Help and search for project overview, project tracks, setlist, project metadata, or send to project.",
      actionLabel: "Open Help",
      href: "/help",
    },
    {
      eyebrow: "Fresh data",
      title: "Refresh Projects",
      body: "Reload projects from Supabase if the list looks stale after creating or changing project data.",
      actionLabel: loadingProjects ? "Refreshing" : "Refresh List",
      onClick: onRefresh,
      disabled: loadingProjects,
    },
    {
      eyebrow: "Current state",
      title: "Project Selection",
      body: `${selectedCount} selected out of ${projectCount} total projects. Use Select, Select All, Clear, and Download below.`,
      actionLabel: "Review List",
      href: "#project-list",
    },
  ];

  return (
    <section className={panelClass}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className={eyebrowClass}>Project Control Center</p>

          <h2 className="mt-2 text-3xl font-black tracking-tight text-white">
            Choose what you want to do with projects
          </h2>

          <p className="mt-3 max-w-4xl text-base leading-7 text-white/70">
            Projects are the main workspace for organizing tracks, continuing
            sessions, exporting records, and opening deeper project tools.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-white/20 bg-black px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-white">
            {projectCount} Projects
          </span>
          <span className="rounded-full border border-white/20 bg-black px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-white">
            {selectedCount} Selected
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <ProjectControlCardView key={card.title} card={card} />
        ))}
      </div>
    </section>
  );
}

function ProjectRecentActivityPanel() {
  return (
    <section className={panelClass}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className={eyebrowClass}>Recent Activity</p>

          <h2 className="mt-2 text-2xl font-black text-white">
            Project history placeholder
          </h2>

          <p className={`mt-3 max-w-4xl ${subTextClass}`}>
            This section is intentionally a placeholder for now. Later it can
            show recently opened projects, recent track changes, project
            downloads, setlist edits, and metadata updates.
          </p>
        </div>

        <span className="rounded-full border border-white/20 bg-black px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-white/70">
          Planned
        </span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {[
          "Recently opened projects",
          "Recent project track changes",
          "Recent exports and downloads",
        ].map((item) => (
          <div key={item} className="rounded-2xl border border-white/15 bg-black p-4">
            <p className="text-sm font-black text-white">{item}</p>
            <p className="mt-2 text-sm leading-6 text-white/70">
              Coming later after the stable project foundation is protected.
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function WorkspaceProjectsPage() {
  const { user, loading } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedProjects = useMemo(
    () => projects.filter((project) => selectedIds.includes(project.id)),
    [projects, selectedIds],
  );

  const musicProjectCount = useMemo(
    () => projects.filter((project) => project.kind === "music").length,
    [projects],
  );

  const sharedOrPublicProjectCount = useMemo(
    () =>
      projects.filter((project) => project.visibility !== "private").length,
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

  function selectAllProjects() {
    setSelectedIds(projects.map((project) => project.id));
  }

  function clearSelectedProjects() {
    setSelectedIds([]);
  }

  function downloadProject(project: Project) {
    downloadJsonFile(
      `${slugifyFileName(project.title)}-${project.id}.json`,
      createProjectDownloadPayload([project]),
    );
  }

  function downloadSelectedProjects() {
    if (selectedProjects.length === 0) return;

    downloadJsonFile(
      `muzes-garden-project-folder-${new Date().toISOString().slice(0, 10)}.json`,
      createProjectDownloadPayload(selectedProjects),
    );
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
    <main className="min-h-screen bg-black px-5 py-8 text-white">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className={panelClass}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className={eyebrowClass}>Workspace</p>
              <h1 className="mt-2 text-4xl font-black tracking-tight text-white">
                Your Projects
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-white/70">
                Create, open, select, and download project records to your
                computer. Multi-select downloads are saved as one project-folder
                JSON package.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
              <button
                type="button"
                className={buttonClass}
                onClick={loadProjects}
                disabled={loadingProjects}
              >
                Refresh
              </button>

              <button
                type="button"
                className={buttonClass}
                onClick={selectAllProjects}
                disabled={projects.length === 0}
              >
                Select All
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
                Download
              </button>
            </div>
          </div>
        </header>

        <ProjectControlCenter
          projectCount={projects.length}
          selectedCount={selectedProjects.length}
          hasProjects={projects.length > 0}
          hasSelectedProjects={hasSelectedProjects}
          loadingProjects={loadingProjects}
          onRefresh={loadProjects}
          onDownloadSelected={downloadSelectedProjects}
        />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ProjectStatCard
            label="Total Projects"
            value={projects.length}
            detail="All project records currently loaded."
          />

          <ProjectStatCard
            label="Selected"
            value={selectedProjects.length}
            detail="Projects ready for batch download."
          />

          <ProjectStatCard
            label="Music"
            value={musicProjectCount}
            detail="Projects marked as music workspaces."
          />

          <ProjectStatCard
            label="Shared / Public"
            value={sharedOrPublicProjectCount}
            detail="Projects not marked private."
          />
        </section>

        <ProjectRecentActivityPanel />

        {errorMsg ? (
          <section className={panelClass}>
            <p className="font-black text-white">Project message</p>
            <p className="mt-2 text-sm text-white/70">{errorMsg}</p>
          </section>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <form
            id="create-project"
            action={onCreate}
            className={panelClass}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className={eyebrowClass}>New Project</p>
                <h2 className="mt-2 text-2xl font-black text-white">
                  Create Project
                </h2>
              </div>

              <button className={buttonClass} type="submit" disabled={creating}>
                {creating ? "Creating" : "Create"}
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="text-sm font-black text-white">Title</span>
                <input
                  className={`${inputClass} mt-2`}
                  name="title"
                  placeholder="Project title"
                  required
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-white">
                  Description
                </span>
                <textarea
                  className={`${inputClass} mt-2 min-h-28 resize-y`}
                  name="description"
                  placeholder="Project notes"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-white">Kind</span>
                <select className={`${selectClass} mt-2`} name="kind">
                  <option value="music">Music</option>
                  <option value="education">Education</option>
                  <option value="game">Game</option>
                  <option value="experiment">Experiment</option>
                  <option value="collab">Collaboration</option>
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-black text-white">
                  Visibility
                </span>
                <select className={`${selectClass} mt-2`} name="visibility">
                  <option value="private">Private</option>
                  <option value="shared">Shared</option>
                  <option value="public">Public</option>
                </select>
              </label>
            </div>
          </form>

          <section id="project-list" className={panelClass}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className={eyebrowClass}>Project List</p>
                <h2 className="mt-2 text-2xl font-black text-white">
                  {projects.length} Projects
                </h2>
              </div>

              <p className="text-sm font-black text-white/70">
                Selected: {selectedProjects.length}
              </p>
            </div>

            <div className="mt-5 space-y-3">
              {loadingProjects ? (
                <p className="rounded-2xl border border-white/20 bg-black p-4 text-white">
                  Loading projects...
                </p>
              ) : null}

              {!loadingProjects && projects.length === 0 ? (
                <p className="rounded-2xl border border-white/20 bg-black p-4 text-white">
                  No projects yet. Use Create Project to make the first project
                  workspace.
                </p>
              ) : null}

              {projects.map((project) => {
                const isActive = selectedIds.includes(project.id);

                return (
                  <article
                    key={project.id}
                    className="rounded-3xl border border-white/20 bg-black p-4"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-xl font-black text-white">
                            {project.title}
                          </h3>

                          {isActive ? (
                            <span className="rounded-full border border-white/20 bg-black px-3 py-1 text-xs font-black text-white">
                              Selected
                            </span>
                          ) : null}
                        </div>

                        <p className="mt-2 text-sm font-bold text-white/70">
                          {formatKind(project.kind)} • Updated{" "}
                          {formatDate(project.updated_at)}
                        </p>

                        {project.description ? (
                          <p className="mt-3 text-sm leading-6 text-white/70">
                            {project.description}
                          </p>
                        ) : null}
                      </div>

                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:min-w-[420px]">
                        <button
                          type="button"
                          className={buttonClass}
                          onClick={() => goToProject(project.id)}
                        >
                          Open
                        </button>

                        <button
                          type="button"
                          className={buttonClass}
                          onClick={() => toggleSelectedProject(project.id)}
                        >
                          {isActive ? "Unselect" : "Select"}
                        </button>

                        <button
                          type="button"
                          className={buttonClass}
                          onClick={() => downloadProject(project)}
                        >
                          Download
                        </button>

                        <Link href="/workspace" className={buttonClass}>
                          Workspace
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </section>
      </section>
    </main>
  );
}
