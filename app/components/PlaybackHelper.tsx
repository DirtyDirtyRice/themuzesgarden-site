"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  getPlaybackState,
  startPlayback,
  stopPlayback,
  subscribePlayback,
  type PlaybackState,
} from "../../lib/playbackBridge";

type LogEntry = {
  atMs: number;
  label: string;
  source?: string;
  playing?: boolean;
};

function safeNowPlayingLabel(st: PlaybackState): string | null {
  const anySt = st as unknown as Record<string, any>;

  const candidates: any[] = [
    anySt?.nowPlaying?.title,
    anySt?.nowPlaying?.name,
    anySt?.trackTitle,
    anySt?.track?.title,
    anySt?.track?.name,
    anySt?.title,
    anySt?.name,
    anySt?.track_id,
    anySt?.trackId,
  ];

  const hit = candidates.find((v) => typeof v === "string" && v.trim().length > 0);
  return hit ? String(hit) : null;
}

function safeFlagLabel(st: PlaybackState, key: string): string | null {
  const anySt = st as unknown as Record<string, any>;
  if (!(key in anySt)) return null;

  const v = anySt[key];
  if (typeof v === "boolean") return v ? "ON" : "OFF";
  if (typeof v === "string" && v.trim().length) return v;
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return null;
}

export default function PlaybackHelper() {
  const [open, setOpen] = useState(false);
  const [st, setSt] = useState<PlaybackState>(() => getPlaybackState());

  const logRef = useRef<LogEntry[]>([]);
  const [, forceLogRender] = useState(0);

  // This prevents duplicate effect logic in React Strict Mode (dev only)
  const didRunEffectRef = useRef(false);

  function pushLog(label: string, next: PlaybackState) {
    const entry: LogEntry = {
      atMs: Date.now(),
      label,
      source: (next as any)?.source,
      playing: (next as any)?.playing,
    };

    logRef.current = [entry, ...logRef.current].slice(0, 20);
    forceLogRender((x) => x + 1);
  }

  useEffect(() => {
    if (didRunEffectRef.current) return;
    didRunEffectRef.current = true;

    const unsub = subscribePlayback((next) => {
      setSt(next);
      pushLog("subscribePlayback", next);
    });

    function onState(e: any) {
      const next = e?.detail;
      if (!next) return;
      setSt(next);
      pushLog("window event: playback:state", next);
    }

    window.addEventListener("playback:state", onState as any);

    pushLog("init snapshot", getPlaybackState());

    return () => {
      unsub();
      window.removeEventListener("playback:state", onState as any);
    };
  }, []);

  const statusLabel = st.playing ? "Playing" : "Stopped";

  const statusClass = useMemo(() => {
    return st.playing
      ? "bg-green-100 text-green-800 border-green-200"
      : "bg-zinc-100 text-zinc-700 border-zinc-200";
  }, [st.playing]);

  const nowPlaying = safeNowPlayingLabel(st);

  const shuffleLabel = safeFlagLabel(st, "shuffle");
  const loopLabel = safeFlagLabel(st, "loop");
  const volumeLabel =
    safeFlagLabel(st, "volume") ??
    safeFlagLabel(st, "volume01") ??
    safeFlagLabel(st, "volumePct");

  async function copyDiagnostics() {
    const payload = {
      copiedAt: new Date().toISOString(),
      state: st,
      log: logRef.current,
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      alert("Diagnostics copied to clipboard");
    } catch {
      alert("Copy failed (clipboard permission blocked)");
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-[70]">
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="rounded-xl bg-black text-white px-4 py-2 shadow"
        >
          ▶ Playback Helper
        </button>
      )}

      {open && (
        <div className="rounded-xl border bg-white p-4 shadow-xl space-y-3 w-80">
          <div className="flex items-center justify-between gap-2">
            <div className="font-semibold">Playback Helper</div>
            <button
              onClick={() => setOpen(false)}
              className="rounded border px-2 py-1 text-xs"
            >
              Close
            </button>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="text-xs text-zinc-500">Status</div>
            <div className={`text-xs border rounded-full px-2 py-1 ${statusClass}`}>
              {statusLabel}
            </div>
          </div>

          {nowPlaying && (
            <div className="flex items-start justify-between gap-2">
              <div className="text-xs text-zinc-500">Now playing</div>
              <div className="text-xs text-right font-medium break-words max-w-[190px]">
                {nowPlaying}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={startPlayback}
              disabled={st.playing}
              className="w-full rounded bg-green-600 text-white px-3 py-2 disabled:opacity-50"
            >
              Start
            </button>

            <button
              onClick={stopPlayback}
              disabled={!st.playing}
              className="w-full rounded bg-red-600 text-white px-3 py-2 disabled:opacity-50"
            >
              Stop
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-[11px] text-zinc-500">
              Last update: {new Date(st.updatedAtMs).toLocaleTimeString()} • source:{" "}
              {st.source}
            </div>
            <button
              onClick={copyDiagnostics}
              className="rounded border px-2 py-1 text-[11px]"
            >
              Copy
            </button>
          </div>

          <div className="rounded-lg border p-2">
            <div className="text-[11px] text-zinc-500 mb-2">
              Event log (latest 20)
            </div>

            <div className="max-h-40 overflow-auto space-y-1">
              {logRef.current.map((e, idx) => (
                <div key={idx} className="text-[11px] flex justify-between gap-2">
                  <div className="text-zinc-500">
                    {new Date(e.atMs).toLocaleTimeString()}
                  </div>
                  <div className="flex-1 text-right">
                    <span className="font-medium">{e.label}</span>
                    {typeof e.playing === "boolean" && (
                      <span className="text-zinc-500">
                        {" "}
                        • {e.playing ? "Playing" : "Stopped"}
                      </span>
                    )}
                    {e.source && (
                      <span className="text-zinc-500"> • {e.source}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}