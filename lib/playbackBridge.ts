// lib/playbackBridge.ts

export type PlaybackState = {
  playing: boolean;
  updatedAtMs: number;
  source: "helper" | "external";
};

let state: PlaybackState = {
  playing: false,
  updatedAtMs: Date.now(),
  source: "external",
};

type Listener = (s: PlaybackState) => void;
const listeners = new Set<Listener>();

function emit(next: PlaybackState) {
  state = next;

  // local subscribers (React-safe)
  for (const fn of listeners) fn(state);

  // cross-app notification (browser only)
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("playback:state", { detail: { ...state } })
    );
    window.dispatchEvent(
      new CustomEvent(state.playing ? "playback:start" : "playback:stop", {
        detail: { ...state },
      })
    );
  }
}

export function getPlaybackState(): PlaybackState {
  return state;
}

export function subscribePlayback(fn: Listener) {
  listeners.add(fn);
  // immediate fire so UI has state instantly
  fn(state);
  return () => listeners.delete(fn);
}

export function startPlayback() {
  emit({
    playing: true,
    updatedAtMs: Date.now(),
    source: "helper",
  });
}

export function stopPlayback() {
  emit({
    playing: false,
    updatedAtMs: Date.now(),
    source: "helper",
  });
}

// Optional external sync hook (if another system wants to report truth)
export function setPlaybackPlaying(playing: boolean, source: "helper" | "external" = "external") {
  emit({
    playing: !!playing,
    updatedAtMs: Date.now(),
    source,
  });
}