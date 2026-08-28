"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  TimelineOfflineRenderJob,
  TimelineRenderFormat,
  TimelineRenderTarget,
} from "../../../../lib/timeline/TimelineOfflineRenderAndExportEngine";
import { executeDawStemPackage, executeDawWavRender, loadDawRenderDelivery, loadDawRenders, prepareDawRender, ProjectDawApiError, uploadDawRenderSource } from "./projectDawApi";
import ProjectDawInterchangeWorkspace from "./ProjectDawInterchangeWorkspace";
import { DAW_RECORDED_SOURCE_EVENT, type DawRecordedSourceEventDetail } from "@/lib/timeline/TimelineDawRecordedSourceEvent";
import {
  getTimelineDawExportPreset,
  timelineDawExportPresets,
  type TimelineDawExportPresetId,
} from "@/lib/timeline/TimelineDawExportPresetPolicy";
import { evaluateTimelineDawExportPreflight } from "@/lib/timeline/TimelineDawExportReliabilityPolicy";
import { createTimelineDawDownloadVerificationReceipt, parseTimelineDawDownloadVerificationReceipt, verifyTimelineDawDownloadedArtifact } from "@/lib/timeline/TimelineDawDownloadVerification";

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
  const [channels, setChannels] = useState(2);
  const [bitDepth, setBitDepth] = useState<16 | 24 | 32>(24);
  const [deliveryPresetId, setDeliveryPresetId] = useState<TimelineDawExportPresetId>("streaming");
  const [targetLufs, setTargetLufs] = useState(-14);
  const [truePeakDbtp, setTruePeakDbtp] = useState(-1);
  const [durationSeconds, setDurationSeconds] = useState(180);
  const [sources, setSources] = useState("");
  const [sourceFiles, setSourceFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deliveryUrls, setDeliveryUrls] = useState<Record<string, string>>({});
  const [jobs, setJobs] = useState<TimelineOfflineRenderJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<TimelineOfflineRenderJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [downloadVerification, setDownloadVerification] = useState<Record<string, { verified: boolean; name: string; byteLength: number; checksum: string; verifiedAt: string }>>({});
  const [receiptVerification, setReceiptVerification] = useState<{ name: string; jobId: string; fileName: string; byteLength: number } | null>(null);
  const exportPreflight = useMemo(
    () => selectedJob ? evaluateTimelineDawExportPreflight(selectedJob) : null,
    [selectedJob],
  );

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

  useEffect(() => { queueMicrotask(() => void load()); }, [load]);
  useEffect(() => {
    const receive = (event: Event) => {
      const detail = (event as CustomEvent<DawRecordedSourceEventDetail>).detail;
      if (!detail?.source?.uri) return;
      setSources((current) => {
        const values = current.split(",").map((value) => value.trim()).filter(Boolean);
        return [...new Set([...values, detail.source.uri])].join(", ");
      });
      setSampleRate(detail.audio.sampleRate);
      setChannels(detail.audio.channelCount);
      setDurationSeconds(Math.max(0.001, Math.floor(detail.audio.durationSeconds * 1000) / 1000));
      setNotice("Recorded WAV was added to the private render sources.");
      setError(null);
    };
    window.addEventListener(DAW_RECORDED_SOURCE_EVENT, receive);
    return () => window.removeEventListener(DAW_RECORDED_SOURCE_EVENT, receive);
  }, []);

  async function uploadSources() {
    if (!sourceFiles.length) return;
    setUploading(true);
    setError(null);
    setNotice(null);
    try {
      const uploaded = [];
      for (const file of sourceFiles) {
        uploaded.push(await uploadDawRenderSource(session.id, file));
      }
      const sampleRates = new Set(uploaded.map((item) => item.audio.sampleRate));
      const channelCounts = new Set(uploaded.map((item) => item.audio.channelCount));
      if (sampleRates.size !== 1 || channelCounts.size !== 1) {
        throw new Error("Uploaded audio sources must share one sample rate and channel count.");
      }
      setSampleRate(uploaded[0].audio.sampleRate);
      setChannels(uploaded[0].audio.channelCount);
      setDurationSeconds(Math.max(0.001, Math.floor(Math.min(...uploaded.map((item) => item.audio.durationSeconds)) * 1000) / 1000));
      setSources(uploaded.map((item) => item.source.uri).join(", "));
      setNotice(`${uploaded.length} private audio source${uploaded.length === 1 ? "" : "s"} uploaded at ${uploaded[0].audio.sampleRate.toLocaleString()} Hz.`);
      setSourceFiles([]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Audio sources could not be uploaded.");
    } finally {
      setUploading(false);
    }
  }

  async function execute(job: TimelineOfflineRenderJob) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const command = {
        sessionId: session.id,
        jobId: job.id,
        expectedWorkspaceRevision: workspaceRevision,
      };
      const result = job.target === "stem"
        ? await executeDawStemPackage(command)
        : await executeDawWavRender(command);
      setJobs((current) => current.map((candidate) =>
        candidate.id === job.id ? result.receipt.job : candidate));
      setSelectedJob(result.receipt.job);
      setDeliveryUrls((current) => ({ ...current, [job.id]: result.receipt.deliveryUrl }));
      onWorkspaceRevision(result.receipt.workspaceRevision);
      const updates = "progress" in result.receipt
        ? result.receipt.progress.length
        : result.receipt.progressUpdates;
      const packageDetail = "stems" in result.receipt
        ? ` ${result.receipt.stems.length} fingerprinted stems were packaged.`
        : "";
      setNotice(`PCM rendering completed after ${updates} durable progress update${updates === 1 ? "" : "s"}.${packageDetail}`);
    } catch (cause) {
      if (cause instanceof ProjectDawApiError && cause.status === 409) {
        await load();
        setNotice("The workspace changed. Render history was reloaded; review it and retry.");
      } else {
        const message = cause instanceof Error ? cause.message : "PCM WAV execution failed.";
        await load();
        setError(message);
      }
    } finally {
      setBusy(false);
    }
  }
  async function prepare() {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const receipt = await prepareDawRender({
        sessionId: session.id, expectedWorkspaceRevision: workspaceRevision, name, target,
        sourceIds: sources.split(",").map((value) => value.trim()).filter(Boolean),
        startSample: 0, endSample: Math.round(durationSeconds * sampleRate), sampleRate,
        bitDepth: format === "mp3" ? 16 : bitDepth, channels, format,
        dither: format === "wav" && bitDepth === 16,
        deliveryPresetId, targetLufs, truePeakDbtp, normalizePeakDb: truePeakDbtp,
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

  async function refreshDelivery(job: TimelineOfflineRenderJob) {
    setError(null);
    try {
      const result = await loadDawRenderDelivery(session.id, job.id);
      setDeliveryUrls((current) => ({ ...current, [job.id]: result.deliveryUrl }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Private WAV delivery could not be prepared.");
    }
  }
  function downloadManifest(job: TimelineOfflineRenderJob | null) {
    if (!job || job.state !== "validated") return;
    const payload = JSON.stringify({
      schema: "the-muzes-garden/render-manifest/v1", sessionId: session.id,
      sessionRevision: session.revision, preparedAt: new Date().toISOString(),
      render: job, audioWorkerStatus: "connected",
    }, null, 2);
    const url = URL.createObjectURL(new Blob([payload], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${job.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "render"}.render.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function verifyDownload(job: TimelineOfflineRenderJob, file: File) {
    if (!job.checksum) return;
    setError(null);
    try {
      const result = await verifyTimelineDawDownloadedArtifact(new Uint8Array(await file.arrayBuffer()), job.checksum);
      setDownloadVerification((current) => ({ ...current, [job.id]: { verified: result.verified, name: file.name, byteLength: result.byteLength, checksum: result.actualChecksum, verifiedAt: new Date().toISOString() } }));
      if (!result.verified) setError(`${file.name} does not match the completed render. Download a fresh copy before delivery.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Downloaded file could not be verified.");
    }
  }

  async function downloadVerificationReceipt(job: TimelineOfflineRenderJob) {
    const verification = downloadVerification[job.id];
    if (!verification?.verified) return;
    const receipt = await createTimelineDawDownloadVerificationReceipt({ sessionId: session.id, jobId: job.id, target: job.target, fileName: verification.name, byteLength: verification.byteLength, checksum: verification.checksum, verifiedAt: verification.verifiedAt });
    const url = URL.createObjectURL(new Blob([JSON.stringify(receipt, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${job.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "render"}.verification.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function verifyReceiptFile(file: File) {
    setError(null);
    setReceiptVerification(null);
    try {
      const receipt = await parseTimelineDawDownloadVerificationReceipt(await file.text(), session.id);
      setReceiptVerification({ name: file.name, jobId: receipt.jobId, fileName: receipt.fileName, byteLength: receipt.byteLength });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Verification receipt could not be validated.");
    }
  }

  return (
    <section className="rounded-3xl border border-white/15 bg-[#080808] p-5 sm:p-7">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-300">Render &amp; Export</p>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div><h2 className="text-2xl font-black">Delivery preparation</h2><p className="mt-2 max-w-2xl text-sm text-white/60">Upload real WAV sources, validate a reproducible specification, and produce a private fingerprinted PCM delivery.</p></div>
        <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs font-black uppercase text-amber-200">PCM WAV worker connected</span>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <label className="rounded-xl border border-emerald-300/25 bg-emerald-300/[0.06] p-3 md:col-span-2 xl:col-span-3">
          <span className="text-xs font-black uppercase tracking-wider text-emerald-200">Delivery preset</span>
          <select
            className={`${field} mt-2 w-full`}
            value={deliveryPresetId}
            onChange={(event) => {
              const preset = getTimelineDawExportPreset(event.target.value);
              setDeliveryPresetId(preset.id);
              setTarget(preset.target); setFormat(preset.format); setSampleRate(preset.sampleRate);
              setBitDepth(preset.bitDepth); setChannels(preset.channels);
              setTargetLufs(preset.targetLufs); setTruePeakDbtp(preset.truePeakDbtp);
            }}
            aria-label="Musician export preset"
          >
            {timelineDawExportPresets.map((preset) => (
              <option key={preset.id} value={preset.id}>{preset.name}</option>
            ))}
          </select>
          <span className="mt-2 block text-xs text-white/50">
            {getTimelineDawExportPreset(deliveryPresetId).description}
          </span>
        </label>
        <input className={field} value={name} onChange={(event) => setName(event.target.value)} aria-label="Export name" />
        <select className={field} value={target} onChange={(event) => setTarget(event.target.value as TimelineRenderTarget)} aria-label="Export target"><option value="mix">Full mix</option><option value="stem">Stems</option><option value="selection">Selection</option></select>
        <select className={field} value={format} onChange={(event) => setFormat(event.target.value as TimelineRenderFormat)} aria-label="Export format"><option value="wav">WAV</option><option value="flac">FLAC</option><option value="mp3">MP3</option></select>
        <select className={field} value={sampleRate} onChange={(event) => setSampleRate(Number(event.target.value))} aria-label="Sample rate"><option value={44100}>44.1 kHz</option><option value={48000}>48 kHz</option><option value={96000}>96 kHz</option></select>
        <select className={field} value={channels} onChange={(event) => setChannels(Number(event.target.value))} aria-label="Channel count"><option value={1}>Mono</option><option value={2}>Stereo</option></select>
        <select className={field} value={format === "mp3" ? 16 : bitDepth} disabled={format === "mp3"} onChange={(event) => setBitDepth(Number(event.target.value) as 16 | 24 | 32)} aria-label="Bit depth"><option value={16}>16-bit</option><option value={24}>24-bit</option><option value={32}>32-bit float</option></select>
        <label className="rounded-xl border border-white/20 bg-black px-3 py-2 text-xs font-black text-white/55">
          Loudness target
          <span className="flex items-center gap-2"><input className="mt-1 w-full bg-transparent text-white outline-none" type="number" min={-36} max={-5} step={0.1} value={targetLufs} onChange={(event) => setTargetLufs(Number(event.target.value))} aria-label="Integrated loudness target" /> LUFS</span>
        </label>
        <label className="rounded-xl border border-white/20 bg-black px-3 py-2 text-xs font-black text-white/55">
          True-peak ceiling
          <span className="flex items-center gap-2"><input className="mt-1 w-full bg-transparent text-white outline-none" type="number" min={-12} max={0} step={0.1} value={truePeakDbtp} onChange={(event) => setTruePeakDbtp(Number(event.target.value))} aria-label="True peak ceiling" /> dBTP</span>
        </label>
        <input className={field} type="number" min={0.001} step={0.001} value={durationSeconds} onChange={(event) => setDurationSeconds(Number(event.target.value))} aria-label="Duration in seconds" />
        <input className={`${field} md:col-span-2 xl:col-span-3`} value={sources} readOnly aria-label="Private render source identifiers" placeholder="Upload one or more WAV sources below" />
        <input className={`${field} md:col-span-2 xl:col-span-3`} type="file" multiple accept=".wav,.mp3,audio/wav,audio/mpeg" onChange={(event) => setSourceFiles(Array.from(event.target.files ?? []))} aria-label="WAV or MP3 render source files" />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className={button} disabled={uploading || busy || !sourceFiles.length} onClick={() => void uploadSources()}>{uploading ? "Uploadingâ€¦" : "Upload Private Audio Sources"}</button>
        <button type="button" className={button} disabled={busy || loading || !sources} onClick={() => void prepare()}>{busy ? "Workingâ€¦" : "Validate & Save Render"}</button>
        <button type="button" className={button} disabled={busy || selectedJob?.state !== "validated" || selectedJob.format !== "wav" || exportPreflight?.safe === false} onClick={() => selectedJob && void execute(selectedJob)}>{selectedJob?.target === "stem" ? "Render Stem ZIP" : "Render PCM WAV"}</button>
        <button type="button" className={button} disabled={selectedJob?.state !== "validated"} onClick={() => downloadManifest(selectedJob)}>Download Selected Manifest</button>
        <label className={`${button} cursor-pointer`}>Verify Receipt File<input className="sr-only" type="file" accept=".json,application/json" onChange={(event) => { const file = event.target.files?.[0]; if (file) void verifyReceiptFile(file); event.target.value = ""; }} /></label>
      </div>
      {exportPreflight ? <p className={`mt-4 rounded-xl border px-3 py-2 text-sm ${exportPreflight.safe ? "border-emerald-300/25 bg-emerald-300/[.05] text-emerald-100" : "border-amber-300/30 bg-amber-300/[.07] text-amber-100"}`}><b>{exportPreflight.safe ? "Export size preflight passed." : "Export size preflight held this render."}</b> {exportPreflight.message}</p> : null}
      {error ? <p role="alert" className="mt-4 text-sm text-red-200">{error}</p> : null}
      {notice ? <p role="status" className="mt-4 text-sm text-emerald-200">{notice}</p> : null}
      {receiptVerification ? <p role="status" className="mt-4 rounded-xl border border-cyan-300/25 bg-cyan-300/[.05] px-3 py-2 text-sm text-cyan-100"><b>Receipt verified for this session.</b> {receiptVerification.name} proves {receiptVerification.fileName} ({(receiptVerification.byteLength / 1_048_576).toFixed(2)} MB) for render {receiptVerification.jobId}.</p> : null}
      <div className="mt-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div><p className="text-xs font-black uppercase tracking-wider text-white/40">Saved render history</p><h3 className="mt-1 text-xl font-black">{loading ? "Loadingâ€¦" : `${jobs.length} saved render${jobs.length === 1 ? "" : "s"}`}</h3></div>
          <button type="button" className="text-sm font-bold text-white/60 hover:text-white disabled:opacity-40" disabled={loading || busy} onClick={() => void load()}>Reload history</button>
        </div>
        {!loading && jobs.length === 0 ? <p className="mt-3 text-sm text-white/50">No render specifications have been saved for this session.</p> : null}
        <ol className="mt-3 grid gap-2">
          {[...jobs].reverse().map((job) => (
            <li key={job.id}>
              <div className={`rounded-2xl border p-4 ${selectedJob?.id === job.id ? "border-emerald-300/50 bg-emerald-300/[0.08]" : "border-white/10 bg-white/[0.03]"}`}>
                <button type="button" onClick={() => setSelectedJob(job)} className="w-full text-left">
                <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-black">{job.name}</span><span className="text-xs font-black uppercase text-emerald-200">{job.state}</span></div>
                <p className="mt-1 text-sm text-white/55">{job.target} Â· {job.format.toUpperCase()} Â· {job.sampleRate.toLocaleString()} Hz Â· {job.bitDepth}-bit Â· {job.totalFrames.toLocaleString()} frames</p>
                {job.targetLufs != null ? <p className="mt-1 text-xs font-bold text-emerald-200">Target {job.targetLufs} LUFS · ceiling {job.truePeakDbtp} dBTP · {job.deliveryPresetId ?? "custom"}</p> : null}
                <p className="mt-1 text-xs text-white/35">{job.id} Â· {job.renderedFrames.toLocaleString()}/{job.totalFrames.toLocaleString()} frames</p>
                </button>
                {deliveryUrls[job.id] ? <a className="mt-3 inline-block text-sm font-black text-emerald-200 underline" href={deliveryUrls[job.id]}>{job.target === "stem" ? "Download private stem ZIP" : "Download private WAV"}</a> : job.state === "completed" ? <button type="button" className="mt-3 text-sm font-black text-emerald-200 underline" onClick={() => void refreshDelivery(job)}>{job.target === "stem" ? "Create private ZIP link" : "Create private WAV link"}</button> : null}
                {job.state === "completed" && job.checksum ? <label className="ml-3 mt-3 inline-block cursor-pointer text-sm font-black text-cyan-200 underline">Verify downloaded file<input className="sr-only" type="file" accept={job.target === "stem" ? ".zip,application/zip" : ".wav,audio/wav"} onChange={(event) => { const file = event.target.files?.[0]; if (file) void verifyDownload(job, file); event.target.value = ""; }} /></label> : null}
                {downloadVerification[job.id] ? <p className={`mt-2 text-xs font-black ${downloadVerification[job.id].verified ? "text-emerald-200" : "text-red-200"}`}>{downloadVerification[job.id].verified ? "Verified local download" : "Download mismatch"} · {downloadVerification[job.id].name} · {(downloadVerification[job.id].byteLength / 1_048_576).toFixed(2)} MB</p> : null}
                {downloadVerification[job.id]?.verified ? <button type="button" className="mt-2 block text-xs font-black text-cyan-200 underline" onClick={() => void downloadVerificationReceipt(job)}>Download Verification Receipt</button> : null}
              </div>
            </li>
          ))}
        </ol>
      </div>
      <ProjectDawInterchangeWorkspace
        session={session}
        jobs={jobs}
        workspaceRevision={workspaceRevision}
        onWorkspaceRevision={onWorkspaceRevision}
      />
    </section>
  );
}
