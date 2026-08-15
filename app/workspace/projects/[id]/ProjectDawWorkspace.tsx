"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createTimelineDawRecentSessionHealth, createTimelineDawSongStartView, timelineDawReadinessRepairAction } from "../../../../lib/timeline/TimelineDawSongStartPolicy";
import { changeDawSession, loadDawSnapshot, openDawSession } from "./projectDawApi";
import {
  dawActionsByState,
  type DawSession,
  type DawSessionAction,
  type DawSnapshot,
} from "./projectDawTypes";

type Track = { id: string; title?: string | null; artist?: string | null };

const buttonClass =
  "rounded-xl border border-white/25 bg-white px-4 py-2 text-sm font-black text-black disabled:cursor-not-allowed disabled:opacity-40";

function trackName(track: Track): string {
  return track.title?.trim() || `Song ${track.id.slice(0, 8)}`;
}

export default function ProjectDawWorkspace({
  projectId,
  projectTitle,
  tracks,
}: {
  projectId: string;
  projectTitle: string;
  tracks: Track[];
}) {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<DawSnapshot>({ workspaceRevision: 0, sessions: [] });
  const [songId, setSongId] = useState("");
  const [sessionName, setSessionName] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await loadDawSnapshot(projectId);
      setSnapshot(next);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Studio could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  useEffect(() => {
    if (!songId && tracks[0]) {
      queueMicrotask(() => {
        setSongId(String(tracks[0].id));
        setSessionName(`${trackName(tracks[0])} Session`);
      });
    }
  }, [songId, tracks]);

  const trackById = useMemo(
    () => new Map(tracks.map((track) => [String(track.id), track])),
    [tracks],
  );
  const songStart = useMemo(
    () => createTimelineDawSongStartView(snapshot.sessions.map((session) => ({
      id: session.id,
      projectId,
      projectTitle,
      name: session.name,
      songId: session.songId,
      state: session.state,
      updatedAt: session.updatedAt,
      readinessReady: session.readiness.ready,
    }))),
    [projectId, projectTitle, snapshot.sessions],
  );
  const recommendedHealth = songStart.recommended
    ? createTimelineDawRecentSessionHealth(songStart.recommended, snapshot.resumeBySessionId?.[songStart.recommended.id])
    : null;

  function selectSong(nextSongId: string) {
    setSongId(nextSongId);
    const track = trackById.get(nextSongId);
    setSessionName(track ? `${trackName(track)} Session` : "");
  }

  async function openSession() {
    if (!songId || !sessionName.trim()) return;
    setBusy("open");
    setError(null);
    try {
      const result = await openDawSession({
        projectId,
        songId,
        name: sessionName.trim(),
        expectedWorkspaceRevision: snapshot.workspaceRevision,
      });
      setSnapshot((current) => ({
        workspaceRevision: result.receipt.workspaceRevision,
        sessions: [...current.sessions, result.receipt.session],
      }));
      setSessionName("");
      router.push(`/workspace/projects/${encodeURIComponent(projectId)}/studio/${encodeURIComponent(result.receipt.session.id)}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "DAW session could not be opened.");
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function runAction(session: DawSession, action: DawSessionAction) {
    setBusy(session.id);
    setError(null);
    try {
      const result = await changeDawSession({
        action,
        sessionId: session.id,
        expectedSessionRevision: session.revision,
        expectedWorkspaceRevision: snapshot.workspaceRevision,
      });
      setSnapshot((current) => ({
        workspaceRevision: result.receipt.workspaceRevision,
        sessions: current.sessions.map((item) =>
          item.id === session.id ? result.receipt.session : item,
        ),
      }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "DAW session could not be changed.");
      await load();
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="space-y-5 rounded-2xl border border-white/20 bg-[#080808] p-5">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-300">
          Project Studio
        </p>
        <h2 className="mt-1 text-2xl font-black text-white">{projectTitle} DAW Sessions</h2>
        <p className="mt-2 text-sm leading-6 text-white/65">
          Every session is owner-protected, revision-safe, and held until all required
          audio engines validate.
        </p>
      </div>

      {!loading && songStart.recommended ? (
        <div className="rounded-2xl border border-emerald-300/35 bg-emerald-400/10 p-5">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200">Pick up where you stopped</p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-white">{songStart.recommended.name}</h3>
              <p className="mt-1 text-sm text-white/65">{songStart.message} Last saved {new Date(songStart.recommended.updatedAt).toLocaleString()}.</p>
              <p className={`mt-1 text-sm font-semibold ${recommendedHealth?.state === "held" ? "text-amber-200" : "text-emerald-100"}`}>{recommendedHealth?.label} · {recommendedHealth?.nextAction}</p>
            </div>
            <Link className={buttonClass} href={`/workspace/projects/${encodeURIComponent(projectId)}/studio/${encodeURIComponent(songStart.recommended.id)}`}>
              {songStart.resumeLabel}
            </Link>
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <h3 className="font-black text-white">Start a song</h3>
        <p className="mt-1 text-sm text-white/55">Choose linked music, name the working session, and go straight into Studio.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <select
          value={songId}
          onChange={(event) => selectSong(event.target.value)}
          className="rounded-xl border border-white/20 bg-black px-3 py-2 text-white"
          aria-label="Song for new DAW session"
          disabled={tracks.length === 0 || busy !== null}
        >
          {tracks.length === 0 ? <option value="">Link a song first</option> : null}
          {tracks.map((track) => (
            <option key={track.id} value={track.id}>
              {trackName(track)}
            </option>
          ))}
        </select>
        <input
          value={sessionName}
          onChange={(event) => setSessionName(event.target.value)}
          placeholder="Session name"
          className="rounded-xl border border-white/20 bg-black px-3 py-2 text-white placeholder:text-white/35"
          disabled={busy !== null}
        />
        <button
          type="button"
          className={buttonClass}
          disabled={!songId || !sessionName.trim() || busy !== null}
          onClick={() => void openSession()}
        >
          {busy === "open" ? "Starting…" : "Start in Studio"}
        </button>
        </div>
      </div>

      {error ? (
        <div role="alert" className="rounded-xl border border-red-400/35 bg-red-950/30 p-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      {loading ? <p className="text-sm text-white/55">Loading Studio sessions…</p> : null}
      {!loading && snapshot.sessions.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/20 p-5 text-sm text-white/55">
          No DAW sessions yet. Choose a linked song and open the first session.
        </p>
      ) : null}

      {songStart.recent.length ? <div>
        <div className="mb-3">
          <h3 className="font-black text-white">Recent sessions</h3>
          <p className="text-xs text-white/50">{songStart.openCount} open session{songStart.openCount === 1 ? "" : "s"}</p>
        </div>
      <div className="space-y-3">
        {songStart.recent.map((summary) => {
          const session = snapshot.sessions.find((item) => item.id === summary.id)!;
          const track = trackById.get(session.songId);
          const health = createTimelineDawRecentSessionHealth(summary, snapshot.resumeBySessionId?.[session.id]);
          const repair = timelineDawReadinessRepairAction(summary);
          return (
            <article key={session.id} className="rounded-2xl border border-white/15 bg-black p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-black text-white">{session.name}</h3>
                  <p className="mt-1 text-sm text-white/55">
                    {track ? trackName(track) : `Song ${session.songId.slice(0, 8)}`}
                  </p>
                </div>
                <span className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-emerald-200">
                  {session.state}
                </span>
              </div>
              <p className="mt-3 text-xs text-white/50">
                Engines ready: {session.readiness.completed}/{session.readiness.required}
                {" · "}Session revision {session.revision}
              </p>
              <p className={`mt-2 text-sm font-semibold ${health.state === "ready" ? "text-emerald-200" : "text-amber-200"}`}>{health.label} · {health.nextAction}</p>
              {session.readiness.errors?.length ? (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-amber-200">
                  {session.readiness.errors.map((item) => <li key={item}>{item}</li>)}
                </ul>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                {repair?.action === "validate" ? <button type="button" className={buttonClass} disabled={busy !== null} onClick={() => void runAction(session, "validate")}>{busy === session.id ? "Validating…" : repair.label}</button> : null}
                {session.state !== "closed" ? (
                  <Link
                    href={`/workspace/projects/${encodeURIComponent(projectId)}/studio/${encodeURIComponent(session.id)}`}
                    className={buttonClass}
                  >
                    Enter Workspace
                  </Link>
                ) : null}
                {dawActionsByState[session.state].filter((action) => action !== "validate").map((action) => (
                  <button
                    key={action}
                    type="button"
                    className={buttonClass}
                    disabled={busy !== null}
                    onClick={() => void runAction(session, action)}
                  >
                    {busy === session.id ? "Working…" : action[0].toUpperCase() + action.slice(1)}
                  </button>
                ))}
              </div>
            </article>
          );
        })}
      </div>
      </div> : null}
    </section>
  );
}
