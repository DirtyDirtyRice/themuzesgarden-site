"use client";

import { useCallback, useEffect, useState } from "react";
import TimelineDawRecoveryBabyStepHelp from "@/app/components/TimelineDawRecoveryBabyStepHelp";
import TimelineDawChromeRecoveryQaWorkspace from "@/app/components/TimelineDawChromeRecoveryQaWorkspace";
import type { TimelineDawRecoveryCheckpoint } from "../../../../lib/timeline/TimelineDawRecoveryCheckpointStore";
import {
  captureDawRecovery,
  loadDawRecovery,
  ProjectDawApiError,
  restoreDawRecovery,
} from "./projectDawApi";
import type { DawSession } from "./projectDawTypes";

const button = "rounded-xl border border-white/25 bg-white px-4 py-2 text-sm font-black text-black disabled:cursor-not-allowed disabled:opacity-40";

export default function ProjectDawRecoveryWorkspace({
  session,
  workspaceRevision,
  onWorkspaceRevision,
}: {
  session: DawSession;
  workspaceRevision: number;
  onWorkspaceRevision: (revision: number) => void;
}) {
  const [label, setLabel] = useState(`${session.name} checkpoint`);
  const [checkpoints, setCheckpoints] = useState<TimelineDawRecoveryCheckpoint[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const snapshot = await loadDawRecovery(session.id);
      setCheckpoints(snapshot.checkpoints);
      onWorkspaceRevision(snapshot.workspaceRevision);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Recovery checkpoints could not be loaded.");
    }
  }, [onWorkspaceRevision, session.id]);

  useEffect(() => { void load(); }, [load]);

  async function capture() {
    setBusy("capture");
    setError(null);
    setNotice(null);
    try {
      const result = await captureDawRecovery({
        sessionId: session.id,
        label,
        expectedWorkspaceRevision: workspaceRevision,
      });
      setCheckpoints((current) => [...current, result.receipt.checkpoint]);
      onWorkspaceRevision(result.receipt.workspaceRevision);
      setNotice("A private fingerprinted recovery checkpoint was captured.");
    } catch (cause) {
      if (cause instanceof ProjectDawApiError && cause.status === 409) {
        await load();
        setNotice("The workspace changed. Recovery history was reloaded; review it and retry.");
      } else {
        setError(cause instanceof Error ? cause.message : "Recovery checkpoint could not be captured.");
      }
    } finally {
      setBusy(null);
    }
  }

  async function restore(checkpoint: TimelineDawRecoveryCheckpoint) {
    if (!window.confirm(`Restore "${checkpoint.label}"? Current session changes after this checkpoint will be replaced.`)) return;
    setBusy(checkpoint.id);
    setError(null);
    setNotice(null);
    try {
      const result = await restoreDawRecovery({
        sessionId: session.id,
        checkpointId: checkpoint.id,
        expectedWorkspaceRevision: workspaceRevision,
      });
      onWorkspaceRevision(result.receipt.workspaceRevision);
      window.location.reload();
    } catch (cause) {
      if (cause instanceof ProjectDawApiError && cause.status === 409) {
        await load();
        setNotice("The workspace changed. Recovery history was reloaded; review it and retry.");
      } else {
        setError(cause instanceof Error ? cause.message : "Recovery checkpoint could not be restored.");
      }
      setBusy(null);
    }
  }

  return (
    <div>
      <TimelineDawRecoveryBabyStepHelp sessionId={session.id} />
    <section className="rounded-3xl border border-white/15 bg-[#080808] p-5 sm:p-7">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-300">Recovery</p>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black">Protected session checkpoints</h2>
          <p className="mt-2 max-w-2xl text-sm text-white/60">
            Capture the complete durable workspace and verify its exact bytes before any restore.
          </p>
        </div>
        <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs font-black uppercase text-amber-200">
          Integrity verified
        </span>
      </div>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <input
          className="min-w-0 flex-1 rounded-xl border border-white/20 bg-black px-3 py-2 text-white"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          aria-label="Recovery checkpoint label"
        />
        <button type="button" className={button} disabled={busy !== null || !label.trim()} onClick={() => void capture()}>
          {busy === "capture" ? "Capturing..." : "Capture Checkpoint"}
        </button>
      </div>
      {error ? <p role="alert" className="mt-4 text-sm text-red-200">{error}</p> : null}
      {notice ? <p role="status" className="mt-4 text-sm text-emerald-200">{notice}</p> : null}
      {!checkpoints.length ? <p className="mt-5 text-sm text-white/50">No recovery checkpoints have been captured.</p> : null}
      <ol className="mt-5 grid gap-2">
        {[...checkpoints].reverse().map((checkpoint) => (
          <li key={checkpoint.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-black">{checkpoint.label}</p>
                <p className="mt-1 text-xs text-white/45">
                  Workspace revision {checkpoint.workspaceRevision} ? {checkpoint.byteLength.toLocaleString()} bytes ? {new Date(checkpoint.createdAt).toLocaleString()}
                </p>
                {checkpoint.lastRestoredAt ? <p className="mt-1 text-xs text-emerald-300">Last restored {new Date(checkpoint.lastRestoredAt).toLocaleString()}</p> : null}
              </div>
              <button type="button" className={button} disabled={busy !== null} onClick={() => void restore(checkpoint)}>
                {busy === checkpoint.id ? "Restoring..." : "Verify & Restore"}
              </button>
            </div>
          </li>
        ))}
      </ol>
    </section>
      <TimelineDawChromeRecoveryQaWorkspace sessionId={session.id} />
    </div>
  );
}
