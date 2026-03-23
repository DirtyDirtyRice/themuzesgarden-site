"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AnyTrack, PlayerTab, TrackSection } from "./playerTypes";
import { pickUrl, isTypingTarget } from "./playerUtils";
import { readPersisted, writePersisted } from "./playerStorage";
import { logProjectActivity } from "../lib/projectActivity";

function fmtTime(sec: number): string {
  const s = Number.isFinite(sec) ? Math.max(0, Math.floor(sec)) : 0;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

function clampNonNegative(n: number): number {
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

function getSortedTrackSections(track: AnyTrack | null | undefined): TrackSection[] {
  const sections = Array.isArray(track?.sections) ? [...track.sections] : [];

  return sections
    .filter(
      (section): section is TrackSection =>
        Boolean(section) &&
        typeof section === "object" &&
        typeof section.id === "string"
    )
    .sort((a, b) => {
      const aStart = Number(a.start);
      const bStart = Number(b.start);

      const safeA = Number.isFinite(aStart) ? aStart : 0;
      const safeB = Number.isFinite(bStart) ? bStart : 0;

      if (safeA !== safeB) return safeA - safeB;

      return String(a.id ?? "").localeCompare(String(b.id ?? ""), undefined, {
        sensitivity: "base",
      });
    });
}

function getTrackSectionById(
  track: AnyTrack | null | undefined,
  sectionId: string | null | undefined
): TrackSection | null {
  if (!track || !sectionId) return null;
  const needle = String(sectionId).trim();
  if (!needle) return null;

  const found = getSortedTrackSections(track).find(
    (section) => String(section?.id ?? "") === needle
  );

  return found ?? null;
}

function getTrackSectionByStartTime(
  track: AnyTrack | null | undefined,
  startTime: number | null | undefined
): TrackSection | null {
  if (!track || typeof startTime !== "number" || !Number.isFinite(startTime)) return null;

  const safeStartTime = clampNonNegative(startTime);
  const sections = getSortedTrackSections(track);

  for (const section of sections) {
    const sectionStart = clampNonNegative(Number(section.start));
    if (Math.abs(sectionStart - safeStartTime) < 0.05) {
      return section;
    }
  }

  return null;
}

function getSafeSectionEnd(section: TrackSection | null, startTime: number): number | null {
  if (!section) return null;
  const end = Number(section.end);
  if (!Number.isFinite(end)) return null;
  if (end <= startTime) return null;
  return end;
}

function getSectionDisplayLabel(section: TrackSection | null): string {
  if (!section) return "";

  const description = String(section.description ?? "").trim();
  if (description) return description;

  const tags = Array.isArray(section.tags)
    ? section.tags.map((x) => String(x ?? "").trim()).filter(Boolean)
    : [];

  if (tags.length > 0) return tags[0]!;
  return String(section.id ?? "").trim();
}

function buildNowLabel(track: AnyTrack, section: TrackSection | null, startTime?: number): string {
  const labelBase = `${track.title ?? "Untitled"} — ${track.artist ?? "Supabase"}`;

  if (section) {
    const sectionLabel = getSectionDisplayLabel(section);
    if (sectionLabel) return `${labelBase} • ${sectionLabel}`;
  }

  if (typeof startTime === "number" && Number.isFinite(startTime) && startTime > 0) {
    return `${labelBase} • @ ${fmtTime(startTime)}`;
  }

  return labelBase;
}

type PlaybackTarget = {
  track: AnyTrack;
  startTime?: number;
  sectionId?: string | null;
};

export function useAudioEngine(args: {
  tab: PlayerTab;
  setTab: (t: PlayerTab) => void;
  onProjectPage: boolean;
  projectId: string;
  allTracks: AnyTrack[];
  projectTracks: AnyTrack[];
}) {
  const { tab, setTab, onProjectPage, projectId, allTracks, projectTracks } = args;

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [open, setOpen] = useState(true);
  const [nowId, setNowId] = useState<string | null>(null);
  const [nowLabel, setNowLabel] = useState<string>("");

  const [shuffle, setShuffle] = useState(false);
  const [loop, setLoop] = useState(false);

  const [statusTime, setStatusTime] = useState("0:00");
  const [statusVolPct, setStatusVolPct] = useState(100);

  const lastTimeSavedRef = useRef<number>(0);
  const errorSkipGuardRef = useRef<number>(0);

  const tabRef = useRef<PlayerTab>(tab);
  const nowIdRef = useRef<string | null>(nowId);
  const shuffleRef = useRef<boolean>(shuffle);
  const loopRef = useRef<boolean>(loop);
  const projectTracksRef = useRef<AnyTrack[]>(projectTracks);
  const allTracksRef = useRef<AnyTrack[]>(allTracks);
  const onProjectPageRef = useRef<boolean>(onProjectPage);
  const projectIdRef = useRef<string>(projectId);

  const playSeqRef = useRef<number>(0);
  const resumeMetaHandlerRef = useRef<(() => void) | null>(null);

  const currentSectionIdRef = useRef<string | null>(null);
  const currentSectionStartRef = useRef<number | null>(null);
  const currentSectionEndRef = useRef<number | null>(null);

  useEffect(() => {
    tabRef.current = tab;
  }, [tab]);

  useEffect(() => {
    nowIdRef.current = nowId;
  }, [nowId]);

  useEffect(() => {
    shuffleRef.current = shuffle;
  }, [shuffle]);

  useEffect(() => {
    loopRef.current = loop;
  }, [loop]);

  useEffect(() => {
    projectTracksRef.current = projectTracks;
  }, [projectTracks]);

  useEffect(() => {
    allTracksRef.current = allTracks;
  }, [allTracks]);

  useEffect(() => {
    onProjectPageRef.current = onProjectPage;
  }, [onProjectPage]);

  useEffect(() => {
    projectIdRef.current = projectId;
  }, [projectId]);

  const clearResumeMetaHandler = useCallback(() => {
    const el = audioRef.current;
    const handler = resumeMetaHandlerRef.current;
    if (el && handler) {
      el.removeEventListener("loadedmetadata", handler);
    }
    resumeMetaHandlerRef.current = null;
  }, []);

  useEffect(() => {
    const p = readPersisted();

    if (p.tab === "project" || p.tab === "search") setTab(p.tab);
    if (typeof p.shuffle === "boolean") setShuffle(p.shuffle);
    if (typeof p.loop === "boolean") setLoop(p.loop);
    if (typeof p.nowId === "string" || p.nowId === null) setNowId(p.nowId ?? null);

    currentSectionIdRef.current =
      typeof p.currentSectionId === "string" ? p.currentSectionId : null;

    currentSectionStartRef.current =
      typeof p.sectionStartTime === "number" && Number.isFinite(p.sectionStartTime)
        ? clampNonNegative(p.sectionStartTime)
        : typeof p.lastMatchedSectionStartTime === "number" &&
          Number.isFinite(p.lastMatchedSectionStartTime)
        ? clampNonNegative(p.lastMatchedSectionStartTime)
        : null;

    currentSectionEndRef.current = null;

    if (typeof p.currentTime === "number") setStatusTime(fmtTime(p.currentTime));
    if (typeof p.volume === "number" && Number.isFinite(p.volume)) {
      setStatusVolPct(Math.round(Math.max(0, Math.min(1, p.volume)) * 100));
    }
  }, [setTab]);

  useEffect(() => writePersisted({ tab }), [tab]);
  useEffect(() => writePersisted({ shuffle, loop }), [shuffle, loop]);

  const autoSwitchedRef = useRef(false);
  useEffect(() => {
    if (!onProjectPage) {
      autoSwitchedRef.current = false;
      return;
    }
    if (autoSwitchedRef.current) return;
    autoSwitchedRef.current = true;
    setTab("project");
  }, [onProjectPage, setTab]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const p = readPersisted();
    if (typeof p.volume === "number" && !Number.isNaN(p.volume)) {
      const v = Math.max(0, Math.min(1, p.volume));
      el.volume = v;
      setStatusVolPct(Math.round(v * 100));
    }
  }, [open]);

  const logProjectPlayIfPossible = useCallback(
    (t: AnyTrack, meta?: { sectionId?: string | null; startTime?: number }) => {
      if (!onProjectPageRef.current) return;

      const pid = String(projectIdRef.current ?? "").trim();
      if (!pid) return;

      const detailParts: string[] = [];
      if (meta?.sectionId) detailParts.push(`section ${meta.sectionId}`);
      if (typeof meta?.startTime === "number" && Number.isFinite(meta.startTime)) {
        detailParts.push(`start ${fmtTime(meta.startTime)}`);
      }

      const detailSuffix = detailParts.length ? ` (${detailParts.join(" • ")})` : "";

      logProjectActivity(
        pid,
        "play",
        `Played track: ${t.title ?? "Untitled"}${detailSuffix}`,
        { trackId: String(t.id) }
      );
    },
    []
  );

  const stop = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    el.pause();
  }, []);

  const clearNow = useCallback(() => {
    clearResumeMetaHandler();

    const el = audioRef.current;
    if (el) {
      el.pause();
      el.removeAttribute("src");
      try {
        el.load();
      } catch {
        // ignore
      }
    }

    setNowId(null);
    setNowLabel("");
    errorSkipGuardRef.current = 0;

    currentSectionIdRef.current = null;
    currentSectionStartRef.current = null;
    currentSectionEndRef.current = null;

    writePersisted({
      nowId: null,
      currentTime: 0,
      currentSectionId: null,
      sectionStartTime: null,
      lastMatchedSectionId: null,
      lastMatchedSectionStartTime: null,
    });

    setStatusTime("0:00");
  }, [clearResumeMetaHandler]);

  const playTarget = useCallback(
    (target: PlaybackTarget) => {
      const { track } = target;
      const rawUrl = pickUrl(track);

      if (!rawUrl) {
        setNowLabel("Track URL missing");
        return;
      }

      clearResumeMetaHandler();

      const el = audioRef.current;
      if (!el) {
        setNowLabel("Audio element missing");
        return;
      }

      const seq = ++playSeqRef.current;
      errorSkipGuardRef.current = 0;

      const requestedStartTime =
        typeof target.startTime === "number" && Number.isFinite(target.startTime)
          ? clampNonNegative(target.startTime)
          : 0;

      const resolvedSectionById =
        typeof target.sectionId === "string"
          ? getTrackSectionById(track, target.sectionId)
          : null;

      const resolvedSectionByTime =
        !resolvedSectionById && requestedStartTime > 0
          ? getTrackSectionByStartTime(track, requestedStartTime)
          : null;

      const resolvedSection = resolvedSectionById ?? resolvedSectionByTime;
      const resolvedStartTime = resolvedSection
        ? clampNonNegative(Number(resolvedSection.start))
        : requestedStartTime;

      const resolvedSectionId = resolvedSection ? String(resolvedSection.id) : null;
      const resolvedSectionEnd = getSafeSectionEnd(resolvedSection, resolvedStartTime);

      const tid = String(track.id);
      setNowId(tid);
      setNowLabel(buildNowLabel(track, resolvedSection, resolvedStartTime));

      currentSectionIdRef.current = resolvedSectionId;
      currentSectionStartRef.current =
        resolvedSection || resolvedStartTime > 0 ? resolvedStartTime : null;
      currentSectionEndRef.current = resolvedSectionEnd;

      const persisted = readPersisted();
      writePersisted({
        nowId: tid,
        lastProjectId: onProjectPageRef.current ? projectIdRef.current : persisted.lastProjectId,
        currentTime: resolvedStartTime,
        currentSectionId: resolvedSectionId,
        sectionStartTime: resolvedSection || resolvedStartTime > 0 ? resolvedStartTime : null,
        lastMatchedSectionId: resolvedSectionId,
        lastMatchedSectionStartTime:
          resolvedSection || resolvedStartTime > 0 ? resolvedStartTime : null,
      });

      lastTimeSavedRef.current = 0;
      setStatusTime(fmtTime(resolvedStartTime));

      logProjectPlayIfPossible(track, {
        sectionId: resolvedSectionId,
        startTime:
          resolvedSection || resolvedStartTime > 0 ? resolvedStartTime : undefined,
      });

      el.src = rawUrl;

      try {
        el.currentTime = 0;
      } catch {
        // ignore
      }

      const applyStartTime = () => {
        if (seq !== playSeqRef.current) return;

        try {
          el.currentTime = resolvedStartTime;
        } catch {
          // ignore
        }

        setStatusTime(fmtTime(resolvedStartTime));

        el.play().catch(() => {
          if (seq !== playSeqRef.current) return;
          setNowLabel("Playback blocked (click Play again)");
        });
      };

      if (el.readyState >= 1) {
        applyStartTime();
        return;
      }

      const onMeta = () => {
        clearResumeMetaHandler();
        applyStartTime();
      };

      resumeMetaHandlerRef.current = onMeta;
      el.addEventListener("loadedmetadata", onMeta);
    },
    [clearResumeMetaHandler, logProjectPlayIfPossible]
  );

  const playTrack = useCallback(
    (t: AnyTrack) => {
      playTarget({ track: t, startTime: 0, sectionId: null });
    },
    [playTarget]
  );

  const playTrackAtTime = useCallback(
    (t: AnyTrack, startTime: number) => {
      playTarget({ track: t, startTime, sectionId: null });
    },
    [playTarget]
  );

  const playSection = useCallback(
    (t: AnyTrack, sectionId: string) => {
      playTarget({ track: t, sectionId });
    },
    [playTarget]
  );

  const playFromHere = useCallback(
    (t: AnyTrack) => {
      if (onProjectPageRef.current) {
        setTab("project");
      }
      setShuffle(false);
      playTarget({ track: t, startTime: 0, sectionId: null });
    },
    [playTarget, setTab]
  );

  const togglePlayPause = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;

    if (el.paused) {
      el.play().catch(() => {
        setNowLabel("Playback blocked (press Play again)");
      });
    } else {
      el.pause();
    }
  }, []);

  const safeProjectIndexOfNow = useCallback((): number => {
    const list = projectTracksRef.current;
    if (!list.length) return -1;
    const nid = String(nowIdRef.current ?? "");
    return list.findIndex((t) => String(t.id) === nid);
  }, []);

  const next = useCallback(() => {
    const list = projectTracksRef.current;
    if (!list.length) return;

    currentSectionIdRef.current = null;
    currentSectionStartRef.current = null;
    currentSectionEndRef.current = null;

    if (shuffleRef.current) {
      const cur = String(nowIdRef.current ?? "");
      const pool = list.filter((t) => String(t.id) !== cur);
      const pickFrom = pool.length ? pool : list;
      const r = Math.floor(Math.random() * pickFrom.length);
      const picked = pickFrom[r];
      if (!picked) return;
      playTrack(picked);
      return;
    }

    const idx = safeProjectIndexOfNow();
    const nextIdx = idx >= 0 ? (idx + 1) % list.length : 0;
    const picked = list[nextIdx];
    if (!picked) return;
    playTrack(picked);
  }, [playTrack, safeProjectIndexOfNow]);

  const prev = useCallback(() => {
    const list = projectTracksRef.current;
    if (!list.length) return;

    currentSectionIdRef.current = null;
    currentSectionStartRef.current = null;
    currentSectionEndRef.current = null;

    if (shuffleRef.current) {
      next();
      return;
    }

    const idx = safeProjectIndexOfNow();
    const prevIdx = idx >= 0 ? (idx - 1 + list.length) % list.length : 0;
    const picked = list[prevIdx];
    if (!picked) return;
    playTrack(picked);
  }, [next, playTrack, safeProjectIndexOfNow]);

  const playAll = useCallback(() => {
    const list = projectTracksRef.current;
    if (!list.length) return;

    currentSectionIdRef.current = null;
    currentSectionStartRef.current = null;
    currentSectionEndRef.current = null;

    if (shuffleRef.current) {
      const r = Math.floor(Math.random() * list.length);
      const picked = list[r];
      if (!picked) return;
      playTrack(picked);
      return;
    }

    const first = list[0];
    if (!first) return;
    playTrack(first);
  }, [playTrack]);

  const resumeLastSession = useCallback(() => {
    const p = readPersisted();
    const id = typeof p.nowId === "string" ? p.nowId : null;
    if (!id) {
      setNowLabel("Nothing to resume yet");
      return;
    }

    const track = allTracksRef.current.find((t) => String(t.id) === String(id));
    if (!track) {
      setNowLabel("Resume failed: track not found");
      return;
    }

    const sectionId =
      typeof p.currentSectionId === "string"
        ? p.currentSectionId
        : typeof p.lastMatchedSectionId === "string"
        ? p.lastMatchedSectionId
        : null;

    const section = sectionId ? getTrackSectionById(track, sectionId) : null;

    const seekTo =
      typeof p.currentTime === "number" && p.currentTime >= 0
        ? clampNonNegative(p.currentTime)
        : typeof p.sectionStartTime === "number" && p.sectionStartTime >= 0
        ? clampNonNegative(p.sectionStartTime)
        : typeof p.lastMatchedSectionStartTime === "number" &&
          p.lastMatchedSectionStartTime >= 0
        ? clampNonNegative(p.lastMatchedSectionStartTime)
        : section
        ? clampNonNegative(section.start)
        : 0;

    playTarget({
      track,
      startTime: seekTo,
      sectionId: section ? section.id : null,
    });
  }, [playTarget]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    function onEnded() {
      if (tabRef.current !== "project") return;

      const list = projectTracksRef.current;
      if (!list.length) return;

      const nid = String(nowIdRef.current ?? "");
      const exists = list.some((t) => String(t.id) === nid);

      if (!exists) {
        playAll();
        return;
      }

      if (loopRef.current) {
        const cur = list.find((t) => String(t.id) === nid);
        if (cur) {
          if (currentSectionIdRef.current) {
            playTarget({
              track: cur,
              sectionId: currentSectionIdRef.current,
              startTime:
                typeof currentSectionStartRef.current === "number"
                  ? currentSectionStartRef.current
                  : undefined,
            });
            return;
          }

          playTrack(cur);
          return;
        }
      }

      next();
    }

    function onError() {
      if (tabRef.current !== "project") return;

      const list = projectTracksRef.current;
      if (!list.length) return;

      errorSkipGuardRef.current += 1;
      if (errorSkipGuardRef.current > 3) {
        setNowLabel("Audio error (too many skips). Stopping.");
        stop();
        return;
      }

      setNowLabel("Audio error → skipping…");
      window.setTimeout(() => next(), 150);
    }

    function onPlaying() {
      errorSkipGuardRef.current = 0;
      setStatusTime(fmtTime(el.currentTime));
    }

    el.addEventListener("ended", onEnded);
    el.addEventListener("error", onError);
    el.addEventListener("playing", onPlaying);

    return () => {
      el.removeEventListener("ended", onEnded);
      el.removeEventListener("error", onError);
      el.removeEventListener("playing", onPlaying);
    };
  }, [next, playAll, playTarget, playTrack, stop]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    function onVolume() {
      const v = Math.max(0, Math.min(1, el.volume));
      writePersisted({ volume: v });
      setStatusVolPct(Math.round(v * 100));
    }

    function onTime() {
      const now = Date.now();
      if (now - lastTimeSavedRef.current < 500) return;
      lastTimeSavedRef.current = now;

      const sectionEnd = currentSectionEndRef.current;
      if (
        typeof sectionEnd === "number" &&
        Number.isFinite(sectionEnd) &&
        el.currentTime >= sectionEnd
      ) {
        if (loopRef.current && currentSectionIdRef.current && nowIdRef.current) {
          const curTrack =
            allTracksRef.current.find((t) => String(t.id) === String(nowIdRef.current)) ?? null;

          if (curTrack) {
            playTarget({
              track: curTrack,
              sectionId: currentSectionIdRef.current,
              startTime:
                typeof currentSectionStartRef.current === "number"
                  ? currentSectionStartRef.current
                  : undefined,
            });
            return;
          }
        }

        try {
          el.currentTime = sectionEnd;
        } catch {
          // ignore
        }

        el.pause();
        setStatusTime(fmtTime(sectionEnd));

        writePersisted({
          currentTime: sectionEnd,
          currentSectionId: currentSectionIdRef.current,
          sectionStartTime: currentSectionStartRef.current,
          lastMatchedSectionId: currentSectionIdRef.current,
          lastMatchedSectionStartTime: currentSectionStartRef.current,
        });

        return;
      }

      writePersisted({
        currentTime: el.currentTime,
        currentSectionId: currentSectionIdRef.current,
        sectionStartTime: currentSectionStartRef.current,
        lastMatchedSectionId: currentSectionIdRef.current,
        lastMatchedSectionStartTime: currentSectionStartRef.current,
      });

      setStatusTime(fmtTime(el.currentTime));
    }

    el.addEventListener("volumechange", onVolume);
    el.addEventListener("timeupdate", onTime);

    return () => {
      el.removeEventListener("volumechange", onVolume);
      el.removeEventListener("timeupdate", onTime);
    };
  }, [open, playTarget]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!open) return;
      if (isTypingTarget(e.target)) return;

      const k = e.key;

      if (k === " ") {
        e.preventDefault();
        togglePlayPause();
        return;
      }

      if (k === "ArrowRight") {
        if (tabRef.current === "project") {
          e.preventDefault();
          next();
        }
        return;
      }

      if (k === "ArrowLeft") {
        if (tabRef.current === "project") {
          e.preventDefault();
          prev();
        }
        return;
      }

      if (k.toLowerCase() === "r") {
        e.preventDefault();
        resumeLastSession();
        return;
      }

      if (k.toLowerCase() === "s") {
        if (tabRef.current === "project") {
          e.preventDefault();
          setShuffle((v) => !v);
        }
        return;
      }

      if (k.toLowerCase() === "l") {
        if (tabRef.current === "project") {
          e.preventDefault();
          setLoop((v) => !v);
        }
        return;
      }
    }

    function onActivityTrackJump(event: Event) {
      const custom = event as CustomEvent<{
        projectId?: string;
        trackId?: string;
      }>;

      const targetProjectId = String(custom.detail?.projectId ?? "").trim();
      const targetTrackId = String(custom.detail?.trackId ?? "").trim();

      if (!targetProjectId || !targetTrackId) return;
      if (!onProjectPageRef.current) return;
      if (String(projectIdRef.current) !== targetProjectId) return;

      const track =
        projectTracksRef.current.find((t) => String(t.id) === targetTrackId) ?? null;

      if (!track) return;

      setTab("project");
      setShuffle(false);
      playTrack(track);
    }

    function onPlaybackTarget(event: Event) {
      const custom = event as CustomEvent<{
        projectId?: string;
        trackId?: string;
        sectionId?: string;
        startTime?: number;
        preferProjectTab?: boolean;
      }>;

      const targetTrackId = String(custom.detail?.trackId ?? "").trim();
      if (!targetTrackId) return;

      const targetProjectId = String(custom.detail?.projectId ?? "").trim();
      const preferProjectTab = Boolean(custom.detail?.preferProjectTab);
      const sectionId = String(custom.detail?.sectionId ?? "").trim() || null;
      const startTime =
        typeof custom.detail?.startTime === "number" &&
        Number.isFinite(custom.detail.startTime)
          ? clampNonNegative(custom.detail.startTime)
          : undefined;

      const fromProject = projectTracksRef.current.find(
        (t) => String(t.id) === targetTrackId
      );
      const fromLibrary = allTracksRef.current.find(
        (t) => String(t.id) === targetTrackId
      );
      const track = fromProject ?? fromLibrary ?? null;

      if (!track) return;

      if (
        targetProjectId &&
        onProjectPageRef.current &&
        String(projectIdRef.current) === targetProjectId
      ) {
        setTab("project");
        setShuffle(false);
      } else if (preferProjectTab && onProjectPageRef.current) {
        setTab("project");
        setShuffle(false);
      }

      playTarget({
        track,
        startTime,
        sectionId,
      });
    }

    window.addEventListener("keydown", onKey);
    window.addEventListener(
      "muzesgarden-activity-track-jump",
      onActivityTrackJump as EventListener
    );
    window.addEventListener(
      "muzesgarden-playback-target",
      onPlaybackTarget as EventListener
    );

    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(
        "muzesgarden-activity-track-jump",
        onActivityTrackJump as EventListener
      );
      window.removeEventListener(
        "muzesgarden-playback-target",
        onPlaybackTarget as EventListener
      );
    };
  }, [
    open,
    next,
    prev,
    resumeLastSession,
    togglePlayPause,
    playTarget,
    playTrack,
    setTab,
  ]);

  useEffect(() => {
    const nid = nowId;
    if (!nid) return;

    const t = allTracks.find((x) => String(x.id) === String(nid)) ?? null;
    if (!t) return;

    const activeSection =
      getTrackSectionById(t, currentSectionIdRef.current) ??
      getTrackSectionByStartTime(t, currentSectionStartRef.current);

    const activeStartTime =
      typeof currentSectionStartRef.current === "number"
        ? currentSectionStartRef.current
        : undefined;

    setNowLabel(buildNowLabel(t, activeSection, activeStartTime));
  }, [allTracks, nowId]);

  useEffect(() => {
    return () => {
      clearResumeMetaHandler();
    };
  }, [clearResumeMetaHandler]);

  const status = useMemo(() => {
    return {
      statusTime,
      statusVolPct,
    };
  }, [statusTime, statusVolPct]);

  return {
    audioRef,
    open,
    setOpen,

    nowId,
    nowLabel,

    shuffle,
    setShuffle,
    loop,
    setLoop,

    statusTime: status.statusTime,
    statusVolPct: status.statusVolPct,

    playTrack,
    playTrackAtTime,
    playSection,
    playFromHere,
    playTarget,
    stop,
    togglePlayPause,
    next,
    prev,
    playAll,
    clearNow,
    resumeLastSession,
  };
}