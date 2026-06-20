import type { Project, ProjectSearchMode } from "./projectPageTypes";
import {
  buttonClass,
  eyebrowClass,
  inputClass,
  panelClass,
  selectClass,
} from "./projectPageStyles";

export function ProjectSearchPanel({
  projects,
  filteredProjects,
  searchMode,
  searchValue,
  selectedProjectId,
  onSearchModeChange,
  onSearchValueChange,
  onSelectedProjectChange,
  onOpenSelectedProject,
}: {
  projects: Project[];
  filteredProjects: Project[];
  searchMode: ProjectSearchMode;
  searchValue: string;
  selectedProjectId: string;
  onSearchModeChange: (mode: ProjectSearchMode) => void;
  onSearchValueChange: (value: string) => void;
  onSelectedProjectChange: (id: string) => void;
  onOpenSelectedProject: () => void;
}) {
  return (
    <section className={panelClass}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className={eyebrowClass}>Search Projects</p>
          <h2 className="mt-2 text-2xl font-black text-white">
            Find Project
          </h2>
          <p className="mt-2 text-sm leading-6 text-white/70">
            {filteredProjects.length} shown of {projects.length} projects.
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
            <option value="">Show matching projects</option>
            {projects.map((project) => (
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
              Showing all projects. Use the dropdown when the project list gets
              large.
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
      </div>
    </section>
  );
}