"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../../../components/AuthProvider";
import ProjectDawTimeline from "../../ProjectDawTimeline";
import ProjectDawExportWorkspace from "../../ProjectDawExportWorkspace";
import ProjectDawRecoveryWorkspace from "../../ProjectDawRecoveryWorkspace";
import ProjectDawTransport from "../../ProjectDawTransport";
import ProjectDawDeviceDiagnostics from "../../ProjectDawDeviceDiagnostics";
import ProjectDawRecordingWorkspace from "../../ProjectDawRecordingWorkspace";
import TimelineDawPrivateAudioLanes from "@/app/components/TimelineDawPrivateAudioLanes";
import TimelineDawNormalizationRevisions from "@/app/components/TimelineDawNormalizationRevisions";
import TimelineDawNormalizationOperations from "@/app/components/TimelineDawNormalizationOperations";
import TimelineDawNormalizationSupportCases from "@/app/components/TimelineDawNormalizationSupportCases";
import TimelineDawNormalizationSupportTriage from "@/app/components/TimelineDawNormalizationSupportTriage";
import TimelineDawNormalizationSupportAutomation from "@/app/components/TimelineDawNormalizationSupportAutomation";
import TimelineDawNormalizationSupportNotifications from "@/app/components/TimelineDawNormalizationSupportNotifications";
import TimelineDawNormalizationSupportAudit from "@/app/components/TimelineDawNormalizationSupportAudit";
import TimelineDawNormalizationSupportAuditRepair from "@/app/components/TimelineDawNormalizationSupportAuditRepair";
import TimelineDawNormalizationSupportEvidenceSeals from "@/app/components/TimelineDawNormalizationSupportEvidenceSeals";
import TimelineDawNormalizationSupportCoverage from "@/app/components/TimelineDawNormalizationSupportCoverage";
import TimelineDawNormalizationEvidenceMonitoring from "@/app/components/TimelineDawNormalizationEvidenceMonitoring";
import TimelineDawBetaWorkflow from "@/app/components/TimelineDawBetaWorkflow";
import TimelineDawOwnerMusicianTest from "@/app/components/TimelineDawOwnerMusicianTest";
import TimelineDawVisualGuide from "@/app/components/TimelineDawVisualGuide";
import TimelineDawTechnicalTestRunner from "@/app/components/TimelineDawTechnicalTestRunner";
import TimelineDawOwnerTestReport from "@/app/components/TimelineDawOwnerTestReport";
import TimelineDawBetaFeedback from "@/app/components/TimelineDawBetaFeedback";
import TimelineDawBetaOnboardingOwner from "@/app/components/TimelineDawBetaOnboardingOwner";
import TimelineDawBetaCohort from "@/app/components/TimelineDawBetaCohort";
import TimelineDawBetaAuditionOwner from "@/app/components/TimelineDawBetaAuditionOwner";
import TimelineDawBetaReleasePackage from "@/app/components/TimelineDawBetaReleasePackage";
import TimelineDawBetaReadinessCertification from "@/app/components/TimelineDawBetaReadinessCertification";
import TimelineDawBetaLaunchOperations from "@/app/components/TimelineDawBetaLaunchOperations";
import TimelineDawStudioFocusRestore from "@/app/components/TimelineDawStudioFocusRestore";
import TimelineDawSafeExit from "@/app/components/TimelineDawSafeExit";
import TimelineDawVerbalEditWorkspace from "@/app/components/TimelineDawVerbalEditWorkspace";
import { createTimelineDawWorkspaceAreas } from "../../../../../../lib/timeline/TimelineDawWorkspaceViewModel";
import {
  changeDawSession,
  loadDawSnapshot,
  ProjectDawApiError,
} from "../../projectDawApi";
import {
  dawActionsByState,
  type DawSession,
  type DawSessionAction,
  type DawSnapshot,
} from "../../projectDawTypes";
import type { TimelineDawSaveHealth } from "@/lib/timeline/TimelineDawSaveHealthPolicy";
import { createTimelineDawLifecycleConfirmation } from "@/lib/timeline/TimelineDawLifecycleConfirmationPolicy";
import { TIMELINE_DAW_MUSICIAN_ACTION, TIMELINE_DAW_MUSICIAN_SESSION_STATE } from "@/lib/timeline/TimelineDawMusicianSessionControls";

const buttonClass =
  "rounded-xl border border-white/25 bg-white px-4 py-2 text-sm font-black text-black disabled:cursor-not-allowed disabled:opacity-40";

const workspacePanelClass = "rounded-3xl border border-white/15 bg-[#080808] p-4";
const workspaceSummaryClass = "cursor-pointer text-xl font-black marker:text-cyan-300";

export default function ProjectDawSessionPage() {
  const params = useParams();
  const projectId = String(params.id ?? "");
  const sessionId = String(params.sessionId ?? "");
  const { user, loading: authLoading } = useAuth();
  const [snapshot, setSnapshot] = useState<DawSnapshot>({
    workspaceRevision: 0,
    sessions: [],
  });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [normalizationLaneRevision, setNormalizationLaneRevision] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saveHealth, setSaveHealth] = useState<TimelineDawSaveHealth>("saved");

  const session = useMemo(
    () => snapshot.sessions.find((item) => item.id === sessionId) ?? null,
    [sessionId, snapshot.sessions],
  );
  const areas = useMemo(
    () => createTimelineDawWorkspaceAreas(session?.readiness.stages ?? []),
    [session],
  );

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      setSnapshot(await loadDawSnapshot(projectId));
      setSaveHealth("saved");
    } catch (cause) {
      setSaveHealth("stale");
      setError(cause instanceof Error ? cause.message : "DAW workspace could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [projectId, user]);

  const handleWorkspaceRevision = useCallback((revision: number) => {
    setSnapshot((value) => ({ ...value, workspaceRevision: revision }));
    setSaveHealth("saved");
  }, []);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  async function runAction(current: DawSession, action: DawSessionAction) {
    if (action === "suspend" || action === "close") {
      const confirmation = createTimelineDawLifecycleConfirmation(action, current.name);
      if (!window.confirm(`${confirmation.title}\n\n${confirmation.message}\n\nChoose OK to ${confirmation.confirmLabel.toLowerCase()}.`)) return;
    }
    setBusy(true);
    setSaveHealth("saving");
    setError(null);
    try {
      const result = await changeDawSession({
        action,
        sessionId: current.id,
        expectedSessionRevision: current.revision,
        expectedWorkspaceRevision: snapshot.workspaceRevision,
      });
      setSnapshot((value) => ({
        workspaceRevision: result.receipt.workspaceRevision,
        sessions: value.sessions.map((item) =>
          item.id === current.id ? result.receipt.session : item,
        ),
      }));
      setSaveHealth("saved");
    } catch (cause) {
      setSaveHealth(cause instanceof ProjectDawApiError && cause.status === 409 ? "conflicted" : "stale");
      setError(cause instanceof Error ? cause.message : "DAW session could not be changed.");
    } finally {
      setBusy(false);
    }
  }

  if (authLoading || loading) {
    return <main className="p-6 text-white">Loading DAW workspace…</main>;
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-2xl space-y-4 p-6 text-white">
        <h1 className="text-2xl font-black">DAW Workspace</h1>
        <p className="text-white/65">Sign in before opening a protected project session.</p>
        <Link href="/members" className={buttonClass}>Go to Members Sign In</Link>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="mx-auto max-w-3xl space-y-4 p-6 text-white">
        <h1 className="text-2xl font-black">Session not found</h1>
        <p className="text-white/65">
          This session is unavailable or does not belong to your project workspace.
        </p>
        <Link href={`/workspace/projects/${encodeURIComponent(projectId)}`} className={buttonClass}>
          Return to Project
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4 text-white sm:p-6">
      <nav className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm font-bold text-white/65">Project Studio · protected session</span>
        <TimelineDawSafeExit projectId={projectId} sessionId={session.id} workspaceRevision={snapshot.workspaceRevision} saveHealth={saveHealth} onRefresh={load} />
      </nav>

      <header className="rounded-3xl border border-white/15 bg-[#080808] p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">
              DAW Session Workspace
            </p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">{session.name}</h1>
            <p className="mt-2 text-sm text-white/55">Song {session.songId}</p>
          </div>
          <span className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-wider text-emerald-200">
            {TIMELINE_DAW_MUSICIAN_SESSION_STATE[session.state].label}
          </span>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-wider text-white/45">Engine readiness</p>
            <p className="mt-1 text-2xl font-black">
              {session.readiness.completed}/{session.readiness.required}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-wider text-white/45">Song identity</p>
            <p className="mt-1 truncate font-bold">{session.songId}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-wider text-white/45">Safety state</p>
            <p className="mt-1 font-bold">
              {session.readiness.ready ? "All systems ready" : "Held for review"}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {dawActionsByState[session.state].map((action) => (
            <button
              key={action}
              type="button"
              className={TIMELINE_DAW_MUSICIAN_ACTION[action].danger ? "rounded-xl border border-red-300/40 bg-red-950 px-4 py-2 text-sm font-black text-red-100 disabled:opacity-40" : buttonClass}
              disabled={busy}
              onClick={() => void runAction(session, action)}
            >
              {busy ? "Working…" : TIMELINE_DAW_MUSICIAN_ACTION[action].label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm text-white/65">{TIMELINE_DAW_MUSICIAN_SESSION_STATE[session.state].explanation}</p>
        {dawActionsByState[session.state].length ? <ul className="mt-2 space-y-1 text-xs text-white/50">{dawActionsByState[session.state].map((action) => <li key={action}><b>{TIMELINE_DAW_MUSICIAN_ACTION[action].label}:</b> {TIMELINE_DAW_MUSICIAN_ACTION[action].explanation}</li>)}</ul> : null}
      </header>

      {error ? (
        <div role="alert" className="rounded-xl border border-red-400/35 bg-red-950/30 p-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      <TimelineDawStudioFocusRestore sessionId={session.id} />

      <section aria-labelledby="daw-work-area-heading" className="space-y-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">Choose one work area</p>
          <h2 id="daw-work-area-heading" className="mt-1 text-2xl font-black">Only the section you choose will open</h2>
          <p className="mt-1 text-sm text-white/60">Choose a heading below. Opening another heading closes the previous one.</p>
        </div>

      <details name="daw-workspace-area" data-daw-workspace-panel className={workspacePanelClass}>
        <summary className={workspaceSummaryClass}>Play and stop the song</summary>
        <div data-daw-focus-area="transport" className="mt-5 scroll-mt-24">
          <ProjectDawTransport session={session} workspaceRevision={snapshot.workspaceRevision} onWorkspaceRevision={handleWorkspaceRevision} />
        </div>
      </details>

      <details name="daw-workspace-area" data-daw-workspace-panel className={workspacePanelClass}>
        <summary className={workspaceSummaryClass}>Record audio</summary>
        <div data-daw-focus-area="record" className="mt-5 scroll-mt-24">
          <ProjectDawRecordingWorkspace session={session} />
        </div>
      </details>

      <details name="daw-workspace-area" data-daw-workspace-panel className={workspacePanelClass}>
        <summary className={workspaceSummaryClass}>Tracks, editing, and MIDI</summary>
        <div data-daw-focus-area="arrange" className="mt-5 scroll-mt-24">
          <ProjectDawTimeline session={session} />
        </div>
      </details>

      <details name="daw-workspace-area" data-daw-workspace-panel className={workspacePanelClass}>
        <summary className={workspaceSummaryClass}>Mix tracks and effects</summary>
        <div data-daw-focus-area="mix" className="mt-5 space-y-6 scroll-mt-24">
          <TimelineDawPrivateAudioLanes key={normalizationLaneRevision} sessionId={session.id} projectId={projectId} />
          <ProjectDawDeviceDiagnostics />
        </div>
      </details>

      <details name="daw-workspace-area" data-daw-workspace-panel className={workspacePanelClass}>
        <summary className={workspaceSummaryClass}>Save or recover work</summary>
        <div data-daw-focus-area="recover" className="mt-5 scroll-mt-24">
          <ProjectDawRecoveryWorkspace session={session} workspaceRevision={snapshot.workspaceRevision} onWorkspaceRevision={handleWorkspaceRevision} />
        </div>
      </details>

      <details name="daw-workspace-area" data-daw-workspace-panel className={workspacePanelClass}>
        <summary className={workspaceSummaryClass}>Export the song</summary>
        <div id="daw-export-workspace" data-daw-focus-area="export" className="mt-5 scroll-mt-24">
          <ProjectDawExportWorkspace session={session} workspaceRevision={snapshot.workspaceRevision} onWorkspaceRevision={handleWorkspaceRevision} />
        </div>
      </details>

      <details name="daw-workspace-area" data-daw-workspace-panel className={workspacePanelClass}>
        <summary className={workspaceSummaryClass}>Verbal Editing <span className="ml-2 text-sm font-normal text-white/50">Advanced</span></summary>
        <div data-daw-focus-area="verbal" className="mt-5 scroll-mt-24">
          <TimelineDawVerbalEditWorkspace />
        </div>
      </details>

      <details name="daw-workspace-area" data-daw-workspace-panel className={workspacePanelClass}>
        <summary className={workspaceSummaryClass}>Lessons and owner checks <span className="ml-2 text-sm font-normal text-white/50">Advanced</span></summary>
        <div data-daw-focus-area="guide" className="mt-5 space-y-6 scroll-mt-24">
        <TimelineDawVisualGuide sessionId={session.id} />
        <TimelineDawTechnicalTestRunner sessionId={session.id} />
        <TimelineDawOwnerTestReport sessionId={session.id} />
        <TimelineDawOwnerMusicianTest sessionId={session.id} />
        </div>
      </details>

      <details name="daw-workspace-area" data-daw-workspace-panel className={workspacePanelClass}>
        <summary className={workspaceSummaryClass}>Beta testing tools <span className="ml-2 text-sm font-normal text-white/50">Owner tools</span></summary>
        <div data-daw-focus-area="beta" className="mt-5 space-y-6 scroll-mt-24">
        <TimelineDawBetaWorkflow sessionId={session.id} />
        <TimelineDawBetaFeedback sessionId={session.id} />
        <TimelineDawBetaOnboardingOwner sessionId={session.id} />
        <TimelineDawBetaCohort sessionId={session.id} />
        <TimelineDawBetaAuditionOwner sessionId={session.id} />
        <TimelineDawBetaReleasePackage sessionId={session.id} />
        <TimelineDawBetaReadinessCertification sessionId={session.id} />
        <TimelineDawBetaLaunchOperations sessionId={session.id} />
        </div>
      </details>

      <details name="daw-workspace-area" data-daw-workspace-panel className={workspacePanelClass}>
        <summary className={workspaceSummaryClass}>Mastering and support tools <span className="ml-2 text-sm font-normal text-white/50">Advanced</span></summary>
        <div data-daw-focus-area="mastering" className="mt-5 space-y-6 scroll-mt-24">
        <TimelineDawNormalizationRevisions sessionId={session.id} onLanesChanged={() => setNormalizationLaneRevision((value) => value + 1)} />
        <TimelineDawNormalizationOperations sessionId={session.id} />
        <TimelineDawNormalizationSupportCases sessionId={session.id} alertIds={[]} recoveryReceiptIds={[]} />
        <TimelineDawNormalizationSupportTriage sessionId={session.id} />
        <TimelineDawNormalizationSupportAutomation sessionId={session.id} />
        <TimelineDawNormalizationSupportNotifications sessionId={session.id} />
        <TimelineDawNormalizationSupportAudit sessionId={session.id} />
        <TimelineDawNormalizationSupportAuditRepair sessionId={session.id} />
        <TimelineDawNormalizationSupportEvidenceSeals sessionId={session.id} />
        <TimelineDawNormalizationSupportCoverage sessionId={session.id} />
        <TimelineDawNormalizationEvidenceMonitoring sessionId={session.id} />
        </div>
      </details>

      <details name="daw-workspace-area" data-daw-workspace-panel className="rounded-3xl border border-white/15 bg-black p-5">
      <summary className={workspaceSummaryClass}>Technical engine readiness <span className="ml-2 text-sm font-normal text-white/50">Advanced details</span></summary>
      <section className="mt-5">
        <div className="mb-3">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-white/45">
            Work Areas
          </p>
          <h2 className="mt-1 text-2xl font-black">Session Control Room</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {areas.map((area) => (
            <article key={area.id} className="rounded-2xl border border-white/15 bg-black p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-black">{area.name}</h3>
                <span className={area.ready ? "text-emerald-300" : "text-amber-300"}>
                  {area.completed}/{area.required}
                </span>
              </div>
              <p className="mt-2 min-h-10 text-sm leading-5 text-white/55">{area.description}</p>
              <p className="mt-4 text-xs font-bold uppercase tracking-wider text-white/35">
                {area.ready ? "Ready" : "Held"}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-white/15 bg-black p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-white/45">
              Startup Chain
            </p>
            <h2 className="mt-1 text-2xl font-black">Twelve Bound Engines</h2>
          </div>
          <p className="text-sm text-white/45">Validated in dependency order</p>
        </div>
        <ol className="mt-5 grid gap-2 md:grid-cols-2">
          {session.readiness.stages.map((stage) => (
            <li key={stage.engineId} className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
              <div className="flex items-center gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-black">
                  {stage.order}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black">{stage.name}</p>
                  <p className={stage.ready ? "text-xs text-emerald-300" : "text-xs text-amber-300"}>
                    {stage.ready ? "Ready" : stage.blockingReasons.join(" ")}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>
      </details>
      </section>
    </main>
  );
}
