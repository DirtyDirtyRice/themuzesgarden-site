import type { AnyTrack } from "./playerTypes";
import { getEditableHost } from "./audioEngineHelpers";

export function attachKeyboardAndCustomEventHandlers(args: {
  open: boolean;
  togglePlayPause: () => void;
  next: () => void;
  prev: () => void;
  resumeLastSession: () => void;
  setShuffle: React.Dispatch<React.SetStateAction<boolean>>;
  setLoop: React.Dispatch<React.SetStateAction<boolean>>;
  playbackQueueSourceRef: React.MutableRefObject<"project" | "search">;
  onProjectPageRef: React.MutableRefObject<boolean>;
  projectIdRef: React.MutableRefObject<string>;
  projectTracksRef: React.MutableRefObject<AnyTrack[]>;
  allTracksRef: React.MutableRefObject<AnyTrack[]>;
  setNowLabel: (value: string) => void;
  setShuffleDirect: (value: boolean) => void;
  playTarget: (args: {
    track: AnyTrack;
    startTime?: number;
    sectionId?: string | null;
  }) => void;
}) {
  const {
    open,
    togglePlayPause,
    next,
    prev,
    resumeLastSession,
    setShuffle,
    setLoop,
    playbackQueueSourceRef,
    onProjectPageRef,
    projectIdRef,
    projectTracksRef,
    allTracksRef,
    setShuffleDirect,
    playTarget,
  } = args;

  function onKey(e: KeyboardEvent) {
    if (!open) return;
    if (e.defaultPrevented) return;
    if (e.isComposing) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    const eventEditable = getEditableHost(e.target);
    const activeEditable = getEditableHost(document.activeElement);

    if (eventEditable || activeEditable) return;

    const k = e.key;

    if (k === " ") {
      e.preventDefault();
      togglePlayPause();
      return;
    }

    if (k === "ArrowRight") {
      e.preventDefault();
      next();
      return;
    }

    if (k === "ArrowLeft") {
      e.preventDefault();
      prev();
      return;
    }

    if (k === "r" || k === "R") {
      e.preventDefault();
      resumeLastSession();
      return;
    }

    if (k === "s" || k === "S") {
      if (playbackQueueSourceRef.current === "project") {
        e.preventDefault();
        setShuffle((v) => !v);
      }
      return;
    }

    if (k === "l" || k === "L") {
      if (playbackQueueSourceRef.current === "project") {
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

    playbackQueueSourceRef.current = "project";
    setShuffleDirect(false);
    playTarget({ track, startTime: 0, sectionId: null });
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
    const sectionId = String(custom.detail?.sectionId ?? "").trim() || null;
    const startTime =
      typeof custom.detail?.startTime === "number" &&
      Number.isFinite(custom.detail.startTime)
        ? custom.detail.startTime
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
      playbackQueueSourceRef.current = "project";
      setShuffleDirect(false);
    } else {
      playbackQueueSourceRef.current = "search";
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
}