"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AnyTrack } from "./playerTypes";
import { listLinkedProjectTrackIds } from "../lib/projectTracksApi";
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
    const id = String(value ?? "").trim();
    if (!id) continue;
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

  const cleanProjectId = String(projectId ?? "").trim();

  const projectTracks = useMemo(() => {
    if (!projectTrackIds.length) return [];

    const byId = new Map(
      allTracks.map((t) => [String(t?.id ?? "").trim(), t] as const)
    );

    return projectTrackIds
      .map((id) => byId.get(String(id).trim()))
      .filter(Boolean) as AnyTrack[];
  }, [projectTrackIds, allTracks]);

  const loadProjectIds = useCallback(
    async (mode: "apply-saved" | "linked-truth" = "apply-saved") => {
      if (!onProjectPage) return;
      if (!cleanProjectId) return;

      const seq = ++refreshSeqRef.current;

      setProjectErr(null);
      setLoadingProject(true);

      try {
        const idsSet = await listLinkedProjectTrackIds(cleanProjectId);
        const liveIds = normalizeIds(idsSet.values());

        const ordered =
          mode === "linked-truth"
            ? liveIds
            : stableMergeOrder(liveIds, readProjectOrder(cleanProjectId));

        if (seq !== refreshSeqRef.current) return;

        setProjectTrackIds((prev) => (sameOrder(prev, ordered) ? prev : ordered));
        writeProjectOrder(cleanProjectId, ordered);
      } catch (e: any) {
        if (seq !== refreshSeqRef.current) return;
        setProjectErr(e?.message ?? "Failed to load project setlist");
        setProjectTrackIds([]);
      } finally {
        if (seq !== refreshSeqRef.current) return;
        setLoadingProject(false);
      }
    },
    [onProjectPage, cleanProjectId]
  );

  const refreshProjectIds = useCallback(async () => {
    await loadProjectIds("apply-saved");
  }, [loadProjectIds]);

  function persistNextOrder(next: string[]) {
    if (onProjectPage && cleanProjectId) {
      writeProjectOrder(cleanProjectId, next);
    }
  }

  function moveId(id: string, dir: -1 | 1) {
    const cleanId = String(id ?? "").trim();
    if (!cleanId) return;

    setProjectTrackIds((prev) => {
      const idx = prev.findIndex((x) => String(x).trim() === cleanId);
      if (idx < 0) return prev;

      const j = idx + dir;
      if (j < 0 || j >= prev.length) return prev;

      const next = [...prev];
      const tmp = next[idx];
      next[idx] = next[j];
      next[j] = tmp;

      if (sameOrder(prev, next)) return prev;

      persistNextOrder(next);
      return next;
    });
  }

  function moveIdToIndex(id: string, toIndex: number) {
    const cleanId = String(id ?? "").trim();
    if (!cleanId) return;

    setProjectTrackIds((prev) => {
      const fromIndex = prev.findIndex((x) => String(x).trim() === cleanId);
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
    const cleanNowId = String(nowId ?? "").trim();
    if (!cleanNowId) return;
    if (!listRef.current) return;

    const selector = `[data-trackid="${cleanNowId}"]`;
    const row = listRef.current.querySelector(selector) as HTMLElement | null;
    if (!row) return;

    row.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  useEffect(() => {
    if (!onProjectPage || !cleanProjectId) {
      setLoadingProject(false);
      setProjectErr(null);
      setProjectTrackIds([]);
      return;
    }

    refreshProjectIds();
  }, [onProjectPage, cleanProjectId, refreshProjectIds]);

  useEffect(() => {
    function onSync() {
      if (!onProjectPage) return;
      if (!cleanProjectId) return;
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
  }, [onProjectPage, cleanProjectId, refreshProjectIds]);

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