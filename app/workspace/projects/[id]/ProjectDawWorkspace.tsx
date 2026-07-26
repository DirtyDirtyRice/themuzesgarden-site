"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { requireProjectSupabase } from "./projectSupabase";

type Track = { id: string; title?: string | null; artist?: string | null };
type SessionState = "draft" | "ready" | "active" | "suspended" | "closed";
type DawSession = {
  id: string;
  songId: string;
  name: string;
  state: SessionState;
  revision: number;
  readiness: { ready: boolean; completed: number; required: number; errors: string[] };
  updatedAt: string;
};
type Snapshot = { workspaceRevision: number; sessions: DawSession[] };
type SessionAction = "validate" | "activate" | "suspend" | "resume" | "close";

const actionByState: Record<SessionState, SessionAction[]> = {
  draft: ["validate"],
  ready: ["activate", "close"],
  active: ["suspend", "close"],
  suspended: ["resume", "close"],
  closed: [],
};

const buttonClass =
  "rounded-xl border border-white/25 bg-white px-4 py-2 text-sm font-black text-black disabled:cursor-not-allowed disabled:opacity-40";

async function accessToken(): Promise<string> {
  const { data, error } = await requireProjectSupabase().auth.getSession();
  if (error) throw error;
  const token = data.session?.access_token;
  if (!token) throw new Error("Your member session expired. Sign in again to use Studio.");
  return token;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const token = await accessToken();
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "Studio request failed.");
  return body as T;
}

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
  const [snapshot, setSnapshot] = useState<Snapshot>({ workspaceRevision: 0, sessions: [] });
  const [songId, setSongId] = useState("");
  const [sessionName, setSessionName] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await request<Snapshot>(
        `/api/timeline/daw-workspaces?projectId=${encodeURIComponent(projectId)}`,
      );
      setSnapshot(next);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Studio could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!songId && tracks[0]) setSongId(String(tracks[0].id));
  }, [songId, tracks]);

  const trackById = useMemo(
    () => new Map(tracks.map((track) => [String(track.id), track])),
    [tracks],
  );

  async function openSession() {
    if (!songId || !sessionName.trim()) return;
    setBusy("open");
    setError(null);
    try {
      const result = await request<{ receipt: { workspaceRevision: number; session: DawSession } }>(
        "/api/timeline/daw-workspaces",
        {
          method: "POST",
          body: JSON.stringify({
            action: "open",
            projectId,
            songId,
            name: sessionName.trim(),
            expectedWorkspaceRevision: snapshot.workspaceRevision,
          }),
        },
      );
      setSnapshot((current) => ({
        workspaceRevision: result.receipt.workspaceRevision,
        sessions: [...current.sessions, result.receipt.session],
      }));
      setSessionName("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "DAW session could not be opened.");
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function runAction(session: DawSession, action: SessionAction) {
    setBusy(session.id);
    setError(null);
    try {
      const result = await request<{ receipt: { workspaceRevision: number; session: DawSession } }>(
        "/api/timeline/daw-workspaces",
        {
          method: "POST",
          body: JSON.stringify({
            action,
            sessionId: session.id,
            expectedSessionRevision: session.revision,
            expectedWorkspaceRevision: snapshot.workspaceRevision,
          }),
        },
      );
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

      <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:grid-cols-[1fr_1fr_auto]">
        <select
          value={songId}
          onChange={(event) => setSongId(event.target.value)}
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
          {busy === "open" ? "Opening…" : "Open Session"}
        </button>
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

      <div className="space-y-3">
        {snapshot.sessions.map((session) => {
          const track = trackById.get(session.songId);
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
              {session.readiness.errors?.length ? (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-amber-200">
                  {session.readiness.errors.map((item) => <li key={item}>{item}</li>)}
                </ul>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                {actionByState[session.state].map((action) => (
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
    </section>
  );
}
