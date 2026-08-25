"use client";

import { useEffect, useMemo, useState } from "react";
import { findTimelineDawStudioFocusArea, TIMELINE_DAW_STUDIO_FOCUS_AREAS, parseTimelineDawStudioFocusArea, timelineDawStudioFocusStorageKey, type TimelineDawStudioFocusArea } from "@/lib/timeline/TimelineDawStudioFocusPolicy";

const button = "rounded-xl border border-white/20 bg-white px-3 py-2 text-sm font-black text-black";

export default function TimelineDawStudioFocusRestore({ sessionId }: { sessionId: string }) {
  const storageKey = useMemo(() => timelineDawStudioFocusStorageKey(sessionId), [sessionId]);
  const [saved, setSaved] = useState<TimelineDawStudioFocusArea | null>(null);
  const [destination, setDestination] = useState<TimelineDawStudioFocusArea>("transport");

  useEffect(() => {
    const initial = parseTimelineDawStudioFocusArea(window.localStorage.getItem(storageKey));
    queueMicrotask(() => setSaved(initial));
    const elements = [...document.querySelectorAll<HTMLElement>("[data-daw-focus-area]")];
    const initialTarget = initial ? elements.find((element) => element.dataset.dawFocusArea === initial) : null;
    if (initialTarget && !window.location.hash) openWorkspacePanel(initialTarget);
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
    return () => observer.disconnect();
  }, [storageKey]);

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

  const musicianAreas = TIMELINE_DAW_STUDIO_FOCUS_AREAS.filter((area) => area.musician);
  const advancedAreas = TIMELINE_DAW_STUDIO_FOCUS_AREAS.filter((area) => !area.musician);

  return <aside aria-label="DAW section navigator" className="sticky top-2 z-30 rounded-2xl border border-sky-300/30 bg-[#07111a]/95 p-3 shadow-xl backdrop-blur"><div className="flex flex-wrap items-end gap-3"><div className="min-w-[15rem] flex-1"><label htmlFor="daw-section-destination" className="text-xs font-black uppercase tracking-[.2em] text-sky-200">Where do you want to work?</label><select id="daw-section-destination" className="mt-1 w-full rounded-xl border border-white/25 bg-black px-3 py-2 text-base font-bold text-white" value={destination} onChange={(event) => setDestination(parseTimelineDawStudioFocusArea(event.target.value) ?? "transport")}><optgroup label="Make music">{musicianAreas.map((area) => <option key={area.id} value={area.id}>{area.label}</option>)}</optgroup><optgroup label="Advanced and owner tools">{advancedAreas.map((area) => <option key={area.id} value={area.id}>{area.label}</option>)}</optgroup></select></div><button type="button" className={button} onClick={() => goTo(destination)}>Go to this section</button>{selected && selected.id !== destination ? <button type="button" className={button} onClick={() => goTo(selected.id)}>Return to {selected.label}</button> : null}</div><p className="mt-2 text-sm text-white/70">{chosen?.help ?? "Choose a Studio section."}</p></aside>;
}

function openWorkspacePanel(target: HTMLElement) {
  const disclosure = target.closest<HTMLDetailsElement>("details[data-daw-workspace-panel]");
  if (!disclosure) return;
  document.querySelectorAll<HTMLDetailsElement>("details[data-daw-workspace-panel]").forEach((panel) => {
    panel.open = panel === disclosure;
  });
}
