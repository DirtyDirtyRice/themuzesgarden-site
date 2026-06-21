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
import {
  createProjectDownloadPayload,
  formatDate,
  formatKind,
} from "./projectPageHelpers";
import {
  createDownloadStamp,
  downloadJsonFile,
} from "../../shared/downloads/downloadFileHelpers";

export function ProjectSearchPanel({
  projects,
  filteredProjects,
  searchMode,
  searchValue,
  selectedProjectId,
  uploadingProjectId,
  onSearchModeChange,
  onSearchValueChange,
  onSelectedProjectChange,
  onOpenSelectedProject,
  onUploadFilesToProject,
}: {
  projects: Project[];
  filteredProjects: Project[];
  searchMode: ProjectSearchMode;
  searchValue: string;
  selectedProjectId: string;
  uploadingProjectId: string | null;
  onSearchModeChange: (mode: ProjectSearchMode) => void;
  onSearchValueChange: (value: string) => void;
  onSelectedProjectChange: (id: string) => void;
  onOpenSelectedProject: () => void;
  onUploadFilesToProject: (projectId: string, files: File[]) => void;
}) {
  function openProject(projectId: string) {
    if (!projectId) return;
    window.location.href = `/workspace/projects/${projectId}`;
  }

  function downloadProject(project: Project) {
    downloadJsonFile({
      fileName: `muzes-garden-project-${createDownloadStamp()}.json`,
      payload: createProjectDownloadPayload([project]),
    });
  }

  function downloadProjectFolder(project: Project) {
    downloadJsonFile({
      fileName: `muzes-garden-project-folder-${createDownloadStamp()}.json`,
      payload: createProjectDownloadPayload([project]),
    });
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

      <div className="mt-5 space-y-3">
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

        <div className="space-y-3 pt-2">
          <div>
            <div className={eyebrowClass}>Project Cards</div>
            <div className="mt-1 text-xs text-white/70">
              Open, upload files, upload folders, and download project data from
              each card.
            </div>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="rounded-2xl border border-white/20 bg-black p-4 text-sm text-white/70">
              No matching projects.
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredProjects.map((project) => {
                const uploading = uploadingProjectId === project.id;
                const selected = selectedProjectId === project.id;

                return (
                  <div
                    key={project.id}
                    className={[
                      "rounded-2xl border bg-black p-4",
                      selected ? "border-white/40" : "border-white/20",
                    ].join(" ")}
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
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
                        </div>

                        <div className="mt-1 text-xs text-white/70">
                          {formatKind(project.kind)} · {project.visibility}
                        </div>

                        <div className="mt-1 text-xs text-white/70">
                          Updated: {formatDate(project.updated_at)}
                        </div>

                        {project.description ? (
                          <div className="mt-2 text-sm leading-6 text-white/70">
                            {project.description}
                          </div>
                        ) : null}
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
                          disabled={uploading}
                          onFilesSelected={(files) =>
                            onUploadFilesToProject(project.id, files)
                          }
                        />

                        <SharedDownloadButtons
                          onDownloadFiles={() => downloadProject(project)}
                          onDownloadFolder={() => downloadProjectFolder(project)}
                        />
                      </div>
                    </div>

                    {uploading ? (
                      <div className="mt-3 rounded-xl border border-white/20 bg-black p-3 text-xs text-white/70">
                        Uploading into this project...
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