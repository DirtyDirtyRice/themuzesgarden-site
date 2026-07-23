"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { TIMELINE_WORKSPACE } from "@/lib/timeline/TimelineSeed";
import type { TimelineWorkspace } from "@/lib/timeline/TimelineTypes";

type ProjectOption = { id: string; title: string };
type WorkflowStatus =
  | "blocked" | "queued" | "running" | "awaiting-review" | "completed"
  | "ready-to-apply" | "applied" | "failed" | "cancelled" | "reverted";
type WorkflowView = {
  id: string;
  projectId: string;
  status: WorkflowStatus;
  responseText: string | null;
  errors: string[];
  warnings: string[];
  createdAt: string;
  updatedAt: string;
};
type ProposalView = {
  id: string;
  kind: string;
  targetId: string | null;
  payload: Record<string, unknown>;
  status: string;
  reasons: string[];
};
type ChangeView = {
  entity: string;
  entityId: string;
  field: string;
  before: unknown;
  after: unknown;
};
type PlanView = {
  id: string;
  status: string;
  changes: ChangeView[];
  issues: Array<{ code: string; message: string }>;
};
type LedgerRow = {
  id: string;
  workflowId: string;
  status: WorkflowStatus;
  recordedAt: string;
  recordedBy: string;
  proposalCount: number;
  actionCount: number;
  receiptId: string | null;
  cost: { estimatedTotalCost?: number } | null;
};

function projectWorkspace(projectId: string): TimelineWorkspace {
  const workspace = structuredClone(TIMELINE_WORKSPACE);
  workspace.projectId = projectId;
  workspace.events = workspace.events.map((event) => ({
    ...event,
    projectId,
  }));
  return workspace;
}

function display(value: unknown): string {
  if (value === undefined) return "undefined";
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

function statusStyle(status: string): string {
  if (["applied", "completed", "reverted"].includes(status)) {
    return "border-emerald-400/50 bg-emerald-400/10 text-emerald-100";
  }
  if (["blocked", "failed", "cancelled"].includes(status)) {
    return "border-rose-400/50 bg-rose-400/10 text-rose-100";
  }
  if (["awaiting-review", "ready-to-apply"].includes(status)) {
    return "border-amber-300/50 bg-amber-300/10 text-amber-50";
  }
  return "border-sky-300/50 bg-sky-300/10 text-sky-100";
}

export default function TimelineAIWorkspace() {
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [projectId, setProjectId] = useState("");
  const [instruction, setInstruction] = useState(
    "Review the selected Timeline context and recommend only changes that improve clarity without removing creative history."
  );
  const [workflow, setWorkflow] = useState<WorkflowView | null>(null);
  const [proposals, setProposals] = useState<ProposalView[]>([]);
  const [plan, setPlan] = useState<PlanView | null>(null);
  const [workspace, setWorkspace] = useState<TimelineWorkspace | null>(null);
  const [history, setHistory] = useState<LedgerRow[]>([]);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === projectId) ?? null,
    [projectId, projects]
  );

  const accessToken = useCallback(async () => {
    const { data, error } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (error || !token) throw new Error("Sign in before using Timeline AI.");
    return token;
  }, []);

  const api = useCallback(async (body: Record<string, unknown>) => {
    const token = await accessToken();
    const response = await fetch("/api/timeline/workflows", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Timeline AI request failed.");
    return result;
  }, [accessToken]);

  const refreshHistory = useCallback(async (targetProjectId = projectId) => {
    if (!targetProjectId) return;
    const token = await accessToken();
    const response = await fetch(
      `/api/timeline/workflows?projectId=${encodeURIComponent(targetProjectId)}`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
    );
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Workflow history failed.");
    setHistory(result.records ?? []);
  }, [accessToken, projectId]);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const { data: auth, error: authError } = await supabase.auth.getUser();
        if (authError || !auth.user) throw new Error("Sign in to load your projects.");
        const { data, error } = await supabase
          .from("projects")
          .select("id, title")
          .eq("owner_id", auth.user.id)
          .order("updated_at", { ascending: false });
        if (error) throw error;
        if (!active) return;
        const options = (data ?? []).map((row) => ({
          id: String(row.id),
          title: String(row.title || "Untitled project"),
        }));
        setProjects(options);
        if (options[0]) setProjectId(options[0].id);
      } catch (error) {
        if (active) setMessage(error instanceof Error ? error.message : "Projects failed.");
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!projectId) return;
    setWorkspace(projectWorkspace(projectId));
    setWorkflow(null);
    setProposals([]);
    setPlan(null);
    void refreshHistory(projectId).catch((error) =>
      setMessage(error instanceof Error ? error.message : "History failed.")
    );
  }, [projectId, refreshHistory]);

  async function run(label: string, operation: () => Promise<void>) {
    setBusy(label);
    setMessage("");
    try {
      await operation();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Timeline AI action failed.");
    } finally {
      setBusy("");
    }
  }

  async function startWorkflow() {
    if (!workspace) throw new Error("Choose a project first.");
    const response = await api({
      action: "start",
      instruction,
      workspace,
      eventIds: workspace.selection.selectedEventIds,
    });
    setWorkflow(response.result);
    setProposals([]);
    setPlan(null);
    setMessage("Workflow created. Run AI when you are ready.");
    await refreshHistory();
  }

  async function act(action: string, extra: Record<string, unknown> = {}) {
    if (!workflow) throw new Error("Start a workflow first.");
    const response = await api({ action, workflowId: workflow.id, ...extra });
    const result = response.result;
    const nextWorkflow = result.workflow ?? result;
    setWorkflow(nextWorkflow);
    if (result.proposals) setProposals(result.proposals);
    if ("actionPlan" in result) setPlan(result.actionPlan);
    if (result.workspace) setWorkspace(result.workspace);
    await refreshHistory();
  }

  const canStart = Boolean(projectId && workspace && instruction.trim() && !busy);

  return (
    <main className="min-h-screen bg-[#05070a] px-4 py-8 text-white md:px-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="rounded-3xl border border-white/15 bg-gradient-to-br from-sky-400/15 via-black to-emerald-400/10 p-6 md:p-9">
          <div className="text-xs font-black uppercase tracking-[0.3em] text-sky-200">
            The Muzes Garden · AI Workspace
          </div>
          <h1 className="mt-3 text-4xl font-black md:text-6xl">Timeline AI Control Room</h1>
          <p className="mt-4 max-w-4xl text-base leading-7 text-white/70">
            AI can analyze and propose. Nothing changes until proposals pass validation,
            you review the exact differences, and you approve the atomic application.
          </p>
          <div className="mt-6 flex flex-wrap gap-2 text-xs font-bold">
            {["Server-authenticated", "Project-owner only", "Held proposals", "Reversible", "Ledger recorded"].map((item) => (
              <span key={item} className="rounded-full border border-white/20 bg-black/35 px-3 py-2">{item}</span>
            ))}
          </div>
        </header>

        {message ? (
          <div className="mt-5 rounded-2xl border border-amber-300/40 bg-amber-300/10 p-4 text-amber-50">
            {message}
          </div>
        ) : null}

        <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-3xl border border-white/15 bg-white/[0.035] p-6">
            <h2 className="text-2xl font-black">1. Choose context and ask</h2>
            <label className="mt-5 block text-sm font-bold text-white/75">Owned project</label>
            <select
              value={projectId}
              onChange={(event) => setProjectId(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/20 bg-black p-3 text-white"
            >
              <option value="">Choose a project…</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>{project.title}</option>
              ))}
            </select>
            <label className="mt-5 block text-sm font-bold text-white/75">Instruction</label>
            <textarea
              value={instruction}
              onChange={(event) => setInstruction(event.target.value)}
              maxLength={4000}
              rows={7}
              className="mt-2 w-full rounded-xl border border-white/20 bg-black p-4 leading-6 text-white"
            />
            <div className="mt-2 flex justify-between text-xs text-white/45">
              <span>Context: {workspace?.events.length ?? 0} events · {workspace?.tracks.length ?? 0} tracks</span>
              <span>{instruction.length}/4,000</span>
            </div>
            <button
              disabled={!canStart}
              onClick={() => void run("start", startWorkflow)}
              className="mt-5 w-full rounded-xl bg-white px-5 py-3 font-black text-black disabled:cursor-not-allowed disabled:opacity-35"
            >
              {busy === "start" ? "Creating…" : "Create held AI workflow"}
            </button>
            <p className="mt-4 text-xs leading-5 text-white/45">
              Current context is supplied by the Timeline engine workspace and bound to
              the selected owned project. The server ignores browser-supplied identity,
              model, and API credentials.
            </p>
          </section>

          <section className="rounded-3xl border border-white/15 bg-white/[0.035] p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-black">2. Workflow review</h2>
              {workflow ? (
                <span className={`rounded-full border px-3 py-2 text-xs font-black uppercase ${statusStyle(workflow.status)}`}>
                  {workflow.status.replaceAll("-", " ")}
                </span>
              ) : null}
            </div>
            {!workflow ? (
              <div className="mt-8 rounded-2xl border border-dashed border-white/20 p-8 text-center text-white/45">
                Create a workflow to begin. AI will not run automatically.
              </div>
            ) : (
              <>
                <div className="mt-5 rounded-2xl border border-white/10 bg-black/45 p-4 text-sm">
                  <div className="font-mono text-xs text-white/45">{workflow.id}</div>
                  {workflow.responseText ? (
                    <p className="mt-3 whitespace-pre-wrap leading-6">{workflow.responseText}</p>
                  ) : null}
                  {workflow.errors.map((error) => (
                    <div key={error} className="mt-2 text-rose-200">Blocked: {error}</div>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  {workflow.status === "queued" ? (
                    <button onClick={() => void run("execute", () => act("execute"))} disabled={Boolean(busy)} className="rounded-xl bg-sky-300 px-5 py-3 font-black text-black disabled:opacity-40">
                      {busy === "execute" ? "Analyzing…" : "Run AI analysis"}
                    </button>
                  ) : null}
                  {workflow.status === "awaiting-review" ? (
                    <>
                      <button onClick={() => void run("approve", () => act("approve"))} disabled={Boolean(busy)} className="rounded-xl bg-emerald-300 px-5 py-3 font-black text-black disabled:opacity-40">Approve proposals</button>
                      <button onClick={() => void run("reject", () => act("reject", { reason: "Rejected in Timeline AI review." }))} disabled={Boolean(busy)} className="rounded-xl border border-rose-300 px-5 py-3 font-black text-rose-100 disabled:opacity-40">Reject proposals</button>
                    </>
                  ) : null}
                  {workflow.status === "ready-to-apply" ? (
                    <button onClick={() => void run("apply", () => act("apply", { workspace }))} disabled={Boolean(busy)} className="rounded-xl bg-amber-300 px-5 py-3 font-black text-black disabled:opacity-40">Apply reviewed changes</button>
                  ) : null}
                  {workflow.status === "applied" ? (
                    <button onClick={() => void run("revert", () => act("revert"))} disabled={Boolean(busy)} className="rounded-xl border border-white/30 px-5 py-3 font-black disabled:opacity-40">Revert exact changes</button>
                  ) : null}
                </div>
              </>
            )}

            {proposals.length ? (
              <div className="mt-6">
                <h3 className="font-black">Held proposals ({proposals.length})</h3>
                <div className="mt-3 space-y-3">
                  {proposals.map((proposal) => (
                    <details key={proposal.id} className="rounded-xl border border-amber-300/25 bg-amber-300/5 p-4" open>
                      <summary className="cursor-pointer font-bold">
                        {proposal.kind} · {proposal.targetId ?? "no target"} · {proposal.status}
                      </summary>
                      <pre className="mt-3 overflow-auto whitespace-pre-wrap text-xs text-white/65">{display(proposal.payload)}</pre>
                      {proposal.reasons.map((reason) => <div key={reason} className="mt-2 text-sm text-rose-200">{reason}</div>)}
                    </details>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        </div>

        <section className="mt-6 rounded-3xl border border-white/15 bg-white/[0.035] p-6">
          <h2 className="text-2xl font-black">3. Exact change preview</h2>
          {!plan ? <p className="mt-4 text-white/45">No action preview yet.</p> : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="text-xs uppercase text-white/45">
                  <tr><th className="p-3">Target</th><th className="p-3">Field</th><th className="p-3">Before</th><th className="p-3">After</th></tr>
                </thead>
                <tbody>
                  {plan.changes.map((change, index) => (
                    <tr key={`${change.entityId}-${change.field}-${index}`} className="border-t border-white/10 align-top">
                      <td className="p-3 font-mono text-xs">{change.entity}:{change.entityId}</td>
                      <td className="p-3 font-bold">{change.field}</td>
                      <td className="max-w-sm whitespace-pre-wrap p-3 text-rose-100/80">{display(change.before)}</td>
                      <td className="max-w-sm whitespace-pre-wrap p-3 text-emerald-100/80">{display(change.after)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {plan.issues.map((issue) => <div key={`${issue.code}-${issue.message}`} className="mt-3 text-rose-200">{issue.code}: {issue.message}</div>)}
            </div>
          )}
        </section>

        <section className="mt-6 rounded-3xl border border-white/15 bg-white/[0.035] p-6">
          <div className="flex items-center justify-between gap-3">
            <div><h2 className="text-2xl font-black">Workflow ledger</h2><p className="mt-1 text-sm text-white/50">{selectedProject?.title ?? "Choose a project"} · restart-safe history</p></div>
            <button onClick={() => void run("history", () => refreshHistory())} disabled={!projectId || Boolean(busy)} className="rounded-xl border border-white/25 px-4 py-2 text-sm font-bold disabled:opacity-40">Refresh</button>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {history.slice().reverse().slice(0, 20).map((row) => (
              <div key={row.id} className="rounded-xl border border-white/10 bg-black/45 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase ${statusStyle(row.status)}`}>{row.status}</span>
                  <span className="text-xs text-white/45">{new Date(row.recordedAt).toLocaleString()}</span>
                </div>
                <div className="mt-3 font-mono text-xs text-white/60">{row.workflowId}</div>
                <div className="mt-2 text-xs text-white/45">Actor: {row.recordedBy} · Proposals: {row.proposalCount} · Changes: {row.actionCount} · Cost: ${(row.cost?.estimatedTotalCost ?? 0).toFixed(6)}</div>
              </div>
            ))}
            {!history.length ? <p className="text-white/45">No recorded workflows for this project yet.</p> : null}
          </div>
        </section>
      </div>
    </main>
  );
}
