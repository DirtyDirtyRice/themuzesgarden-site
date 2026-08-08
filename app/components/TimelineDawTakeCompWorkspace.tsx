"use client";

import { useEffect, useRef, useState } from "react";
import {
  createDawRecordingTakeAudition,
  deleteDawTakeComp,
  loadDawTakeComps,
  loadDawTakeCompDelivery,
  renderDawTakeComp,
  saveDawTakeComp,
  type DawRecordingTake,
  type DawTakeComp,
  type DawTakeCompRegion,
} from "@/app/workspace/projects/[id]/projectDawApi";

const control = "rounded-xl border border-white/25 bg-white px-3 py-2 text-sm font-black text-black disabled:cursor-not-allowed disabled:opacity-40";

export default function TimelineDawTakeCompWorkspace({ sessionId, takes }: { sessionId: string; takes: DawRecordingTake[] }) {
  const [comps, setComps] = useState<DawTakeComp[]>([]);
  const [compId, setCompId] = useState<string>();
  const [name, setName] = useState("New Take Comp");
  const [regions, setRegions] = useState<DawTakeCompRegion[]>([]);
  const [busy, setBusy] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [error, setError] = useState<string>();
  const [renderingCompId, setRenderingCompId] = useState<string>();
  const [renderProgress, setRenderProgress] = useState<Record<string, number>>({});
  const [deliveryUrls, setDeliveryUrls] = useState<Record<string, string>>({});
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewRunRef = useRef(0);
  const previewResolveRef = useRef<(() => void) | undefined>(undefined);

  useEffect(() => {
    let active = true;
    void loadDawTakeComps(sessionId)
      .then(({ comps: stored }) => { if (active) setComps(stored); })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Take comps could not be loaded."); });
    return () => { active = false; previewAudioRef.current?.pause(); };
  }, [sessionId]);

  function toggleTake(take: DawRecordingTake) {
    setRegions((current) => current.some((region) => region.takeId === take.id)
      ? current.filter((region) => region.takeId !== take.id)
      : [...current, { takeId: take.id, startSeconds: 0, endSeconds: take.audio.durationSeconds }]);
  }

  function updateRegion(index: number, patch: Partial<DawTakeCompRegion>) {
    setRegions((current) => current.map((region, candidate) => candidate === index ? { ...region, ...patch } : region));
  }

  function moveRegion(index: number, direction: -1 | 1) {
    setRegions((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function editComp(comp: DawTakeComp) {
    setCompId(comp.id);
    setName(comp.name);
    setRegions(comp.regions);
    setError(undefined);
  }

  async function saveComp() {
    setBusy(true);
    setError(undefined);
    try {
      const { comp } = await saveDawTakeComp({ sessionId, compId, name, regions });
      setComps((current) => [comp, ...current.filter((candidate) => candidate.id !== comp.id)]);
      editComp(comp);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Take comp could not be saved.");
    } finally { setBusy(false); }
  }

  async function renderComp(comp: DawTakeComp) {
    setBusy(true);
    setRenderingCompId(comp.id);
    setRenderProgress((current) => ({ ...current, [comp.id]: 5 }));
    setError(undefined);
    try {
      const result = await renderDawTakeComp(sessionId, comp.id);
      setComps((current) => [result.comp, ...current.filter((candidate) => candidate.id !== comp.id)]);
      setDeliveryUrls((current) => ({ ...current, [comp.id]: result.deliveryUrl }));
      setRenderProgress((current) => ({ ...current, [comp.id]: result.progress.at(-1)?.percent ?? 100 }));
      if (compId === comp.id) editComp(result.comp);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Take comp could not be rendered.");
      setRenderProgress((current) => { const next = { ...current }; delete next[comp.id]; return next; });
    } finally { setRenderingCompId(undefined); setBusy(false); }
  }

  async function loadDelivery(comp: DawTakeComp) {
    setBusy(true);
    setError(undefined);
    try {
      const { deliveryUrl } = await loadDawTakeCompDelivery(sessionId, comp.id);
      setDeliveryUrls((current) => ({ ...current, [comp.id]: deliveryUrl }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Rendered comp delivery could not be prepared.");
    } finally { setBusy(false); }
  }

  async function removeComp(comp: DawTakeComp) {
    if (!window.confirm(`Delete the comp recipe “${comp.name}”? Private master takes will not be changed.`)) return;
    setBusy(true);
    setError(undefined);
    try {
      await deleteDawTakeComp(sessionId, comp.id);
      setComps((current) => current.filter((candidate) => candidate.id !== comp.id));
      if (compId === comp.id) { setCompId(undefined); setName("New Take Comp"); setRegions([]); }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Take comp could not be deleted.");
    } finally { setBusy(false); }
  }

  async function previewComp() {
    const run = previewRunRef.current + 1;
    previewRunRef.current = run;
    setBusy(true);
    setPreviewing(true);
    setError(undefined);
    try {
      for (const region of regions) {
        if (previewRunRef.current !== run) break;
        const { auditionUrl } = await createDawRecordingTakeAudition(sessionId, region.takeId);
        await new Promise<void>((resolve, reject) => {
          const audio = new Audio(auditionUrl);
          previewAudioRef.current = audio;
          previewResolveRef.current = resolve;
          audio.currentTime = region.startSeconds;
          audio.ontimeupdate = () => { if (audio.currentTime >= region.endSeconds) { audio.pause(); resolve(); } };
          audio.onended = () => resolve();
          audio.onerror = () => reject(new Error("A comp region could not be auditioned."));
          void audio.play().catch(reject);
        });
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Comp preview could not be played.");
    } finally { previewAudioRef.current = null; previewResolveRef.current = undefined; setPreviewing(false); setBusy(false); }
  }

  function stopPreview() {
    previewRunRef.current += 1;
    previewAudioRef.current?.pause();
    previewResolveRef.current?.();
    previewAudioRef.current = null;
    setPreviewing(false);
    setBusy(false);
  }

  const takeById = new Map(takes.map((take) => [take.id, take]));
  return (
    <div className="mt-6 rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.04] p-4">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">Take comping</p>
      <h3 className="mt-1 text-xl font-black">Non-destructive comp recipe</h3>
      <p className="mt-1 text-sm text-white/55">Select at least two takes, trim their source regions, order the edit list, then save or preview it. Private masters remain untouched.</p>
      {comps.length ? <div className="mt-3 grid gap-2">{comps.map((comp) => <div key={comp.id} className="rounded-xl border border-white/15 bg-black p-3"><div className="flex flex-wrap items-center gap-2"><button type="button" className="text-sm font-black text-white underline decoration-white/30" onClick={() => editComp(comp)}>{comp.name}</button>{comp.render ? <span className="text-xs font-black text-emerald-200">Rendered {comp.render.durationSeconds.toFixed(2)}s · {(comp.render.byteLength / 1_048_576).toFixed(2)} MB</span> : <span className="text-xs text-white/45">Recipe only</span>}{renderProgress[comp.id] !== undefined ? <span className="text-xs font-black text-cyan-200">Render {renderProgress[comp.id]}%</span> : null}</div><div className="mt-2 flex flex-wrap gap-2"><button type="button" className={control} disabled={busy} onClick={() => void renderComp(comp)}>{renderingCompId === comp.id ? "Rendering…" : comp.render ? "Render Again" : "Render WAV"}</button>{comp.render ? <button type="button" className={control} disabled={busy} onClick={() => void loadDelivery(comp)}>{deliveryUrls[comp.id] ? "Refresh Delivery" : "Audition & Download"}</button> : null}<button type="button" className={control} disabled={busy} onClick={() => void removeComp(comp)}>Delete Recipe</button></div>{deliveryUrls[comp.id] ? <><audio className="mt-2 w-full" controls preload="metadata" src={deliveryUrls[comp.id]} /><a className="mt-2 inline-block text-sm font-black text-cyan-200" href={deliveryUrls[comp.id]} download={`${comp.name}.wav`}>Download rendered WAV</a></> : null}</div>)}</div> : null}
      <label className="mt-4 grid gap-1 text-xs font-black uppercase tracking-wide text-white/60">Comp name<input className="rounded-xl border border-white/20 bg-black px-3 py-2 text-sm normal-case tracking-normal text-white" maxLength={120} value={name} onChange={(event) => setName(event.target.value)} disabled={busy} /></label>
      <div className="mt-3 flex flex-wrap gap-2">{takes.map((take) => <label key={take.id} className="flex items-center gap-2 rounded-xl border border-white/15 bg-black px-3 py-2 text-sm"><input type="checkbox" checked={regions.some((region) => region.takeId === take.id)} onChange={() => toggleTake(take)} disabled={busy} />{take.name} ({take.audio.durationSeconds.toFixed(2)}s)</label>)}</div>
      {regions.length ? <ol className="mt-4 grid gap-2">{regions.map((region, index) => { const take = takeById.get(region.takeId); return <li key={region.takeId} className="grid gap-2 rounded-xl border border-white/10 bg-black/70 p-3 md:grid-cols-[1fr_auto_auto_auto]"><div><p className="font-black">{index + 1}. {take?.name ?? "Unavailable take"}</p><p className="text-xs text-white/45">Source region; output begins after the previous region.</p></div><label className="text-xs text-white/55">Start (s)<input className="block w-28 rounded-lg border border-white/20 bg-black px-2 py-1 text-white" type="number" min={0} max={take?.audio.durationSeconds} step="0.01" value={region.startSeconds} onChange={(event) => updateRegion(index, { startSeconds: Number(event.target.value) })} /></label><label className="text-xs text-white/55">End (s)<input className="block w-28 rounded-lg border border-white/20 bg-black px-2 py-1 text-white" type="number" min={0} max={take?.audio.durationSeconds} step="0.01" value={region.endSeconds} onChange={(event) => updateRegion(index, { endSeconds: Number(event.target.value) })} /></label><div className="flex gap-1"><button type="button" className={control} disabled={busy || index === 0} onClick={() => moveRegion(index, -1)}>Up</button><button type="button" className={control} disabled={busy || index === regions.length - 1} onClick={() => moveRegion(index, 1)}>Down</button></div></li>; })}</ol> : null}
      {error ? <p role="alert" className="mt-3 text-sm text-red-200">{error}</p> : null}
      <div className="mt-4 flex flex-wrap gap-2"><button type="button" className={control} disabled={busy || !name.trim() || regions.length < 2} onClick={() => void saveComp()}>{compId ? "Update Comp" : "Save Comp"}</button><button type="button" className={control} disabled={busy || regions.length < 2} onClick={() => void previewComp()}>Preview Ordered Comp</button>{previewing ? <button type="button" className={control} onClick={stopPreview}>Stop Preview</button> : null}<button type="button" className={control} disabled={busy} onClick={() => { setCompId(undefined); setName("New Take Comp"); setRegions([]); }}>New Comp</button></div>
    </div>
  );
}
