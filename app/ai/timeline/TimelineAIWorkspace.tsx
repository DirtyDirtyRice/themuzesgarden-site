"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { TimelineWorkspace } from "@/lib/timeline/TimelineTypes";

type ProjectOption = { id: string; title: string };
type WorkflowStatus =
  | "blocked"
  | "queued"
  | "running"
  | "awaiting-review"
  | "completed"
  | "ready-to-apply"
  | "applied"
  | "failed"
  | "cancelled"
  | "reverted";
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
type LifecycleState =
  "draft" | "incomplete" | "waiting-validation" | "validated" | "active";
type HeldDraft = {
  id: string;
  lifecycle: LifecycleState;
  originEventId?: string;
  event: {
    id: string;
    trackId: string;
    type: string;
    title: string;
    content?: string;
    source?: string;
    aiGenerated?: boolean;
    aiModel?: string;
  };
  validationAttempts: Array<{
    id: string;
    at: string;
    accepted: boolean;
    issues: Array<{ id: string; code: string; message: string; path: string }>;
  }>;
  transitions: Array<{
    id: string;
    from: LifecycleState | null;
    to: LifecycleState;
    at: string;
    reason: string;
  }>;
};
type EvidenceRecord = {
  id: string;
  draftId: string;
  eventId: string;
  originEventId?: string;
  action: "begin-edit" | "validation" | "activation" | "ai-intake";
  outcome: "prevented" | "validated" | "activated" | "edit-held";
  lifecycle: string;
  recordedAt: string;
  recordedBy: string;
  issues: Array<{ code: string; message: string; path?: string }>;
};
type DependencyView = {
  id: string;
  projectId: string;
  dependentEventId: string;
  requiredEventId: string;
  createdAt: string;
  createdBy: string;
};
type DependencyPlanView = {
  ready: boolean;
  requestedDraftIds: string[];
  includedDraftIds: string[];
  activationOrder: string[];
  issues: Array<{
    code: string;
    message: string;
    eventId?: string;
    requiredEventId?: string;
  }>;
  generatedAt: string;
};
type DependencyImpactView = {
  safeToChange: boolean;
  affectedDraftIds: string[];
  affectedEventIds: string[];
  paths: Array<{
    draftId: string;
    eventId: string;
    title: string;
    distance: number;
    path: string[];
  }>;
  generatedAt: string;
};
type HoldingView = {
  generatedAt: string;
  drafts: HeldDraft[];
  heldCount: number;
  validationAttemptCount: number;
  preventedActivationCount: number;
  evidence: EvidenceRecord[];
  evidenceCount: number;
  successfulActivationCount: number;
  dependencies: DependencyView[];
};
type DraftEdit = {
  title: string;
  content: string;
  type: string;
  trackId: string;
};

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
    "Review the selected Timeline context and recommend only changes that improve clarity without removing creative history.",
  );
  const [workflow, setWorkflow] = useState<WorkflowView | null>(null);
  const [proposals, setProposals] = useState<ProposalView[]>([]);
  const [plan, setPlan] = useState<PlanView | null>(null);
  const [workspace, setWorkspace] = useState<TimelineWorkspace | null>(null);
  const [history, setHistory] = useState<LedgerRow[]>([]);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [holding, setHolding] = useState<HoldingView | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [draftType, setDraftType] = useState("note");
  const [eventSearch, setEventSearch] = useState("");
  const [draftEdits, setDraftEdits] = useState<Record<string, DraftEdit>>({});
  const [dependencyChoices, setDependencyChoices] = useState<
    Record<string, string>
  >({});
  const [dependencyPlans, setDependencyPlans] = useState<
    Record<string, DependencyPlanView>
  >({});
  const [dependencyImpacts, setDependencyImpacts] = useState<
    Record<string, DependencyImpactView>
  >({});

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === projectId) ?? null,
    [projectId, projects],
  );

  const accessToken = useCallback(async () => {
    const { data, error } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (error || !token) throw new Error("Sign in before using Timeline AI.");
    return token;
  }, []);

  const api = useCallback(
    async (body: Record<string, unknown>) => {
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
      if (!response.ok)
        throw new Error(
          result.error ||
            result.result?.issues?.[0]?.message ||
            "Timeline AI request failed.",
        );
      return result;
    },
    [accessToken],
  );

  const refreshHistory = useCallback(
    async (targetProjectId = projectId) => {
      if (!targetProjectId) return;
      const token = await accessToken();
      const response = await fetch(
        `/api/timeline/workflows?projectId=${encodeURIComponent(targetProjectId)}`,
        { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
      );
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Workflow history failed.");
      setHistory(result.records ?? []);
      if (result.workspace?.workspace) setWorkspace(result.workspace.workspace);
      if (result.holding) {
        setHolding(result.holding);
        setDraftEdits((current) => {
          const next = { ...current };
          for (const draft of result.holding.drafts as HeldDraft[]) {
            if (!next[draft.id]) {
              next[draft.id] = {
                title: draft.event.title,
                content: draft.event.content ?? "",
                type: draft.event.type,
                trackId: draft.event.trackId,
              };
            }
          }
          return next;
        });
      }
    },
    [accessToken, projectId],
  );

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const { data: auth, error: authError } = await supabase.auth.getUser();
        if (authError || !auth.user)
          throw new Error("Sign in to load your projects.");
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
        if (active)
          setMessage(
            error instanceof Error ? error.message : "Projects failed.",
          );
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!projectId) return;
    setWorkspace(null);
    setWorkflow(null);
    setProposals([]);
    setPlan(null);
    setHolding(null);
    void refreshHistory(projectId).catch((error) =>
      setMessage(error instanceof Error ? error.message : "History failed."),
    );
  }, [projectId, refreshHistory]);

  async function run(label: string, operation: () => Promise<void>) {
    setBusy(label);
    setMessage("");
    try {
      await operation();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Timeline AI action failed.",
      );
    } finally {
      setBusy("");
    }
  }

  async function startWorkflow() {
    if (!workspace) throw new Error("Choose a project first.");
    const response = await api({
      action: "start",
      instruction,
      projectId,
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
    if (response.workspaceRecord?.workspace)
      setWorkspace(response.workspaceRecord.workspace);
    if (response.holding) setHolding(response.holding);
    if (response.intakeResults?.length) {
      const accepted = response.intakeResults.filter(
        (item: { acceptedForReview: boolean }) => item.acceptedForReview,
      ).length;
      setMessage(
        `${response.intakeResults.length} AI event proposal(s) routed to holding: ${accepted} validated, ${response.intakeResults.length - accepted} incomplete. Nothing was activated.`,
      );
    }
    await refreshHistory();
  }

  async function eventLifecycleAction(
    action: string,
    extra: Record<string, unknown> = {},
  ) {
    if (!projectId || !workspace) throw new Error("Choose a project first.");
    const response = await api({ action, projectId, ...extra });
    if (response.holding) setHolding(response.holding);
    if (response.workspaceRecord?.workspace) {
      setWorkspace(response.workspaceRecord.workspace);
    }
    return response;
  }

  async function createEventDraft() {
    if (!draftTitle.trim() && !draftContent.trim()) {
      throw new Error(
        "Enter a title or content. Incomplete drafts are allowed, but an empty card is not useful.",
      );
    }
    await eventLifecycleAction("create-event-draft", {
      patch: {
        type: draftType,
        title: draftTitle,
        content: draftContent,
        trackId: workspace?.tracks[0]?.id,
      },
    });
    setDraftTitle("");
    setDraftContent("");
    setMessage("Draft created in the holding bin. It is not live yet.");
    await refreshHistory();
  }

  async function beginEventEdit(eventId: string) {
    await eventLifecycleAction("begin-event-edit", { eventId });
    setMessage(
      "A safe edit copy is now in the holding bin. The live event is unchanged.",
    );
    await refreshHistory();
  }
  async function saveEventDraft(draft: HeldDraft) {
    const edit = draftEdits[draft.id];
    if (!edit) return;
    await eventLifecycleAction("update-event-draft", {
      draftId: draft.id,
      patch: edit,
    });
    setMessage("Draft saved. Any earlier validation was cleared.");
    await refreshHistory();
  }

  async function validateEventDraft(draftId: string) {
    const response = await eventLifecycleAction("validate-event-draft", {
      draftId,
    });
    const result = response.result;
    setMessage(
      result.accepted
        ? "Validation passed. The event is ready for explicit activation."
        : "Validation blocked activation. The missing pieces are recorded below.",
    );
    await refreshHistory();
  }

  async function activateEventDraft(draftId: string) {
    await eventLifecycleAction("activate-event-draft", { draftId });
    setMessage(
      "Event and every validated requirement activated atomically in dependency order.",
    );
    await refreshHistory();
  }

  async function addEventDependency(draft: HeldDraft) {
    const requiredEventId = dependencyChoices[draft.id];
    if (!requiredEventId) throw new Error("Choose a required event first.");
    await eventLifecycleAction("add-event-dependency", {
      dependentEventId: draft.event.id,
      requiredEventId,
    });
    setDependencyChoices((current) => ({ ...current, [draft.id]: "" }));
    setDependencyPlans({});
    setMessage(
      "Requirement saved. Activation now waits for this event and cannot bypass it.",
    );
  }

  async function removeEventDependency(dependencyId: string) {
    await eventLifecycleAction("remove-event-dependency", { dependencyId });
    setDependencyPlans({});
    setMessage("Event requirement removed.");
  }

  async function previewDependencyPlan(draftId: string) {
    const response = await eventLifecycleAction("plan-event-dependencies", {
      draftId,
    });
    setDependencyPlans((current) => ({
      ...current,
      [draftId]: response.plan,
    }));
    setMessage(
      response.plan.ready
        ? "Readiness check passed. The complete activation order is shown below."
        : "Readiness check found blockers. Nothing was activated.",
    );
  }
  async function inspectEventImpact(eventId: string) {
    const response = await eventLifecycleAction(
      "inspect-event-dependency-impact",
      { eventId },
    );
    setDependencyImpacts((current) => ({
      ...current,
      [eventId]: response.impact,
    }));
    setMessage(
      response.impact.safeToChange
        ? "No held events currently depend on this live event."
        : `${response.impact.affectedDraftIds.length} held event(s) depend on this live event. Review the chain before editing, archiving, or replacing it.`,
    );
  }

  const canStart = Boolean(
    projectId && workspace && instruction.trim() && !busy,
  );

  return (
    <main className="min-h-screen bg-[#05070a] px-4 py-8 text-white md:px-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="rounded-3xl border border-white/15 bg-gradient-to-br from-sky-400/15 via-black to-emerald-400/10 p-6 md:p-9">
          <div className="text-xs font-black uppercase tracking-[0.3em] text-sky-200">
            The Muzes Garden · AI Workspace
          </div>
          <h1 className="mt-3 text-4xl font-black md:text-6xl">
            Timeline AI Control Room
          </h1>
          <p className="mt-4 max-w-4xl text-base leading-7 text-white/70">
            AI can analyze and propose. Nothing changes until proposals pass
            validation, you review the exact differences, and you approve the
            atomic application.
          </p>
          <div className="mt-6 flex flex-wrap gap-2 text-xs font-bold">
            {[
              "Server-authenticated",
              "Project-owner only",
              "Held proposals",
              "Reversible",
              "Ledger recorded",
            ].map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/20 bg-black/35 px-3 py-2"
              >
                {item}
              </span>
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
            <label className="mt-5 block text-sm font-bold text-white/75">
              Owned project
            </label>
            <select
              value={projectId}
              onChange={(event) => setProjectId(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/20 bg-black p-3 text-white"
            >
              <option value="">Choose a project…</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
            <label className="mt-5 block text-sm font-bold text-white/75">
              Instruction
            </label>
            <textarea
              value={instruction}
              onChange={(event) => setInstruction(event.target.value)}
              maxLength={4000}
              rows={7}
              className="mt-2 w-full rounded-xl border border-white/20 bg-black p-4 leading-6 text-white"
            />
            <div className="mt-2 flex justify-between text-xs text-white/45">
              <span>
                Context: {workspace?.events.length ?? 0} events ·{" "}
                {workspace?.tracks.length ?? 0} tracks
              </span>
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
              Context is loaded from the selected project persistent Timeline
              workspace. Every apply creates a new protected revision. The
              server ignores browser-supplied identity, model, and API
              credentials.
            </p>
          </section>

          <section className="rounded-3xl border border-white/15 bg-white/[0.035] p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-black">2. Workflow review</h2>
              {workflow ? (
                <span
                  className={`rounded-full border px-3 py-2 text-xs font-black uppercase ${statusStyle(workflow.status)}`}
                >
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
                  <div className="font-mono text-xs text-white/45">
                    {workflow.id}
                  </div>
                  {workflow.responseText ? (
                    <p className="mt-3 whitespace-pre-wrap leading-6">
                      {workflow.responseText}
                    </p>
                  ) : null}
                  {workflow.errors.map((error) => (
                    <div key={error} className="mt-2 text-rose-200">
                      Blocked: {error}
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  {workflow.status === "queued" ? (
                    <button
                      onClick={() => void run("execute", () => act("execute"))}
                      disabled={Boolean(busy)}
                      className="rounded-xl bg-sky-300 px-5 py-3 font-black text-black disabled:opacity-40"
                    >
                      {busy === "execute" ? "Analyzing…" : "Run AI analysis"}
                    </button>
                  ) : null}
                  {workflow.status === "awaiting-review" ? (
                    <>
                      <button
                        onClick={() =>
                          void run("approve", () => act("approve"))
                        }
                        disabled={Boolean(busy)}
                        className="rounded-xl bg-emerald-300 px-5 py-3 font-black text-black disabled:opacity-40"
                      >
                        Approve proposals
                      </button>
                      <button
                        onClick={() =>
                          void run("reject", () =>
                            act("reject", {
                              reason: "Rejected in Timeline AI review.",
                            }),
                          )
                        }
                        disabled={Boolean(busy)}
                        className="rounded-xl border border-rose-300 px-5 py-3 font-black text-rose-100 disabled:opacity-40"
                      >
                        Reject proposals
                      </button>
                    </>
                  ) : null}
                  {workflow.status === "ready-to-apply" ? (
                    <button
                      onClick={() => void run("apply", () => act("apply"))}
                      disabled={Boolean(busy)}
                      className="rounded-xl bg-amber-300 px-5 py-3 font-black text-black disabled:opacity-40"
                    >
                      Apply reviewed changes
                    </button>
                  ) : null}
                  {workflow.status === "applied" ? (
                    <button
                      onClick={() => void run("revert", () => act("revert"))}
                      disabled={Boolean(busy)}
                      className="rounded-xl border border-white/30 px-5 py-3 font-black disabled:opacity-40"
                    >
                      Revert exact changes
                    </button>
                  ) : null}
                </div>
              </>
            )}

            {proposals.length ? (
              <div className="mt-6">
                <h3 className="font-black">
                  Held proposals ({proposals.length})
                </h3>
                <div className="mt-3 space-y-3">
                  {proposals.map((proposal) => (
                    <details
                      key={proposal.id}
                      className="rounded-xl border border-amber-300/25 bg-amber-300/5 p-4"
                      open
                    >
                      <summary className="cursor-pointer font-bold">
                        {proposal.kind} · {proposal.targetId ?? "no target"} ·{" "}
                        {proposal.status}
                      </summary>
                      <pre className="mt-3 overflow-auto whitespace-pre-wrap text-xs text-white/65">
                        {display(proposal.payload)}
                      </pre>
                      {proposal.reasons.map((reason) => (
                        <div
                          key={reason}
                          className="mt-2 text-sm text-rose-200"
                        >
                          {reason}
                        </div>
                      ))}
                    </details>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        </div>

        <section className="mt-6 rounded-3xl border border-cyan-300/25 bg-cyan-300/[0.035] p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.25em] text-cyan-200">
                Draft / Activation Engine
              </div>
              <h2 className="mt-2 text-2xl font-black">Event Holding Bin</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/60">
                Drafts exist and retain their history, but they cannot affect
                the live Timeline until every required part passes validation
                and you press Activate.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center text-xs sm:grid-cols-4">
              <div className="rounded-xl border border-white/15 bg-black/40 p-3">
                <div className="text-xl font-black">
                  {holding?.heldCount ?? 0}
                </div>
                <div className="text-white/45">Held</div>
              </div>
              <div className="rounded-xl border border-white/15 bg-black/40 p-3">
                <div className="text-xl font-black">
                  {holding?.validationAttemptCount ?? 0}
                </div>
                <div className="text-white/45">Checks</div>
              </div>
              <div className="rounded-xl border border-rose-300/25 bg-rose-300/5 p-3">
                <div className="text-xl font-black">
                  {holding?.preventedActivationCount ?? 0}
                </div>
                <div className="text-white/45">Prevented</div>
              </div>{" "}
              <div className="rounded-xl border border-emerald-300/25 bg-emerald-300/5 p-3">
                <div className="text-xl font-black">
                  {holding?.successfulActivationCount ?? 0}
                </div>
                <div className="text-white/45">Activated</div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 rounded-2xl border border-white/10 bg-black/40 p-4 lg:grid-cols-[160px_1fr_1.5fr_auto]">
            <select
              value={draftType}
              onChange={(event) => setDraftType(event.target.value)}
              className="rounded-xl border border-white/20 bg-black px-3 py-3 text-white"
            >
              {[
                "note",
                "lyric",
                "marker",
                "idea",
                "comment",
                "task",
                "prompt",
                "response",
                "analysis",
              ].map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <input
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
              placeholder="Event title"
              className="rounded-xl border border-white/20 bg-black px-4 py-3 text-white"
            />
            <input
              value={draftContent}
              onChange={(event) => setDraftContent(event.target.value)}
              placeholder="Event content (can be completed later)"
              className="rounded-xl border border-white/20 bg-black px-4 py-3 text-white"
            />
            <button
              onClick={() => void run("create-event", createEventDraft)}
              disabled={!workspace || Boolean(busy)}
              className="rounded-xl bg-cyan-200 px-5 py-3 font-black text-black disabled:opacity-35"
            >
              {busy === "create-event" ? "Creating..." : "Create Draft"}
            </button>
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-black">Live Timeline Events</h3>
                <p className="mt-1 text-xs text-white/45">
                  Choose Edit Safely to create a held copy. The live original
                  stays untouched.
                </p>
              </div>
              <input
                value={eventSearch}
                onChange={(event) => setEventSearch(event.target.value)}
                placeholder="Search live events..."
                className="rounded-xl border border-white/15 bg-black px-4 py-2 text-sm text-white"
              />
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {(workspace?.events ?? [])
                .filter((event) => {
                  const query = eventSearch.trim().toLowerCase();
                  return (
                    !query ||
                    `${event.title} ${event.content ?? ""} ${event.type}`
                      .toLowerCase()
                      .includes(query)
                  );
                })
                .slice(0, 24)
                .map((event) => {
                  const alreadyHeld = (holding?.drafts ?? []).some(
                    (draft) => draft.originEventId === event.id,
                  );
                  const impact = dependencyImpacts[event.id];
                  return (
                    <div
                      key={event.id}
                      className="rounded-xl border border-white/10 bg-black/45 p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate font-bold">
                            {event.title || "Untitled event"}
                          </div>
                          <div className="mt-1 text-xs text-white/40">
                            {event.type} · {event.status} · {event.id}
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-2">
                          <button
                            onClick={() =>
                              void run(`impact-${event.id}`, () =>
                                inspectEventImpact(event.id),
                              )
                            }
                            disabled={Boolean(busy)}
                            className="rounded-lg border border-amber-200/40 px-3 py-2 text-xs font-black text-amber-100 disabled:opacity-30"
                          >
                            Check Impact
                          </button>
                          <button
                            onClick={() =>
                              void run(`edit-${event.id}`, () =>
                                beginEventEdit(event.id),
                              )
                            }
                            disabled={
                              event.locked || alreadyHeld || Boolean(busy)
                            }
                            className="rounded-lg border border-cyan-200/40 px-3 py-2 text-xs font-black text-cyan-100 disabled:opacity-30"
                          >
                            {event.locked
                              ? "Locked"
                              : alreadyHeld
                                ? "Edit Held"
                                : "Edit Safely"}
                          </button>
                        </div>
                      </div>
                      {impact ? (
                        <div
                          className={`mt-3 rounded-lg border p-3 text-xs ${
                            impact.safeToChange
                              ? "border-emerald-300/25 bg-emerald-300/5"
                              : "border-amber-300/30 bg-amber-300/5"
                          }`}
                        >
                          <div className="font-black">
                            {impact.safeToChange
                              ? "No downstream held events"
                              : `${impact.affectedDraftIds.length} downstream held event(s)`}
                          </div>
                          {impact.paths.map((path) => (
                            <div
                              key={path.draftId}
                              className="mt-2 text-white/65"
                            >
                              Level {path.distance}:{" "}
                              {path.title || path.eventId}
                              <div className="mt-1 font-mono text-[10px] text-white/35">
                                {path.path.join(" → ")}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              {!workspace?.events.length ? (
                <div className="text-sm text-white/40">
                  No live events yet. Create and activate a draft first.
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {(holding?.drafts ?? []).map((draft) => {
              const edit = draftEdits[draft.id] ?? {
                title: draft.event.title,
                content: draft.event.content ?? "",
                type: draft.event.type,
                trackId: draft.event.trackId,
              };
              const lastAttempt = draft.validationAttempts.at(-1);
              const readiness = dependencyPlans[draft.id];
              const dependencies = (holding?.dependencies ?? []).filter(
                (item) => item.dependentEventId === draft.event.id,
              );
              const dependencyOptions = [
                ...(holding?.drafts ?? []).map((item) => ({
                  id: item.event.id,
                  label: `${item.event.title || item.event.id} (held)`,
                })),
                ...(workspace?.events ?? []).map((event) => ({
                  id: event.id,
                  label: `${event.title || event.id} (live)`,
                })),
              ].filter(
                (option, index, all) =>
                  option.id !== draft.event.id &&
                  all.findIndex((candidate) => candidate.id === option.id) ===
                    index,
              );
              return (
                <article
                  key={draft.id}
                  className="rounded-2xl border border-white/15 bg-black/45 p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-mono text-xs text-white/40">
                        {draft.id} / {draft.event.id}
                      </div>
                      <div className="mt-2 text-lg font-black">
                        {draft.event.title || "Untitled held event"}
                      </div>{" "}
                      {draft.event.aiGenerated ? (
                        <div className="mt-2 inline-flex rounded-full border border-violet-300/35 bg-violet-300/10 px-2 py-1 text-[10px] font-black uppercase text-violet-100">
                          AI held · {draft.event.aiModel || "model recorded"}
                        </div>
                      ) : null}
                    </div>
                    <span
                      className={`rounded-full border px-3 py-2 text-xs font-black uppercase ${statusStyle(draft.lifecycle)}`}
                    >
                      {draft.lifecycle.replaceAll("-", " ")}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-3 lg:grid-cols-[150px_1fr_1.5fr]">
                    <select
                      value={edit.type}
                      onChange={(event) =>
                        setDraftEdits((current) => ({
                          ...current,
                          [draft.id]: { ...edit, type: event.target.value },
                        }))
                      }
                      className="rounded-xl border border-white/15 bg-black px-3 py-2 text-white"
                    >
                      {[
                        "note",
                        "lyric",
                        "marker",
                        "idea",
                        "comment",
                        "task",
                        "prompt",
                        "response",
                        "analysis",
                      ].map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    <input
                      value={edit.title}
                      onChange={(event) =>
                        setDraftEdits((current) => ({
                          ...current,
                          [draft.id]: { ...edit, title: event.target.value },
                        }))
                      }
                      placeholder="Title required"
                      className="rounded-xl border border-white/15 bg-black px-3 py-2 text-white"
                    />
                    <input
                      value={edit.content}
                      onChange={(event) =>
                        setDraftEdits((current) => ({
                          ...current,
                          [draft.id]: { ...edit, content: event.target.value },
                        }))
                      }
                      placeholder="Usable content required"
                      className="rounded-xl border border-white/15 bg-black px-3 py-2 text-white"
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      onClick={() =>
                        void run(`save-${draft.id}`, () =>
                          saveEventDraft(draft),
                        )
                      }
                      disabled={Boolean(busy)}
                      className="rounded-xl border border-white/25 px-4 py-2 text-sm font-black disabled:opacity-35"
                    >
                      Save Draft
                    </button>
                    <button
                      onClick={() =>
                        void run(`validate-${draft.id}`, () =>
                          validateEventDraft(draft.id),
                        )
                      }
                      disabled={Boolean(busy)}
                      className="rounded-xl bg-amber-200 px-4 py-2 text-sm font-black text-black disabled:opacity-35"
                    >
                      Validate
                    </button>
                    <button
                      onClick={() =>
                        void run(`plan-${draft.id}`, () =>
                          previewDependencyPlan(draft.id),
                        )
                      }
                      disabled={Boolean(busy)}
                      className="rounded-xl border border-sky-200/40 px-4 py-2 text-sm font-black text-sky-100 disabled:opacity-35"
                    >
                      Check Readiness
                    </button>
                    <button
                      onClick={() =>
                        void run(`activate-${draft.id}`, () =>
                          activateEventDraft(draft.id),
                        )
                      }
                      disabled={
                        draft.lifecycle !== "validated" || Boolean(busy)
                      }
                      className="rounded-xl bg-emerald-300 px-4 py-2 text-sm font-black text-black disabled:cursor-not-allowed disabled:opacity-25"
                    >
                      Activate with Requirements
                    </button>
                  </div>
                  <div className="mt-4 rounded-xl border border-sky-300/20 bg-sky-300/5 p-4">
                    <div className="text-sm font-black text-sky-100">
                      Activation Requirements
                    </div>
                    <p className="mt-1 text-xs text-white/50">
                      Required held events activate first. Missing, incomplete,
                      or inactive requirements keep the entire group safely
                      held.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <select
                        value={dependencyChoices[draft.id] ?? ""}
                        onChange={(event) =>
                          setDependencyChoices((current) => ({
                            ...current,
                            [draft.id]: event.target.value,
                          }))
                        }
                        className="min-w-64 rounded-lg border border-white/15 bg-black px-3 py-2 text-sm text-white"
                      >
                        <option value="">Choose required event...</option>
                        {dependencyOptions.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() =>
                          void run(`dependency-${draft.id}`, () =>
                            addEventDependency(draft),
                          )
                        }
                        disabled={!dependencyChoices[draft.id] || Boolean(busy)}
                        className="rounded-lg border border-sky-200/40 px-3 py-2 text-xs font-black text-sky-100 disabled:opacity-30"
                      >
                        Add Requirement
                      </button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {dependencies.map((dependency) => {
                        const required = dependencyOptions.find(
                          (option) => option.id === dependency.requiredEventId,
                        );
                        return (
                          <span
                            key={dependency.id}
                            className="inline-flex items-center gap-2 rounded-full border border-sky-300/25 bg-black/40 px-3 py-2 text-xs"
                          >
                            Requires{" "}
                            {required?.label ?? dependency.requiredEventId}
                            <button
                              onClick={() =>
                                void run(`remove-${dependency.id}`, () =>
                                  removeEventDependency(dependency.id),
                                )
                              }
                              disabled={Boolean(busy)}
                              className="font-black text-rose-200 disabled:opacity-30"
                            >
                              Remove
                            </button>
                          </span>
                        );
                      })}
                      {!dependencies.length ? (
                        <span className="text-xs text-white/35">
                          No requirements. This event can activate by itself.
                        </span>
                      ) : null}
                    </div>
                  </div>
                  {readiness ? (
                    <div
                      className={`mt-4 rounded-xl border p-4 ${
                        readiness.ready
                          ? "border-emerald-300/30 bg-emerald-300/5"
                          : "border-rose-300/30 bg-rose-300/5"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="font-black">
                          {readiness.ready
                            ? "Ready for Atomic Activation"
                            : "Activation Blocked"}
                        </div>
                        <span className="text-xs text-white/45">
                          {readiness.includedDraftIds.length} held event(s) in
                          group
                        </span>
                      </div>
                      {readiness.activationOrder.length ? (
                        <div className="mt-3">
                          <div className="text-xs font-black uppercase tracking-wider text-white/45">
                            Activation order
                          </div>
                          <ol className="mt-2 space-y-1 text-sm">
                            {readiness.activationOrder.map((draftId, index) => {
                              const planned = holding?.drafts.find(
                                (item) => item.id === draftId,
                              );
                              return (
                                <li key={draftId}>
                                  {index + 1}. {planned?.event.title || draftId}
                                </li>
                              );
                            })}
                          </ol>
                        </div>
                      ) : null}
                      {readiness.issues.map((issue) => (
                        <div
                          key={`${issue.code}-${issue.eventId ?? issue.message}`}
                          className="mt-2 text-sm text-rose-100/80"
                        >
                          <span className="font-mono text-xs">
                            {issue.code}
                          </span>
                          : {issue.message}
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {lastAttempt && !lastAttempt.accepted ? (
                    <div className="mt-4 rounded-xl border border-rose-300/25 bg-rose-300/5 p-4">
                      <div className="text-sm font-black text-rose-100">
                        Activation prevented - {lastAttempt.issues.length}{" "}
                        issue(s)
                      </div>
                      {lastAttempt.issues.map((issue) => (
                        <div
                          key={issue.id}
                          className="mt-2 text-sm text-rose-100/75"
                        >
                          <span className="font-mono text-xs">
                            {issue.code}
                          </span>
                          : {issue.message}
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <details className="mt-4 text-sm text-white/55">
                    <summary className="cursor-pointer font-bold">
                      Lifecycle history ({draft.transitions.length} transitions)
                    </summary>
                    {draft.transitions.map((transition) => (
                      <div
                        key={transition.id}
                        className="mt-2 border-l border-white/15 pl-3"
                      >
                        {transition.from ?? "new"} → {transition.to}:{" "}
                        {transition.reason}
                      </div>
                    ))}
                  </details>
                </article>
              );
            })}
            {!holding?.drafts.length ? (
              <div className="rounded-2xl border border-dashed border-white/15 p-7 text-center text-white/40">
                The holding bin is empty. Create a draft above to test the full
                lifecycle.
              </div>
            ) : null}
          </div>

          <div className="mt-6 rounded-2xl border border-violet-300/20 bg-violet-300/[0.035] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black">
                  Permanent Lifecycle Evidence
                </h3>
                <p className="mt-1 text-xs text-white/45">
                  Restart-safe proof of validations, prevented actions, safe
                  edit starts, and successful activations.
                </p>
              </div>
              <span className="rounded-full border border-white/15 px-3 py-2 text-xs font-black">
                {holding?.evidenceCount ?? 0} records
              </span>
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {(holding?.evidence ?? []).slice(0, 30).map((record) => (
                <details
                  key={record.id}
                  className={`rounded-xl border p-4 ${record.outcome === "prevented" ? "border-rose-300/25 bg-rose-300/5" : record.outcome === "activated" ? "border-emerald-300/25 bg-emerald-300/5" : "border-white/10 bg-black/35"}`}
                >
                  <summary className="cursor-pointer list-none">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-black capitalize">
                          {record.outcome.replaceAll("-", " ")} ·{" "}
                          {record.action.replaceAll("-", " ")}
                        </div>
                        <div className="mt-1 font-mono text-[11px] text-white/40">
                          {record.eventId}
                        </div>
                      </div>
                      <div className="text-right text-[11px] text-white/45">
                        {new Date(record.recordedAt).toLocaleString()}
                        <br />
                        {record.issues.length} issue(s)
                      </div>
                    </div>
                  </summary>
                  <div className="mt-3 border-t border-white/10 pt-3 text-xs text-white/55">
                    <div>Draft: {record.draftId}</div>
                    {record.originEventId ? (
                      <div>Original: {record.originEventId}</div>
                    ) : null}
                    <div>
                      Actor: {record.recordedBy} · Lifecycle: {record.lifecycle}
                    </div>
                    {record.issues.map((issue, index) => (
                      <div
                        key={`${record.id}-${issue.code}-${index}`}
                        className="mt-2 rounded-lg bg-black/35 p-2 text-rose-100/80"
                      >
                        <span className="font-mono">{issue.code}</span>:{" "}
                        {issue.message}
                        {issue.path ? (
                          <div className="mt-1 font-mono text-[10px] text-white/35">
                            {issue.path}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </details>
              ))}
              {!holding?.evidence.length ? (
                <div className="text-sm text-white/40">
                  Evidence will appear after the first validation or safe edit.
                </div>
              ) : null}
            </div>
          </div>
        </section>
        <section className="mt-6 rounded-3xl border border-white/15 bg-white/[0.035] p-6">
          <h2 className="text-2xl font-black">3. Exact change preview</h2>
          {!plan ? (
            <p className="mt-4 text-white/45">No action preview yet.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="text-xs uppercase text-white/45">
                  <tr>
                    <th className="p-3">Target</th>
                    <th className="p-3">Field</th>
                    <th className="p-3">Before</th>
                    <th className="p-3">After</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.changes.map((change, index) => (
                    <tr
                      key={`${change.entityId}-${change.field}-${index}`}
                      className="border-t border-white/10 align-top"
                    >
                      <td className="p-3 font-mono text-xs">
                        {change.entity}:{change.entityId}
                      </td>
                      <td className="p-3 font-bold">{change.field}</td>
                      <td className="max-w-sm whitespace-pre-wrap p-3 text-rose-100/80">
                        {display(change.before)}
                      </td>
                      <td className="max-w-sm whitespace-pre-wrap p-3 text-emerald-100/80">
                        {display(change.after)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {plan.issues.map((issue) => (
                <div
                  key={`${issue.code}-${issue.message}`}
                  className="mt-3 text-rose-200"
                >
                  {issue.code}: {issue.message}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-6 rounded-3xl border border-white/15 bg-white/[0.035] p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black">Workflow ledger</h2>
              <p className="mt-1 text-sm text-white/50">
                {selectedProject?.title ?? "Choose a project"} · restart-safe
                history
              </p>
            </div>
            <button
              onClick={() => void run("history", () => refreshHistory())}
              disabled={!projectId || Boolean(busy)}
              className="rounded-xl border border-white/25 px-4 py-2 text-sm font-bold disabled:opacity-40"
            >
              Refresh
            </button>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {history
              .slice()
              .reverse()
              .slice(0, 20)
              .map((row) => (
                <div
                  key={row.id}
                  className="rounded-xl border border-white/10 bg-black/45 p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase ${statusStyle(row.status)}`}
                    >
                      {row.status}
                    </span>
                    <span className="text-xs text-white/45">
                      {new Date(row.recordedAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-3 font-mono text-xs text-white/60">
                    {row.workflowId}
                  </div>
                  <div className="mt-2 text-xs text-white/45">
                    Actor: {row.recordedBy} · Proposals: {row.proposalCount} ·
                    Changes: {row.actionCount} · Cost: $
                    {(row.cost?.estimatedTotalCost ?? 0).toFixed(6)}
                  </div>
                </div>
              ))}
            {!history.length ? (
              <p className="text-white/45">
                No recorded workflows for this project yet.
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
