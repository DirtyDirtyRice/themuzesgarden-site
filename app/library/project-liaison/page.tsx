"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import TopNav from "../../components/TopNav";
import { supabase } from "../../../lib/supabaseClient";
import { getUnifiedTrackLibrary } from "../../../lib/tracks/unifiedTrackLibrary";
import { getSupabaseProjects, type ProjectRow } from "../../../lib/getSupabaseProjects";
import { addTracksToSupabaseProject } from "../../../lib/addTracksToSupabaseProject";
import { listLinkedProjectTrackIds } from "../../../lib/projectTracksApi";

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
  const [linkedIds, setLinkedIds] = useState<Set<string>>(() => new Set());
  const [hideAlreadyLinked, setHideAlreadyLinked] = useState(true);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(() => new Set());
  const [lastCheckedGroupId, setLastCheckedGroupId] = useState("");
  const [sentGroupIds, setSentGroupIds] = useState<Set<string>>(() => new Set());
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [err, setErr] = useState("");

  const allGroups = useMemo(() => buildGroups(tracks), [tracks]);
  const visibleGroups = useMemo(
    () =>
      allGroups.filter((group) => {
        if (sentGroupIds.has(group.id)) return false;

        if (!hideAlreadyLinked || !projectId) return true;

        const ids = group.tracks.map((track) => clean(track.id)).filter(Boolean);
        return !ids.length || !ids.every((id) => linkedIds.has(id));
      }),
    [allGroups, hideAlreadyLinked, linkedIds, projectId, sentGroupIds]
  );

  const sentCount = sentGroupIds.size;
  const alreadyLinkedCount = allGroups.filter((group) => {
    const ids = group.tracks.map((track) => clean(track.id)).filter(Boolean);
    return ids.length > 0 && ids.every((id) => linkedIds.has(id));
  }).length;

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

  useEffect(() => {
    let mounted = true;

    async function loadProjectLinks() {
      setCheckedIds(new Set());
      setLastCheckedGroupId("");
      setMessage("");
      setErr("");

      if (!projectId) {
        setLinkedIds(new Set());
        return;
      }

      try {
        const ids = await listLinkedProjectTrackIds(projectId);
        if (mounted) setLinkedIds(new Set(Array.from(ids)));
      } catch (error: any) {
        if (mounted) {
          setLinkedIds(new Set());
          setErr(error?.message ?? "Failed to load already linked tracks.");
        }
      }
    }

    loadProjectLinks();

    return () => {
      mounted = false;
    };
  }, [projectId]);
  function toggleGroup(group: TrackGroup, shiftKey: boolean) {
    setCheckedIds((current) => {
      const next = new Set(current);
      const groupIds = group.tracks.map((track) => clean(track.id)).filter(Boolean);
      const shouldCheck = !groupIds.every((id) => next.has(id));

      let groupsToToggle = [group];

      if (shiftKey && lastCheckedGroupId) {
        const currentIndex = visibleGroups.findIndex((item) => item.id === group.id);
        const lastIndex = visibleGroups.findIndex((item) => item.id === lastCheckedGroupId);

        if (currentIndex >= 0 && lastIndex >= 0) {
          const start = Math.min(currentIndex, lastIndex);
          const end = Math.max(currentIndex, lastIndex);
          groupsToToggle = visibleGroups.slice(start, end + 1);
        }
      }

      for (const item of groupsToToggle) {
        const ids = item.tracks.map((track) => clean(track.id)).filter(Boolean);

        for (const id of ids) {
          if (shouldCheck) next.add(id);
          else next.delete(id);
        }
      }

      return next;
    });

    setLastCheckedGroupId(group.id);
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
                Remaining: {visibleGroups.length} titles / Sent this session: {sentCount} / Already linked: {alreadyLinkedCount} / Copies: {tracks.length}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={projectId}
                onChange={(event) => {
                  setProjectId(event.target.value);
                  setCheckedIds(new Set());
                  setLastCheckedGroupId("");
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

              <label className="flex min-h-10 items-center gap-2 rounded border border-white/25 bg-black px-3 py-2 text-sm font-bold text-white">
                <input
                  type="checkbox"
                  checked={hideAlreadyLinked}
                  onChange={(event) => setHideAlreadyLinked(event.target.checked)}
                  className="h-4 w-4 accent-white"
                />
                Hide Already Linked
              </label>

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
                    onChange={(event) =>
                      toggleGroup(
                        group,
                        event.nativeEvent instanceof MouseEvent
                          ? event.nativeEvent.shiftKey
                          : false
                      )
                    }
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
