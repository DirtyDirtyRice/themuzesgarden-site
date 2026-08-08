"use client";

import { useEffect, useMemo, useState } from "react";
import { applyDawPrivateLaneHistory, loadDawPrivateLaneHistory, type DawPrivateAudioLane, type DawPrivateLaneEditHistory } from "@/app/workspace/projects/[id]/projectDawApi";

const button = "rounded-xl border border-white/25 bg-white px-3 py-2 text-sm font-black text-black disabled:opacity-40";

export default function TimelineDawPrivateLaneHistory({ sessionId, revision, onRestore }: {
  sessionId: string;
  revision: number;
  onRestore: (lanes: DawPrivateAudioLane[]) => void;
}) {
  const [history, setHistory] = useState<DawPrivateLaneEditHistory[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  useEffect(() => {
    let active = true;
    void loadDawPrivateLaneHistory(sessionId).then(({ history: loaded }) => { if (active) setHistory(loaded); })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Lane history could not be loaded."); });
    return () => { active = false; };
  }, [revision, sessionId]);
  const undo = history.find((entry) => entry.state === "applied");
  const redo = useMemo(() => [...history].reverse().find((entry) => entry.state === "undone"), [history]);

  async function apply(entry: DawPrivateLaneEditHistory, action: "undo" | "redo") {
    setBusy(true); setError(undefined);
    try {
      const result = await applyDawPrivateLaneHistory(sessionId, entry.id, action);
      setHistory(result.history); onRestore(result.lanes);
    } catch (cause) { setError(cause instanceof Error ? cause.message : `Lane ${action} failed.`); }
    finally { setBusy(false); }
  }

  return (
    <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div><p className="text-sm font-black">Region edit history</p><p className="text-xs text-white/45">Undo and redo reject stale lane state instead of overwriting newer work.</p></div>
        <div className="flex gap-2"><button className={button} type="button" disabled={busy || !undo} onClick={() => undo && void apply(undo, "undo")}>Undo{undo ? `: ${undo.label}` : ""}</button><button className={button} type="button" disabled={busy || !redo} onClick={() => redo && void apply(redo, "redo")}>Redo{redo ? `: ${redo.label}` : ""}</button></div>
      </div>
      {error ? <p role="alert" className="mt-2 text-xs text-red-200">{error}</p> : null}
      {history.length ? <ol className="mt-2 grid gap-1 text-xs text-white/55">{history.slice(0, 6).map((entry) => <li key={entry.id} className="flex justify-between gap-3"><span>{entry.label}</span><span>{entry.state === "applied" ? "Applied" : "Undone"} · {new Date(entry.createdAt).toLocaleString()}</span></li>)}</ol> : <p className="mt-2 text-xs text-white/45">No reversible region edits yet.</p>}
    </div>
  );
}
