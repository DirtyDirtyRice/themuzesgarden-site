"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import TextBlock from "../components/TextBlock";

type Block = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  text: string;
  locked?: boolean;
};

type Point = { x: number; y: number };

type Snapshot = {
  pages: CanvasPage[];
  currentPageId: string;
  // selection is per page
  selectedByPage: Record<string, string[]>;
};

type CanvasPage = {
  id: string;
  name: string;
  blocks: Block[];
};

function uid() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c: any = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  return `id_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function rectsIntersect(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number }
) {
  return !(
    a.x + a.w < b.x ||
    a.x > b.x + b.w ||
    a.y + a.h < b.y ||
    a.y > b.y + b.h
  );
}

function dist2(a: Point, b: Point) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

function snap(n: number, grid: number) {
  return Math.round(n / grid) * grid;
}

function clonePages(pages: CanvasPage[]): CanvasPage[] {
  return pages.map((p) => ({
    ...p,
    blocks: p.blocks.map((b) => ({ ...b })),
  }));
}

function isTypingTarget(t: EventTarget | null) {
  const el = t as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName?.toLowerCase();
  if (tag === "textarea") return true;
  if (tag === "input") return true;
  if ((el as HTMLElement).isContentEditable) return true;
  return false;
}

const LS_AUTOSAVE_KEY = "muzg_textcanvas_pages_autosave_v2";
const LS_MANUALSAVE_KEY = "muzg_textcanvas_pages_manualsave_v2";

// Back-compat keys (older single-page)
const LS_AUTOSAVE_KEY_V1 = "muzg_textcanvas_autosave_v1";
const LS_MANUALSAVE_KEY_V1 = "muzg_textcanvas_manualsave_v1";

function defaultBlocks(): Block[] {
  return [
    { id: uid(), x: 80, y: 80, w: 220, h: 80, text: "Text box A", locked: false },
    { id: uid(), x: 360, y: 120, w: 240, h: 80, text: "Text box B", locked: false },
    { id: uid(), x: 180, y: 240, w: 260, h: 80, text: "Text box C", locked: false },
  ];
}

function safeParseSnapshot(raw: string | null): Snapshot | null {
  if (!raw) return null;
  try {
    const obj = JSON.parse(raw);
    if (!obj || typeof obj !== "object") return null;
    if (!Array.isArray(obj.pages)) return null;
    if (typeof obj.currentPageId !== "string") return null;
    if (!obj.selectedByPage || typeof obj.selectedByPage !== "object") return null;

    // pages
    const pages: CanvasPage[] = obj.pages
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((p: any) => p && typeof p === "object")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((p: any) => ({
        id: String(p.id ?? uid()),
        name: String(p.name ?? "Page"),
        blocks: Array.isArray(p.blocks)
          ? p.blocks
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .filter((b: any) => b && typeof b === "object")
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .map((b: any) => ({
                id: String(b.id ?? uid()),
                x: Number(b.x ?? 0),
                y: Number(b.y ?? 0),
                w: Number(b.w ?? 240),
                h: Number(b.h ?? 80),
                text: String(b.text ?? ""),
                locked: Boolean(b.locked ?? false),
              }))
          : [],
      }));

    const currentPageId = String(obj.currentPageId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const selectedByPage: Record<string, string[]> = Object.fromEntries(
      Object.entries(obj.selectedByPage).map(([k, v]: any) => [
        String(k),
        Array.isArray(v) ? v.map((id: any) => String(id)) : [],
      ])
    );

    if (!pages.length) return null;
    const exists = pages.some((p) => p.id === currentPageId);
    return {
      pages,
      currentPageId: exists ? currentPageId : pages[0].id,
      selectedByPage,
    };
  } catch {
    return null;
  }
}

// Back-compat: old snapshot shape { blocks, selectedIds }
function safeParseSnapshotV1(raw: string | null): { blocks: Block[]; selectedIds: string[] } | null {
  if (!raw) return null;
  try {
    const obj = JSON.parse(raw);
    if (!obj || typeof obj !== "object") return null;
    if (!Array.isArray(obj.blocks)) return null;
    if (!Array.isArray(obj.selectedIds)) return null;

    const blocks: Block[] = obj.blocks
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((b: any) => b && typeof b === "object")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((b: any) => ({
        id: String(b.id ?? uid()),
        x: Number(b.x ?? 0),
        y: Number(b.y ?? 0),
        w: Number(b.w ?? 240),
        h: Number(b.h ?? 80),
        text: String(b.text ?? ""),
        locked: Boolean(b.locked ?? false),
      }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const selectedIds: string[] = obj.selectedIds.map((id: any) => String(id));
    return { blocks, selectedIds };
  } catch {
    return null;
  }
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export default function MusicPage() {
  const canvasRef = useRef<HTMLDivElement | null>(null);

  /* ---------- STATE: PAGES ---------- */
  const [pages, setPages] = useState<CanvasPage[]>(() => [
    { id: uid(), name: "Page 1", blocks: defaultBlocks() },
  ]);
  const [currentPageId, setCurrentPageId] = useState<string>(() => {
    const first = uid(); // overwritten immediately by state init above? (we'll fix in effect)
    return first;
  });

  // selected ids are per page
  const [selectedByPage, setSelectedByPage] = useState<Record<string, string[]>>({});

  // Fix initial currentPageId to the real first page id
  useEffect(() => {
    setCurrentPageId((prev) => {
      const exists = pages.some((p) => p.id === prev);
      return exists ? prev : pages[0]?.id ?? prev;
    });
    setSelectedByPage((prev) => {
      const next = { ...prev };
      for (const p of pages) {
        if (!next[p.id]) next[p.id] = [];
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentPage = useMemo(
    () => pages.find((p) => p.id === currentPageId) ?? pages[0],
    [pages, currentPageId]
  );

  const blocks = currentPage?.blocks ?? [];
  const selectedIds = selectedByPage[currentPageId] ?? [];

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  // Always-fresh values for window handlers
  const pagesRef = useRef<CanvasPage[]>(pages);
  const currentPageIdRef = useRef<string>(currentPageId);
  const selectedByPageRef = useRef<Record<string, string[]>>(selectedByPage);
  const selectedSetRef = useRef<Set<string>>(selectedSet);

  useEffect(() => {
    pagesRef.current = pages;
    currentPageIdRef.current = currentPageId;
    selectedByPageRef.current = selectedByPage;
    selectedSetRef.current = new Set(selectedByPage[currentPageId] ?? []);
  }, [pages, currentPageId, selectedByPage]);

  /* ---------- SNAP SETTINGS ---------- */
  const GRID = 10;
  const [snapOn, setSnapOn] = useState<boolean>(true);

  /* ---------- HISTORY (global snapshot, includes all pages) ---------- */
  const undoStack = useRef<Snapshot[]>([]);
  const redoStack = useRef<Snapshot[]>([]);
  const recordingRef = useRef(true);

  const makeSnapshot = useCallback(
    (nextPages: CanvasPage[], nextCurrentId: string, nextSelected: Record<string, string[]>) => {
      return {
        pages: clonePages(nextPages),
        currentPageId: nextCurrentId,
        selectedByPage: JSON.parse(JSON.stringify(nextSelected)) as Record<string, string[]>,
      };
    },
    []
  );

  const commit = useCallback(
    (nextPages: CanvasPage[], nextCurrentId = currentPageId, nextSelected = selectedByPage) => {
      if (!recordingRef.current) return;
      undoStack.current.push(makeSnapshot(pages, currentPageId, selectedByPage));
      redoStack.current.length = 0;

      setPages(nextPages);
      setCurrentPageId(nextCurrentId);
      setSelectedByPage(nextSelected);
    },
    [pages, currentPageId, selectedByPage, makeSnapshot]
  );

  const commitRef = useRef(commit);
  useEffect(() => {
    commitRef.current = commit;
  }, [commit]);

  const undo = useCallback(() => {
    const prev = undoStack.current.pop();
    if (!prev) return;

    redoStack.current.push(makeSnapshot(pages, currentPageId, selectedByPage));

    recordingRef.current = false;
    setPages(prev.pages);
    setCurrentPageId(prev.currentPageId);
    setSelectedByPage(prev.selectedByPage);
    recordingRef.current = true;
  }, [pages, currentPageId, selectedByPage, makeSnapshot]);

  const redo = useCallback(() => {
    const next = redoStack.current.pop();
    if (!next) return;

    undoStack.current.push(makeSnapshot(pages, currentPageId, selectedByPage));

    recordingRef.current = false;
    setPages(next.pages);
    setCurrentPageId(next.currentPageId);
    setSelectedByPage(next.selectedByPage);
    recordingRef.current = true;
  }, [pages, currentPageId, selectedByPage, makeSnapshot]);

  const undoRef = useRef(undo);
  const redoRef = useRef(redo);
  useEffect(() => {
    undoRef.current = undo;
    redoRef.current = redo;
  }, [undo, redo]);

  /* ---------- COPY BUFFER ---------- */
  const copyBufferRef = useRef<Block[]>([]);

  /* ---------- MODIFIER KEYS (Alt disables snapping) ---------- */
  const altDownRef = useRef(false);
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Alt") altDownRef.current = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Alt") altDownRef.current = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  const shouldSnap = () => snapOn && !altDownRef.current;

  /* ---------- LOAD AUTOSAVE ON MOUNT ---------- */
  const didLoadAutosaveRef = useRef(false);
  useEffect(() => {
    if (didLoadAutosaveRef.current) return;
    didLoadAutosaveRef.current = true;

    // try v2 first
    const s2 = safeParseSnapshot(localStorage.getItem(LS_AUTOSAVE_KEY));
    if (s2) {
      recordingRef.current = false;
      setPages(s2.pages);
      setCurrentPageId(s2.currentPageId);
      setSelectedByPage(s2.selectedByPage);
      recordingRef.current = true;
      return;
    }

    // fallback: v1 -> migrate into Page 1
    const s1 = safeParseSnapshotV1(localStorage.getItem(LS_AUTOSAVE_KEY_V1));
    if (s1) {
      const pid = uid();
      recordingRef.current = false;
      setPages([{ id: pid, name: "Page 1", blocks: s1.blocks.length ? s1.blocks : defaultBlocks() }]);
      setCurrentPageId(pid);
      setSelectedByPage({ [pid]: s1.selectedIds ?? [] });
      recordingRef.current = true;
      return;
    }

    // if nothing saved, ensure state is consistent
    setPages((prev) => {
      if (prev.length) return prev;
      const pid = uid();
      setCurrentPageId(pid);
      setSelectedByPage({ [pid]: [] });
      return [{ id: pid, name: "Page 1", blocks: defaultBlocks() }];
    });
  }, []);

  /* ---------- AUTOSAVE PERSIST ---------- */
  useEffect(() => {
    const snapshot: Snapshot = {
      pages,
      currentPageId: currentPageId || pages[0]?.id,
      selectedByPage,
    };
    try {
      localStorage.setItem(LS_AUTOSAVE_KEY, JSON.stringify(snapshot));
    } catch {
      // ignore
    }
  }, [pages, currentPageId, selectedByPage]);

  /* ---------- HELPERS: update current page blocks ---------- */
  const setCurrentPageBlocks = useCallback(
    (nextBlocks: Block[], nextSelectedIds?: string[]) => {
      const pid = currentPageId;
      const nextPages = pages.map((p) => (p.id === pid ? { ...p, blocks: nextBlocks } : p));
      const nextSelected = {
        ...selectedByPage,
        [pid]: nextSelectedIds ?? (selectedByPage[pid] ?? []),
      };
      commit(nextPages, pid, nextSelected);
    },
    [pages, selectedByPage, currentPageId, commit]
  );

  const setSelectedIds = useCallback(
    (nextIds: string[]) => {
      const pid = currentPageId;
      setSelectedByPage((prev) => ({ ...prev, [pid]: nextIds }));
    },
    [currentPageId]
  );

  /* ---------- GROUP DRAG ---------- */
  const dragRef = useRef<{
    active: boolean;
    pointerId: number | null;
    anchor: Point;
    initial: Map<string, Point>;
    committedStart: boolean;
  }>({
    active: false,
    pointerId: null,
    anchor: { x: 0, y: 0 },
    initial: new Map(),
    committedStart: false,
  });

  const beginGroupDrag = useCallback(
    (pointerId: number, start: Point) => {
      if (!dragRef.current.committedStart) {
        undoStack.current.push(makeSnapshot(pages, currentPageId, selectedByPage));
        redoStack.current.length = 0;
        dragRef.current.committedStart = true;
      }

      const initial = new Map<string, Point>();
      blocks.forEach((b) => {
        if (!selectedSet.has(b.id)) return;
        if (b.locked) return;
        initial.set(b.id, { x: b.x, y: b.y });
      });

      if (initial.size === 0) {
        dragRef.current.active = false;
        dragRef.current.pointerId = null;
        dragRef.current.initial = new Map();
        dragRef.current.committedStart = false;
        return;
      }

      dragRef.current.active = true;
      dragRef.current.pointerId = pointerId;
      dragRef.current.anchor = start;
      dragRef.current.initial = initial;
    },
    [blocks, selectedSet, pages, currentPageId, selectedByPage, makeSnapshot]
  );

  const applyDrag = useCallback(
    (dx: number, dy: number) => {
      // No commit spam during drag; we mutate with setPages and commit only via begin drag snapshot already pushed.
      setPages((prevPages) => {
        const pid = currentPageIdRef.current;
        return prevPages.map((p) => {
          if (p.id !== pid) return p;
          const nextBlocks = p.blocks.map((b) => {
            if (!dragRef.current.initial.has(b.id)) return b;
            const start = dragRef.current.initial.get(b.id)!;

            let nx = start.x + dx;
            let ny = start.y + dy;

            if (shouldSnap()) {
              nx = snap(nx, GRID);
              ny = snap(ny, GRID);
            }

            return { ...b, x: nx, y: ny };
          });
          return { ...p, blocks: nextBlocks };
        });
      });
    },
    [snapOn]
  );

  const endDrag = useCallback(() => {
    dragRef.current.active = false;
    dragRef.current.pointerId = null;
    dragRef.current.initial.clear();
    dragRef.current.committedStart = false;
  }, []);

  /* ---------- MARQUEE ---------- */
  const marqueeRef = useRef<{
    active: boolean;
    pointerId: number | null;
    start: Point;
    current: Point;
    additive: boolean;
    moved: boolean;
    committedStart: boolean;
  }>({
    active: false,
    pointerId: null,
    start: { x: 0, y: 0 },
    current: { x: 0, y: 0 },
    additive: false,
    moved: false,
    committedStart: false,
  });

  const getMarqueeRect = () => {
    const s = marqueeRef.current.start;
    const c = marqueeRef.current.current;
    return {
      x: Math.min(s.x, c.x),
      y: Math.min(s.y, c.y),
      w: Math.abs(s.x - c.x),
      h: Math.abs(s.y - c.y),
    };
  };

  /* ---------- POINTER EVENTS ---------- */
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (dragRef.current.active && dragRef.current.pointerId === e.pointerId) {
        applyDrag(e.clientX - dragRef.current.anchor.x, e.clientY - dragRef.current.anchor.y);
      }

      if (marqueeRef.current.active && marqueeRef.current.pointerId === e.pointerId) {
        const now = { x: e.clientX, y: e.clientY };
        marqueeRef.current.current = now;

        if (!marqueeRef.current.moved && dist2(now, marqueeRef.current.start) > 9) {
          marqueeRef.current.moved = true;

          if (!marqueeRef.current.committedStart) {
            undoStack.current.push(makeSnapshot(pagesRef.current, currentPageIdRef.current, selectedByPageRef.current));
            redoStack.current.length = 0;
            marqueeRef.current.committedStart = true;
          }

          if (!marqueeRef.current.additive) {
            const pid = currentPageIdRef.current;
            setSelectedByPage((prev) => ({ ...prev, [pid]: [] }));
          }
        }

        if (marqueeRef.current.moved) {
          const rect = getMarqueeRect();
          const pid = currentPageIdRef.current;
          const curPage = pagesRef.current.find((p) => p.id === pid);
          const curBlocks = curPage?.blocks ?? [];

          const hits = curBlocks
            .filter((b) => rectsIntersect(rect, { x: b.x, y: b.y, w: b.w, h: b.h }))
            .map((b) => b.id);

          setSelectedByPage((prev) => {
            const prevSel = prev[pid] ?? [];
            const nextSel = marqueeRef.current.additive ? Array.from(new Set([...prevSel, ...hits])) : hits;
            return { ...prev, [pid]: nextSel };
          });
        }
      }
    };

    const onUp = (e: PointerEvent) => {
      if (dragRef.current.active && dragRef.current.pointerId === e.pointerId) endDrag();

      marqueeRef.current.active = false;
      marqueeRef.current.pointerId = null;
      marqueeRef.current.moved = false;
      marqueeRef.current.committedStart = false;
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [applyDrag, endDrag, makeSnapshot]);

  /* ---------- WINDOW KEYBOARD ---------- */
  useEffect(() => {
    const onWindowKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;

      const isMac = navigator.platform.toLowerCase().includes("mac");
      const mod = isMac ? e.metaKey : e.ctrlKey;

      // Undo/Redo
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redoRef.current();
        else undoRef.current();
        return;
      }

      const curPages = pagesRef.current;
      const pid = currentPageIdRef.current;
      const curPage = curPages.find((p) => p.id === pid);
      const curBlocks = curPage?.blocks ?? [];
      const curSelectedIds = (selectedByPageRef.current[pid] ?? []).slice();
      const curSelectedSet = new Set(curSelectedIds);

      if (curSelectedIds.length === 0) return;

      // Copy
      if (mod && e.key.toLowerCase() === "c") {
        e.preventDefault();
        const sel = curBlocks.filter((b) => curSelectedSet.has(b.id));
        if (!sel.length) return;
        const minX = Math.min(...sel.map((b) => b.x));
        const minY = Math.min(...sel.map((b) => b.y));
        copyBufferRef.current = sel.map((b) => ({ ...b, x: b.x - minX, y: b.y - minY }));
        return;
      }

      // Paste
      if (mod && e.key.toLowerCase() === "v") {
        e.preventDefault();
        const buf = copyBufferRef.current;
        if (!buf.length) return;

        const baseX = 80;
        const baseY = 80;
        const newOnes: Block[] = buf.map((b) => ({
          ...b,
          id: uid(),
          x: baseX + b.x + 16,
          y: baseY + b.y + 16,
          locked: Boolean(b.locked ?? false),
        }));

        const nextBlocks = [...curBlocks, ...newOnes];
        const nextSelected = { ...selectedByPageRef.current, [pid]: newOnes.map((b) => b.id) };
        commitRef.current(
          curPages.map((p) => (p.id === pid ? { ...p, blocks: nextBlocks } : p)),
          pid,
          nextSelected
        );
        return;
      }

      // Duplicate
      if (mod && e.key.toLowerCase() === "d") {
        e.preventDefault();
        const sel = curBlocks.filter((b) => curSelectedSet.has(b.id));
        if (!sel.length) return;

        const newOnes: Block[] = sel.map((b) => ({
          ...b,
          id: uid(),
          x: b.x + 16,
          y: b.y + 16,
          locked: Boolean(b.locked ?? false),
        }));

        const nextBlocks = [...curBlocks, ...newOnes];
        const nextSelected = { ...selectedByPageRef.current, [pid]: newOnes.map((b) => b.id) };
        commitRef.current(
          curPages.map((p) => (p.id === pid ? { ...p, blocks: nextBlocks } : p)),
          pid,
          nextSelected
        );
        return;
      }

      // Delete
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        const nextBlocks = curBlocks.filter((b) => !curSelectedSet.has(b.id));
        const nextSelected = { ...selectedByPageRef.current, [pid]: [] };
        commitRef.current(
          curPages.map((p) => (p.id === pid ? { ...p, blocks: nextBlocks } : p)),
          pid,
          nextSelected
        );
        return;
      }

      // Arrow nudges
      const step = e.shiftKey ? 10 : 1;
      let dx = 0;
      let dy = 0;
      if (e.key === "ArrowLeft") dx = -step;
      else if (e.key === "ArrowRight") dx = step;
      else if (e.key === "ArrowUp") dy = -step;
      else if (e.key === "ArrowDown") dy = step;
      else return;

      e.preventDefault();

      const nextBlocks = curBlocks.map((b) => {
        if (!curSelectedSet.has(b.id)) return b;
        if (b.locked) return b;

        let nx = b.x + dx;
        let ny = b.y + dy;

        if (snapOn && !altDownRef.current) {
          nx = snap(nx, GRID);
          ny = snap(ny, GRID);
        }

        return { ...b, x: nx, y: ny };
      });

      commitRef.current(
        curPages.map((p) => (p.id === pid ? { ...p, blocks: nextBlocks } : p)),
        pid,
        selectedByPageRef.current
      );
    };

    window.addEventListener("keydown", onWindowKeyDown, { capture: true });
    return () =>
      window.removeEventListener("keydown", onWindowKeyDown, { capture: true } as any);
  }, [snapOn]);

  /* ---------- ACTIONS: BLOCKS ---------- */
  const addBlock = useCallback(() => {
    const b: Block = { id: uid(), x: 120, y: 120, w: 240, h: 80, text: "New text box", locked: false };
    setCurrentPageBlocks([...blocks, b], [b.id]);
  }, [blocks, setCurrentPageBlocks]);

  const toggleLockSelected = useCallback(() => {
    if (selectedIds.length === 0) return;
    const sel = new Set(selectedIds);
    const selectedBlocks = blocks.filter((b) => sel.has(b.id));
    const anyUnlocked = selectedBlocks.some((b) => !b.locked);
    const nextLockState = anyUnlocked ? true : false;

    const nextBlocks = blocks.map((b) => (sel.has(b.id) ? { ...b, locked: nextLockState } : b));
    setCurrentPageBlocks(nextBlocks, selectedIds);
  }, [blocks, selectedIds, setCurrentPageBlocks]);

  /* ---------- ACTIONS: SAVE/LOAD/EXPORT/IMPORT ---------- */
  const saveManual = useCallback(() => {
    const snapShot: Snapshot = {
      pages,
      currentPageId: currentPageId || pages[0]?.id,
      selectedByPage,
    };
    try {
      localStorage.setItem(LS_MANUALSAVE_KEY, JSON.stringify(snapShot));
      alert("Saved ✅");
    } catch {
      alert("Save failed (localStorage)");
    }
  }, [pages, currentPageId, selectedByPage]);

  const loadManual = useCallback(() => {
    const s2 = safeParseSnapshot(localStorage.getItem(LS_MANUALSAVE_KEY));
    if (s2) {
      undoStack.current.push(makeSnapshot(pages, currentPageId, selectedByPage));
      redoStack.current.length = 0;

      recordingRef.current = false;
      setPages(s2.pages);
      setCurrentPageId(s2.currentPageId);
      setSelectedByPage(s2.selectedByPage);
      recordingRef.current = true;
      return;
    }

    // fallback: old manual save v1
    const s1 = safeParseSnapshotV1(localStorage.getItem(LS_MANUALSAVE_KEY_V1));
    if (s1) {
      const pid = uid();
      undoStack.current.push(makeSnapshot(pages, currentPageId, selectedByPage));
      redoStack.current.length = 0;

      recordingRef.current = false;
      setPages([{ id: pid, name: "Page 1", blocks: s1.blocks.length ? s1.blocks : defaultBlocks() }]);
      setCurrentPageId(pid);
      setSelectedByPage({ [pid]: s1.selectedIds ?? [] });
      recordingRef.current = true;
      alert("Loaded (migrated from older save) ✅");
      return;
    }

    alert("No saved layout found.");
  }, [pages, currentPageId, selectedByPage, makeSnapshot]);

  const exportJson = useCallback(async () => {
    const snapShot: Snapshot = {
      pages,
      currentPageId: currentPageId || pages[0]?.id,
      selectedByPage,
    };
    const text = JSON.stringify(snapShot, null, 2);
    const ok = await copyToClipboard(text);
    if (ok) alert("Export copied to clipboard ✅");
    else window.prompt("Copy this JSON:", text);
  }, [pages, currentPageId, selectedByPage]);

  const importJson = useCallback(() => {
    const raw = window.prompt("Paste JSON to import:");
    if (!raw) return;
    const s2 = safeParseSnapshot(raw);
    if (!s2) {
      alert("Invalid JSON.");
      return;
    }

    undoStack.current.push(makeSnapshot(pages, currentPageId, selectedByPage));
    redoStack.current.length = 0;

    recordingRef.current = false;
    setPages(s2.pages);
    setCurrentPageId(s2.currentPageId);
    setSelectedByPage(s2.selectedByPage);
    recordingRef.current = true;
  }, [pages, currentPageId, selectedByPage, makeSnapshot]);

  /* ---------- ACTIONS: PAGES ---------- */
  const addPage = useCallback(() => {
    const nextIndex = pages.length + 1;
    const pid = uid();
    const nextPages = [...pages, { id: pid, name: `Page ${nextIndex}`, blocks: defaultBlocks() }];
    const nextSelected = { ...selectedByPage, [pid]: [] };
    commit(nextPages, pid, nextSelected);
  }, [pages, selectedByPage, commit]);

  const renamePage = useCallback(() => {
    const p = currentPage;
    if (!p) return;
    const raw = window.prompt("Rename page:", p.name);
    if (!raw) return;
    const name = raw.trim();
    if (!name) return;

    const nextPages = pages.map((pg) => (pg.id === p.id ? { ...pg, name } : pg));
    commit(nextPages, currentPageId, selectedByPage);
  }, [currentPage, pages, currentPageId, selectedByPage, commit]);

  const duplicatePage = useCallback(() => {
    const p = currentPage;
    if (!p) return;
    const pid = uid();
    const name = `${p.name} Copy`;
    const nextPages = [
      ...pages,
      {
        id: pid,
        name,
        blocks: p.blocks.map((b) => ({ ...b, id: uid(), x: b.x + 12, y: b.y + 12 })),
      },
    ];
    const nextSelected = { ...selectedByPage, [pid]: [] };
    commit(nextPages, pid, nextSelected);
  }, [currentPage, pages, selectedByPage, commit]);

  const deletePage = useCallback(() => {
    if (pages.length <= 1) {
      alert("You must keep at least 1 page.");
      return;
    }
    const p = currentPage;
    if (!p) return;

    const ok = window.confirm(`Delete "${p.name}"?`);
    if (!ok) return;

    const nextPages = pages.filter((pg) => pg.id !== p.id);
    const nextCurrent = nextPages[0].id;

    const nextSelected = { ...selectedByPage };
    delete nextSelected[p.id];
    if (!nextSelected[nextCurrent]) nextSelected[nextCurrent] = [];

    commit(nextPages, nextCurrent, nextSelected);
  }, [pages, currentPage, selectedByPage, commit]);

  const switchPage = useCallback(
    (id: string) => {
      setCurrentPageId(id);
      setSelectedByPage((prev) => ({ ...prev, [id]: prev[id] ?? [] }));
      canvasRef.current?.focus();
    },
    []
  );

  const clearAutosaveAll = useCallback(() => {
    const ok = window.confirm("Clear autosave (ALL pages) and reset to defaults?");
    if (!ok) return;

    try {
      localStorage.removeItem(LS_AUTOSAVE_KEY);
      localStorage.removeItem(LS_AUTOSAVE_KEY_V1);
    } catch {
      // ignore
    }

    undoStack.current.length = 0;
    redoStack.current.length = 0;

    const pid = uid();
    recordingRef.current = false;
    setPages([{ id: pid, name: "Page 1", blocks: defaultBlocks() }]);
    setCurrentPageId(pid);
    setSelectedByPage({ [pid]: [] });
    recordingRef.current = true;
  }, []);

  /* ---------- HANDLERS ---------- */
  const onBlockPointerDown = (e: React.PointerEvent, id: string) => {
    canvasRef.current?.focus();

    e.stopPropagation();
    e.preventDefault();

    // Shift+click toggle selection
    if (e.shiftKey) {
      const next = selectedSet.has(id) ? selectedIds.filter((i) => i !== id) : [...selectedIds, id];
      // commit selection change (so undo restores it)
      commit(pages, currentPageId, { ...selectedByPage, [currentPageId]: next });
      return;
    }

    // Click selected: keep selection
    if (!selectedSet.has(id)) {
      // commit selection change
      commit(pages, currentPageId, { ...selectedByPage, [currentPageId]: [id] });
    }

    // If the block is locked, do NOT start drag
    const b = blocks.find((p) => p.id === id);
    if (b?.locked) return;

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    beginGroupDrag(e.pointerId, { x: e.clientX, y: e.clientY });
  };

  const onCanvasPointerDown = (e: React.PointerEvent) => {
    canvasRef.current?.focus();

    marqueeRef.current = {
      active: true,
      pointerId: e.pointerId,
      start: { x: e.clientX, y: e.clientY },
      current: { x: e.clientX, y: e.clientY },
      additive: e.shiftKey,
      moved: false,
      committedStart: false,
    };
  };

  /* ---------- OUTLINE ---------- */
  const selectionBox = useMemo(() => {
    const sel = blocks.filter((b) => selectedSet.has(b.id));
    if (!sel.length) return null;
    const l = Math.min(...sel.map((b) => b.x));
    const t = Math.min(...sel.map((b) => b.y));
    const r = Math.max(...sel.map((b) => b.x + b.w));
    const btm = Math.max(...sel.map((b) => b.y + b.h));
    return { l, t, w: r - l, h: btm - t };
  }, [blocks, selectedSet]);

  useEffect(() => {
    canvasRef.current?.focus();
  }, []);

  const selectedCount = selectedIds.length;

  return (
    <div className="min-h-screen bg-zinc-50 p-6">
      {/* Pages Bar */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {pages.map((p) => {
            const active = p.id === currentPageId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => switchPage(p.id)}
                className={[
                  "rounded-lg border px-3 py-2 text-sm shadow-sm",
                  active ? "border-zinc-900 bg-white" : "border-zinc-200 bg-white hover:bg-zinc-100",
                ].join(" ")}
              >
                {p.name}
              </button>
            );
          })}
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button className="rounded-lg border bg-white px-3 py-2 text-sm shadow-sm hover:bg-zinc-100" onClick={addPage} type="button">
            + Page
          </button>
          <button className="rounded-lg border bg-white px-3 py-2 text-sm shadow-sm hover:bg-zinc-100" onClick={renamePage} type="button">
            Rename
          </button>
          <button className="rounded-lg border bg-white px-3 py-2 text-sm shadow-sm hover:bg-zinc-100" onClick={duplicatePage} type="button">
            Duplicate
          </button>
          <button className="rounded-lg border bg-white px-3 py-2 text-sm shadow-sm hover:bg-red-50" onClick={deletePage} type="button">
            Delete
          </button>
        </div>
      </div>

      {/* Main toolbar */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button className="rounded-lg border bg-white px-3 py-2 text-sm shadow-sm hover:bg-zinc-100" onClick={addBlock} type="button">
          + Add
        </button>

        <button
          className="rounded-lg border bg-white px-3 py-2 text-sm shadow-sm hover:bg-zinc-100"
          onClick={() => setSnapOn((v) => !v)}
          type="button"
        >
          Snap: {snapOn ? "ON" : "OFF"}
        </button>

        <button className="rounded-lg border bg-white px-3 py-2 text-sm shadow-sm hover:bg-zinc-100" onClick={saveManual} type="button">
          Save
        </button>
        <button className="rounded-lg border bg-white px-3 py-2 text-sm shadow-sm hover:bg-zinc-100" onClick={loadManual} type="button">
          Load
        </button>
        <button className="rounded-lg border bg-white px-3 py-2 text-sm shadow-sm hover:bg-zinc-100" onClick={exportJson} type="button">
          Export JSON
        </button>
        <button className="rounded-lg border bg-white px-3 py-2 text-sm shadow-sm hover:bg-zinc-100" onClick={importJson} type="button">
          Import JSON
        </button>

        <button
          className="rounded-lg border bg-white px-3 py-2 text-sm shadow-sm hover:bg-zinc-100"
          onClick={toggleLockSelected}
          type="button"
          disabled={selectedCount === 0}
        >
          {selectedCount === 0 ? "Lock/Unlock" : "Lock/Unlock Selected"}
        </button>

        <button
          className="rounded-lg border bg-white px-3 py-2 text-sm shadow-sm hover:bg-red-50"
          onClick={clearAutosaveAll}
          type="button"
        >
          Clear Autosave (All Pages)
        </button>

        <div className="text-sm text-zinc-600">
          Page: <b>{currentPage?.name ?? "Page"}</b> • Selected: <b>{selectedCount}</b> • Tip: hold <b>Alt</b> to disable snapping
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        tabIndex={0}
        onPointerDown={onCanvasPointerDown}
        className="relative h-[720px] rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-zinc-300"
      >
        {marqueeRef.current.active && marqueeRef.current.moved && (
          <div
            className="absolute pointer-events-none border-2 border-blue-500/60 bg-blue-500/10"
            style={getMarqueeRect()}
          />
        )}

        {selectionBox && (
          <div
            className="absolute pointer-events-none rounded-lg border-2 border-zinc-900/40"
            style={{
              left: selectionBox.l - 6,
              top: selectionBox.t - 6,
              width: selectionBox.w + 12,
              height: selectionBox.h + 12,
            }}
          />
        )}

        {blocks.map((b) => (
          <TextBlock
            key={b.id}
            {...b}
            locked={Boolean(b.locked)}
            selected={selectedSet.has(b.id)}
            onPointerDown={onBlockPointerDown}
            onChangeText={(id, text) => {
              const nextBlocks = blocks.map((p) => (p.id === id ? { ...p, text } : p));
              // commit text edits so undo works
              setCurrentPageBlocks(nextBlocks, selectedIds);
            }}
          />
        ))}
      </div>
    </div>
  );
}