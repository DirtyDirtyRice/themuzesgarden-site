"use client";

import { useLayoutEffect, useMemo, useState } from "react";
import { findTimelineDawStudioFocusArea, parseTimelineDawStudioFocusArea, resolveTimelineDawStudioRestoreState, shouldTimelineDawWorkspaceAreaOpen, timelineDawCompactMenuGroups, timelineDawStudioFocusStorageKey, timelineDawStudioScrollStorageKey, type TimelineDawStudioFocusArea } from "@/lib/timeline/TimelineDawStudioFocusPolicy";
import { TIMELINE_DAW_HELP_WORKFLOWS } from "@/lib/timeline/TimelineDawHelpCoveragePolicy";

const button = "rounded-xl border border-white/20 bg-white px-3 py-2 text-sm font-black text-black";

export default function TimelineDawStudioFocusRestore({ sessionId }: { sessionId: string }) {
  const storageKey = useMemo(() => timelineDawStudioFocusStorageKey(sessionId), [sessionId]);
  const scrollStorageKey = useMemo(() => timelineDawStudioScrollStorageKey(sessionId), [sessionId]);
  const [saved, setSaved] = useState<TimelineDawStudioFocusArea | null>(null);
  const [destination, setDestination] = useState<TimelineDawStudioFocusArea>("transport");

  useLayoutEffect(() => {
    const restored = resolveTimelineDawStudioRestoreState(readStorage(storageKey), readStorage(scrollStorageKey));
    const requestedArea = delayedHashFocusArea(decodeURIComponent(window.location.hash.slice(1)));
    const initialArea = requestedArea ?? restored.area ?? "transport";
    if (requestedArea) writeStorage(storageKey, requestedArea);
    queueMicrotask(() => { setSaved(initialArea); setDestination(initialArea); });
    const elements = [...document.querySelectorAll<HTMLElement>("[data-daw-focus-area]")];
    const initialTarget = elements.find((element) => element.dataset.dawFocusArea === initialArea) ?? null;
    if (initialTarget && !window.location.hash) openWorkspacePanel(initialTarget);
    if (restored.scrollTop && !window.location.hash) requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo({ top: restored.scrollTop, behavior: "auto" })));
    const rememberScroll = () => {
      if (window.location.hash) return;
      writeStorage(scrollStorageKey, String(Math.round(window.scrollY)));
    };
    const rememberOpenedPanel = (event: Event) => {
      const panel = event.target as HTMLDetailsElement;
      if (!panel.open || !panel.matches("details[data-daw-workspace-panel]")) return;
      const area = workspacePanelArea(panel);
      if (!area) return;
      openWorkspacePanel(panel);
      writeStorage(storageKey, area);
      setSaved(area);
      setDestination(area);
    };
    document.querySelectorAll<HTMLDetailsElement>("details[data-daw-workspace-panel]").forEach((panel) => panel.addEventListener("toggle", rememberOpenedPanel));
    window.addEventListener("scroll", rememberScroll, { passive: true });
    window.addEventListener("pagehide", rememberScroll);
    return () => {
      document.querySelectorAll<HTMLDetailsElement>("details[data-daw-workspace-panel]").forEach((panel) => panel.removeEventListener("toggle", rememberOpenedPanel));
      window.removeEventListener("scroll", rememberScroll);
      window.removeEventListener("pagehide", rememberScroll);
    };
  }, [scrollStorageKey, storageKey]);

  useLayoutEffect(() => {
    function rememberHashArea(target: HTMLElement, fallbackArea: TimelineDawStudioFocusArea | null = null) {
      const panel = target.closest<HTMLDetailsElement>("details[data-daw-workspace-panel]");
      const area = (panel ? workspacePanelArea(panel) : null) ?? fallbackArea;
      if (!area) return;
      writeStorage(storageKey, area);
      setSaved(area);
      setDestination(area);
    }
    function openHashDestination(forceAlignment = false) {
      const hash = decodeURIComponent(window.location.hash.slice(1));
      if (!hash) return false;
      const target = document.getElementById(hash);
      if (!target) {
        const delayedArea = delayedHashFocusArea(hash);
        const delayedPanel = delayedArea
          ? document.querySelector<HTMLElement>(`[data-daw-focus-area="${delayedArea}"]`)
          : null;
        if (delayedPanel) {
          openWorkspacePanel(delayedPanel);
          rememberHashArea(delayedPanel, delayedArea);
        }
        return false;
      }
      openWorkspacePanel(target);
      rememberHashArea(target, delayedHashFocusArea(hash));
      if (forceAlignment || !isHashDestinationAligned(target)) alignHashDestination(target);
      return true;
    }
    openHashDestination(true);
    const delayedTargetObserver = new MutationObserver(() => openHashDestination());
    if (window.location.hash) delayedTargetObserver.observe(document.body, { childList: true, subtree: true });
    const destinationResizeObserver = new ResizeObserver(() => openHashDestination());
    const observedPanel = document.querySelector<HTMLElement>(`[data-daw-focus-area="${delayedHashFocusArea(decodeURIComponent(window.location.hash.slice(1))) ?? ""}"]`);
    if (observedPanel) destinationResizeObserver.observe(observedPanel);
    function openClickedHash(event: MouseEvent) {
      const anchor = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
      const hash = anchor?.getAttribute("href")?.slice(1);
      if (!hash) return;
      const target = document.getElementById(decodeURIComponent(hash));
      if (target) openWorkspacePanel(target);
    }
    const restoreHashDestination = () => openHashDestination(true);
    window.addEventListener("hashchange", restoreHashDestination);
    window.addEventListener("pageshow", restoreHashDestination);
    window.addEventListener("popstate", restoreHashDestination);
    const restoreHashWhenVisible = () => {
      if (document.visibilityState === "visible") restoreHashDestination();
    };
    const restoreHashOnFocus = () => restoreHashDestination();
    document.addEventListener("visibilitychange", restoreHashWhenVisible);
    window.addEventListener("focus", restoreHashOnFocus);
    document.addEventListener("click", openClickedHash, true);
    return () => {
      delayedTargetObserver.disconnect();
      destinationResizeObserver.disconnect();
      window.removeEventListener("hashchange", restoreHashDestination);
      window.removeEventListener("pageshow", restoreHashDestination);
      window.removeEventListener("popstate", restoreHashDestination);
      document.removeEventListener("visibilitychange", restoreHashWhenVisible);
      window.removeEventListener("focus", restoreHashOnFocus);
      document.removeEventListener("click", openClickedHash, true);
    };
  }, [storageKey]);

  const selected = findTimelineDawStudioFocusArea(saved);
  const chosen = findTimelineDawStudioFocusArea(destination);
  function goTo(area: TimelineDawStudioFocusArea) {
    const target = document.querySelector<HTMLElement>(`[data-daw-focus-area="${area}"]`);
    if (!target) return;
    openWorkspacePanel(target);
    if (window.location.hash) window.history.replaceState(window.history.state, "", `${window.location.pathname}${window.location.search}`);
    writeStorage(storageKey, area);
    setSaved(area);
    requestAnimationFrame(() => target.scrollIntoView({ behavior: "auto", block: "start" }));
  }

  const menuGroups = timelineDawCompactMenuGroups();

  return <aside aria-label="DAW section navigator" className="sticky top-2 z-30 rounded-2xl border border-sky-300/30 bg-[#07111a]/95 p-3 shadow-xl backdrop-blur"><div className="flex flex-wrap items-end gap-3"><div className="min-w-[13rem] flex-1"><label htmlFor="daw-section-destination" className="text-xs font-black uppercase tracking-[.2em] text-sky-200">DAW work area</label><select id="daw-section-destination" className="mt-1 w-full rounded-xl border border-white/25 bg-black px-3 py-2 text-base font-bold text-white" value={destination} onChange={(event) => setDestination(parseTimelineDawStudioFocusArea(event.target.value) ?? "transport")}>{menuGroups.map((group) => <optgroup key={group.label} label={group.label}>{group.areas.map((area) => <option key={area.id} value={area.id}>{area.menuLabel}</option>)}</optgroup>)}</select></div><button type="button" className={button} onClick={() => goTo(destination)}>Open</button>{selected ? <button type="button" className={button} onClick={() => goTo(selected.id)}>Return to open {selected.menuLabel}</button> : null}</div><div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"><span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2 py-1 text-xs font-black text-emerald-100" aria-live="polite">Open now: {selected?.menuLabel ?? "none"}</span><span className="text-white/70">{chosen?.help ?? "Choose a Studio section."}</span></div><details className="mt-3 rounded-xl border border-sky-200/20 bg-black/30 p-3"><summary className="cursor-pointer font-black text-sky-100">Help for every important DAW workflow</summary><p className="mt-2 text-sm text-white/60">Choose the music job below. The directory names the exact controls covered by its on-screen guide and opens the correct Studio area.</p><div className="mt-3 grid gap-2 lg:grid-cols-2">{TIMELINE_DAW_HELP_WORKFLOWS.map((workflow) => <article key={workflow.id} className="rounded-xl border border-white/10 bg-white/[0.04] p-3"><div className="flex items-start justify-between gap-3"><div><h3 className="font-black text-white">{workflow.title}</h3><p className="mt-1 text-xs font-bold text-sky-200">Guide: {workflow.guide}</p></div><button type="button" className="shrink-0 rounded-lg border border-white/20 bg-white px-2 py-1 text-xs font-black text-black" onClick={() => goTo(workflow.area)}>Open</button></div><p className="mt-2 text-xs text-white/55"><b className="text-white/75">Controls covered:</b> {workflow.controls.join(" · ")}</p></article>)}</div></details></aside>;
}

function delayedHashFocusArea(hash: string): TimelineDawStudioFocusArea | null {
  if (hash === "private-session-snapshots") return "mix";
  return null;
}

function openWorkspacePanel(target: HTMLElement) {
  const disclosure = target.closest<HTMLDetailsElement>("details[data-daw-workspace-panel]");
  if (!disclosure) return;
  const selectedArea = workspacePanelArea(disclosure);
  document.querySelectorAll<HTMLDetailsElement>("details[data-daw-workspace-panel]").forEach((panel) => {
    const panelArea = workspacePanelArea(panel);
    panel.open = shouldTimelineDawWorkspaceAreaOpen(panelArea, selectedArea);
  });
  let ancestor: HTMLElement | null = target;
  while (ancestor && ancestor !== disclosure) {
    const nestedDisclosure: HTMLDetailsElement | null = ancestor.closest("details");
    if (!nestedDisclosure || nestedDisclosure === disclosure) break;
    nestedDisclosure.open = true;
    ancestor = nestedDisclosure.parentElement;
  }
}

function workspacePanelArea(panel: HTMLDetailsElement) {
  return parseTimelineDawStudioFocusArea(panel.dataset.dawFocusArea)
    ?? parseTimelineDawStudioFocusArea(panel.querySelector<HTMLElement>("[data-daw-focus-area]")?.dataset.dawFocusArea);
}

function alignHashDestination(target: HTMLElement) {
  target.scrollIntoView({ behavior: "auto", block: "start" });
}

function isHashDestinationAligned(target: HTMLElement) {
  const margin = Number.parseFloat(window.getComputedStyle(target).scrollMarginTop) || 0;
  return Math.abs(target.getBoundingClientRect().top - margin) <= 4;
}

function readStorage(key: string) {
  try { return window.localStorage.getItem(key); } catch { return null; }
}

function writeStorage(key: string, value: string) {
  try { window.localStorage.setItem(key, value); } catch { /* Navigation memory must never block music work. */ }
}
