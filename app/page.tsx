"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

type Mp3Item = {
  name: string;
  path: string;
  publicUrl: string;
};

const LS_LAST_TRACK_PATH = "tmz_player_last_track_path";
const LS_LAST_TRACK_PUBLIC_URL = "tmz_player_last_track_public_url";
const LS_LAST_TRACK_TITLE = "tmz_player_last_track_title";
const LS_VOLUME = "tmz_player_volume";
const LS_MUTED = "tmz_player_muted";
const LS_RATE = "tmz_player_rate";
const LS_WAS_PLAYING = "tmz_player_was_playing";
const LS_POS_PREFIX = "tmz_player_pos:"; // + track.path

function isMp3(name: string) {
  return /\.mp3$/i.test(name);
}

function stripExt(name: string) {
  return name.replace(/\.[^/.]+$/, "");
}

function safeDecodeMaybe(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

// Recursively list files in a Supabase Storage bucket (client-side).
async function listAllFilesInBucket(params: {
  bucket: string;
  prefix?: string;
}): Promise<{ path: string; name: string }[]> {
  const { bucket } = params;
  const prefix = (params.prefix ?? "").replace(/^\/+|\/+$/g, "");

  const results: { path: string; name: string }[] = [];

  async function walk(folder: string) {
    const { data, error } = await supabase.storage.from(bucket).list(folder, {
      limit: 1000,
      offset: 0,
      sortBy: { column: "name", order: "asc" },
    });

    if (error) throw error;
    if (!data) return;

    for (const entry of data) {
      const fullPath = folder ? `${folder}/${entry.name}` : entry.name;

      if (/\.[a-z0-9]+$/i.test(entry.name)) {
        results.push({ path: fullPath, name: entry.name });
      } else {
        try {
          await walk(fullPath);
        } catch {}
      }
    }
  }

  await walk(prefix);
  return results;
}

export default function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [items, setItems] = useState<Mp3Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [index, setIndex] = useState(0);

  const [shouldAutoplay, setShouldAutoplay] = useState(false);
  const pendingGesturePlayRef = useRef(false);

  const advancingRef = useRef(false);
  const lastAdvanceAtRef = useRef(0);

  const currentUrlRef = useRef<string>("");

  // ---- Restore persisted audio prefs once ----
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    try {
      const vRaw = localStorage.getItem(LS_VOLUME);
      if (vRaw != null) {
        const v = Number(vRaw);
        if (Number.isFinite(v)) a.volume = clamp(v, 0, 1);
      }
    } catch {}

    try {
      const mRaw = localStorage.getItem(LS_MUTED);
      if (mRaw === "1") a.muted = true;
      if (mRaw === "0") a.muted = false;
    } catch {}

    try {
      const rRaw = localStorage.getItem(LS_RATE);
      if (rRaw != null) {
        const r = Number(rRaw);
        if (Number.isFinite(r) && r > 0) a.playbackRate = clamp(r, 0.25, 4);
      }
    } catch {}
  }, []);

  // Persist volume/mute/rate + wasPlaying
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    const onVol = () => {
      try {
        localStorage.setItem(LS_VOLUME, String(a.volume));
      } catch {}
      try {
        localStorage.setItem(LS_MUTED, a.muted ? "1" : "0");
      } catch {}
    };

    const onRate = () => {
      try {
        localStorage.setItem(LS_RATE, String(a.playbackRate));
      } catch {}
    };

    const onPlay = () => {
      try {
        localStorage.setItem(LS_WAS_PLAYING, "1");
      } catch {}
    };

    const onPause = () => {
      try {
        localStorage.setItem(LS_WAS_PLAYING, "0");
      } catch {}
    };

    a.addEventListener("volumechange", onVol);
    a.addEventListener("ratechange", onRate);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);

    return () => {
      a.removeEventListener("volumechange", onVol);
      a.removeEventListener("ratechange", onRate);
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
    };
  }, []);

  // ---- Load MP3 list ----
  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setLoadError(null);

      try {
        const BUCKET = "audio";
        const files = await listAllFilesInBucket({ bucket: BUCKET });

        const mp3s = files
          .filter((f) => isMp3(f.name))
          .map((f) => {
            const { data } = supabase.storage.from(BUCKET).getPublicUrl(f.path);
            return {
              name: f.name,
              path: f.path,
              publicUrl: data.publicUrl,
            } satisfies Mp3Item;
          })
          .sort((a, b) => a.name.localeCompare(b.name));

        if (!cancelled) {
          setItems(mp3s);
          setLoading(false);
        }
      } catch (e: unknown) {
        const msg =
          e instanceof Error ? e.message : "Unknown error loading audio files";
        if (!cancelled) {
          setLoadError(msg);
          setItems([]);
          setLoading(false);
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  // Keep URL in sync (uses track.path)
  const syncUrlToCurrent = useCallback(
    (nextIndex: number) => {
      const next = items[nextIndex];
      if (!next) return;

      const sp = new URLSearchParams(searchParams.toString());
      sp.set("track", next.path);
      router.replace(`/?${sp.toString()}`, { scroll: false });
    },
    [items, router, searchParams]
  );

  // Resolve initial track: path / publicUrl / filename / title
  useEffect(() => {
    if (!items.length) return;

    const raw = searchParams.get("track");
    const trackParam = raw ? safeDecodeMaybe(raw) : null;

    if (trackParam) {
      const found = items.findIndex((t) => {
        const title = stripExt(t.name);

        if (t.path === trackParam) return true;
        if (t.publicUrl === trackParam) return true;
        if (t.name === trackParam) return true;
        if (title === trackParam) return true;

        const again = safeDecodeMaybe(trackParam);
        if (t.path === again) return true;
        if (t.name === again) return true;
        if (t.publicUrl === again) return true;
        if (title === again) return true;

        return false;
      });

      if (found >= 0) {
        setIndex(found);
        setShouldAutoplay(true);
      }
      return;
    }

    try {
      const savedPath = localStorage.getItem(LS_LAST_TRACK_PATH);
      if (savedPath) {
        const found = items.findIndex((t) => t.path === savedPath);
        if (found >= 0) setIndex(found);
      }
    } catch {}

    try {
      const was = localStorage.getItem(LS_WAS_PLAYING);
      if (was === "1") setShouldAutoplay(true);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  const current = items[index];

  // Persist last track selection (path + publicUrl + title)
  useEffect(() => {
    if (!current) return;

    try {
      localStorage.setItem(LS_LAST_TRACK_PATH, current.path);
    } catch {}

    try {
      localStorage.setItem(LS_LAST_TRACK_PUBLIC_URL, current.publicUrl);
    } catch {}

    try {
      localStorage.setItem(LS_LAST_TRACK_TITLE, stripExt(current.name));
    } catch {}
  }, [current]);

  // Restore saved playback position when metadata loads
  useEffect(() => {
    const a = audioRef.current;
    if (!a || !current) return;

    const key = `${LS_POS_PREFIX}${current.path}`;

    const onLoaded = () => {
      try {
        const raw = localStorage.getItem(key);
        const pos = raw == null ? null : Number(raw);
        if (pos != null && Number.isFinite(pos) && pos > 0) {
          const dur = a.duration;
          if (Number.isFinite(dur) && dur > 0 && pos > dur - 2) return;
          a.currentTime = Math.max(0, pos);
        }
      } catch {}
    };

    a.addEventListener("loadedmetadata", onLoaded);
    return () => a.removeEventListener("loadedmetadata", onLoaded);
  }, [current]);

  // Persist playback position periodically + on pause/seek
  useEffect(() => {
    const a = audioRef.current;
    if (!a || !current) return;

    const key = `${LS_POS_PREFIX}${current.path}`;

    const save = () => {
      try {
        if (!Number.isFinite(a.currentTime)) return;
        localStorage.setItem(key, String(a.currentTime));
      } catch {}
    };

    const onPause = () => save();
    const onSeeked = () => save();

    a.addEventListener("pause", onPause);
    a.addEventListener("seeked", onSeeked);

    const id = window.setInterval(() => {
      if (!a.paused) save();
    }, 2000);

    return () => {
      window.clearInterval(id);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("seeked", onSeeked);
    };
  }, [current]);

  const guardedAdvance = useCallback((fn: () => void) => {
    const now = Date.now();
    if (advancingRef.current && now - lastAdvanceAtRef.current < 500) return;

    advancingRef.current = true;
    lastAdvanceAtRef.current = now;

    fn();

    window.setTimeout(() => {
      advancingRef.current = false;
    }, 350);
  }, []);

  const goNext = useCallback(() => {
    if (!items.length) return;

    guardedAdvance(() => {
      setIndex((i) => (i + 1) % items.length);
      setShouldAutoplay(true);
    });
  }, [guardedAdvance, items.length]);

  const goPrev = useCallback(() => {
    if (!items.length) return;

    guardedAdvance(() => {
      setIndex((i) => (i - 1 + items.length) % items.length);
      setShouldAutoplay(true);
    });
  }, [guardedAdvance, items.length]);

  // When current changes: sync URL + optional autoplay
  useEffect(() => {
    if (!current) return;

    syncUrlToCurrent(index);
    currentUrlRef.current = current.publicUrl;

    if (!shouldAutoplay) return;

    const a = audioRef.current;
    if (!a) return;

    const tryPlay = async () => {
      try {
        await a.play();
        pendingGesturePlayRef.current = false;
      } catch {
        pendingGesturePlayRef.current = true;
      } finally {
        setShouldAutoplay(false);
      }
    };

    queueMicrotask(tryPlay);
  }, [current, index, shouldAutoplay, syncUrlToCurrent]);

  // One-time gesture fallback ONLY when armed
  useEffect(() => {
    function attempt() {
      if (!pendingGesturePlayRef.current) return;
      const a = audioRef.current;
      if (!a) return;

      a.play()
        .then(() => {
          pendingGesturePlayRef.current = false;
        })
        .catch(() => {});
    }

    function onPointerDown() {
      attempt();
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === " " || e.key === "Enter") attempt();
    }

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  // Keyboard: Left/Right for prev/next
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!items.length) return;

      const el = document.activeElement as HTMLElement | null;
      const tag = el?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;

      if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goNext, goPrev, items.length]);

  const onEnded = useCallback(() => {
    const a = audioRef.current;
    const src = a?.currentSrc ?? "";
    if (src && currentUrlRef.current && src !== currentUrlRef.current) return;
    goNext();
  }, [goNext]);

  const options = useMemo(() => {
    return items.map((t, i) => ({
      value: String(i),
      label: stripExt(t.name),
    }));
  }, [items]);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="mb-6 text-2xl font-semibold">Player</h1>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          {loading ? (
            <div className="text-sm text-zinc-600">Loading Supabase MP3s…</div>
          ) : loadError ? (
            <div className="text-sm text-red-600">
              Couldn’t load MP3s: {loadError}
            </div>
          ) : !items.length ? (
            <div className="text-sm text-zinc-600">
              No MP3s found in your public bucket.
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm text-zinc-600">
                  Track {index + 1} / {items.length}
                </div>
                <div className="text-sm font-medium">
                  {stripExt(current.name)}
                </div>
              </div>

              <label className="mb-2 block text-xs font-medium text-zinc-600">
                Select track
              </label>
              <select
                className="mb-4 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
                value={String(index)}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  if (Number.isFinite(next)) {
                    setIndex(next);
                    setShouldAutoplay(true);
                  }
                }}
              >
                {options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>

              <div className="mb-4 flex gap-3">
                <button
                  onClick={goPrev}
                  className="rounded-lg border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50 active:scale-[0.99]"
                >
                  Prev
                </button>
                <button
                  onClick={goNext}
                  className="rounded-lg border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50 active:scale-[0.99]"
                >
                  Next
                </button>
              </div>

              <audio
                ref={audioRef}
                key={current.publicUrl}
                src={current.publicUrl}
                controls
                className="w-full"
                onEnded={onEnded}
              />
            </>
          )}
        </div>
      </main>
    </div>
  );
}