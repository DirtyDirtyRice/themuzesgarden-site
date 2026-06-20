import type { Project } from "./projectPageTypes";
import { buttonClass, eyebrowClass, panelClass } from "./projectPageStyles";
import { formatDate, formatKind } from "./projectPageHelpers";

export function ProjectListPanel({
  projects,
  filteredProjects,
  selectedIds,
  selectedCount,
  loadingProjects,
  onOpenProject,
  onToggleSelected,
  onDownloadProject,
  onDownloadProjectFolder,
}: {
  projects: Project[];
  filteredProjects: Project[];
  selectedIds: string[];
  selectedCount: number;
  loadingProjects: boolean;
  onOpenProject: (id: string) => void;
  onToggleSelected: (id: string) => void;
  onDownloadProject: (project: Project) => void;
  onDownloadProjectFolder: (project: Project) => void;
}) {
  return (
    <section id="project-list" className={panelClass}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={eyebrowClass}>Project List</p>
          <h2 className="mt-2 text-2xl font-black text-white">
            {filteredProjects.length} Projects
          </h2>
        </div>

        <p className="text-sm font-black text-white/70">
          Selected: {selectedCount}
        </p>
      </div>

      <div className="mt-5 max-h-[48rem] space-y-3 overflow-y-auto pr-1">
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

        {!loadingProjects &&
        projects.length > 0 &&
        filteredProjects.length === 0 ? (
          <p className="rounded-2xl border border-white/20 bg-black p-4 text-white">
            No projects found for that search.
          </p>
        ) : null}

        {filteredProjects.map((project) => {
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
                    {formatKind(project.kind)} · {project.visibility} · Updated{" "}
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
                    onClick={() => onOpenProject(project.id)}
                  >
                    Open
                  </button>

                  <button
                    type="button"
                    className={buttonClass}
                    onClick={() => onToggleSelected(project.id)}
                  >
                    {isActive ? "Unselect" : "Select"}
                  </button>

                  <button
                    type="button"
                    className={buttonClass}
                    onClick={() => onDownloadProject(project)}
                  >
                    Download File
                  </button>

                  <button
                    type="button"
                    className={buttonClass}
                    onClick={() => onDownloadProjectFolder(project)}
                  >
                    Download Folder
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}