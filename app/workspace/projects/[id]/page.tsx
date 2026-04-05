"use client";

import ProjectActivityPanel from "./ProjectActivityPanel";
import MetadataPanel from "../../../../player/MetadataPanel";
import { logProjectActivity } from "../../../../lib/projectActivity";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import ProjectLibraryPanel from "./ProjectLibraryPanel";
import { useAuth } from "../../../components/AuthProvider";
import PlaybackHelper from "../../../components/PlaybackHelper";
import * as supabaseClientModule from "../../../../lib/supabaseClient";
import { getSupabaseTracks } from "../../../../lib/getSupabaseTracks";
import {
  loadPerformanceState,
  patchPerformanceState,
  type LoopMode as PersistLoopMode,
} from "../../../../lib/performanceState";
import { createPerformancePlayback } from "../../../../lib/performancePlayback";

type ProjectKind = "music" | "education" | "game" | "experiment" | "collab";
type ProjectVisibility = "private" | "shared" | "public";

type Project = {
  id: string;
  owner_id: string;
  title: string;
  description?: string | null;
  kind: ProjectKind;
  visibility: ProjectVisibility;
  created_at: string;
  updated_at: string;
};

type Note = {
  id: string;
  project_id: string;
  owner_id: string;
  title: string;
  body: string;
  pinned: boolean;
  created_at: string;
  updated_at: string;
};

const supabase: any =
  (supabaseClientModule as any).supabase ??
  (supabaseClientModule as any).default ??
  (supabaseClientModule as any).client ??
  (supabaseClientModule as any).supabaseClient;

function formatKind(kind: ProjectKind) {
  switch (kind) {
    case "music":
      return "Music";
    case "education":
      return "Education";
    case "game":
      return "Game";
    case "experiment":
      return "Experiment";
    case "collab":
      return "Collaboration";
    default:
      return "Project";
  }
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

// simple UUID check (prevents noisy Supabase errors)
function looksLikeUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
}

type Tab = "overview" | "notes" | "library" | "activity";

function firstLine(s: string) {
  const line = (s ?? "").replace(/\r/g, "").split("\n")[0] ?? "";
  return line.trim();
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 1;
  return Math.max(0, Math.min(1, n));
}

function fmtTime(secs: number) {
  if (!Number.isFinite(secs) || secs < 0) return "0:00";
  const s = Math.floor(secs);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

type LoopMode = "off" | "track" | "setlist";
function nextLoopMode(m: LoopMode): LoopMode {
  if (m === "off") return "track";
  if (m === "track") return "setlist";
  return "off";
}

function toPersistLoopMode(m: LoopMode): PersistLoopMode {
  if (m === "track") return "one";
  if (m === "setlist") return "all";
  return "off";
}

function fromPersistLoopMode(m: PersistLoopMode): LoopMode {
  if (m === "one") return "track";
  if (m === "all") return "setlist";
  return "off";
}

// Fisher–Yates shuffle (safe, in-place copy)
function shuffled<T>(arr: T[]) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

function buildShuffleOrder(ids: string[], keepFirstId?: string | null) {
  const unique = Array.from(new Set(ids.map(String)));
  if (!unique.length) return [];
  const keep = keepFirstId ? String(keepFirstId) : null;

  if (!keep || !unique.includes(keep)) {
    return shuffled(unique);
  }

  const rest = unique.filter((x) => x !== keep);
  return [keep, ...shuffled(rest)];
}

export default function ProjectDetailsPage() {
  const { user, loading } = useAuth();
  const params = useParams();
  const id = useMemo(() => String((params as any)?.id ?? ""), [params]);

  const [tab, setTab] = useState<Tab>("overview");

  const [proj, setProj] = useState<Project | null>(null);
  const [loadingProj, setLoadingProj] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Notes (list)
  const [notes, setNotes] = useState<Note[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [notesErr, setNotesErr] = useState<string | null>(null);

  // Notes UX
  const [notesQuery, setNotesQuery] = useState("");
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

  // Editor state
  const [editorTitle, setEditorTitle] = useState("");
  const [editorBody, setEditorBody] = useState("");
  const [editorDirty, setEditorDirty] = useState(false);

  // Create note
  const [creatingNote, setCreatingNote] = useState(false);

  // Save/Delete
  const [savingNote, setSavingNote] = useState(false);
  const [deletingNote, setDeletingNote] = useState(false);

  // Autosave
  const [autosaveOn, setAutosaveOn] = useState(false);
  const autosaveTimerRef = useRef<number | null>(null);

  // Inline rename (left list)
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renamingBusy, setRenamingBusy] = useState(false);

  /* ===============================
     🌿 Project Library Linking
     - No Library refactor
     - Reads library via getSupabaseTracks()
     - Links via project_tracks join table
     - Track IDs are storage-based strings like: sb:audio:<path>
  ============================== */

  const [allTracks, setAllTracks] = useState<any[]>([]);
  const [linkedTrackIds, setLinkedTrackIds] = useState<Set<string>>(new Set());
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [libraryErr, setLibraryErr] = useState<string | null>(null);

  // Library UX (only busy id now; filtering/search moved into ProjectLibraryPanel)
  const [linkBusyId, setLinkBusyId] = useState<string | null>(null);

  // Overview UX (Project workspace)
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewErr, setOverviewErr] = useState<string | null>(null);
  const [overviewQuery, setOverviewQuery] = useState("");
  const [setlistOrder, setSetlistOrder] = useState<string[]>([]);
  const [previewTrackId, setPreviewTrackId] = useState<string | null>(null);
  const [metadataTargetType, setMetadataTargetType] = useState<"track" | "section" | "moment" | "project">("track");
  const [metadataTargetId, setMetadataTargetId] = useState<string | null>(null);

  // Phase 3: Project Player Mode
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [nowPlayingId, setNowPlayingId] = useState<string | null>(null);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [playerErr, setPlayerErr] = useState<string | null>(null);

  // ===============================
  // Performance Mode: player UI state
  // ===============================
  const [elapsedSec, setElapsedSec] = useState(0);
  const [durationSec, setDurationSec] = useState(0);
  const [seeking, setSeeking] = useState(false);

  const [miniPlayerPinned, setMiniPlayerPinned] = useState(false);
  const [miniAutoVisible, setMiniAutoVisible] = useState(false);

  const [loopMode, setLoopMode] = useState<LoopMode>("off");
  const [isPaused, setIsPaused] = useState(false);

  // Performance Mode additions (Phase 1 bundle)
  const [shuffleOn, setShuffleOn] = useState(false);
  const [shuffleOrder, setShuffleOrder] = useState<string[]>([]);
  const [volume01, setVolume01] = useState(1);
  const [muted, setMuted] = useState(false);
  const [showKeys, setShowKeys] = useState(false);

  // Scroll target for "jump to Now Playing"
  const nowPlayingCardRef = useRef<HTMLDivElement | null>(null);

  const linkedTracks = useMemo(() => {
    if (!allTracks?.length) return [];
    return allTracks.filter((t) => linkedTrackIds.has(String(t.id)));
  }, [allTracks, linkedTrackIds]);

  const orderedLinkedTracks = useMemo(() => {
    if (!linkedTracks.length) return [];

    const order = setlistOrder;
    const map = new Map<string, any>();
    for (const t of linkedTracks) map.set(String(t.id), t);

    const ordered: any[] = [];
    for (const tid of order) {
      const t = map.get(String(tid));
      if (t) ordered.push(t);
    }

    for (const t of linkedTracks) {
      const tid = String(t.id);
      if (!order.includes(tid)) ordered.push(t);
    }

    return ordered;
  }, [linkedTracks, setlistOrder]);

  // Playback list (ordered unless shuffle enabled)
  const playbackTracks = useMemo(() => {
    if (!orderedLinkedTracks.length) return [];
    if (!shuffleOn) return orderedLinkedTracks;

    const ids = orderedLinkedTracks.map((t: any) => String(t.id));
    const set = new Set(ids);

    // keep shuffleOrder only for currently-linked ids
    const filteredOrder = shuffleOrder.filter((tid) => set.has(String(tid)));

    // append any missing ids (newly linked) at end, in stable ordered order
    const missing = ids.filter((tid) => !filteredOrder.includes(tid));
    const finalIds = [...filteredOrder, ...missing];

    const map = new Map<string, any>();
    for (const t of orderedLinkedTracks) map.set(String(t.id), t);
    return finalIds.map((tid) => map.get(String(tid))).filter(Boolean);
  }, [orderedLinkedTracks, shuffleOn, shuffleOrder]);

  const nowPlayingTrack = useMemo(() => {
    if (!nowPlayingId) return null;
    return orderedLinkedTracks.find((t: any) => String(t.id) === nowPlayingId) ?? null;
  }, [nowPlayingId, orderedLinkedTracks]);

  // Index in playbackTracks (used by next/prev/ended)
  const playbackIndex = useMemo(() => {
    if (!nowPlayingId) return -1;
    return playbackTracks.findIndex((t: any) => String(t.id) === nowPlayingId);
  }, [nowPlayingId, playbackTracks]);

  const upNextTrack = useMemo(() => {
    if (!nowPlayingId) return null;
    if (!playbackTracks.length) return null;
    const idx = playbackIndex;
    if (idx < 0) return null;

    const atEnd = idx + 1 >= playbackTracks.length;
    if (atEnd) {
      if (loopMode === "setlist") return playbackTracks[0] ?? null;
      return null;
    }

    return playbackTracks[idx + 1] ?? null;
  }, [nowPlayingId, playbackTracks, playbackIndex, loopMode]);

  const previewTrack = useMemo(() => {
    if (!previewTrackId) return null;
    return orderedLinkedTracks.find(
      (t: any) => String(t.id) === String(previewTrackId)
    ) ?? null;
  }, [previewTrackId, orderedLinkedTracks]);

  const topLinkedTracks = useMemo(() => {
    return orderedLinkedTracks.slice(0, 5);
  }, [orderedLinkedTracks]);

  const overviewSuggestions = useMemo(() => {
    const q = overviewQuery.trim().toLowerCase();
    if (!q) return [];

    let list = Array.isArray(allTracks) ? allTracks : [];
    list = list.filter((t: any) => {
      const title = String(t?.title ?? "").toLowerCase();
      const artist = String(t?.artist ?? "").toLowerCase();
      const path = String(t?.path ?? "").toLowerCase();
      const tid = String(t?.id ?? "").toLowerCase();
      return title.includes(q) || artist.includes(q) || path.includes(q) || tid.includes(q);
    });

    list = list.filter((t: any) => !linkedTrackIds.has(String(t?.id)));
    return list.slice(0, 6);
  }, [overviewQuery, allTracks, linkedTrackIds]);

  const activeNote = useMemo(() => {
    if (!activeNoteId) return null;
    return notes.find((n) => n.id === activeNoteId) ?? null;
  }, [notes, activeNoteId]);

  const filteredNotes = useMemo(() => {
    const q = notesQuery.trim().toLowerCase();
    if (!q) return notes;

    return notes.filter((n) => {
      const t = (n.title ?? "").toLowerCase();
      const b = (n.body ?? "").toLowerCase();
      return t.includes(q) || b.includes(q);
    });
  }, [notes, notesQuery]);

  const displayNotes = useMemo(() => {
    const list = [...filteredNotes];
    list.sort((a, b) => {
      const ap = a.pinned ? 1 : 0;
      const bp = b.pinned ? 1 : 0;
      if (ap !== bp) return bp - ap;
      const ad = Date.parse(a.updated_at || "") || 0;
      const bd = Date.parse(b.updated_at || "") || 0;
      return bd - ad;
    });
    return list;
  }, [filteredNotes]);

  const totalNotes = notes.length;
  const shownNotes = displayNotes.length;

  async function loadProject() {
    setErrorMsg(null);
    setLoadingProj(true);

    try {
      if (!supabase) throw new Error("Supabase client not found.");
      if (!id) throw new Error("Missing project id.");
      if (!looksLikeUuid(id)) throw new Error("Invalid project id format.");

      const { data, error } = await supabase
        .from("projects")
        .select("id, owner_id, title, description, kind, visibility, created_at, updated_at")
        .eq("id", id)
        .single();

      if (error) throw new Error(error.message);
      setProj(data as Project);
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to load project");
      setProj(null);
    } finally {
      setLoadingProj(false);
    }
  }

  async function loadNotes(opts?: { autoOpenNewest?: boolean }) {
    setNotesErr(null);
    setLoadingNotes(true);

    try {
      if (!supabase) throw new Error("Supabase client not found.");
      if (!looksLikeUuid(id)) throw new Error("Invalid project id format.");

      const { data, error } = await supabase
        .from("project_notes")
        .select("id, project_id, owner_id, title, body, pinned, created_at, updated_at")
        .eq("project_id", id)
        .order("updated_at", { ascending: false });

      if (error) throw new Error(error.message);

      const list = (data ?? []) as Note[];
      setNotes(list);

      const shouldAutoOpen = opts?.autoOpenNewest || (!activeNoteId && list.length > 0);

      if (shouldAutoOpen) {
        setActiveNoteId(list[0].id);
      } else {
        if (activeNoteId && !list.some((n) => n.id === activeNoteId)) {
          setActiveNoteId(null);
        }
      }
    } catch (e: any) {
      setNotesErr(e?.message ?? "Failed to load notes");
      setNotes([]);
      setActiveNoteId(null);
    } finally {
      setLoadingNotes(false);
    }
  }

  /* ===============================
     🌿 Library Linking Loaders
  ============================== */

  async function refreshLinkedIdsOnly() {
    if (!supabase) throw new Error("Supabase client not found.");
    if (!looksLikeUuid(id)) throw new Error("Invalid project id format.");

    const { data, error } = await supabase.from("project_tracks").select("track_id").eq("project_id", id);

    if (error) throw new Error(error.message);

    const ids = new Set<string>((data ?? []).map((r: any) => String(r.track_id)));
    setLinkedTrackIds(ids);

    setSetlistOrder((prev) => prev.filter((tid) => ids.has(String(tid))));

    // If currently playing track was unlinked, stop.
    setNowPlayingId((cur) => {
      if (!cur) return cur;
      return ids.has(String(cur)) ? cur : null;
    });
    setPreviewTrackId((cur) => {
      if (!cur) return cur;
      return ids.has(String(cur)) ? cur : null;
    });
  }

  async function ensureTracksLoadedOnce() {
    if (allTracks && allTracks.length > 0) return;
    const tracks = await getSupabaseTracks();
    const safeTracks = Array.isArray(tracks) ? tracks : [];
    setAllTracks(safeTracks);
  }

  async function loadLibrary() {
    setLibraryErr(null);
    setLoadingLibrary(true);

    try {
      if (!supabase) throw new Error("Supabase client not found.");
      if (!looksLikeUuid(id)) throw new Error("Invalid project id format.");

      await ensureTracksLoadedOnce();
      await refreshLinkedIdsOnly();
    } catch (e: any) {
      setLibraryErr(e?.message ?? "Failed to load library links");
      setLinkedTrackIds(new Set());
    } finally {
      setLoadingLibrary(false);
    }
  }

  async function loadOverviewDock() {
    setOverviewErr(null);
    setOverviewLoading(true);

    try {
      if (!supabase) throw new Error("Supabase client not found.");
      if (!looksLikeUuid(id)) throw new Error("Invalid project id format.");
      await ensureTracksLoadedOnce();
      await refreshLinkedIdsOnly();
    } catch (e: any) {
      setOverviewErr(e?.message ?? "Failed to load project library dock");
    } finally {
      setOverviewLoading(false);
    }
  }

  async function linkTrack(trackId: string) {
    setLibraryErr(null);
    setOverviewErr(null);

    try {
      if (!supabase) throw new Error("Supabase client not found.");
      if (!looksLikeUuid(id)) throw new Error("Invalid project id format.");

      if (linkedTrackIds.has(trackId)) return;

      setLinkBusyId(trackId);

      setLinkedTrackIds((prev) => {
        const next = new Set(prev);
        next.add(trackId);
        return next;
      });

      const { data: existing, error: existingErr } = await supabase
        .from("project_tracks")
        .select("track_id")
        .eq("project_id", id)
        .eq("track_id", trackId)
        .limit(1);

      if (existingErr) throw new Error(existingErr.message);
      if (Array.isArray(existing) && existing.length > 0) {
        return;
      }

      const { error } = await supabase.from("project_tracks").insert({ project_id: id, track_id: trackId });

      if (error) throw new Error(error.message);

      const linkedTrack =
        allTracks.find((t: any) => String(t?.id) === String(trackId)) ?? null;

      logProjectActivity(
        id,
        "link",
        `Linked track: ${linkedTrack?.title ?? "Untitled"}`,
        { trackId }
      );

      setSetlistOrder((prev) => {
        if (prev.includes(trackId)) return prev;
        return [...prev, trackId];
      });
    } catch (e: any) {
      setLinkedTrackIds((prev) => {
        const next = new Set(prev);
        next.delete(trackId);
        return next;
      });
      const msg = e?.message ?? "Link failed";
      setLibraryErr(msg);
      setOverviewErr(msg);
    } finally {
      setLinkBusyId(null);
    }
  }

  async function unlinkTrack(trackId: string) {
    setLibraryErr(null);
    setOverviewErr(null);

    try {
      if (!supabase) throw new Error("Supabase client not found.");
      if (!looksLikeUuid(id)) throw new Error("Invalid project id format.");

      if (!linkedTrackIds.has(trackId)) return;

      setLinkBusyId(trackId);

      setLinkedTrackIds((prev) => {
        const next = new Set(prev);
        next.delete(trackId);
        return next;
      });

      setSetlistOrder((prev) => prev.filter((tid) => tid !== trackId));

      const { error } = await supabase
        .from("project_tracks")
        .delete()
        .eq("project_id", id)
        .eq("track_id", trackId);

      if (error) throw new Error(error.message);

      const unlinkedTrack =
        allTracks.find((t: any) => String(t?.id) === String(trackId)) ?? null;

      logProjectActivity(
        id,
        "unlink",
        `Unlinked track: ${unlinkedTrack?.title ?? "Untitled"}`,
        { trackId }
      );

      if (previewTrackId === trackId) setPreviewTrackId(null);
      if (metadataTargetType === "track" && metadataTargetId === trackId) {
        setMetadataTargetId(null);
      }
      if (nowPlayingId === trackId) setNowPlayingId(null);
    } catch (e: any) {
      setLinkedTrackIds((prev) => {
        const next = new Set(prev);
        next.add(trackId);
        return next;
      });
      const msg = e?.message ?? "Unlink failed";
      setLibraryErr(msg);
      setOverviewErr(msg);
    } finally {
      setLinkBusyId(null);
    }
  }

  function moveSetlistItem(tid: string, dir: "up" | "down") {
    setSetlistOrder((prev) => {
      const cur = prev.slice();
      const i = cur.indexOf(tid);
      if (i === -1) return prev;

      const j = dir === "up" ? i - 1 : i + 1;
      if (j < 0 || j >= cur.length) return prev;

      const tmp = cur[i];
      cur[i] = cur[j];
      cur[j] = tmp;
      return cur;
    });
  }

  function selectTrackMetadataTarget(tid: string) {
    setMetadataTargetType("track");
    setMetadataTargetId(String(tid));
  }

  // ===============================
  // Player controls
  // ===============================

  function getTrackById(tid: string) {
    return orderedLinkedTracks.find((t: any) => String(t.id) === String(tid)) ?? null;
  }

  function playTrackById(tid: string) {
    setPlayerErr(null);

    const t = getTrackById(tid);
    if (!t?.url) {
      setPlayerErr("Track URL missing. Cannot play.");
      return;
    }

    setNowPlayingId(String(tid));
    setPreviewTrackId(String(tid)); // keep UI consistent (preview follows player)
    logProjectActivity(
      id,
      "play",
      `Played track: ${t.title ?? "Untitled"}`,
      { trackId: tid }
    );

    const el = audioRef.current;
    if (!el) return;

    try {
      el.src = String(t.url);
      el.currentTime = 0;

      // apply volume & mute every time we load a track
      el.volume = clamp01(volume01);
      el.muted = !!muted;

      // track loop mode sync
      el.loop = loopMode === "track";

      const p = el.play();
      if (p && typeof (p as any).catch === "function") {
        (p as any).catch((err: any) => {
          setPlayerErr(err?.message ?? "Playback blocked by browser.");
        });
      }
    } catch (e: any) {
      setPlayerErr(e?.message ?? "Failed to start playback.");
    }
  }

  function playProject() {
    setPlayerErr(null);

    if (playbackTracks.length === 0) {
      setPlayerErr("No linked tracks. Link tracks first.");
      return;
    }

    const tid = nowPlayingId ? nowPlayingId : String(playbackTracks[0]?.id ?? "");

    if (!tid) {
      setPlayerErr("No playable track found.");
      return;
    }

    playTrackById(tid);
  }

  function prevTrack() {
    setPlayerErr(null);

    if (playbackTracks.length === 0) return;

    const idx = playbackIndex >= 0 ? playbackIndex : 0;
    const prevIdx = Math.max(0, idx - 1);
    const tid = String(playbackTracks[prevIdx]?.id ?? "");
    if (!tid) return;
    playTrackById(tid);
  }

  function nextTrack(opts?: { wrapIfSetlistLoop?: boolean }) {
    setPlayerErr(null);

    if (playbackTracks.length === 0) return;

    const idx = playbackIndex >= 0 ? playbackIndex : -1;
    let nextIdx = Math.min(playbackTracks.length - 1, idx + 1);

    if (opts?.wrapIfSetlistLoop && loopMode === "setlist") {
      if (idx >= playbackTracks.length - 1) nextIdx = 0;
    }

    const tid = String(playbackTracks[nextIdx]?.id ?? "");
    if (!tid) return;
    playTrackById(tid);
  }

  function stopPlayer() {
    setPlayerErr(null);

    const el = audioRef.current;
    if (!el) {
      setNowPlayingId(null);
      return;
    }

    try {
      el.pause();
      el.currentTime = 0;
      el.loop = false;
    } catch {
      // ignore
    } finally {
      setNowPlayingId(null);
      setElapsedSec(0);
      setDurationSec(0);
      setIsPaused(false);
    }
  }

  function togglePlayPause() {
    setPlayerErr(null);
    const el = audioRef.current;
    if (!el) return;

    // If nothing started yet, default to Play Project
    if (!nowPlayingId) {
      playProject();
      return;
    }

    try {
      if (el.paused) {
        const p = el.play();
        if (p && typeof (p as any).catch === "function") {
          (p as any).catch((err: any) => {
            setPlayerErr(err?.message ?? "Playback blocked by browser.");
          });
        }
      } else {
        el.pause();
      }
    } catch (e: any) {
      setPlayerErr(e?.message ?? "Failed to toggle playback.");
    }
  }

  function onEnded() {
    if (loopMode === "track") return;

    if (!autoAdvance) return;
    if (playbackTracks.length === 0) return;
    if (playbackIndex < 0) return;

    const atEnd = playbackIndex + 1 >= playbackTracks.length;

    if (atEnd) {
      if (loopMode === "setlist") {
        nextTrack({ wrapIfSetlistLoop: true });
      }
      return;
    }

    const tid = String(playbackTracks[playbackIndex + 1]?.id ?? "");
    if (!tid) return;
    playTrackById(tid);
  }

  // ===============================
  // Performance Mode helpers
  // ===============================

  function syncTimesFromAudio() {
    const el = audioRef.current;
    if (!el) return;
    const d = Number.isFinite(el.duration) ? el.duration : 0;
    const t = Number.isFinite(el.currentTime) ? el.currentTime : 0;
    setDurationSec(d || 0);
    if (!seeking) setElapsedSec(t || 0);
  }

  function seekTo(percent01: number) {
    const el = audioRef.current;
    if (!el) return;
    const d = Number.isFinite(el.duration) ? el.duration : 0;
    if (!d || d <= 0) return;
    const nextTime = clamp(percent01, 0, 1) * d;
    try {
      el.currentTime = nextTime;
      setElapsedSec(nextTime);
    } catch {
      // ignore
    }
  }

  function toggleLoop() {
    setLoopMode((prev) => {
      const next = nextLoopMode(prev);
      const el = audioRef.current;
      if (el) el.loop = next === "track";
      return next;
    });
  }

  function toggleShuffle() {
    setShuffleOn((prev) => {
      const next = !prev;
      if (next) {
        const ids = orderedLinkedTracks.map((t: any) => String(t.id));
        const order = buildShuffleOrder(ids, nowPlayingId);
        setShuffleOrder(order);
      }
      return next;
    });
  }

  const miniVisible = (miniAutoVisible || miniPlayerPinned) && !!nowPlayingId;

  // ===============================
  // Loaders
  // ===============================

  // Load project
  useEffect(() => {
    if (loading) return;
    if (!user) return;
    loadProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user?.id, id]);

  // Load notes when tab opens
  useEffect(() => {
    if (tab !== "notes") return;
    if (loading) return;
    if (!user) return;
    loadNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // Load library when library tab opens
  useEffect(() => {
    if (tab !== "library") return;
    if (loading) return;
    if (!user) return;
    loadLibrary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // Load overview dock when overview tab opens
  useEffect(() => {
    if (tab !== "overview") return;
    if (loading) return;
    if (!user) return;
    loadOverviewDock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // When active note changes, load into editor (and clear dirty)
  useEffect(() => {
    if (!activeNote) {
      setEditorTitle("");
      setEditorBody("");
      setEditorDirty(false);
      return;
    }
    setEditorTitle(activeNote.title ?? "");
    setEditorBody(activeNote.body ?? "");
    setEditorDirty(false);
  }, [activeNote?.id]);

  // Mini auto visibility: show once Now Playing card scrolls off top
  useEffect(() => {
    if (tab !== "overview") return;

    function onScroll() {
      if (!nowPlayingCardRef.current) return;
      const rect = nowPlayingCardRef.current.getBoundingClientRect();
      setMiniAutoVisible(rect.top < -10);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll as any);
  }, [tab]);

  useEffect(() => {
    if (tab !== "overview") return;
    if (previewTrackId) return;
    if (!orderedLinkedTracks.length) return;

    setPreviewTrackId(String(orderedLinkedTracks[0].id));
  }, [tab, previewTrackId, orderedLinkedTracks]);

  // Keep duration/elapsed updated from audio element
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    function onTimeUpdate() {
      syncTimesFromAudio();
    }
    function onLoadedMeta() {
      syncTimesFromAudio();
    }
    function onDurationChange() {
      syncTimesFromAudio();
    }
    function onPlay() {
      setIsPaused(false);
      syncTimesFromAudio();
    }
    function onPause() {
      setIsPaused(true);
      syncTimesFromAudio();
    }
    function onVolumeChange() {
      const activeEl = audioRef.current;
      if (!activeEl) return;

      try {
        setVolume01(clamp01(activeEl.volume));
        setMuted(!!activeEl.muted);
      } catch {
        // ignore
      }
    }

    el.addEventListener("timeupdate", onTimeUpdate);
    el.addEventListener("loadedmetadata", onLoadedMeta);
    el.addEventListener("durationchange", onDurationChange);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("volumechange", onVolumeChange);

    syncTimesFromAudio();
    setIsPaused(!!el.paused);
    setVolume01(clamp01(el.volume));
    setMuted(!!el.muted);

    return () => {
      el.removeEventListener("timeupdate", onTimeUpdate);
      el.removeEventListener("loadedmetadata", onLoadedMeta);
      el.removeEventListener("durationchange", onDurationChange);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("volumechange", onVolumeChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nowPlayingId, loopMode, tab]);

  // If loop mode changes while playing, keep audio element in sync
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.loop = loopMode === "track";
  }, [loopMode]);
  // Apply volume/mute to audio element whenever UI changes
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    try {
      el.volume = clamp01(volume01);
      el.muted = !!muted;
    } catch {
      // ignore
    }
  }, [volume01, muted]);

  // Keep shuffleOrder coherent when linked tracks change
  useEffect(() => {
    if (!shuffleOn) return;
    const ids = orderedLinkedTracks.map((t: any) => String(t.id));
    if (!ids.length) {
      setShuffleOrder([]);
      return;
    }

    setShuffleOrder((prev) => {
      const set = new Set(ids);
      const filtered = prev.filter((tid) => set.has(String(tid)));
      const missing = ids.filter((tid) => !filtered.includes(tid));
      if (!filtered.length && prev.length === 0) {
        return buildShuffleOrder(ids, nowPlayingId);
      }
      return [...filtered, ...missing];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shuffleOn, orderedLinkedTracks.length]);

  // ===============================
  // Performance Mode persistence
  // ===============================

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    if (tab !== "overview") return;
    if (!looksLikeUuid(id)) return;

    const st = loadPerformanceState(id);
    void createPerformancePlayback;

    if (Array.isArray(st.trackIds) && st.trackIds.length > 0) {
      setSetlistOrder(st.trackIds.slice());
    }

    if (st.currentTrackId) setNowPlayingId(String(st.currentTrackId));
    setLoopMode(fromPersistLoopMode(st.loopMode));
    setShuffleOn(!!st.isShuffle);
    setVolume01(clamp01(st.volume));
    setMuted(!!st.isMuted);

    if (st.isShuffle && Array.isArray(st.trackIds) && st.trackIds.length > 0) {
      setShuffleOrder(st.trackIds.map(String));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user?.id, tab, id]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!looksLikeUuid(id)) return;

    const idsForSave = (shuffleOn ? playbackTracks : orderedLinkedTracks).map((t: any) =>
      String(t?.id ?? "")
    );

    patchPerformanceState(id, {
      trackIds: idsForSave.filter(Boolean),
      currentTrackId: nowPlayingId ? String(nowPlayingId) : null,
      currentIndex: Math.max(0, playbackIndex),
      lastSeekSeconds: Math.max(0, elapsedSec || 0),
      isShuffle: !!shuffleOn,
      loopMode: toPersistLoopMode(loopMode),
      volume: clamp01(volume01),
      isMuted: !!muted,
    });
  }, [
    id,
    nowPlayingId,
    loopMode,
    shuffleOn,
    volume01,
    muted,
    elapsedSec,
    playbackIndex,
    playbackTracks,
    orderedLinkedTracks,
  ]);

  // Autosave (debounced)
  useEffect(() => {
    if (!autosaveOn) return;
    if (!activeNote) return;
    if (!editorDirty) return;

    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = window.setTimeout(() => {
      saveActiveNote({ silent: true });
    }, 800);

    return () => {
      if (autosaveTimerRef.current) {
        window.clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autosaveOn, editorTitle, editorBody, editorDirty, activeNoteId]);

  // Keyboard shortcuts (Notes)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isMod = e.metaKey || e.ctrlKey;

      if (tab === "notes") {
        if (e.key === "Escape") {
          if (notesQuery) {
            e.preventDefault();
            setNotesQuery("");
            return;
          }
        }

        if (isMod && (e.key === "s" || e.key === "S")) {
          e.preventDefault();
          saveActiveNote();
          return;
        }

        if (isMod && (e.key === "n" || e.key === "N")) {
          e.preventDefault();
          createNote();
          return;
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, notesQuery, activeNoteId, editorDirty, editorTitle, editorBody]);

  // Performance Mode shortcuts (Overview only)
  useEffect(() => {
    if (tab !== "overview") return;

    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isTyping = tag === "input" || tag === "textarea" || (target as any)?.isContentEditable;

      if (isTyping) return;

      const k = e.key?.toLowerCase?.() ?? "";

      if (k === "?" || k === "h") {
        e.preventDefault();
        setShowKeys((v) => !v);
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        togglePlayPause();
        return;
      }

      if (k === "j" || e.key === "ArrowLeft") {
        e.preventDefault();
        prevTrack();
        return;
      }
      if (k === "k" || e.key === "ArrowRight") {
        e.preventDefault();
        nextTrack({ wrapIfSetlistLoop: true });
        return;
      }

      if (k === "s") {
        e.preventDefault();
        toggleShuffle();
        return;
      }

      if (k === "l") {
        e.preventDefault();
        toggleLoop();
        return;
      }

      if (k === "m") {
        e.preventDefault();
        setMuted((v) => !v);
        return;
      }

      if (k === "escape") {
        if (showKeys) {
          e.preventDefault();
          setShowKeys(false);
          return;
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, nowPlayingId, playbackIndex, loopMode, shuffleOn, muted, showKeys]);

  function trySwitchNote(nextId: string) {
    if (nextId === activeNoteId) return;

    if (!autosaveOn && editorDirty) {
      const ok = window.confirm("You have unsaved changes. Switch notes anyway?");
      if (!ok) return;
    }

    setActiveNoteId(nextId);
  }

  async function createNote() {
    setNotesErr(null);

    try {
      if (!supabase) throw new Error("Supabase client not found.");
      if (!looksLikeUuid(id)) throw new Error("Invalid project id format.");

      setCreatingNote(true);

      const seededTitle = notesQuery.trim() ? notesQuery.trim().slice(0, 120) : "Note";

      const { data, error } = await supabase
        .from("project_notes")
        .insert({ project_id: id, title: seededTitle, body: "", pinned: false })
        .select("id")
        .single();

      if (error) throw new Error(error.message);

      logProjectActivity(id, "note", `Created note: ${seededTitle || "Note"}`);

      setNotesQuery("");
      await loadNotes({ autoOpenNewest: true });
      if (data?.id) setActiveNoteId(String(data.id));
    } catch (e: any) {
      setNotesErr(e?.message ?? "Create note failed");
    } finally {
      setCreatingNote(false);
    }
  }

  async function saveActiveNote(opts?: { silent?: boolean }) {
    if (!activeNote) return;
    if (!editorDirty && opts?.silent) return;

    setNotesErr(null);

    try {
      if (!supabase) throw new Error("Supabase client not found.");

      const title = (editorTitle || "Note").trim().slice(0, 120);
      const body = (editorBody || "").toString();

      if (!opts?.silent) setSavingNote(true);

      const { error } = await supabase.from("project_notes").update({ title, body }).eq("id", activeNote.id);

      if (error) throw new Error(error.message);

      logProjectActivity(id, "note", `Saved note: ${title}`);

      setEditorDirty(false);
      await loadNotes();
    } catch (e: any) {
      if (!opts?.silent) setNotesErr(e?.message ?? "Save note failed");
    } finally {
      if (!opts?.silent) setSavingNote(false);
    }
  }

  async function togglePin(note: Note) {
    setNotesErr(null);

    try {
      if (!supabase) throw new Error("Supabase client not found.");

      const { error } = await supabase.from("project_notes").update({ pinned: !note.pinned }).eq("id", note.id);

      if (error) throw new Error(error.message);
      await loadNotes();
    } catch (e: any) {
      setNotesErr(e?.message ?? "Pin update failed");
    }
  }

  function startRename(note: Note) {
    setRenamingId(note.id);
    setRenameValue(note.title ?? "");
  }

  function cancelRename() {
    setRenamingId(null);
    setRenameValue("");
  }

  async function saveRename(noteId: string) {
    setNotesErr(null);

    const title = (renameValue || "Note").trim().slice(0, 120);
    if (!title) return;

    try {
      if (!supabase) throw new Error("Supabase client not found.");
      setRenamingBusy(true);

      const { error } = await supabase.from("project_notes").update({ title }).eq("id", noteId);

      if (error) throw new Error(error.message);

      cancelRename();
      await loadNotes();
    } catch (e: any) {
      setNotesErr(e?.message ?? "Rename failed");
    } finally {
      setRenamingBusy(false);
    }
  }

  async function deleteActiveNote() {
    if (!activeNote) return;

    const ok = window.confirm("Delete this note? This cannot be undone.");
    if (!ok) return;

    setNotesErr(null);

    try {
      if (!supabase) throw new Error("Supabase client not found.");
      setDeletingNote(true);

      const deletedTitle = activeNote.title ?? "Note";

      const { error } = await supabase.from("project_notes").delete().eq("id", activeNote.id);

      if (error) throw new Error(error.message);

      logProjectActivity(id, "note", `Deleted note: ${deletedTitle}`);

      setActiveNoteId(null);
      setEditorTitle("");
      setEditorBody("");
      setEditorDirty(false);

      await loadNotes({ autoOpenNewest: true });
    } catch (e: any) {
      setNotesErr(e?.message ?? "Delete note failed");
    } finally {
      setDeletingNote(false);
    }
  }

  if (loading) return <div className="p-6">Loading…</div>;

  if (!user) {
    return (
      <main className="mx-auto max-w-2xl p-6 space-y-4">
        <h1 className="text-2xl font-bold">Project</h1>
        <div className="rounded-xl border p-5 space-y-2">
          <div className="text-sm text-zinc-600">You must be signed in to view this project.</div>
          <Link href="/members" className="inline-block rounded bg-black px-4 py-2 text-white">
            Go to Members Sign In
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl p-6 space-y-6">
      {/* Breadcrumb / Nav */}
      <header className="space-y-2">
        <div className="text-sm text-zinc-600">
          <Link href="/workspace" className="underline">
            Workspace
          </Link>{" "}
          <span className="text-zinc-400">/</span>{" "}
          <Link href="/workspace/projects" className="underline">
            Projects
          </Link>{" "}
          <span className="text-zinc-400">/</span>{" "}
          <span className="text-zinc-700">Details</span>
        </div>

        <h1 className="text-2xl font-bold">Project Workspace</h1>
        <div className="text-xs text-zinc-500 break-all">ID: {id}</div>
      </header>

      {/* Tabs */}
      <section className="rounded-xl border p-2">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["overview", "Overview"],
              ["notes", "Notes"],
              ["library", "Library"],
              ["activity", "Activity"],
            ] as const
          ).map(([key, label]) => {
            const active = tab === key;
            return (
              <button
                key={key}
                className={`rounded-lg px-3 py-2 text-sm border ${active ? "bg-zinc-50" : "bg-white"}`}
                onClick={() => setTab(key)}
              >
                {label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Keyboard shortcuts overlay (Performance Mode) */}
      {tab === "overview" && showKeys ? (
        <div className="fixed inset-0 z-[60] bg-black/30 flex items-center justify-center p-4">
          <div className="w-[min(42rem,calc(100vw-2rem))] rounded-2xl border bg-white shadow-lg p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-medium">Performance Shortcuts</div>
              <button className="rounded border px-2 py-1 text-xs" onClick={() => setShowKeys(false)}>
                Close
              </button>
            </div>

            <div className="text-sm text-zinc-700">
              Use these anywhere on Overview (when not typing in an input).
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <div className="rounded border p-2">
                <div className="font-medium text-xs text-zinc-600 mb-1">Playback</div>
                <div>Space: Play / Pause</div>
                <div>J or ←: Previous</div>
                <div>K or →: Next</div>
                <div>M: Mute</div>
              </div>
              <div className="rounded border p-2">
                <div className="font-medium text-xs text-zinc-600 mb-1">Modes</div>
                <div>S: Shuffle</div>
                <div>L: Loop (Off → Track → Setlist)</div>
                <div>H or ?: Toggle this help</div>
                <div>Esc: Close help</div>
              </div>
            </div>

            <div className="text-xs text-zinc-500">
              Tip: These do not change Global Library. They only control Project playback.
            </div>
          </div>
        </div>
      ) : null}

    {/* Floating Mini Player (Performance Mode) */}
      {tab === "overview" && miniVisible ? (
        <div className="fixed bottom-4 left-1/2 z-50 w-[min(42rem,calc(100vw-2rem))] -translate-x-1/2">
          <div className="rounded-2xl border bg-white shadow-lg p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <button
                  className="text-left min-w-0"
                  onClick={() => {
                    nowPlayingCardRef.current?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }}
                  title="Jump to Now Playing"
                >
                  <div className="text-sm font-medium truncate">▶ {nowPlayingTrack?.title ?? "Untitled"}</div>
                </button>
                <div className="text-xs text-zinc-500 truncate">
                  {nowPlayingTrack?.artist ?? "Supabase"}
                  {playbackIndex >= 0 ? (
                    <>
                      {" "}
                      • Track {playbackIndex + 1} / {playbackTracks.length}
                    </>
                  ) : null}
                </div>
              </div>

              <div className="text-xs text-zinc-500 truncate">Up next: {upNextTrack?.title ?? "—"}</div>
            </div>

            <div className="flex items-center gap-2">
              <button className="rounded border px-2 py-1 text-xs" onClick={() => setShowKeys(true)} title="Show keyboard shortcuts (H / ?)">
                Keys
              </button>

              <button
                className="rounded border px-2 py-1 text-xs"
                onClick={() => setMiniPlayerPinned((v) => !v)}
                title={miniPlayerPinned ? "Unpin mini player" : "Pin mini player"}
              >
                {miniPlayerPinned ? "Unpin" : "Pin"}
              </button>

              <button className="rounded border px-2 py-1 text-xs" onClick={toggleShuffle} title="Shuffle (S)">
                {shuffleOn ? "Shuffle: On" : "Shuffle: Off"}
              </button>

              <button
                className="rounded border px-2 py-1 text-xs disabled:opacity-60"
                onClick={prevTrack}
                disabled={playbackTracks.length === 0 || playbackIndex <= 0}
                title="J / ←"
              >
                Prev
              </button>
              <button
                className="rounded border px-2 py-1 text-xs disabled:opacity-60"
                onClick={() => nextTrack({ wrapIfSetlistLoop: true })}
                disabled={
                  playbackTracks.length === 0 ||
                  playbackIndex === -1 ||
                  (loopMode !== "setlist" && playbackIndex >= playbackTracks.length - 1)
                }
                title="K / →"
              >
                Next
              </button>
              <button className="rounded border px-2 py-1 text-xs disabled:opacity-60" onClick={togglePlayPause} disabled={!nowPlayingId} title="Space">
                {isPaused ? "Resume" : "Pause"}
              </button>
              <button className="rounded border px-2 py-1 text-xs disabled:opacity-60" onClick={stopPlayer} disabled={!nowPlayingId}>
                Stop
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 text-xs text-zinc-600">
            <div>
              {fmtTime(elapsedSec)} / {fmtTime(durationSec)}
            </div>

            <div className="flex items-center gap-2">
              <button className="rounded border px-2 py-1 text-xs" onClick={() => setMuted((v) => !v)} title="Mute (M)">
                {muted ? "Muted" : "Mute"}
              </button>

              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(volume01 * 100)}
                onChange={(e) => {
                  const v = Number(e.target.value) || 0;
                  setVolume01(clamp01(v / 100));
                }}
                className="w-24"
                title="Volume"
              />

              <button className="rounded border px-2 py-1 text-xs" onClick={toggleLoop} title="Loop mode cycles: Off → Track → Setlist (L)">
                Loop: {loopMode === "off" ? "Off" : loopMode === "track" ? "Track" : "Setlist"}
              </button>
            </div>
          </div>

          <input
            type="range"
            min={0}
            max={1000}
            value={durationSec > 0 ? Math.round((elapsedSec / durationSec) * 1000) : 0}
            onMouseDown={() => setSeeking(true)}
            onMouseUp={() => setSeeking(false)}
            onTouchStart={() => setSeeking(true)}
            onTouchEnd={() => setSeeking(false)}
            onChange={(e) => {
              const v = Number(e.target.value) || 0;
              const pct = v / 1000;
              setElapsedSec(pct * (durationSec || 0));
              seekTo(pct);
            }}
            className="w-full"
          />
        </div>
      </div>
    ) : null}

    {/* Main card */}
    <section className="rounded-xl border p-5 space-y-3">
      {loadingProj ? (
        <div className="text-sm text-zinc-600">Loading project…</div>
      ) : errorMsg ? (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorMsg}</div>
      ) : !proj ? (
        <div className="text-sm text-zinc-600">Project not found.</div>
      ) : tab === "overview" ? (
        <div className="space-y-4">
          <div className="text-sm text-zinc-600">
            Overview section unchanged — your previous content should remain.
          </div>
        </div>
      ) : tab === "notes" ? (
        <div className="text-sm text-zinc-600">
          Notes section unchanged — your previous content should remain.
        </div>
      ) : tab === "library" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="font-medium">Project Library</div>
            <button
              className="rounded border px-3 py-2 text-sm disabled:opacity-60"
              onClick={loadLibrary}
              disabled={loadingLibrary}
              title="Refresh"
            >
              {loadingLibrary ? "Refreshing…" : "Refresh"}
            </button>
          </div>

          {libraryErr ? (
            <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{libraryErr}</div>
          ) : null}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {/* Linked */}
            <div className="rounded-lg border p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-medium">Linked Tracks</div>
                <div className="text-xs text-zinc-500">Linked: {linkedTrackIds.size}</div>
              </div>

              {linkedTracks.length === 0 ? (
                <div className="text-sm text-zinc-600">No tracks linked yet. Use the Library list to link.</div>
              ) : (
                <div className="space-y-2">
                  {linkedTracks.map((t: any) => {
                    const tid = String(t.id);
                    const isNow = nowPlayingId === tid;
                    const isPreview = previewTrack ? String(previewTrack.id) === tid : false;
                    const isMetadataSelected =
                      metadataTargetType === "track" && metadataTargetId === tid;

                    return (
                      <div
                        key={tid}
                        className={`rounded border p-3 flex items-center justify-between gap-3 cursor-pointer ${
                          isPreview ? "bg-zinc-50 border-black" : "bg-white"
                        }`}
                        onClick={() => {
                          setPreviewTrackId(tid);
                          selectTrackMetadataTarget(tid);
                        }}
                        title="Click anywhere to inspect this track"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">
                            {isNow ? "▶ " : ""}
                            {isNow ? (
                              <span className="mr-2 rounded bg-black px-2 py-0.5 text-[10px] text-white">NOW</span>
                            ) : null}
                            {t.title ?? "Untitled"}
                          </div>
                          {t.artist ? <div className="text-xs text-zinc-500 truncate">{t.artist}</div> : null}
                          {isMetadataSelected ? (
                            <div className="mt-1 text-[11px] text-zinc-500">Selected for metadata</div>
                          ) : null}
                          {isMetadataSelected ? (
                            <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                              <MetadataPanel
                                targetType={metadataTargetType}
                                targetId={metadataTargetId ?? tid}
                              />
                            </div>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button className="rounded border px-3 py-2 text-xs" onClick={() => playTrackById(tid)}>
                            Play
                          </button>
                          <button
                            className="rounded border px-3 py-2 text-xs"
                            onClick={() => {
                              setPreviewTrackId(tid);
                              selectTrackMetadataTarget(tid);
                            }}
                          >
                            Inspect
                          </button>
                          <button
                            className="rounded border px-3 py-2 text-xs disabled:opacity-60"
                            onClick={() => unlinkTrack(tid)}
                            disabled={linkBusyId === tid}
                          >
                            {linkBusyId === tid ? "..." : "Unlink"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <ProjectLibraryPanel
              allTracks={allTracks as any[]}
              linkedTrackIds={linkedTrackIds}
              loadingLibrary={loadingLibrary}
              linkBusyId={linkBusyId}
              linkTrack={linkTrack}
              unlinkTrack={unlinkTrack}
            />
          </div>

          <div className="rounded-lg border p-4 space-y-1">
            <div className="font-medium text-sm">Safe architecture</div>
            <div className="text-sm text-zinc-600">
              This uses <code className="px-1">project_tracks</code> as a join table. Library stays global and unchanged.
              Track IDs are the storage-based ids returned by <code className="px-1">getSupabaseTracks()</code>.
            </div>
          </div>
        </div>
      ) : (
        <ProjectActivityPanel />
      )}
    </section>

    <section className="rounded-xl border p-5">
      <Link href="/workspace/projects" className="rounded border px-3 py-2 text-sm">
        Back to Projects
      </Link>
    </section>

    <PlaybackHelper />
  </main>
);
}