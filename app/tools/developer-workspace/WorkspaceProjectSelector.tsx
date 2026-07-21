"use client";

import { useCallback, useEffect, useState } from "react";

type WorkspaceProject = {
  id: string;
  name: string;
  rootPath: string;
  framework: "nextjs" | "typescript";
  packageName: string | null;
  status: "available" | "missing";
};

type RegistryResponse = {
  activeProjectId: string | null;
  projects: WorkspaceProject[];
};

function errorMessage(value: unknown, fallback: string): string {
  if (typeof value === "object" && value !== null && "error" in value && typeof value.error === "string") {
    return value.error;
  }
  return fallback;
}

export default function WorkspaceProjectSelector() {
  const [projects, setProjects] = useState<WorkspaceProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState("");
  const [projectPath, setProjectPath] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const loadProjects = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/developer-workspace/projects", { cache: "no-store" });
      const body: unknown = await response.json();
      if (!response.ok) throw new Error(errorMessage(body, "Projects could not be loaded."));
      const registry = body as RegistryResponse;
      setProjects(registry.projects);
      setActiveProjectId(registry.activeProjectId ?? "");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Projects could not be loaded.");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  async function changeProject(projectId: string) {
    if (!projectId || projectId === activeProjectId) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/developer-workspace/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "select", projectId }),
      });
      const body: unknown = await response.json();
      if (!response.ok) throw new Error(errorMessage(body, "Project could not be selected."));
      window.location.reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Project could not be selected.");
      setBusy(false);
    }
  }

  async function registerProject() {
    const path = projectPath.trim();
    if (!path) {
      setError("Enter the full folder path for a TypeScript project.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/developer-workspace/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "register", path }),
      });
      const body: unknown = await response.json();
      if (!response.ok) throw new Error(errorMessage(body, "Project could not be registered."));
      window.location.reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Project could not be registered.");
      setBusy(false);
    }
  }

  const active = projects.find((project) => project.id === activeProjectId) ?? null;

  return (
    <section className="mt-4 rounded-xl border border-cyan-300/25 bg-[#0b1720] p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[260px] flex-1">
          <label htmlFor="workspace-project" className="text-xs font-black uppercase tracking-wider text-cyan-200">
            Active code project
          </label>
          <select
            id="workspace-project"
            value={activeProjectId}
            onChange={(event) => void changeProject(event.target.value)}
            disabled={busy || projects.length === 0}
            className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white disabled:opacity-50"
          >
            {projects.length === 0 ? <option value="">No registered projects</option> : null}
            {projects.map((project) => (
              <option key={project.id} value={project.id} disabled={project.status === "missing"}>
                {project.name} ({project.framework === "nextjs" ? "Next.js" : "TypeScript"})
              </option>
            ))}
          </select>
          {active ? <div className="mt-1 truncate text-xs text-white/45" title={active.rootPath}>{active.rootPath}</div> : null}
        </div>

        <div className="min-w-[300px] flex-[1.4]">
          <label htmlFor="workspace-project-path" className="text-xs font-black uppercase tracking-wider text-white/55">
            Add another project folder
          </label>
          <div className="mt-1 flex gap-2">
            <input
              id="workspace-project-path"
              value={projectPath}
              onChange={(event) => setProjectPath(event.target.value)}
              onKeyDown={(event) => { if (event.key === "Enter") void registerProject(); }}
              placeholder="C:\\path\\to\\typescript-project"
              disabled={busy}
              className="min-w-0 flex-1 rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => void registerProject()}
              disabled={busy}
              className="rounded-lg border border-cyan-300/50 px-4 py-2 text-sm font-bold text-cyan-100 hover:bg-cyan-300/10 disabled:opacity-50"
            >
              Add project
            </button>
          </div>
        </div>
      </div>
      {error ? <div className="mt-3 rounded-lg border border-red-400/40 bg-red-400/10 p-2 text-sm text-red-100">{error}</div> : null}
    </section>
  );
}
