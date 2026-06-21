import SharedDownloadButtons from "../../shared/downloads/SharedDownloadButtons";
import SharedUploadButtons from "../../shared/uploads/SharedUploadButtons";
import type { Project, ProjectSearchMode } from "./projectPageTypes";
import {
  buttonClass,
  eyebrowClass,
  inputClass,
  panelClass,
  selectClass,
} from "./projectPageStyles";
import { formatDate, formatKind } from "./projectPageHelpers";

export function ProjectSearchPanel({
  projects,
  filteredProjects,
  searchMode,
  searchValue,
  selectedProjectId,
  uploadingProjectId,
  downloadingProjectId,
  onSearchModeChange,
  onSearchValueChange,
  onSelectedProjectChange,
  onOpenSelectedProject,
  onUploadFilesToProject,
  onDownloadProjectFiles,
  onDownloadProjectFolder,
}: {
  projects: Project[];
  filteredProjects: Project[];
  searchMode: ProjectSearchMode;
  searchValue: string;
  selectedProjectId: string;
  uploadingProjectId: string | null;
  downloadingProjectId: string | null;
  onSearchModeChange: (mode: ProjectSearchMode) => void;
  onSearchValueChange: (value: string) => void;
  onSelectedProjectChange: (id: string) => void;
  onOpenSelectedProject: () => void;
  onUploadFilesToProject: (projectId: string, files: File[]) => void;
  onDownloadProjectFiles: (project: Project) => void;
  onDownloadProjectFolder: (project: Project) => void;
}) {
  function openProject(projectId: string) {
    if (!projectId) return;
    window.location.href = `/workspace/projects/${projectId}`;
  }

  return (
    <section className={panelClass}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className={eyebrowClass}>Search Projects</p>
          <h2 className="mt-2 text-2xl font-black text-white">Find Project</h2>
          <p className="mt-2 text-sm leading-6 text-white/70">
            {filteredProjects.length} matching of {projects.length} projects.
          </p>
        </div>

        <button
          type="button"
          className={buttonClass}
          onClick={onOpenSelectedProject}
          disabled={!selectedProjectId}
        >
          Open Selected
        </button>
      </div>

      <div className="mt-5 space-y-4">
        <label className="block">
          <span className="text-sm font-black text-white">
            Project Dropdown
          </span>

          <select
            value={selectedProjectId}
            onChange={(event) => onSelectedProjectChange(event.target.value)}
            className={`${selectClass} mt-2`}
          >
            <option value="">Choose a project to open...</option>

            {filteredProjects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-3 md:grid-cols-[220px_1fr]">
          <select
            value={searchMode}
            onChange={(event) =>
              onSearchModeChange(event.target.value as ProjectSearchMode)
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
              All projects are inside the cards below.
            </div>
          ) : (
            <input
              value={searchValue}
              onChange={(event) => onSearchValueChange(event.target.value)}
              className={inputClass}
              placeholder="Search projects..."
            />
          )}
        </div>

        <div className="rounded-2xl border border-white/20 bg-black p-4">
          <div className={eyebrowClass}>Project Card Actions</div>
          <div className="mt-2 grid gap-2 text-xs text-white/70 md:grid-cols-3">
            <div>
              <span className="font-black text-white">Open:</span> go straight
              into the project page.
            </div>
            <div>
              <span className="font-black text-white">Upload:</span> send files
              or folders directly into a project.
            </div>
            <div>
              <span className="font-black text-white">Download:</span> pull real
              linked audio from the project.
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <div>
            <div className={eyebrowClass}>Project Cards</div>
            <div className="mt-1 text-xs text-white/70">
              Each card now works like a mini project control center.
            </div>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="rounded-2xl border border-white/20 bg-black p-4 text-sm text-white/70">
              No matching projects.
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredProjects.map((project, index) => {
                const uploading = uploadingProjectId === project.id;
                const downloading = downloadingProjectId === project.id;
                const selected = selectedProjectId === project.id;
                const busy = uploading || downloading;

                return (
                  <div
                    key={project.id}
                    className={[
                      "rounded-2xl border bg-black p-4",
                      selected ? "border-white/40" : "border-white/20",
                    ].join(" ")}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-xl border border-white/25 bg-black px-2 py-1 text-[11px] font-bold text-white">
                            #{index + 1}
                          </span>

                          <button
                            type="button"
                            onClick={() => onSelectedProjectChange(project.id)}
                            className="text-left text-sm font-black text-white transition-transform duration-150 hover:scale-[1.02]"
                          >
                            {project.title}
                          </button>

                          {selected ? (
                            <span className="rounded-xl border border-white/25 bg-black px-2 py-1 text-[11px] font-bold text-white">
                              SELECTED
                            </span>
                          ) : null}

                          {busy ? (
                            <span className="rounded-xl border border-white/25 bg-black px-2 py-1 text-[11px] font-bold text-white">
                              BUSY
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="rounded-xl border border-white/25 bg-black px-2 py-1 text-[11px] font-bold text-white">
                            {formatKind(project.kind)}
                          </span>

                          <span className="rounded-xl border border-white/25 bg-black px-2 py-1 text-[11px] font-bold text-white">
                            {project.visibility}
                          </span>

                          <span className="rounded-xl border border-white/25 bg-black px-2 py-1 text-[11px] font-bold text-white">
                            PROJECT CARD
                          </span>
                        </div>

                        <div className="mt-2 text-xs text-white/70">
                          Updated: {formatDate(project.updated_at)}
                        </div>

                        <div className="mt-1 break-all text-xs text-white/70">
                          ID: {project.id}
                        </div>

                        {project.description ? (
                          <div className="mt-3 text-sm leading-6 text-white/70">
                            {project.description}
                          </div>
                        ) : (
                          <div className="mt-3 text-sm leading-6 text-white/70">
                            No description yet.
                          </div>
                        )}

                        <div className="mt-3 rounded-xl border border-white/15 bg-black p-3 text-xs text-white/70">
                          Computer → Project Card → Upload File / Upload Folder
                          → Library → Project. Download buttons pull linked audio
                          back from the project.
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 lg:items-end">
                        <div className="flex flex-wrap gap-2 lg:justify-end">
                          <button
                            type="button"
                            className={buttonClass}
                            onClick={() => openProject(project.id)}
                          >
                            Open
                          </button>

                          <button
                            type="button"
                            className={buttonClass}
                            onClick={() => onSelectedProjectChange(project.id)}
                          >
                            Select
                          </button>
                        </div>

                        <SharedUploadButtons
                          disabled={busy}
                          onFilesSelected={(files) =>
                            onUploadFilesToProject(project.id, files)
                          }
                        />

                        <SharedDownloadButtons
                          disabled={busy}
                          onDownloadFiles={() => onDownloadProjectFiles(project)}
                          onDownloadFolder={() =>
                            onDownloadProjectFolder(project)
                          }
                        />
                      </div>
                    </div>

                    {uploading ? (
                      <div className="mt-3 rounded-xl border border-white/20 bg-black p-3 text-xs text-white/70">
                        Uploading files into this project...
                      </div>
                    ) : null}

                    {downloading ? (
                      <div className="mt-3 rounded-xl border border-white/20 bg-black p-3 text-xs text-white/70">
                        Preparing real project audio downloads...
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}