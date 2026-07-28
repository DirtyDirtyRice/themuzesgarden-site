"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  TimelineOfflineRenderJob,
  TimelineRenderFormat,
  TimelineRenderTarget,
} from "../../../../lib/timeline/TimelineOfflineRenderAndExportEngine";
import { loadDawRenders, prepareDawRender, ProjectDawApiError } from "./projectDawApi";
import type { DawSession } from "./projectDawTypes";

const field = "rounded-xl border border-white/20 bg-black px-3 py-2 text-white";
const button = "rounded-xl border border-white/25 bg-white px-4 py-2 text-sm font-black text-black disabled:cursor-not-allowed disabled:opacity-40";

export default function ProjectDawExportWorkspace({
  session, workspaceRevision, onWorkspaceRevision,
}: {
  session: DawSession;
  workspaceRevision: number;
  onWorkspaceRevision: (revision: number) => void;
}) {
  const [name, setName] = useState(`${session.name} Mix`);
  const [target, setTarget] = useState<TimelineRenderTarget>("mix");
  const [format, setFormat] = useState<TimelineRenderFormat>("wav");
  const [sampleRate, setSampleRate] = useState(48000);
  const [bitDepth, setBitDepth] = useState<16 | 24 | 32>(24);
  const [durationSeconds, setDurationSeconds] = useState(180);
  const [sources, setSources] = useState("master");
  const [jobs, setJobs] = useState<TimelineOfflineRenderJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<TimelineOfflineRenderJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const snapshot = await loadDawRenders(session.id);
      setJobs(snapshot.jobs);
      setSelectedJob((current) =>
        current
          ? snapshot.jobs.find((job) => job.id === current.id) ?? snapshot.jobs.at(-1) ?? null
          : snapshot.jobs.at(-1) ?? null);
      onWorkspaceRevision(snapshot.workspaceRevision);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Saved renders could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [onWorkspaceRevision, session.id]);

  useEffect(() => { void load(); }, [load]);

  async function prepare() {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const receipt = await prepareDawRender({
        sessionId: session.id, expectedWorkspaceRevision: workspaceRevision, name, target,
        sourceIds: sources.split(",").map((value) => value.trim()).filter(Boolean),
        startSample: 0, endSample: Math.round(durationSeconds * sampleRate), sampleRate,
        bitDepth: format === "mp3" ? 16 : bitDepth, channels: 2, format,
        dither: format === "wav" && bitDepth === 16,
      });
      setJobs((current) => [...current, receipt.receipt.job]);
      setSelectedJob(receipt.receipt.job);
      onWorkspaceRevision(receipt.receipt.workspaceRevision);
      setNotice("Render specification validated and saved to this project workspace.");
    } catch (cause) {
      if (cause instanceof ProjectDawApiError && cause.status === 409) {
        await load();
        setNotice("The workspace changed in another Studio operation. Saved renders were reloaded; review them and retry.");
      } else {
        setError(cause instanceof Error ? cause.message : "Export could not be prepared.");
      }
    } finally {
      setBusy(false);
    }
  }

  function downloadManifest(job: TimelineOfflineRenderJob | null) {
    if (!job || job.state !== "validated") return;
    const payload = JSON.stringify({
      schema: "the-muzes-garden/render-manifest/v1", sessionId: session.id,
      sessionRevision: session.revision, preparedAt: new Date().toISOString(),
      render: job, audioWorkerStatus: "not-connected",
    }, null, 2);
    const url = URL.createObjectURL(new Blob([payload], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${job.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "render"}.render.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="rounded-3xl border border-white/15 bg-[#080808] p-5 sm:p-7">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-300">Render &amp; Export</p>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div><h2 className="text-2xl font-black">Delivery preparation</h2><p className="mt-2 max-w-2xl text-sm text-white/60">Validate and durably save a reproducible mix, stem, or selection render before it reaches an offline audio worker.</p></div>
        <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs font-black uppercase text-amber-200">Audio worker not connected</span>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <input className={field} value={name} onChange={(event) => setName(event.target.value)} aria-label="Export name" />
        <select className={field} value={target} onChange={(event) => setTarget(event.target.value as TimelineRenderTarget)} aria-label="Export target"><option value="mix">Full mix</option><option value="stem">Stems</option><option value="selection">Selection</option></select>
        <select className={field} value={format} onChange={(event) => setFormat(event.target.value as TimelineRenderFormat)} aria-label="Export format"><option value="wav">WAV</option><option value="flac">FLAC</option><option value="mp3">MP3</option></select>
        <select className={field} value={sampleRate} onChange={(event) => setSampleRate(Number(event.target.value))} aria-label="Sample rate"><option value={44100}>44.1 kHz</option><option value={48000}>48 kHz</option><option value={96000}>96 kHz</option></select>
        <select className={field} value={format === "mp3" ? 16 : bitDepth} disabled={format === "mp3"} onChange={(event) => setBitDepth(Number(event.target.value) as 16 | 24 | 32)} aria-label="Bit depth"><option value={16}>16-bit</option><option value={24}>24-bit</option><option value={32}>32-bit float</option></select>
        <input className={field} type="number" min={1} step={1} value={durationSeconds} onChange={(event) => setDurationSeconds(Number(event.target.value))} aria-label="Duration in seconds" />
        <input className={`${field} md:col-span-2 xl:col-span-3`} value={sources} onChange={(event) => setSources(event.target.value)} aria-label="Comma-separated render sources" placeholder="master, vocals, drums" />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className={button} disabled={busy || loading} onClick={() => void prepare()}>{busy ? "Saving…" : "Validate & Save Render"}</button>
        <button type="button" className={button} disabled={selectedJob?.state !== "validated"} onClick={() => downloadManifest(selectedJob)}>Download Selected Manifest</button>
      </div>
      {error ? <p role="alert" className="mt-4 text-sm text-red-200">{error}</p> : null}
      {notice ? <p role="status" className="mt-4 text-sm text-emerald-200">{notice}</p> : null}
      <div className="mt-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div><p className="text-xs font-black uppercase tracking-wider text-white/40">Saved render history</p><h3 className="mt-1 text-xl font-black">{loading ? "Loading…" : `${jobs.length} saved render${jobs.length === 1 ? "" : "s"}`}</h3></div>
          <button type="button" className="text-sm font-bold text-white/60 hover:text-white disabled:opacity-40" disabled={loading || busy} onClick={() => void load()}>Reload history</button>
        </div>
        {!loading && jobs.length === 0 ? <p className="mt-3 text-sm text-white/50">No render specifications have been saved for this session.</p> : null}
        <ol className="mt-3 grid gap-2">
          {[...jobs].reverse().map((job) => (
            <li key={job.id}>
              <button type="button" onClick={() => setSelectedJob(job)} className={`w-full rounded-2xl border p-4 text-left ${selectedJob?.id === job.id ? "border-emerald-300/50 bg-emerald-300/[0.08]" : "border-white/10 bg-white/[0.03]"}`}>
                <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-black">{job.name}</span><span className="text-xs font-black uppercase text-emerald-200">{job.state}</span></div>
                <p className="mt-1 text-sm text-white/55">{job.target} · {job.format.toUpperCase()} · {job.sampleRate.toLocaleString()} Hz · {job.bitDepth}-bit · {job.totalFrames.toLocaleString()} frames</p>
                <p className="mt-1 text-xs text-white/35">{job.id}</p>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
