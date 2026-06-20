import Link from "next/link";
import {
  buttonClass,
  eyebrowClass,
  insetPanelClass,
  panelClass,
  subTextClass,
} from "./projectPageStyles";

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

export function ProjectDetailsPanel({
  projectCount,
  selectedCount,
  musicProjectCount,
  sharedOrPublicProjectCount,
  loadingProjects,
  hasSelectedProjects,
  onRefresh,
  onDownloadSelected,
}: {
  projectCount: number;
  selectedCount: number;
  musicProjectCount: number;
  sharedOrPublicProjectCount: number;
  loadingProjects: boolean;
  hasSelectedProjects: boolean;
  onRefresh: () => void;
  onDownloadSelected: () => void;
}) {
  return (
    <section className={panelClass}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className={eyebrowClass}>Project Details</p>
          <h2 className="mt-2 text-2xl font-black text-white">
            Project control center
          </h2>
          <p className={`mt-3 max-w-4xl ${subTextClass}`}>
            Project details, stats, selection tools, refresh, and download
            helpers live here so the main Projects page stays clean.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={buttonClass}
            onClick={onRefresh}
            disabled={loadingProjects}
          >
            {loadingProjects ? "Refreshing" : "Refresh"}
          </button>

          <button
            type="button"
            className={buttonClass}
            onClick={onDownloadSelected}
            disabled={!hasSelectedProjects}
          >
            Download Selected
          </button>

          <Link href="/help" className={buttonClass}>
            Help
          </Link>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ProjectStatCard
          label="Total Projects"
          value={projectCount}
          detail="All project records currently loaded."
        />

        <ProjectStatCard
          label="Selected"
          value={selectedCount}
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
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className={insetPanelClass}>
          <p className="text-sm font-black text-white">Open Existing Project</p>
          <p className="mt-2 text-sm leading-6 text-white/70">
            Use the project list below to open a saved workspace.
          </p>
        </div>

        <div className={insetPanelClass}>
          <p className="text-sm font-black text-white">Create New Project</p>
          <p className="mt-2 text-sm leading-6 text-white/70">
            Use the create panel to start a new workspace.
          </p>
        </div>

        <div className={insetPanelClass}>
          <p className="text-sm font-black text-white">Download System</p>
          <p className="mt-2 text-sm leading-6 text-white/70">
            File downloads are active. Folder downloads and duplicate handling
            come next.
          </p>
        </div>
      </div>
    </section>
  );
}