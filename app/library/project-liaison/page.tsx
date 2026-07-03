"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import TopNav from "../../components/TopNav";
import { supabase } from "../../../lib/supabaseClient";
import { getUnifiedTrackLibrary } from "../../../lib/tracks/unifiedTrackLibrary";
import { getSupabaseProjects, type ProjectRow } from "../../../lib/getSupabaseProjects";
import { addTracksToSupabaseProject } from "../../../lib/addTracksToSupabaseProject";

type TrackLike = { id?: unknown; title?: unknown; path?: unknown };

type TrackGroup = {
  id: string;
  title: string;
  tracks: TrackLike[];
};

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function rawTitle(track: TrackLike) {
  const title = clean(track.title);
  if (title) return title;
  const file = clean(track.path).split("/").pop() ?? "";
  return file.replace(/\.[^.]+$/, "") || "Untitled";
}

function baseTitle(value: string) {
  return value
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/\s*\(\d+\)\s*$/g, "")
    .replace(/\s+copy\s*\d+$/i, "")
    .replace(/\s+/g, " ")
    .trim() || "Untitled";
}

function fileTitle(value: string) {
  return `${baseTitle(value)}.mp3`;
}

function groupKey(value: string) {
  return baseTitle(value).toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function buildGroups(tracks: TrackLike[]) {
  const map = new Map<string, TrackGroup>();

  for (const track of tracks) {
    const id = clean(track.id);
    if (!id) continue;

    const title = rawTitle(track);
    const key = groupKey(title);
    const existing = map.get(key);

    if (existing) {
      existing.tracks.push(track);
    } else {
      map.set(key, { id: key, title: fileTitle(title), tracks: [track] });
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    a.title.localeCompare(b.title, undefined, { sensitivity: "base" })
  );
}

export default function ProjectLiaisonPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [tracks, setTracks] = useState<TrackLike[]>([]);
  const [projectId, setProjectId] = useState("");
  const [checkedIds, setCheckedIds] = useState<Set<string>>(() => new Set());
  const [sentGroupIds, setSentGroupIds] = useState<Set<string>>(() => new Set());
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [err, setErr] = useState("");

  const allGroups = useMemo(() => buildGroups(tracks), [tracks]);
  const visibleGroups = useMemo(
    () => allGroups.filter((group) => !sentGroupIds.has(group.id)),
    [allGroups, sentGroupIds]
  );

  const sentCount = allGroups.length - visibleGroups.length;

  useEffect(() => {
    let mounted = true;

    async function load() {
      setErr("");
      setLoading(true);

      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!data.session) {
          router.replace("/members");
          return;
        }

        const [projectRows, trackRows] = await Promise.all([
          getSupabaseProjects(),
          getUnifiedTrackLibrary(true),
        ]);

        if (!mounted) return;

        setProjects(projectRows);
        setTracks(Array.isArray(trackRows) ? trackRows : []);
      } catch (error: any) {
        if (mounted) setErr(error?.message ?? "Failed to load liaison page.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [router]);

  function toggleGroup(group: TrackGroup) {
    const ids = group.tracks.map((track) => clean(track.id)).filter(Boolean);

    setCheckedIds((current) => {
      const next = new Set(current);
      const allChecked = ids.every((id) => next.has(id));

      for (const id of ids) {
        if (allChecked) next.delete(id);
        else next.add(id);
      }

      return next;
    });
  }

  async function sendChecked() {
    if (!projectId) {
      setErr("Choose a project first.");
      return;
    }

    const ids = Array.from(checkedIds);
    if (ids.length === 0) {
      setErr("Check at least one song first.");
      return;
    }

    setSaving(true);
    setErr("");
    setMessage("");

    try {
      await addTracksToSupabaseProject({ projectId, trackIds: ids });

      const sentGroups = visibleGroups.filter((group) =>
        group.tracks.some((track) => checkedIds.has(clean(track.id)))
      );

      setSentGroupIds((current) => {
        const next = new Set(current);
        for (const group of sentGroups) next.add(group.id);
        return next;
      });

      setCheckedIds(new Set());

      const projectTitle =
        projects.find((project) => project.id === projectId)?.title ?? "project";

      setMessage(`Sent ${sentGroups.length} titles to ${projectTitle}. They were removed from this list.`);
    } catch (error: any) {
      setErr(error?.message ?? "Failed to send checked songs.");
    } finally {
      setSaving(false);
    }
  }

  function resetSession() {
    setSentGroupIds(new Set());
    setCheckedIds(new Set());
    setMessage("List reset for this session.");
    setErr("");
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <TopNav />

      <main className="mx-auto max-w-6xl p-4 lg:pr-[32rem]">
        <section className="sticky top-[64px] z-20 border-b border-white/15 bg-black py-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-white/55">
                Library to Projects
              </p>
              <h1 className="text-2xl font-black">Project Liaison</h1>
              <p className="mt-1 text-sm text-white/65">
                Remaining: {visibleGroups.length} titles / Sent: {sentCount} titles / Copies: {tracks.length}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={projectId}
                onChange={(event) => {
                  setProjectId(event.target.value);
                  setCheckedIds(new Set());
                  setMessage("");
                  setErr("");
                }}
                className="min-h-10 rounded border border-white/25 bg-black px-3 py-2 text-sm font-bold text-white"
              >
                <option value="">Choose project...</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title || "Untitled project"}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={sendChecked}
                disabled={saving || !projectId}
                className="min-h-10 rounded border border-white/25 bg-white px-4 py-2 text-sm font-black text-black disabled:opacity-50"
              >
                {saving ? "Sending..." : "Send Checked"}
              </button>

              <button
                type="button"
                onClick={resetSession}
                className="min-h-10 rounded border border-white/25 bg-black px-4 py-2 text-sm font-black text-white"
              >
                Reset List
              </button>
            </div>
          </div>

          {message ? (
            <div className="mt-3 rounded border border-white/20 bg-black p-2 text-sm text-white/75">
              {message}
            </div>
          ) : null}

          {err ? (
            <div className="mt-3 rounded border border-red-300/40 bg-black p-2 text-sm text-red-100">
              {err}
            </div>
          ) : null}
        </section>

        {loading ? (
          <div className="mt-4 text-sm text-white/70">Loading...</div>
        ) : visibleGroups.length === 0 ? (
          <div className="mt-4 rounded border border-white/15 p-4 text-sm text-white/70">
            Empty. All visible titles have been dispersed in this session.
          </div>
        ) : (
          <section className="mt-3 divide-y divide-white/10 border border-white/15">
            {visibleGroups.map((group) => {
              const ids = group.tracks.map((track) => clean(track.id)).filter(Boolean);
              const checked = ids.length > 0 && ids.every((id) => checkedIds.has(id));

              return (
                <label
                  key={group.id}
                  className="grid cursor-pointer grid-cols-[2rem_minmax(0,1fr)_5rem] items-center gap-2 px-3 py-1.5 text-sm hover:bg-white/[0.06]"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleGroup(group)}
                    className="h-4 w-4 accent-white"
                  />

                  <span className="truncate font-semibold text-white">
                    {group.title}
                  </span>

                  <span className="text-right text-xs font-bold text-white/60">
                    ({group.tracks.length})
                  </span>
                </label>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}
