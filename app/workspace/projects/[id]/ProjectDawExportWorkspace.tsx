"use client";

import { useRef, useState } from "react";
import {
  TimelineOfflineRenderAndExportEngine,
  type TimelineOfflineRenderJob,
  type TimelineRenderFormat,
  type TimelineRenderTarget,
} from "../../../../lib/timeline/TimelineOfflineRenderAndExportEngine";
import type { DawSession } from "./projectDawTypes";

const field = "rounded-xl border border-white/20 bg-black px-3 py-2 text-white";
const button = "rounded-xl border border-white/25 bg-white px-4 py-2 text-sm font-black text-black disabled:cursor-not-allowed disabled:opacity-40";

export default function ProjectDawExportWorkspace({ session, actorId }: { session: DawSession; actorId: string }) {
  const engine = useRef(new TimelineOfflineRenderAndExportEngine());
  const [name, setName] = useState(`${session.name} Mix`);
  const [target, setTarget] = useState<TimelineRenderTarget>("mix");
  const [format, setFormat] = useState<TimelineRenderFormat>("wav");
  const [sampleRate, setSampleRate] = useState(48000);
  const [bitDepth, setBitDepth] = useState<16 | 24 | 32>(24);
  const [durationSeconds, setDurationSeconds] = useState(180);
  const [sources, setSources] = useState("master");
  const [job, setJob] = useState<TimelineOfflineRenderJob | null>(null);
  const [error, setError] = useState<string | null>(null);

  function prepare() {
    setError(null);
    try {
      let next = engine.current.createJob({
        projectId: session.projectId,
        name,
        target,
        sourceIds: sources.split(",").map((value) => value.trim()).filter(Boolean),
        startSample: 0,
        endSample: Math.round(durationSeconds * sampleRate),
        sampleRate,
        bitDepth: format === "mp3" ? 16 : bitDepth,
        channels: 2,
        format,
        dither: format === "wav" && bitDepth === 16,
        createdBy: actorId,
      });
      next = engine.current.validate({ jobId: next.id, expectedHead: next.head, validatedBy: actorId });
      setJob(next);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Export could not be prepared.");
    }
  }

  function downloadManifest() {
    if (!job || job.state !== "validated") return;
    const payload = JSON.stringify({
      schema: "the-muzes-garden/render-manifest/v1",
      sessionId: session.id,
      sessionRevision: session.revision,
      preparedAt: new Date().toISOString(),
      render: job,
      audioWorkerStatus: "not-connected",
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
        <div><h2 className="text-2xl font-black">Delivery preparation</h2><p className="mt-2 max-w-2xl text-sm text-white/60">Validate a reproducible mix, stem, or selection render before it reaches an offline audio worker.</p></div>
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
      <div className="mt-4 flex flex-wrap gap-2"><button type="button" className={button} onClick={prepare}>Validate Render</button><button type="button" className={button} disabled={job?.state !== "validated"} onClick={downloadManifest}>Download Render Manifest</button></div>
      {error ? <p role="alert" className="mt-4 text-sm text-red-200">{error}</p> : null}
      {job ? <div className={`mt-4 rounded-2xl border p-4 ${job.state === "validated" ? "border-emerald-300/30 bg-emerald-300/[0.06]" : "border-amber-300/30 bg-amber-300/[0.06]"}`}><p className="font-black uppercase">{job.state}</p><p className="mt-1 text-sm text-white/60">{job.format.toUpperCase()} · {job.sampleRate} Hz · {job.bitDepth}-bit · {job.totalFrames.toLocaleString()} frames</p>{job.issues.length ? <ul className="mt-3 list-disc pl-5 text-sm text-amber-100">{job.issues.map((issue) => <li key={issue}>{issue}</li>)}</ul> : <p className="mt-2 text-sm text-emerald-200">Specification passed the Offline Render and Export Engine gate.</p>}</div> : null}
    </section>
  );
}