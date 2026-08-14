"use client";

import { useRef, useState } from "react";
import { uploadDawRenderSource } from "@/app/workspace/projects/[id]/projectDawApi";
import { requireProjectSupabase } from "@/app/workspace/projects/[id]/projectSupabase";
import {
  createTimelineDawMusicianImportPlan,
  timelineDawMusicianImportDescription,
  type TimelineDawMusicianImportKind,
} from "@/lib/timeline/TimelineDawMusicianImportPolicy";

const button = "rounded-xl border border-white/25 bg-white px-3 py-2 text-sm font-black text-black disabled:cursor-not-allowed disabled:opacity-40";
const field = "rounded-xl border border-white/15 bg-black px-3 py-2 text-sm text-white";
const kinds: TimelineDawMusicianImportKind[] = ["full-song", "stems", "alternate-versions"];
const labels = { "full-song": "Full Song", stems: "Stems", "alternate-versions": "Alternate Versions" } satisfies Record<TimelineDawMusicianImportKind, string>;

export default function TimelineDawMusicianImport({ sessionId }: { sessionId: string }) {
  const [kind, setKind] = useState<TimelineDawMusicianImportKind>("full-song");
  const [name, setName] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState({ done: 0, total: 0, duplicates: 0, failed: 0 });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelled = useRef(false);

  async function api(body: Record<string, unknown>) {
    const accessToken = (await requireProjectSupabase().auth.getSession()).data.session?.access_token ?? "";
    const response = await fetch("/api/timeline/daw-audio-families", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, ...body }),
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.error ?? "Audio import request failed.");
    return json;
  }

  async function runImport() {
    const plan = createTimelineDawMusicianImportPlan({ kind, files, requestedName: name });
    setBusy(true); setError(undefined); setMessage(undefined); cancelled.current = false;
    setProgress({ done: 0, total: files.length, duplicates: 0, failed: 0 });
    try {
      const { family } = await api({ action: "create-family", name: plan.familyName, description: `${labels[kind]} musician import. Original source audio is preserved.` });
      let cursor = 0, imported = 0, duplicates = 0, failed = 0;
      const worker = async () => {
        while (cursor < files.length && !cancelled.current) {
          const index = cursor++, file = files[index];
          try {
            const uploaded = await uploadDawRenderSource(sessionId, file);
            const result = await api({ action: "add-version", candidate: { name: file.name, byteLength: uploaded.source.byteLength, checksum: uploaded.source.checksum, role: plan.role, version: `Version ${index + 1}`, performer: null, origin: "musician-import", familyId: family.id, relationship: kind === "stems" ? "stem" : "alternate" }, source: uploaded.source, audio: uploaded.audio });
            if (result.duplicate) duplicates += 1; else imported += 1;
          } catch { failed += 1; }
          setProgress({ done: imported + duplicates + failed, total: files.length, duplicates, failed });
        }
      };
      await Promise.all(Array.from({ length: Math.min(3, files.length) }, worker));
      if (cancelled.current) throw new Error("Import stopped safely. Completed source copies remain protected.");
      if (!imported) throw new Error(duplicates ? "These files are already safely imported in this session." : "No audio files could be imported.");
      await api({ action: "create-lanes", familyId: family.id, mode: plan.laneMode });
      window.dispatchEvent(new CustomEvent("muzes:daw-family-lanes", { detail: { sessionId } }));
      setMessage(`${imported} ${imported === 1 ? "file" : "files"} imported into the arrangement. Originals are preserved.`);
      setFiles([]); setName(""); if (inputRef.current) inputRef.current.value = "";
    } finally { setBusy(false); }
  }

  return <section id="musician-audio-import" className="mt-4 rounded-2xl border border-cyan-300/30 bg-cyan-300/[0.06] p-4">
    <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">Step 1 · Bring in your music</p>
    <h3 className="mt-1 text-xl font-black">Import Into Arrangement</h3>
    <p className="mt-1 text-sm text-white/60">Choose what you are bringing in. Protected source copies and the correct lanes are created automatically.</p>
    <div className="mt-4 grid gap-2 sm:grid-cols-3">{kinds.map(value => <button key={value} type="button" disabled={busy} aria-pressed={kind === value} onClick={() => { setKind(value); setError(undefined); }} className={`rounded-xl border p-3 text-left ${kind === value ? "border-cyan-200 bg-cyan-200 text-black" : "border-white/15 bg-black text-white"}`}><span className="block font-black">{labels[value]}</span><span className={`mt-1 block text-xs ${kind === value ? "text-black/70" : "text-white/50"}`}>{timelineDawMusicianImportDescription(value)}</span></button>)}</div>
    <div className="mt-3 grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto]">
      <input className={field} value={name} disabled={busy} onChange={event => setName(event.target.value)} placeholder="Song or session name (optional)" aria-label="Song or session name" />
      <input ref={inputRef} className={field} type="file" multiple={kind !== "full-song"} accept=".wav,.mp3,audio/wav,audio/mpeg" disabled={busy} onChange={event => { setFiles(Array.from(event.target.files ?? [])); setError(undefined); }} aria-label={`Choose ${labels[kind]} audio files`} />
      <button type="button" className={button} disabled={busy || !files.length} onClick={() => void runImport().catch(cause => setError(cause instanceof Error ? cause.message : "Audio could not be imported."))}>{busy ? `Importing ${progress.done}/${progress.total}` : "Import Into Arrangement"}</button>
    </div>
    {busy ? <div className="mt-3 flex items-center gap-3 text-xs text-white/60"><progress className="h-2 flex-1" max={Math.max(1, progress.total)} value={progress.done} /><button type="button" className="font-black text-amber-200" onClick={() => { cancelled.current = true; }}>Stop safely</button></div> : null}
    <p className="mt-2 text-xs text-white/50">{files.length ? `${files.length} selected · ` : ""}Up to 3 files upload at once · duplicates are held · source audio is never overwritten.</p>
    {message ? <p role="status" className="mt-2 text-sm font-bold text-emerald-200">{message}</p> : null}
    {error ? <p role="alert" className="mt-2 text-sm font-bold text-red-200">{error}</p> : null}
  </section>;
}
