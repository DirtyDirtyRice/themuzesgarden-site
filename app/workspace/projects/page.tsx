"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../components/AuthProvider";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseProjects } from "../../../lib/getSupabaseProjects";
import { createSupabaseProject } from "../../../lib/createSupabaseProject";
import * as supabaseClientModule from "../../../lib/supabaseClient";

/**
 * PROJECT CONTRACT v1
 */
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

// Match your existing "safe export sniff" approach
const supabase: any =
  (supabaseClientModule as any).supabase ??
  (supabaseClientModule as any).default ??
  (supabaseClientModule as any).client ??
  (supabaseClientModule as any).supabaseClient;

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

function clampTitle(s: string) {
  return s.trim().slice(0, 120);
}

export default function WorkspaceProjectsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [loadingProjects, setLoadingProjects] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Create form
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newKind, setNewKind] = useState<ProjectKind>("music");
  const [newVis, setNewVis] = useState<ProjectVisibility>("private");

  // Edit form (selected)
  const selectedProject = useMemo(
    () => (selectedId ? projects.find((p) => p.id === selectedId) : null),
    [projects, selectedId]
  );

  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editKind, setEditKind] = useState<ProjectKind>("music");
  const [editVis, setEditVis] = useState<ProjectVisibility>("private");

  // When selection changes, load edit fields
  useEffect(() => {
    if (!selectedProject) return;
    setEditTitle(selectedProject.title ?? "");
    setEditDesc(selectedProject.description ?? "");
    setEditKind(selectedProject.kind);
    setEditVis(selectedProject.visibility);
  }, [selectedProject?.id]); // intentionally keyed by id

  async function loadProjects(opts?: { keepSelection?: boolean }) {
    setErrorMsg(null);
    setLoadingProjects(true);

    try {
      const rows = await getSupabaseProjects();
      const list = rows as any as Project[];
      setProjects(list);

      if (!opts?.keepSelection) {
        setSelectedId(null);
      } else {
        // if selection no longer exists, close it
        if (selectedId && !list.some((p) => p.id === selectedId)) {
          setSelectedId(null);
        }
      }
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to load projects");
    } finally {
      setLoadingProjects(false);
    }
  }

  useEffect(() => {
    // Only attempt loading when auth is resolved
    if (loading) return;
    if (!user) return;

    loadProjects({ keepSelection: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user?.id]);

  async function onCreate() {
    setErrorMsg(null);

    const title = clampTitle(newTitle);
    if (!title) {
      setErrorMsg("Title is required.");
      return;
    }

    setCreating(true);
    try {
      const created = await createSupabaseProject({
        title,
        description: newDesc.trim() ? newDesc.trim() : undefined,
        kind: newKind,
        visibility: newVis,
      });

      await loadProjects({ keepSelection: true });

      // reset form
      setNewTitle("");
      setNewDesc("");
      setNewKind("music");
      setNewVis("private");

      // navigate into the real project details route
      router.push(`/workspace/projects/${created.id}`);
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Create failed");
    } finally {
      setCreating(false);
    }
  }

  async function onSaveSelected() {
    if (!selectedProject) return;

    setErrorMsg(null);
    const title = clampTitle(editTitle);
    if (!title) {
      setErrorMsg("Title is required.");
      return;
    }

    if (!supabase) {
      setErrorMsg("Supabase client not found.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title,
        description: editDesc.trim() ? editDesc.trim() : null,
        kind: editKind,
        visibility: editVis,
      };

      const { error } = await supabase
        .from("projects")
        .update(payload)
        .eq("id", selectedProject.id);

      if (error) throw new Error(error.message);

      await loadProjects({ keepSelection: true });
      setSelectedId(selectedProject.id);
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    setErrorMsg(null);

    const ok = window.confirm(
      "Delete this project? This cannot be undone."
    );
    if (!ok) return;

    if (!supabase) {
      setErrorMsg("Supabase client not found.");
      return;
    }

    setDeletingId(id);
    try {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw new Error(error.message);

      // If we deleted the selected project, close it
      if (selectedId === id) setSelectedId(null);

      await loadProjects({ keepSelection: true });
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) return <div className="p-6">Loading...</div>;

  if (!user) {
    return (
      <main className="mx-auto max-w-2xl p-6 space-y-4">
        <h1 className="text-2xl font-bold">Projects</h1>

        <div className="rounded-xl border p-5 space-y-2">
          <div className="text-sm text-zinc-600">
            You must be signed in to access your projects.
          </div>

          <Link
            href="/members"
            className="inline-block rounded bg-black px-4 py-2 text-white"
          >
            Go to Members Sign In
          </Link>
        </div>
      </main>
    );
  }

  const emptyState = !loadingProjects && projects.length === 0;

  return (
    <main className="mx-auto max-w-2xl p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Your Projects</h1>
        <p className="text-sm text-zinc-600">Project space for {user.email}</p>
      </header>

      {/* CREATE */}
      <section className="rounded-xl border p-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="font-medium">Create Project</div>
          <button
            className="rounded bg-black px-3 py-2 text-sm text-white disabled:opacity-60"
            onClick={onCreate}
            disabled={creating}
          >
            {creating ? "Creating…" : "Create"}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <label className="space-y-1">
            <div className="text-sm font-medium">Title</div>
            <input
              className="w-full rounded border px-3 py-2 text-sm"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="My new project"
            />
          </label>

          <label className="space-y-1">
            <div className="text-sm font-medium">Description</div>
            <textarea
              className="w-full rounded border px-3 py-2 text-sm"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Optional"
              rows={3}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1">
              <div className="text-sm font-medium">Kind</div>
              <select
                className="w-full rounded border px-3 py-2 text-sm"
                value={newKind}
                onChange={(e) => setNewKind(e.target.value as ProjectKind)}
              >
                <option value="music">Music</option>
                <option value="education">Education</option>
                <option value="game">Game</option>
                <option value="experiment">Experiment</option>
                <option value="collab">Collaboration</option>
              </select>
            </label>

            <label className="space-y-1">
              <div className="text-sm font-medium">Visibility</div>
              <select
                className="w-full rounded border px-3 py-2 text-sm"
                value={newVis}
                onChange={(e) =>
                  setNewVis(e.target.value as ProjectVisibility)
                }
              >
                <option value="private">Private</option>
                <option value="shared">Shared</option>
                <option value="public">Public</option>
              </select>
            </label>
          </div>
        </div>

        {errorMsg ? (
          <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {errorMsg}
          </div>
        ) : null}
      </section>

      {/* LIST */}
      <section className="rounded-xl border p-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="font-medium">
            {loadingProjects ? "Loading Projects…" : "Projects"}
          </div>

          <div className="flex items-center gap-2">
            {selectedProject ? (
              <button
                className="rounded border px-3 py-2 text-sm"
                onClick={() => setSelectedId(null)}
              >
                Close Selected
              </button>
            ) : null}

            <button
              className="rounded border px-3 py-2 text-sm disabled:opacity-60"
              onClick={() => loadProjects({ keepSelection: true })}
              disabled={loadingProjects}
            >
              Refresh
            </button>
          </div>
        </div>

        {emptyState ? (
          <div className="text-sm text-zinc-600">
            No projects yet. Create one above.
          </div>
        ) : null}

        <div className="space-y-3 pt-2">
          {projects.map((p) => {
            const isActive = p.id === selectedId;

            return (
              <div
                key={p.id}
                className={`rounded-lg border p-4 space-y-2 ${
                  isActive ? "bg-zinc-50" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <button
                      type="button"
                      className="text-left font-medium underline-offset-2 hover:underline"
                      onClick={() => router.push(`/workspace/projects/${p.id}`)}
                      title="Open project details"
                    >
                      {p.title}
                    </button>

                    {p.description ? (
                      <div className="text-sm text-zinc-600">{p.description}</div>
                    ) : null}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="text-xs rounded-full border px-2 py-1 text-zinc-600">
                      {formatKind(p.kind)}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        className="rounded bg-black px-3 py-2 text-sm text-white"
                        onClick={() => router.push(`/workspace/projects/${p.id}`)}
                        title="Open project details"
                      >
                        Open
                      </button>

                      <button
                        className="rounded border px-3 py-2 text-sm"
                        onClick={() => setSelectedId(p.id)}
                      >
                        {isActive ? "Selected" : "Select"}
                      </button>

                      <button
                        className="rounded border px-3 py-2 text-sm disabled:opacity-60"
                        onClick={() => onDelete(p.id)}
                        disabled={deletingId === p.id}
                        title="Delete project"
                      >
                        {deletingId === p.id ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-xs text-zinc-500">
                  <span>Visibility: {p.visibility}</span>
                  <span>•</span>
                  <span>Updated: {formatDate(p.updated_at)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SELECTED PROJECT */}
      <section className="rounded-xl border p-5 space-y-4">
        <div className="font-medium">Project Workspace</div>

        {!selectedProject ? (
          <div className="text-sm text-zinc-600">
            Select a project above to view/edit it here, or use Open to enter the full project page.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="font-medium">Edit Project</div>
                <button
                  className="rounded bg-black px-3 py-2 text-sm text-white disabled:opacity-60"
                  onClick={onSaveSelected}
                  disabled={saving}
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>

              <label className="space-y-1">
                <div className="text-sm font-medium">Title</div>
                <input
                  className="w-full rounded border px-3 py-2 text-sm"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </label>

              <label className="space-y-1">
                <div className="text-sm font-medium">Description</div>
                <textarea
                  className="w-full rounded border px-3 py-2 text-sm"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={3}
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1">
                  <div className="text-sm font-medium">Kind</div>
                  <select
                    className="w-full rounded border px-3 py-2 text-sm"
                    value={editKind}
                    onChange={(e) => setEditKind(e.target.value as ProjectKind)}
                  >
                    <option value="music">Music</option>
                    <option value="education">Education</option>
                    <option value="game">Game</option>
                    <option value="experiment">Experiment</option>
                    <option value="collab">Collaboration</option>
                  </select>
                </label>

                <label className="space-y-1">
                  <div className="text-sm font-medium">Visibility</div>
                  <select
                    className="w-full rounded border px-3 py-2 text-sm"
                    value={editVis}
                    onChange={(e) =>
                      setEditVis(e.target.value as ProjectVisibility)
                    }
                  >
                    <option value="private">Private</option>
                    <option value="shared">Shared</option>
                    <option value="public">Public</option>
                  </select>
                </label>
              </div>

              <div className="text-xs text-zinc-500">
                Updated: {formatDate(selectedProject.updated_at)} • Kind:{" "}
                {formatKind(selectedProject.kind)}
              </div>
            </div>

            <div className="rounded-lg border p-4 space-y-2">
              <div className="font-medium">Project details route</div>
              <div className="text-sm text-zinc-600">
                Open sends you to the full project page at
                <code className="px-1">/workspace/projects/[id]</code>.
              </div>
            </div>
          </div>
        )}
      </section>

      {/* NAV */}
      <section className="rounded-xl border p-5">
        <Link href="/workspace" className="rounded border px-3 py-2 text-sm">
          Back to Workspace
        </Link>
      </section>
    </main>
  );
}