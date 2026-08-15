"use client";

import { useEffect, useMemo, useState } from "react";
import { TIMELINE_DAW_STUDIO_FOCUS_AREAS, parseTimelineDawStudioFocusArea, timelineDawStudioFocusStorageKey, type TimelineDawStudioFocusArea } from "@/lib/timeline/TimelineDawStudioFocusPolicy";

const button = "rounded-xl border border-white/20 bg-white px-3 py-2 text-sm font-black text-black";

export default function TimelineDawStudioFocusRestore({ sessionId }: { sessionId: string }) {
  const storageKey = useMemo(() => timelineDawStudioFocusStorageKey(sessionId), [sessionId]);
  const [saved, setSaved] = useState<TimelineDawStudioFocusArea | null>(null);

  useEffect(() => {
    const initial = parseTimelineDawStudioFocusArea(window.localStorage.getItem(storageKey));
    queueMicrotask(() => setSaved(initial));
    const elements = [...document.querySelectorAll<HTMLElement>("[data-daw-focus-area]")];
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];
      const area = parseTimelineDawStudioFocusArea((visible?.target as HTMLElement | undefined)?.dataset.dawFocusArea);
      if (area) {
        window.localStorage.setItem(storageKey, area);
        setSaved(area);
      }
    }, { rootMargin: "-20% 0px -55%", threshold: [0.1, 0.5] });
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [storageKey]);

  const selected = TIMELINE_DAW_STUDIO_FOCUS_AREAS.find((area) => area.id === saved) ?? null;
  function restore() {
    if (!saved) return;
    document.querySelector<HTMLElement>(`[data-daw-focus-area="${saved}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return <aside className="sticky top-2 z-30 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-300/30 bg-[#07111a]/95 p-3 shadow-xl backdrop-blur"><div><p className="text-xs font-black uppercase tracking-[.2em] text-sky-200">Studio focus</p><p className="text-sm text-white/60">{selected ? `Last area: ${selected.label}` : "Move through Studio to save your place."}</p></div>{selected ? <button type="button" className={button} onClick={restore}>Return to {selected.label}</button> : null}</aside>;
}
