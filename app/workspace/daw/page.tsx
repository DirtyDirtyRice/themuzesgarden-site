"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../components/AuthProvider";
import { getSupabaseProjects, type ProjectRow } from "../../../lib/getSupabaseProjects";
import { changeDawSession, changeDawTransport, loadDawSnapshot } from "../projects/[id]/projectDawApi";
import type { DawSnapshot } from "../projects/[id]/projectDawTypes";
import { createTimelineDawClosedSessionArchive, createTimelineDawRecentSessionHealth, createTimelineDawRecentSessionPrimaryAction, createTimelineDawSongStartView, filterTimelineDawClosedSessionArchive, filterTimelineDawOpenSessions, parseTimelineDawOpenSessionPreferences, timelineDawOpenSessionPreferenceKey, timelineDawOpenSessionResultSummary, timelineDawOpenSessionViewIsDefault, type TimelineDawOpenSessionFilter, type TimelineDawOpenSessionSort } from "../../../lib/timeline/TimelineDawSongStartPolicy";

type Studio = { project: ProjectRow; snapshot: DawSnapshot | null; error: string | null };
const button = "inline-flex rounded-xl border border-white/25 bg-white px-4 py-2 text-sm font-black text-black disabled:opacity-40";

function SessionHealth({ projectId, session, snapshot, busy, onValidate, onInitialize, onActivate, onResume }: { projectId: string; session: DawSnapshot["sessions"][number]; snapshot: DawSnapshot; busy: boolean; onValidate: () => void; onInitialize: () => void; onActivate: () => void; onResume: () => void }) {
  const health = createTimelineDawRecentSessionHealth({ state: session.state, readinessReady: session.readiness.ready }, snapshot.resumeBySessionId?.[session.id]);
  const primary = createTimelineDawRecentSessionPrimaryAction({ state: session.state, readinessReady: session.readiness.ready }, snapshot.resumeBySessionId?.[session.id]);
  const run = primary?.action === "validate" ? onValidate : primary?.action === "initialize-transport" ? onInitialize : primary?.action === "activate" ? onActivate : onResume;
  return <><p className={`mt-2 text-sm font-semibold ${health.state === "ready" ? "text-emerald-200" : "text-amber-200"}`}>{health.label} · {health.nextAction}</p>{primary?.action === "enter-studio" ? <Link href={`/workspace/projects/${encodeURIComponent(projectId)}/studio/${encodeURIComponent(session.id)}`} className={`${button} mt-3`}>{primary.label}</Link> : primary ? <button type="button" className={`${button} mt-3`} disabled={busy} onClick={run}>{busy ? "Working…" : primary.label}</button> : null}</>;
}

function ClosedSessionArchive({ project, snapshot }: { project: ProjectRow; snapshot: DawSnapshot }) {
  const [query, setQuery] = useState("");
  const archive = createTimelineDawClosedSessionArchive(snapshot.sessions.map((session) => ({ id: session.id, projectId: project.id, projectTitle: project.title || "Untitled Project", name: session.name, songId: session.songId, state: session.state, updatedAt: session.updatedAt, readinessReady: session.readiness.ready })));
  const filtered = filterTimelineDawClosedSessionArchive(archive, query);
  if (!archive.count) return null;
  return <details className="mt-4 rounded-2xl border border-white/10 p-3"><summary className="cursor-pointer font-black text-white/65">Closed session archive · {archive.count}</summary><p className="mt-2 text-xs text-white/45">Read-only history; no reopen action is available.</p><input type="search" maxLength={100} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search closed session or song" className="mt-3 w-full rounded-lg border border-white/15 bg-black px-3 py-2 text-sm"/><p className="mt-2 text-xs text-white/45">Showing {filtered.sessions.length} of {filtered.matchingCount} matches · {filtered.totalCount} total closed</p>{filtered.sessions.map((archived) => { const source = snapshot.sessions.find((session) => session.id === archived.id)!; return <p key={archived.id} className="mt-2 border-t border-white/10 pt-2 text-sm"><b>{archived.name}</b><span className="ml-2 text-white/45">revision {source.revision} · {new Date(archived.updatedAt).toLocaleString()}</span></p>; })}{filtered.matchingCount === 0 ? <p className="mt-2 text-sm text-white/45">No closed sessions match this search.</p> : null}</details>;
}

export default function DawPage() {
  const { user, loading: authLoading } = useAuth();
  const [studios, setStudios] = useState<Studio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busySessionId, setBusySessionId] = useState<string | null>(null);
  const [recentQuery, setRecentQuery] = useState("");
  const [recentStateFilter, setRecentStateFilter] = useState<TimelineDawOpenSessionFilter>("all");
  const [recentSort, setRecentSort] = useState<TimelineDawOpenSessionSort>("newest");
  const [recentPreferencesLoaded, setRecentPreferencesLoaded] = useState(false);

  const load = useCallback(async () => {
    if (!user) { setStudios([]); setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const projects = await getSupabaseProjects(user.id);
      setStudios(await Promise.all(projects.map(async (project) => {
        try { return { project, snapshot: await loadDawSnapshot(project.id), error: null }; }
        catch (cause) { return { project, snapshot: null, error: cause instanceof Error ? cause.message : "Studio could not be loaded." }; }
      })));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "DAW Studios could not be loaded."); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { queueMicrotask(() => void load()); }, [load]);
  useEffect(() => { queueMicrotask(() => { try { const saved = parseTimelineDawOpenSessionPreferences(window.localStorage.getItem(timelineDawOpenSessionPreferenceKey("global"))); setRecentStateFilter(saved.stateFilter); setRecentSort(saved.sort); } catch {} setRecentPreferencesLoaded(true); }); }, []);
  useEffect(() => { if (!recentPreferencesLoaded) return; try { window.localStorage.setItem(timelineDawOpenSessionPreferenceKey("global"), JSON.stringify({ stateFilter: recentStateFilter, sort: recentSort })); } catch {} }, [recentPreferencesLoaded, recentSort, recentStateFilter]);
  const sessions = useMemo(() => studios.flatMap((studio) => studio.snapshot?.sessions ?? []), [studios]);
  const songStart = useMemo(() => createTimelineDawSongStartView(studios.flatMap((studio) =>
    (studio.snapshot?.sessions ?? []).map((session) => ({
      id: session.id,
      projectId: studio.project.id,
      projectTitle: studio.project.title || "Untitled Project",
      name: session.name,
      songId: session.songId,
      state: session.state,
      updatedAt: session.updatedAt,
      readinessReady: session.readiness.ready,
    })),
  )), [studios]);
  const recommendedStudio = songStart.recommended
    ? studios.find((studio) => studio.project.id === songStart.recommended?.projectId)
    : null;
  const recommendedHealth = songStart.recommended
    ? createTimelineDawRecentSessionHealth(songStart.recommended, recommendedStudio?.snapshot?.resumeBySessionId?.[songStart.recommended.id])
    : null;
  const resumeBySessionId = useMemo(() => Object.assign({}, ...studios.map((studio) => studio.snapshot?.resumeBySessionId ?? {})), [studios]);
  const filteredRecent = useMemo(() => filterTimelineDawOpenSessions(songStart.open, recentQuery, recentStateFilter, resumeBySessionId, recentSort), [recentQuery, recentSort, recentStateFilter, resumeBySessionId, songStart.open]);
  const visibleRecentIds = useMemo(() => new Set(recentPreferencesLoaded ? filteredRecent.sessions.map((session) => session.id) : []), [filteredRecent.sessions, recentPreferencesLoaded]);
  const recentViewIsDefault = timelineDawOpenSessionViewIsDefault(recentQuery, recentStateFilter, recentSort);

  async function validateSession(snapshot: DawSnapshot, session: DawSnapshot["sessions"][number]) {
    setBusySessionId(session.id);
    setError(null);
    try {
      await changeDawSession({ action: "validate", sessionId: session.id, expectedSessionRevision: session.revision, expectedWorkspaceRevision: snapshot.workspaceRevision });
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Session validation could not be completed.");
      await load();
    } finally {
      setBusySessionId(null);
    }
  }

  async function initializeTransport(snapshot: DawSnapshot, session: DawSnapshot["sessions"][number]) {
    setBusySessionId(session.id);
    setError(null);
    try {
      await changeDawTransport({ action: "initialize", sessionId: session.id, expectedWorkspaceRevision: snapshot.workspaceRevision });
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Transport could not be initialized.");
      await load();
    } finally {
      setBusySessionId(null);
    }
  }

  async function activateSession(snapshot: DawSnapshot, session: DawSnapshot["sessions"][number]) {
    setBusySessionId(session.id);
    setError(null);
    try {
      await changeDawSession({ action: "activate", sessionId: session.id, expectedSessionRevision: session.revision, expectedWorkspaceRevision: snapshot.workspaceRevision });
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Session could not be activated.");
      await load();
    } finally {
      setBusySessionId(null);
    }
  }

  async function resumeSession(snapshot: DawSnapshot, session: DawSnapshot["sessions"][number]) {
    setBusySessionId(session.id);
    setError(null);
    try {
      await changeDawSession({ action: "resume", sessionId: session.id, expectedSessionRevision: session.revision, expectedWorkspaceRevision: snapshot.workspaceRevision });
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Session could not be resumed.");
      await load();
    } finally {
      setBusySessionId(null);
    }
  }

  if (authLoading) return <main className="min-h-screen bg-black p-6 text-white">Checking membership…</main>;
  if (!user) return <main className="min-h-screen bg-black p-8 text-white"><h1 className="text-4xl font-black">DAW Studio</h1><p className="my-5 text-white/65">Sign in to open owner-protected sessions.</p><Link href="/members" className={button}>Members Sign In</Link></main>;

  return (
    <main className="min-h-screen bg-black px-5 py-8 text-white">
      <section className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-3xl border border-white/15 bg-[#080808] p-7">
          <div className="flex flex-wrap justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">Musician Control Center</p><h1 className="mt-2 text-5xl font-black">DAW Studio</h1><p className="mt-3 text-white/65">Open authenticated project Studios and durable sessions from one place.</p></div><button type="button" className={button} disabled={loading} onClick={() => void load()}>{loading ? "Refreshing…" : "Refresh Studios"}</button></div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">{[["Projects", studios.length], ["Sessions", sessions.length], ["Engine-ready", sessions.filter((session) => session.readiness.ready).length]].map(([label, value]) => <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><p className="text-xs uppercase text-white/45">{label}</p><p className="text-3xl font-black">{value}</p></div>)}</div>
        </header>
        <section aria-busy={!recentPreferencesLoaded} className="rounded-2xl border border-white/10 bg-[#080808] p-4">{recentPreferencesLoaded ? <><label className="text-sm font-black" htmlFor="daw-open-session-search">Search open sessions</label><div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]"><input id="daw-open-session-search" type="search" maxLength={100} value={recentQuery} onChange={(event) => setRecentQuery(event.target.value)} placeholder="Session, song, or project" className="w-full rounded-xl border border-white/15 bg-black px-3 py-2"/><select aria-label="Filter open sessions by state" value={recentStateFilter} onChange={(event) => setRecentStateFilter(event.target.value as TimelineDawOpenSessionFilter)} className="rounded-xl border border-white/15 bg-black px-3 py-2"><option value="all">All</option><option value="needs-setup">Needs Setup</option><option value="ready">Ready</option><option value="active">Active</option><option value="suspended">Suspended</option></select><select aria-label="Sort open sessions" value={recentSort} onChange={(event) => setRecentSort(event.target.value as TimelineDawOpenSessionSort)} className="rounded-xl border border-white/15 bg-black px-3 py-2"><option value="newest">Newest</option><option value="session-name">Session Name</option><option value="project-name">Project Name</option></select>{!recentViewIsDefault ? <button type="button" className={button} onClick={() => { setRecentQuery(""); setRecentStateFilter("all"); setRecentSort("newest"); }}>Reset view</button> : null}</div><p role="status" aria-live="polite" aria-atomic="true" className="mt-2 text-xs text-white/45">{timelineDawOpenSessionResultSummary(filteredRecent, recentStateFilter, recentSort)}</p></> : <p className="text-sm text-white/45">Restoring recent session view…</p>}</section>
        {!loading && filteredRecent.totalOpenCount > 0 && filteredRecent.matchingCount === 0 ? <p className="rounded-xl border border-dashed border-white/15 p-4 text-sm text-white/45">No open sessions match this search and state filter.</p> : null}
        {error ? <p role="alert" className="rounded-xl border border-red-400/35 p-4 text-red-100">{error}</p> : null}
        {!loading && songStart.recommended ? <section className="rounded-3xl border border-emerald-300/35 bg-emerald-400/10 p-6"><p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-200">Continue your song</p><div className="mt-2 flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-3xl font-black">{songStart.recommended.name}</h2><p className="mt-1 text-white/65">{songStart.recommended.projectTitle} · last saved {new Date(songStart.recommended.updatedAt).toLocaleString()}</p><p className={`mt-1 font-semibold ${recommendedHealth?.state === "ready" ? "text-emerald-100" : "text-amber-200"}`}>{recommendedHealth?.label} · {recommendedHealth?.nextAction}</p></div><Link href={`/workspace/projects/${encodeURIComponent(songStart.recommended.projectId)}/studio/${encodeURIComponent(songStart.recommended.id)}`} className={button}>{songStart.resumeLabel}</Link></div></section> : null}
        {loading ? <p className="rounded-2xl border border-white/15 p-6 text-white/60">Loading authenticated project Studios…</p> : null}
        {!loading && studios.length === 0 ? <section className="rounded-2xl border border-dashed border-white/20 p-6"><h2 className="text-2xl font-black">Create your first project</h2><Link href="/workspace/projects" className={`${button} mt-4`}>Open Projects</Link></section> : null}
        {!loading ? studios.map(({ project, snapshot, error: studioError }) => <section key={project.id} className="rounded-3xl border border-white/15 bg-[#080808] p-6"><div className="flex flex-wrap justify-between gap-3"><div><p className="text-xs uppercase text-white/40">{project.kind} · {project.visibility}</p><h2 className="text-2xl font-black">{project.title || "Untitled Project"}</h2><p className="text-xs text-white/40">Workspace revision {snapshot?.workspaceRevision ?? "unavailable"}</p></div><Link href={`/workspace/projects/${encodeURIComponent(project.id)}`} className={button}>Manage Project Studio</Link></div>{studioError ? <p role="alert" className="mt-4 text-amber-200">{studioError}</p> : null}{snapshot?.sessions.length === 0 ? <p className="mt-4 text-white/55">No sessions yet. Open the project to create one.</p> : null}<div className="mt-5 grid gap-3 lg:grid-cols-2">{snapshot?.sessions.filter((session) => visibleRecentIds.has(session.id)).map((session) => <article key={session.id} className="rounded-2xl border border-white/10 bg-black p-4"><div className="flex justify-between gap-3"><h3 className="font-black">{session.name}</h3><span className="text-xs font-black uppercase text-emerald-300">{session.state}</span></div><p className="mt-2 text-sm text-white/55">Engines {session.readiness.completed}/{session.readiness.required} · Revision {session.revision}</p><SessionHealth projectId={project.id} session={session} snapshot={snapshot} busy={busySessionId === session.id} onValidate={() => void validateSession(snapshot, session)} onInitialize={() => void initializeTransport(snapshot, session)} onActivate={() => void activateSession(snapshot, session)} onResume={() => void resumeSession(snapshot, session)} /></article>)}</div>{snapshot ? <ClosedSessionArchive project={project} snapshot={snapshot} /> : null}</section>) : null}
      </section>
    </main>
  );
}

