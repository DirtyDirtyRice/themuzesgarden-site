"use client";

import { useCallback, useEffect, useState } from "react";
import { requireProjectSupabase } from "@/app/workspace/projects/[id]/projectSupabase";
import { timelineDawPrivateLoudnessMatchGain } from "@/lib/timeline/TimelineDawPrivateSnapshotPolicy";

type Snapshot = {
  id: string; name: string; notes: string; favorite: boolean; revision: number;
  state: Record<string, unknown>; checksum: string; stale: boolean; diff: Array<{ section: string }>;
};

export default function TimelineDawPrivateSnapshots({ sessionId, currentMaster, onAudition, onRestored }: {
  sessionId: string;
  currentMaster: { gain: number; muted: boolean; revision: number };
  onAudition: (master: { gain: number; muted: boolean; revision: number }) => void;
  onRestored: () => void;
}) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [currentChecksum, setCurrentChecksum] = useState("");
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string>();

  const req = useCallback(async (body?: Record<string, unknown>) => {
    const { data } = await requireProjectSupabase().auth.getSession();
    const response = await fetch(`/api/timeline/daw-private-snapshots${body ? "" : `?sessionId=${sessionId}`}`, {
      method: body ? "POST" : "GET",
      headers: { Authorization: `Bearer ${data.session?.access_token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
      body: body ? JSON.stringify({ sessionId, ...body }) : undefined,
    });
    const result = await response.json();
    if (!response.ok) throw Error(result.error);
    if (result.snapshots) { setSnapshots(result.snapshots); setCurrentChecksum(result.currentChecksum); }
    if (result.snapshot) setSnapshots((items) => [result.snapshot, ...items.filter((item) => item.id !== result.snapshot.id)]);
    return result;
  }, [sessionId]);

  useEffect(() => { queueMicrotask(() => void req().catch((cause) => setError(cause.message))); }, [req]);
  const master = (snapshot: Snapshot) =>
    (snapshot.state.timeline_daw_private_masters as Array<Record<string, unknown>> | undefined)?.[0] ?? { gain: 1, muted: false, revision: 0 };

  return <section id="private-session-snapshots" className="mt-3 scroll-mt-24 rounded-xl border border-indigo-300/20 bg-indigo-300/[.05] p-3 text-xs">
    <div className="flex flex-wrap gap-2">
      <strong>Session Snapshots</strong>
      <input className="bg-black" value={name} onChange={(event) => setName(event.target.value)} placeholder="Snapshot name" />
      <input className="bg-black" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Notes" />
      <button disabled={!name.trim()} onClick={() => void req({ action: "capture", name, notes }).then(() => { setName(""); setNotes(""); return req(); }).catch((cause) => setError(cause.message))}>Capture</button>
      <button onClick={() => onAudition(currentMaster)}>A Current</button>
      {error ? <span className="text-red-200">{error}</span> : null}
    </div>
    {snapshots.map((snapshot) => {
      const savedMaster = master(snapshot);
      const matched = Number(savedMaster.gain ?? 1) * timelineDawPrivateLoudnessMatchGain(Number(currentMaster.gain), Number(savedMaster.gain ?? 1));
      return <div className="mt-2 flex flex-wrap gap-2 border-t border-white/10 pt-2" key={snapshot.id}>
        <span>{snapshot.favorite ? "★ " : ""}{snapshot.name} v{snapshot.revision} · {snapshot.stale ? `${snapshot.diff.length} changed sections` : "Current"}</span>
        <button onClick={() => onAudition({ gain: matched, muted: Boolean(savedMaster.muted), revision: Number(savedMaster.revision ?? 0) })}>B Loudness Match</button>
        <button onClick={() => void req({ action: "favorite", snapshotId: snapshot.id, favorite: !snapshot.favorite }).then(() => req())}>{snapshot.favorite ? "Unfavorite" : "Favorite"}</button>
        <button disabled={!snapshot.stale} onClick={() => void req({ action: "restore", snapshotId: snapshot.id, expectedCurrentChecksum: currentChecksum }).then(() => { onRestored(); return req(); }).catch((cause) => setError(cause.message))}>Restore Safely</button>
        <span title={snapshot.checksum}>{snapshot.notes}</span>
      </div>;
    })}
  </section>;
}
