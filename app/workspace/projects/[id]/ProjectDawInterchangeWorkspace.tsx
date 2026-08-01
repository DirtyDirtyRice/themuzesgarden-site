"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { TimelineOfflineRenderJob } from "../../../../lib/timeline/TimelineOfflineRenderAndExportEngine";
import type { TimelineInterchangePackage } from "../../../../lib/timeline/TimelineInterchangeExportEngine";
import {
  createDawInterchange,
  loadDawInterchange,
  loadDawInterchangeDelivery,
  ProjectDawApiError,
} from "./projectDawApi";
import type { DawSession } from "./projectDawTypes";

const field = "rounded-xl border border-white/20 bg-black px-3 py-2 text-white";
const button = "rounded-xl border border-white/25 bg-white px-4 py-2 text-sm font-black text-black disabled:cursor-not-allowed disabled:opacity-40";

export default function ProjectDawInterchangeWorkspace({
  session,
  jobs,
  workspaceRevision,
  onWorkspaceRevision,
}: {
  session: DawSession;
  jobs: TimelineOfflineRenderJob[];
  workspaceRevision: number;
  onWorkspaceRevision: (revision: number) => void;
}) {
  const [name, setName] = useState(`${session.name} Interchange`);
  const [destination, setDestination] = useState("Project archive");
  const [packages, setPackages] = useState<TimelineInterchangePackage[]>([]);
  const [deliveryUrls, setDeliveryUrls] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const completed = useMemo(() => jobs.filter((job) => job.state === "completed"), [jobs]);

  const load = useCallback(async () => {
    try {
      const snapshot = await loadDawInterchange(session.id);
      setPackages(snapshot.packages);
      onWorkspaceRevision(snapshot.workspaceRevision);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Interchange history could not be loaded.");
    }
  }, [onWorkspaceRevision, session.id]);

  useEffect(() => { void load(); }, [load]);

  async function createPackage() {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const result = await createDawInterchange({
        sessionId: session.id,
        jobIds: completed.map((job) => job.id),
        name,
        destination,
        expectedWorkspaceRevision: workspaceRevision,
      });
      setPackages((current) => [...current, result.receipt.package]);
      setDeliveryUrls((current) => ({
        ...current,
        [result.receipt.package.id]: result.receipt.deliveryUrl,
      }));
      onWorkspaceRevision(result.receipt.workspaceRevision);
      setNotice(`${completed.length} verified render artifact${completed.length === 1 ? "" : "s"} packaged for private delivery.`);
    } catch (cause) {
      if (cause instanceof ProjectDawApiError && cause.status === 409) {
        await load();
        setNotice("The workspace changed. Interchange history was reloaded; review it and retry.");
      } else {
        setError(cause instanceof Error ? cause.message : "Interchange package could not be created.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function refreshDelivery(value: TimelineInterchangePackage) {
    setError(null);
    try {
      const result = await loadDawInterchangeDelivery(session.id, value.id);
      setDeliveryUrls((current) => ({ ...current, [value.id]: result.deliveryUrl }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Private interchange delivery could not be prepared.");
    }
  }

  return (
    <div className="mt-8 border-t border-white/10 pt-6">
      <p className="text-xs font-black uppercase tracking-wider text-cyan-300">Interchange packages</p>
      <h3 className="mt-1 text-xl font-black">Verified project handoff</h3>
      <p className="mt-2 max-w-2xl text-sm text-white/55">
        Package every completed private render with fingerprint evidence and a durable manifest.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <input className={field} value={name} onChange={(event) => setName(event.target.value)} aria-label="Interchange package name" />
        <input className={field} value={destination} onChange={(event) => setDestination(event.target.value)} aria-label="Interchange destination" />
      </div>
      <button type="button" className={`${button} mt-3`} disabled={busy || !completed.length || !name.trim() || !destination.trim()} onClick={() => void createPackage()}>
        {busy ? "Packaging..." : `Package ${completed.length} Completed Render${completed.length === 1 ? "" : "s"}`}
      </button>
      {error ? <p role="alert" className="mt-3 text-sm text-red-200">{error}</p> : null}
      {notice ? <p role="status" className="mt-3 text-sm text-emerald-200">{notice}</p> : null}
      <ol className="mt-4 grid gap-2">
        {[...packages].reverse().map((value) => (
          <li key={value.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-black">{value.name}</span>
              <span className="text-xs font-black uppercase text-cyan-200">{value.status}</span>
            </div>
            <p className="mt-1 text-sm text-white/55">{value.destination} ? {value.assets.length} verified assets ? revision {value.revision}</p>
            {deliveryUrls[value.id] ? (
              <a className="mt-3 inline-block text-sm font-black text-cyan-200 underline" href={deliveryUrls[value.id]}>Download private interchange ZIP</a>
            ) : value.status === "delivered" ? (
              <button type="button" className="mt-3 text-sm font-black text-cyan-200 underline" onClick={() => void refreshDelivery(value)}>Create private package link</button>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
