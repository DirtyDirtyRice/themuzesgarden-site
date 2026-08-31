"use client";

import { useEffect, useMemo, useState } from "react";
import { findTimelineDawStudioFocusArea, parseTimelineDawStudioFocusArea, parseTimelineDawStudioScrollPosition, shouldTimelineDawWorkspaceAreaOpen, timelineDawCompactMenuGroups, timelineDawStudioFocusStorageKey, timelineDawStudioScrollStorageKey, type TimelineDawStudioFocusArea } from "@/lib/timeline/TimelineDawStudioFocusPolicy";
import { TIMELINE_DAW_HELP_WORKFLOWS } from "@/lib/timeline/TimelineDawHelpCoveragePolicy";

const button = "rounded-xl border border-white/20 bg-white px-3 py-2 text-sm font-black text-black";

export default function TimelineDawStudioFocusRestore({ sessionId }: { sessionId: string }) {
  const storageKey = useMemo(() => timelineDawStudioFocusStorageKey(sessionId), [sessionId]);
  const scrollStorageKey = useMemo(() => timelineDawStudioScrollStorageKey(sessionId), [sessionId]);
  const [saved, setSaved] = useState<TimelineDawStudioFocusArea | null>(null);
  const [destination, setDestination] = useState<TimelineDawStudioFocusArea>("transport");

  useEffect(() => {
    const initial = parseTimelineDawStudioFocusArea(window.localStorage.getItem(storageKey));
    const initialScroll = parseTimelineDawStudioScrollPosition(window.localStorage.getItem(scrollStorageKey));
    queueMicrotask(() => { setSaved(initial); if (initial) setDestination(initial); });
    const elements = [...document.querySelectorAll<HTMLElement>("[data-daw-focus-area]")];
    const initialTarget = initial ? elements.find((element) => element.dataset.dawFocusArea === initial) : null;
    if (initialTarget && !window.location.hash) openWorkspacePanel(initialTarget);
    if (initialScroll && !window.location.hash) requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo({ top: initialScroll, behavior: "auto" })));
    const rememberScroll = () => window.localStorage.setItem(scrollStorageKey, String(Math.round(window.scrollY)));
    const rememberOpenedPanel = (event: Event) => {
      const panel = event.target as HTMLDetailsElement;
      if (!panel.open || !panel.matches("details[data-daw-workspace-panel]")) return;
      const area = parseTimelineDawStudioFocusArea(panel.querySelector<HTMLElement>("[data-daw-focus-area]")?.dataset.dawFocusArea);
      if (!area) return;
      openWorkspacePanel(panel);
      window.localStorage.setItem(storageKey, area);
      setSaved(area);
      setDestination(area);
    };
    document.querySelectorAll<HTMLDetailsElement>("details[data-daw-workspace-panel]").forEach((panel) => panel.addEventListener("toggle", rememberOpenedPanel));
    window.addEventListener("scroll", rememberScroll, { passive: true });
    window.addEventListener("pagehide", rememberScroll);
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];
      const area = parseTimelineDawStudioFocusArea((visible?.target as HTMLElement | undefined)?.dataset.dawFocusArea);
      if (area) {
        window.localStorage.setItem(storageKey, area);
        setSaved(area);
        setDestination(area);
      }
    }, { rootMargin: "-20% 0px -55%", threshold: [0.1, 0.5] });
    elements.forEach((element) => observer.observe(element));
    return () => {
      observer.disconnect();
      document.querySelectorAll<HTMLDetailsElement>("details[data-daw-workspace-panel]").forEach((panel) => panel.removeEventListener("toggle", rememberOpenedPanel));
      window.removeEventListener("scroll", rememberScroll);
      window.removeEventListener("pagehide", rememberScroll);
    };
  }, [scrollStorageKey, storageKey]);

  useEffect(() => {
    function openHashDestination() {
      const hash = decodeURIComponent(window.location.hash.slice(1));
      if (!hash) return;
      const target = document.getElementById(hash);
      if (!target) return;
      openWorkspacePanel(target);
      requestAnimationFrame(() => target.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
    openHashDestination();
    function openClickedHash(event: MouseEvent) {
      const anchor = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
      const hash = anchor?.getAttribute("href")?.slice(1);
      if (!hash) return;
      const target = document.getElementById(decodeURIComponent(hash));
      if (target) openWorkspacePanel(target);
    }
    window.addEventListener("hashchange", openHashDestination);
    document.addEventListener("click", openClickedHash, true);
    return () => {
      window.removeEventListener("hashchange", openHashDestination);
      document.removeEventListener("click", openClickedHash, true);
    };
  }, []);

  const selected = findTimelineDawStudioFocusArea(saved);
  const chosen = findTimelineDawStudioFocusArea(destination);
  function goTo(area: TimelineDawStudioFocusArea) {
    const target = document.querySelector<HTMLElement>(`[data-daw-focus-area="${area}"]`);
    if (!target) return;
    openWorkspacePanel(target);
    window.localStorage.setItem(storageKey, area);
    setSaved(area);
    requestAnimationFrame(() => target.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  const menuGroups = timelineDawCompactMenuGroups();

  return <aside aria-label="DAW section navigator" className="sticky top-2 z-30 rounded-2xl border border-sky-300/30 bg-[#07111a]/95 p-3 shadow-xl backdrop-blur"><div className="flex flex-wrap items-end gap-3"><div className="min-w-[13rem] flex-1"><label htmlFor="daw-section-destination" className="text-xs font-black uppercase tracking-[.2em] text-sky-200">DAW work area</label><select id="daw-section-destination" className="mt-1 w-full rounded-xl border border-white/25 bg-black px-3 py-2 text-base font-bold text-white" value={destination} onChange={(event) => setDestination(parseTimelineDawStudioFocusArea(event.target.value) ?? "transport")}>{menuGroups.map((group) => <optgroup key={group.label} label={group.label}>{group.areas.map((area) => <option key={area.id} value={area.id}>{area.menuLabel}</option>)}</optgroup>)}</select></div><button type="button" className={button} onClick={() => goTo(destination)}>Open</button>{selected && selected.id !== destination ? <button type="button" className={button} onClick={() => goTo(selected.id)}>Return to {selected.menuLabel}</button> : null}</div><div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"><span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2 py-1 text-xs font-black text-emerald-100" aria-live="polite">Open now: {selected?.menuLabel ?? "none"}</span><span className="text-white/70">{chosen?.help ?? "Choose a Studio section."}</span></div><details className="mt-3 rounded-xl border border-sky-200/20 bg-black/30 p-3"><summary className="cursor-pointer font-black text-sky-100">Help for every important DAW workflow</summary><p className="mt-2 text-sm text-white/60">Choose the music job below. The directory names the exact controls covered by its on-screen guide and opens the correct Studio area.</p><div className="mt-3 grid gap-2 lg:grid-cols-2">{TIMELINE_DAW_HELP_WORKFLOWS.map((workflow) => <article key={workflow.id} className="rounded-xl border border-white/10 bg-white/[0.04] p-3"><div className="flex items-start justify-between gap-3"><div><h3 className="font-black text-white">{workflow.title}</h3><p className="mt-1 text-xs font-bold text-sky-200">Guide: {workflow.guide}</p></div><button type="button" className="shrink-0 rounded-lg border border-white/20 bg-white px-2 py-1 text-xs font-black text-black" onClick={() => goTo(workflow.area)}>Open</button></div><p className="mt-2 text-xs text-white/55"><b className="text-white/75">Controls covered:</b> {workflow.controls.join(" · ")}</p></article>)}</div></details></aside>;
}

function openWorkspacePanel(target: HTMLElement) {
  const disclosure = target.closest<HTMLDetailsElement>("details[data-daw-workspace-panel]");
  if (!disclosure) return;
  const selectedArea = disclosure.querySelector<HTMLElement>("[data-daw-focus-area]")?.dataset.dawFocusArea;
  document.querySelectorAll<HTMLDetailsElement>("details[data-daw-workspace-panel]").forEach((panel) => {
    const panelArea = panel.querySelector<HTMLElement>("[data-daw-focus-area]")?.dataset.dawFocusArea;
    panel.open = shouldTimelineDawWorkspaceAreaOpen(panelArea, selectedArea);
  });
}
