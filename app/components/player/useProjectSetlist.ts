"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AnyTrack } from "./playerTypes";
import { listLinkedProjectTrackIds } from "../../../lib/projectTracksApi";
import {
  readProjectOrder,
  stableMergeOrder,
  writeProjectOrder,
} from "./playerStorage";

function sameOrder(a: string[], b: string[]) {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (String(a[i]) !== String(b[i])) return false;
  }
  return true;
}

function normalizeIds(values: Iterable<unknown>): string[] {
  const out: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    const id = String(value);
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }

  return out;
}

export function useProjectSetlist(args: {
  onProjectPage: boolean;
  projectId: string;
  allTracks: AnyTrack[];
}) {
  const { onProjectPage, projectId, allTracks } = args;

  const [projectTrackIds, setProjectTrackIds] = useState<string[]>([]);
  const [loadingProject, setLoadingProject] = useState(false);
  const [projectErr, setProjectErr] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement | null>(null);
  const refreshSeqRef = useRef(0);

  const projectTracks = useMemo(() => {
    if (!projectTrackIds.length) return [];
    const byId = new Map(allTracks.map((t) => [String(t.id), t]));
    return projectTrackIds
      .map((id) => byId.get(String(id)))
      .filter(Boolean) as AnyTrack[];
  }, [projectTrackIds, allTracks]);

  const loadProjectIds = useCallback(
    async (mode: "apply-saved" | "linked-truth" = "apply-saved") => {
      if (!onProjectPage) return;
      if (!projectId) return;

      const seq = ++refreshSeqRef.current;

      setProjectErr(null);
      setLoadingProject(true);

      try {
        const idsSet = await listLinkedProjectTrackIds(projectId);
        const liveIds = normalizeIds(idsSet.values());

        const ordered =
          mode === "linked-truth"
            ? liveIds
            : stableMergeOrder(liveIds, readProjectOrder(projectId));

        if (seq !== refreshSeqRef.current) return;

        setProjectTrackIds((prev) => (sameOrder(prev, ordered) ? prev : ordered));
        writeProjectOrder(projectId, ordered);
      } catch (e: any) {
        if (seq !== refreshSeqRef.current) return;
        setProjectErr(e?.message ?? "Failed to load project setlist");
        setProjectTrackIds([]);
      } finally {
        if (seq !== refreshSeqRef.current) return;
        setLoadingProject(false);
      }
    },
    [onProjectPage, projectId]
  );

  const refreshProjectIds = useCallback(async () => {
    await loadProjectIds("apply-saved");
  }, [loadProjectIds]);

  function persistNextOrder(next: string[]) {
    if (onProjectPage && projectId) {
      writeProjectOrder(projectId, next);
    }
  }

  function moveId(id: string, dir: -1 | 1) {
    setProjectTrackIds((prev) => {
      const idx = prev.findIndex((x) => String(x) === String(id));
      if (idx < 0) return prev;

      const j = idx + dir;
      if (j < 0 || j >= prev.length) return prev;

      const next = [...prev];
      const tmp = next[idx];
      next[idx] = next[j];
      next[j] = tmp;

      persistNextOrder(next);
      return next;
    });
  }

  function moveIdToIndex(id: string, toIndex: number) {
    setProjectTrackIds((prev) => {
      const fromIndex = prev.findIndex((x) => String(x) === String(id));
      if (fromIndex < 0) return prev;
      if (!Number.isFinite(toIndex)) return prev;

      const clampedIndex = Math.max(0, Math.min(prev.length - 1, Math.floor(toIndex)));
      if (fromIndex === clampedIndex) return prev;

      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      if (!moved) return prev;

      next.splice(clampedIndex, 0, moved);

      if (sameOrder(prev, next)) return prev;

      persistNextOrder(next);
      return next;
    });
  }

  async function resetOrderToLinkedTruth() {
    await loadProjectIds("linked-truth");
  }

  function jumpToNow(nowId: string | null) {
    if (!nowId) return;
    if (!listRef.current) return;

    const selector = `[data-trackid="${String(nowId)}"]`;
    const row = listRef.current.querySelector(selector) as HTMLElement | null;
    if (!row) return;

    row.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  useEffect(() => {
    if (!onProjectPage) return;
    refreshProjectIds();
  }, [onProjectPage, projectId, refreshProjectIds]);

  useEffect(() => {
    function onSync() {
      if (!onProjectPage) return;
      refreshProjectIds();
    }

    if (typeof window !== "undefined") {
      window.addEventListener("muzes:projectTracksChanged", onSync as EventListener);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener(
          "muzes:projectTracksChanged",
          onSync as EventListener
        );
      }
    };
  }, [onProjectPage, projectId, refreshProjectIds]);

  return {
    projectTrackIds,
    projectTracks,
    loadingProject,
    projectErr,
    refreshProjectIds,

    moveUp: (id: string) => moveId(id, -1),
    moveDown: (id: string) => moveId(id, 1),
    moveToIndex: (id: string, toIndex: number) => moveIdToIndex(id, toIndex),
    resetOrderToLinkedTruth,
    jumpToNow,
    listRef,
  };
}