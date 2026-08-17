"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseTracksClient, type SupabaseTrack } from "../../../lib/getSupabaseTracks";
import { getUploadedTracks } from "../../../lib/uploadedTracks";
import { mergeTrackLists } from "../../library/libraryUtils";
import { listLinkedProjectTrackIds } from "../../../lib/projectTracksApi";
import { createTimelineDawQuickSongStartName, filterTimelineDawQuickSongChoices, validateTimelineDawQuickSongStart } from "../../../lib/timeline/TimelineDawQuickSongStartPolicy";
import { openDawSession } from "../projects/[id]/projectDawApi";

type QuickProject = { id: string; title: string; workspaceRevision: number | null };
type QuickTrack = Pick<SupabaseTrack, "id" | "title" | "artist">;
const field = "rounded-xl border border-white/20 bg-black px-3 py-3 text-white";
const button = "rounded-xl border border-white/25 bg-white px-4 py-3 font-black text-black disabled:cursor-not-allowed disabled:opacity-40";

export default function TimelineDawQuickSongStart({ projects }: { projects: QuickProject[] }) {
  const router = useRouter();
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [linkedIds, setLinkedIds] = useState<Set<string>>(new Set());
  const [tracks, setTracks] = useState<QuickTrack[]>([]);
  const [songId, setSongId] = useState("");
  const [songQuery, setSongQuery] = useState("");
  const [sessionName, setSessionName] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loadFailed, setLoadFailed] = useState(false);
  const project = projects.find((item) => item.id === projectId) ?? null;
  const linkedTracks = useMemo(() => tracks.filter((track) => linkedIds.has(track.id)), [linkedIds, tracks]);
  const visibleTracks = useMemo(() => filterTimelineDawQuickSongChoices(linkedTracks, songQuery), [linkedTracks, songQuery]);

  useEffect(() => { if (!projects.some((item) => item.id === projectId)) setProjectId(projects[0]?.id ?? ""); }, [projectId, projects]);
  useEffect(() => {
    if (!projectId) { setLinkedIds(new Set()); setTracks([]); return; }
    let current = true;
    setLoading(true); setLoadFailed(false); setError(""); setSongId(""); setSongQuery(""); setSessionName("");
    Promise.all([listLinkedProjectTrackIds(projectId), getSupabaseTracksClient()]).then(([ids, storageTracks]) => {
      if (!current) return;
      const all = mergeTrackLists(storageTracks, getUploadedTracks().map((track) => ({ ...track, artist: track.artist ?? "" }))) as QuickTrack[];
      setLinkedIds(ids); setTracks(all);
      const first = all.find((track) => ids.has(track.id));
      if (first) { setSongId(first.id); setSessionName(createTimelineDawQuickSongStartName(first.title)); }
    }).catch((cause) => { if (current) { setLoadFailed(true); setError(cause instanceof Error ? cause.message : "Linked songs could not be loaded."); } }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [projectId]);

  function chooseSong(value: string) {
    setSongId(value);
    setSessionName(createTimelineDawQuickSongStartName(linkedTracks.find((track) => track.id === value)?.title));
  }

  async function start() {
    const checked = validateTimelineDawQuickSongStart({ projectId, songId, sessionName, workspaceRevision: project?.workspaceRevision });
    if (!checked.ready) { setError(checked.message); return; }
    setBusy(true); setError("");
    try {
      const result = await openDawSession(checked.input);
      router.push(`/workspace/projects/${encodeURIComponent(projectId)}/studio/${encodeURIComponent(result.receipt.session.id)}`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The Studio session could not be started."); setBusy(false); }
  }

  return <section id="daw-quick-start" className="scroll-mt-24 rounded-3xl border border-emerald-300/35 bg-emerald-300/[0.06] p-6"><p className="text-xs font-black uppercase tracking-[.22em] text-emerald-200">Start a Song Here</p><h2 className="mt-2 text-3xl font-black">Choose it and enter Studio</h2><p className="mt-2 text-white/65">You do not need to leave the DAW Control Center.</p><div className="mt-5 grid gap-3 md:grid-cols-2"><label className="text-sm font-bold">1. Project<select aria-label="Project for new song" className={`${field} mt-1 w-full`} value={projectId} disabled={busy || projects.length === 0} onChange={(event) => setProjectId(event.target.value)}>{projects.length === 0 ? <option value="">Create a project first</option> : projects.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><label className="text-sm font-bold">2. Find a linked song<input type="search" aria-label="Search linked songs" className={`${field} mt-1 w-full`} value={songQuery} disabled={busy || loading || linkedTracks.length === 0} onChange={(event) => { setSongQuery(event.target.value); setSongId(""); setSessionName(""); }} placeholder="Search title or artist"/></label><label className="text-sm font-bold">3. Choose the song<select aria-label="Linked song for new Studio session" className={`${field} mt-1 w-full`} value={songId} disabled={busy || loading || visibleTracks.length === 0} onChange={(event) => chooseSong(event.target.value)}>{loading ? <option value="">Loading linked songs…</option> : loadFailed ? <option value="">Songs could not be confirmed</option> : visibleTracks.length === 0 ? <option value="">No matching linked songs</option> : <><option value="">Choose a song</option>{visibleTracks.map((track) => <option key={track.id} value={track.id}>{track.title}{track.artist ? ` — ${track.artist}` : ""}</option>)}</>}</select><span className="mt-1 block text-xs font-normal text-white/50">Showing {visibleTracks.length} of {linkedTracks.length} linked songs.</span></label><label className="text-sm font-bold">4. Name the session<input aria-label="New Studio session name" className={`${field} mt-1 w-full`} maxLength={120} value={sessionName} disabled={busy || !songId} onChange={(event) => setSessionName(event.target.value)} placeholder="Session name"/></label></div><button type="button" className={`${button} mt-4`} disabled={busy || loading || !songId || !sessionName.trim() || project?.workspaceRevision === null} onClick={() => void start()}>{busy ? "Opening Studio…" : "Start in Studio"}</button>{!loading && !loadFailed && projectId && linkedTracks.length === 0 ? <p className="mt-3 text-amber-200">This project has no linked songs yet. Open the project or Upload Audio to add one.</p> : null}{!loading && !loadFailed && linkedTracks.length > 0 && visibleTracks.length === 0 ? <p className="mt-3 text-amber-200">No linked songs match that search. Clear or change the search words.</p> : null}{error ? <p role="alert" className="mt-3 text-red-200">Songs could not be confirmed. Your project has not been changed. {error}</p> : null}</section>;
}
