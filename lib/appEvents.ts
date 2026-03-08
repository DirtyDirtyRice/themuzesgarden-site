export const APP_EVENT_PROJECT_TRACKS_CHANGED = "muzes:projectTracksChanged";
export const APP_EVENT_PROJECT_ACTIVITY = "muzes:projectActivity";

export type ProjectTracksChangedDetail = {
  projectId: string;
  action: "link" | "unlink";
  trackId?: string;
  ts: number;
};

export type ProjectActivityDetail = {
  projectId: string;
  type: "play" | "link" | "unlink" | "note";
  label: string;
  trackId?: string;
  ts: number;
};

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.dispatchEvent === "function";
}

export function emitProjectTracksChanged(
  detail: Omit<ProjectTracksChangedDetail, "ts">
) {
  if (!isBrowser()) return;

  const payload: ProjectTracksChangedDetail = {
    ...detail,
    ts: Date.now(),
  };

  window.dispatchEvent(
    new CustomEvent<ProjectTracksChangedDetail>(APP_EVENT_PROJECT_TRACKS_CHANGED, {
      detail: payload,
    })
  );
}

export function onProjectTracksChanged(
  handler: (detail: ProjectTracksChangedDetail) => void
): () => void {
  if (!isBrowser()) return () => {};

  const listener = (evt: Event) => {
    const ce = evt as CustomEvent<ProjectTracksChangedDetail>;
    if (!ce?.detail) return;
    handler(ce.detail);
  };

  window.addEventListener(APP_EVENT_PROJECT_TRACKS_CHANGED, listener as EventListener);

  return () => {
    window.removeEventListener(APP_EVENT_PROJECT_TRACKS_CHANGED, listener as EventListener);
  };
}

export function emitProjectActivity(
  detail: Omit<ProjectActivityDetail, "ts">
) {
  if (!isBrowser()) return;

  const payload: ProjectActivityDetail = {
    ...detail,
    ts: Date.now(),
  };

  window.dispatchEvent(
    new CustomEvent<ProjectActivityDetail>(APP_EVENT_PROJECT_ACTIVITY, {
      detail: payload,
    })
  );
}

export function onProjectActivity(
  handler: (detail: ProjectActivityDetail) => void
): () => void {
  if (!isBrowser()) return () => {};

  const listener = (evt: Event) => {
    const ce = evt as CustomEvent<ProjectActivityDetail>;
    if (!ce?.detail) return;
    handler(ce.detail);
  };

  window.addEventListener(APP_EVENT_PROJECT_ACTIVITY, listener as EventListener);

  return () => {
    window.removeEventListener(APP_EVENT_PROJECT_ACTIVITY, listener as EventListener);
  };
}