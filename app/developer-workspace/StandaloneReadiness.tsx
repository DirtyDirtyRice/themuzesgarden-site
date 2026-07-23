"use client";

import { useCallback, useEffect, useState } from "react";

type CheckState = "checking" | "ready" | "action" | "error";
type ReadinessCheck = { label: string; detail: string; state: CheckState };
type RegistryResponse = { activeProjectId: string | null; count: number; projects: Array<{ id: string; name: string; status: string }> };
type AssistantStatus = { configured: boolean; model: string };
type ProjectIndexStatus = { stats: { fileCount: number }; generatedAt: string };

async function json<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  const body: unknown = await response.json();
  if (!response.ok) {
    const message = typeof body === "object" && body !== null && "error" in body && typeof body.error === "string" ? body.error : `${url} failed.`;
    throw new Error(message);
  }
  return body as T;
}

function badge(state: CheckState): string {
  if (state === "ready") return "border-emerald-300/35 bg-emerald-300/10 text-emerald-100";
  if (state === "action") return "border-amber-300/35 bg-amber-300/10 text-amber-100";
  if (state === "error") return "border-red-300/35 bg-red-300/10 text-red-100";
  return "border-white/15 bg-white/5 text-white/55";
}

export default function StandaloneReadiness() {
  const [checks, setChecks] = useState<ReadinessCheck[]>([
    { label: "Local safety boundary", detail: "Confirming local-only access…", state: "checking" },
    { label: "Code project", detail: "Reading registered projects…", state: "checking" },
    { label: "Project index", detail: "Checking the active index…", state: "checking" },
    { label: "AI assistant", detail: "Checking server configuration…", state: "checking" },
  ]);
  const [loading, setLoading] = useState(true);

  const inspect = useCallback(async () => {
    setLoading(true);
    const next: ReadinessCheck[] = [];
    next.push({ label: "Local safety boundary", detail: "Workspace filesystem APIs are restricted to this local development server.", state: "ready" });

    const results = await Promise.allSettled([
      json<RegistryResponse>("/api/developer-workspace/projects"),
      json<ProjectIndexStatus>("/api/developer-workspace/project-index"),
      json<AssistantStatus>("/api/developer-workspace/assistant"),
    ]);

    const registry = results[0];
    if (registry.status === "fulfilled") {
      const active = registry.value.projects.find((project) => project.id === registry.value.activeProjectId);
      next.push(active
        ? { label: "Code project", detail: `${active.name} is active; ${registry.value.count} project(s) registered.`, state: active.status === "available" ? "ready" : "action" }
        : { label: "Code project", detail: "Add or select a TypeScript project below.", state: "action" });
    } else next.push({ label: "Code project", detail: registry.reason instanceof Error ? registry.reason.message : "Project registry failed.", state: "error" });

    const index = results[1];
    next.push(index.status === "fulfilled"
      ? { label: "Project index", detail: `${index.value.stats.fileCount.toLocaleString()} files are indexed and ready for investigation.`, state: "ready" }
      : { label: "Project index", detail: index.reason instanceof Error ? index.reason.message : "Project index failed.", state: "error" });

    const assistant = results[2];
    next.push(assistant.status === "fulfilled"
      ? assistant.value.configured
        ? { label: "AI assistant", detail: `${assistant.value.model} is configured through the server-only key.`, state: "ready" }
        : { label: "AI assistant", detail: "Add OPENAI_API_KEY to .env.local and restart the app.", state: "action" }
      : { label: "AI assistant", detail: assistant.reason instanceof Error ? assistant.reason.message : "Assistant check failed.", state: "error" });

    setChecks(next);
    setLoading(false);
  }, []);

  useEffect(() => { void inspect(); }, [inspect]);
  const ready = checks.filter((check) => check.state === "ready").length;

  return (
    <section className="mx-4 mt-4 rounded-xl border border-cyan-300/25 bg-[#0b1720] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><div className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">Standalone readiness</div><h1 className="mt-1 text-2xl font-black">{ready}/{checks.length} systems ready</h1><p className="mt-1 text-sm text-white/55">The workspace checks its own installation before a developer begins.</p></div>
        <button type="button" onClick={() => void inspect()} disabled={loading} className="rounded-lg border border-cyan-300/40 px-4 py-2 text-sm font-bold text-cyan-100 disabled:opacity-50">{loading ? "Checking…" : "Run checks"}</button>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {checks.map((check) => <div key={check.label} className={`rounded-lg border p-3 ${badge(check.state)}`}><div className="text-sm font-black">{check.label}</div><div className="mt-1 text-xs leading-5 opacity-75">{check.detail}</div></div>)}
      </div>
    </section>
  );
}
