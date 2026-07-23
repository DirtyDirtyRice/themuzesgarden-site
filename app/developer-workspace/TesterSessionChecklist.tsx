"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "developer-workspace-tester-session-v1";

const steps = [
  { id: "readiness", label: "Confirm standalone readiness", detail: "All installation and project checks have been reviewed.", href: "#standalone-readiness" },
  { id: "project", label: "Select or create a project", detail: "The intended TypeScript project is active.", href: "#project-setup" },
  { id: "baseline", label: "Establish the project baseline", detail: "Symbols, relationships, TypeScript diagnostics, and health are recorded.", href: "#project-adoption" },
  { id: "watcher", label: "Start the live watcher", detail: "New code events can be captured while the developer works.", href: "#event-timeline" },
  { id: "verification", label: "Run verification", detail: "Build errors and ordered repair clusters have been inspected.", href: "#build-errors" },
  { id: "evidence", label: "Review prevented-error evidence", detail: "Held code, incomplete types, and AI drift evidence have been reviewed.", href: "#prevented-errors" },
  { id: "support", label: "Save a support report", detail: "A privacy-safe report is available if the session needs follow-up.", href: "/api/developer-workspace/support-report", download: true },
] as const;

type StepId = (typeof steps)[number]["id"];

function readStoredSteps(): StepId[] {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(value)) return [];
    const valid = new Set<StepId>(steps.map((step) => step.id));
    return value.filter((item): item is StepId => typeof item === "string" && valid.has(item as StepId));
  } catch {
    return [];
  }
}

export default function TesterSessionChecklist() {
  const [completed, setCompleted] = useState<StepId[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setCompleted(readStoredSteps());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(completed));
  }, [completed, loaded]);

  const completedSet = useMemo(() => new Set(completed), [completed]);
  const percent = Math.round((completed.length / steps.length) * 100);

  function toggle(id: StepId) {
    setCompleted((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  return (
    <section className="mx-4 mt-4 rounded-xl border border-emerald-300/25 bg-[#0b1720] p-5" aria-labelledby="tester-session-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.25em] text-emerald-300">Test session</div>
          <h2 id="tester-session-title" className="mt-1 text-2xl font-black">{completed.length}/{steps.length} steps complete</h2>
          <p className="mt-1 text-sm text-white/55">Progress is saved in this browser so a tester can leave and safely resume.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/developer-workspace/guide" className="rounded-lg border border-emerald-300/35 px-4 py-2 text-sm font-black text-emerald-100">Open guide</Link>
          <button type="button" onClick={() => setCompleted([])} disabled={completed.length === 0} className="rounded-lg border border-white/15 px-4 py-2 text-sm font-bold text-white/65 disabled:opacity-35">Reset</button>
        </div>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/40" aria-label={`${percent}% complete`}><div className="h-full bg-emerald-300 transition-[width]" style={{ width: `${percent}%` }} /></div>
      <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {steps.map((step) => {
          const checked = completedSet.has(step.id);
          const linkClass = "text-xs font-black text-cyan-200 hover:text-cyan-100";
          return (
            <article key={step.id} className={`rounded-lg border p-3 ${checked ? "border-emerald-300/30 bg-emerald-300/10" : "border-white/10 bg-black/20"}`}>
              <label className="flex cursor-pointer items-start gap-3">
                <input type="checkbox" checked={checked} onChange={() => toggle(step.id)} className="mt-1 h-4 w-4 accent-emerald-300" />
                <span><span className="block text-sm font-black">{step.label}</span><span className="mt-1 block text-xs leading-5 text-white/50">{step.detail}</span></span>
              </label>
              {"download" in step && step.download ? <a href={step.href} download className={`ml-7 mt-2 inline-block ${linkClass}`}>Download report</a> : <a href={step.href} className={`ml-7 mt-2 inline-block ${linkClass}`}>Go to section</a>}
            </article>
          );
        })}
      </div>
    </section>
  );
}
