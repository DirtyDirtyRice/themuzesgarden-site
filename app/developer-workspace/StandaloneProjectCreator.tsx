"use client";

import { useState } from "react";

type CreateResponse = {
  project: { name: string; rootPath: string };
  createdFiles: string[];
};

function apiError(value: unknown): string {
  return typeof value === "object" && value !== null && "error" in value && typeof value.error === "string"
    ? value.error
    : "The project could not be created.";
}

export default function StandaloneProjectCreator() {
  const [open, setOpen] = useState(false);
  const [parentDirectory, setParentDirectory] = useState("");
  const [projectName, setProjectName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<CreateResponse | null>(null);

  async function createProject() {
    if (!parentDirectory.trim() || !projectName.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/developer-workspace/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", parentDirectory: parentDirectory.trim(), projectName: projectName.trim() }),
      });
      const body: unknown = await response.json();
      if (!response.ok) throw new Error(apiError(body));
      setCreated(body as CreateResponse);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The project could not be created.");
    } finally {
      setBusy(false);
    }
  }

  if (created) {
    return (
      <section className="mx-4 mt-4 rounded-xl border border-emerald-300/30 bg-emerald-300/10 p-5">
        <div className="text-xs font-black uppercase tracking-[0.25em] text-emerald-200">Project created and registered</div>
        <h2 className="mt-1 text-xl font-black">{created.project.name}</h2>
        <div className="mt-1 break-all text-sm text-emerald-50/70">{created.project.rootPath}</div>
        <div className="mt-3 text-xs text-emerald-50/60">Created: {created.createdFiles.join(", ")}</div>
        <button type="button" onClick={() => window.location.reload()} className="mt-4 rounded-lg border border-emerald-200/40 px-4 py-2 text-sm font-black text-emerald-50">Open new project</button>
      </section>
    );
  }

  return (
    <section className="mx-4 mt-4 rounded-xl border border-violet-300/25 bg-[#0b1720] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><div className="text-xs font-black uppercase tracking-[0.25em] text-violet-300">Start from zero</div><h2 className="mt-1 text-xl font-black">Create a protected TypeScript project</h2><p className="mt-1 text-sm text-white/55">Creates a strict, buildable project and registers it as the active workspace.</p></div>
        <button type="button" onClick={() => setOpen((value) => !value)} className="rounded-lg border border-violet-300/40 px-4 py-2 text-sm font-black text-violet-100">{open ? "Close" : "Create new project"}</button>
      </div>
      {open ? <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_0.7fr_auto]">
        <label className="text-xs font-bold text-white/65">Parent development folder<input value={parentDirectory} onChange={(event) => setParentDirectory(event.target.value)} placeholder="C:\Users\name\projects" className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white" /></label>
        <label className="text-xs font-bold text-white/65">New project name<input value={projectName} onChange={(event) => setProjectName(event.target.value.toLowerCase())} placeholder="my-new-app" className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white" /></label>
        <button type="button" onClick={() => void createProject()} disabled={busy || !parentDirectory.trim() || !projectName.trim()} className="self-end rounded-lg border border-violet-300/50 px-5 py-2 text-sm font-black text-violet-100 disabled:opacity-40">{busy ? "Creating…" : "Create and register"}</button>
      </div> : null}
      {error ? <div className="mt-3 rounded-lg border border-red-300/40 bg-red-300/10 p-3 text-sm text-red-100">{error}</div> : null}
    </section>
  );
}
