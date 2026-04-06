"use client";

import Link from "next/link";
import { useAuth } from "../../components/AuthProvider";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseProjects } from "../../../lib/getSupabaseProjects";
import { createSupabaseProject } from "../../../lib/createSupabaseProject";
import * as supabaseClientModule from "../../../lib/supabaseClient";

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

const supabase: any =
  (supabaseClientModule as any).supabase ??
  (supabaseClientModule as any).default ??
  (supabaseClientModule as any).client ??
  (supabaseClientModule as any).supabaseClient;

function formatKind(kind: ProjectKind) {
  switch (kind) {
    case "music": return "Music";
    case "education": return "Education";
    case "game": return "Game";
    case "experiment": return "Experiment";
    case "collab": return "Collaboration";
    default: return "Project";
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
  const { user, loading } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [loadingProjects, setLoadingProjects] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newKind, setNewKind] = useState<ProjectKind>("music");
  const [newVis, setNewVis] = useState<ProjectVisibility>("private");

  const selectedProject = useMemo(
    () => (selectedId ? projects.find((p) => p.id === selectedId) : null),
    [projects, selectedId]
  );

  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editKind, setEditKind] = useState<ProjectKind>("music");
  const [editVis, setEditVis] = useState<ProjectVisibility>("private");

  function goToProject(id: string) {
    if (!id) return;
    window.location.href = `/workspace/projects/${id}`;
  }

  useEffect(() => {
    if (!selectedProject) return;
    setEditTitle(selectedProject.title ?? "");
    setEditDesc(selectedProject.description ?? "");
    setEditKind(selectedProject.kind);
    setEditVis(selectedProject.visibility);
  }, [selectedProject?.id]);

  async function loadProjects() {
    setLoadingProjects(true);
    try {
      const rows = await getSupabaseProjects();
      setProjects(rows as any);
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to load projects");
    } finally {
      setLoadingProjects(false);
    }
  }

  useEffect(() => {
    if (loading || !user) return;
    loadProjects();
  }, [loading, user?.id]);

  async function onCreate() {
    const title = clampTitle(newTitle);
    if (!title) return;

    setCreating(true);
    try {
      const created = await createSupabaseProject({
        title,
        description: newDesc,
        kind: newKind,
        visibility: newVis,
      });

      await loadProjects();
      goToProject(created.id);
    } finally {
      setCreating(false);
    }
  }

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <main className="mx-auto max-w-2xl p-6 space-y-6">
      <h1 className="text-2xl font-bold">Your Projects</h1>

      {/* CREATE PROJECT */}
      <section className="rounded-xl border p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-medium">Create Project</div>

          <button
            className="rounded bg-black px-3 py-2 text-sm text-white"
            onClick={onCreate}
            disabled={creating}
          >
            {creating ? "Creating…" : "Create"}
          </button>
        </div>

        <input
          className="w-full rounded border px-3 py-2 text-sm"
          placeholder="Project title"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
      </section>

      {/* PROJECT LIST */}
      <section className="rounded-xl border p-5 space-y-3">
        {projects.map((p) => {
          const isActive = p.id === selectedId;

          return (
            <div
              key={p.id}
              className={`rounded-lg border p-4 ${isActive ? "bg-zinc-50" : ""}`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{p.title}</div>
                  <div className="text-xs text-zinc-500">
                    {formatKind(p.kind)} • {formatDate(p.updated_at)}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    className="rounded bg-black px-3 py-2 text-sm text-white"
                    onClick={() => goToProject(p.id)}
                  >
                    Open
                  </button>

                  <button
                    className="rounded border px-3 py-2 text-sm"
                    onClick={() => setSelectedId(p.id)}
                  >
                    {isActive ? "Selected" : "Select"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <Link href="/workspace" className="text-sm underline">
        Back to Workspace
      </Link>
    </main>
  );
}