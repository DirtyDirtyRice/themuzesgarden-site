"use client";

import { useCallback, useEffect, useState } from "react";

import type { CodeCapsule, CodeCapsuleState } from "@/lib/developer-workspace/codeCapsule";
import type { CodeCapsuleActivationResult } from "@/lib/developer-workspace/codeCapsuleActivator";
import type { CodeCapsuleValidationResult } from "@/lib/developer-workspace/codeCapsuleValidator";

type ApiError = { error: string };
type CapsuleList = { capsules: CodeCapsule[]; count: number };
const states: CodeCapsuleState[] = ["draft", "incomplete", "waiting-validation", "validated", "active", "deprecated", "archived", "deleted"];

function isApiError(value: unknown): value is ApiError {
  return typeof value === "object" && value !== null && "error" in value && typeof value.error === "string";
}

async function capsuleRequest(payload: Record<string, unknown>): Promise<unknown> {
  const response = await fetch("/api/developer-workspace/code-capsules", {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body: unknown = await response.json();
  if (!response.ok || isApiError(body)) throw new Error(isApiError(body) ? body.error : "Code capsule request failed.");
  return body;
}

export default function DraftActivationWorkspace() {
  const [capsules, setCapsules] = useState<CodeCapsule[]>([]);
  const [selected, setSelected] = useState<CodeCapsule | null>(null);
  const [confirmationToken, setConfirmationToken] = useState<string | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetFile, setTargetFile] = useState("");
  const [startLine, setStartLine] = useState("1");
  const [endLine, setEndLine] = useState("1");
  const [expectedText, setExpectedText] = useState("");
  const [requirementKind, setRequirementKind] = useState<"text" | "symbol" | "import" | "export">("symbol");
  const [requirementValue, setRequirementValue] = useState("");
  const [fragment, setFragment] = useState("");
  const [fragmentNote, setFragmentNote] = useState("");

  const refresh = useCallback(async () => {
    const response = await fetch("/api/developer-workspace/code-capsules", { cache: "no-store" });
    const body: unknown = await response.json();
    if (!response.ok || isApiError(body)) throw new Error(isApiError(body) ? body.error : "Code capsules could not be loaded.");
    const next = (body as CapsuleList).capsules;
    setCapsules(next);
    setSelected((current) => current ? next.find((capsule) => capsule.id === current.id) ?? null : next[0] ?? null);
  }, []);

  useEffect(() => { void refresh().catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Code capsules could not be loaded.")); }, [refresh]);

  async function createCapsule() {
    setBusy("create"); setError("");
    try {
      const requirements = requirementValue.trim() ? [{ id: crypto.randomUUID(), kind: requirementKind, value: requirementValue.trim(), description: `Required ${requirementKind}: ${requirementValue.trim()}` }] : [];
      const capsule = await capsuleRequest({ action: "create", capsule: { title, description, target: { file: targetFile, startLine: Number(startLine), endLine: Number(endLine), expectedLines: expectedText.split(/\r?\n/) }, requirements } }) as CodeCapsule;
      setCapsules((current) => [capsule, ...current]); setSelected(capsule); setConfirmationToken(null);
      setTitle(""); setDescription(""); setTargetFile(""); setExpectedText(""); setRequirementValue("");
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Capsule creation failed."); }
    finally { setBusy(""); }
  }

  async function addFragment() {
    if (!selected) return;
    setBusy("fragment"); setError("");
    try {
      const updated = await capsuleRequest({ action: "add-fragment", id: selected.id, content: fragment, note: fragmentNote, expectedVersion: selected.version }) as CodeCapsule;
      setSelected(updated); setCapsules((current) => current.map((capsule) => capsule.id === updated.id ? updated : capsule)); setFragment(""); setFragmentNote(""); setConfirmationToken(null);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Fragment could not be stored."); }
    finally { setBusy(""); }
  }

  async function validateCapsule() {
    if (!selected) return;
    setBusy("validate"); setError(""); setConfirmationToken(null);
    try {
      const result = await capsuleRequest({ action: "validate", id: selected.id, expectedVersion: selected.version }) as CodeCapsuleValidationResult;
      setSelected(result.capsule); setCapsules((current) => current.map((capsule) => capsule.id === result.capsule.id ? result.capsule : capsule)); setConfirmationToken(result.confirmationToken);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Capsule validation failed."); }
    finally { setBusy(""); }
  }

  async function activateCapsule() {
    if (!selected || !confirmationToken) return;
    const confirmed = window.confirm(`Activate “${selected.title}” in ${selected.target.file}? Safe Patch will restore the original file if the global TypeScript check fails.`);
    if (!confirmed) return;
    setBusy("activate"); setError("");
    try {
      const result = await capsuleRequest({ action: "activate", id: selected.id, expectedVersion: selected.version, confirmationToken }) as CodeCapsuleActivationResult;
      setSelected(result.capsule); setCapsules((current) => current.map((capsule) => capsule.id === result.capsule.id ? result.capsule : capsule)); setConfirmationToken(null);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Capsule activation failed."); }
    finally { setBusy(""); }
  }

  return <section className="mt-4 rounded-xl border border-violet-300/25 bg-[#0b1720] p-5">
    <div><div className="text-xs font-black uppercase tracking-[0.28em] text-violet-300">Inactive code holding bin</div><h2 className="mt-1 text-2xl font-black">Draft / Activation Engine</h2><p className="mt-2 max-w-4xl text-sm text-white/60">Build incomplete code as timestamped fragments outside the live source tree. Validation assembles and typechecks it virtually. A second explicit confirmation is required before Safe Patch can activate it.</p></div>
    <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(300px,0.75fr)_minmax(420px,1.25fr)]">
      <div className="space-y-4">
        <details className="rounded-lg border border-white/10 bg-black/20 p-3"><summary className="cursor-pointer font-black text-violet-100">Create a code capsule</summary><div className="mt-3 space-y-2"><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Capsule title" className="w-full rounded border border-white/15 bg-black/30 px-3 py-2" /><textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What this code will become" className="w-full rounded border border-white/15 bg-black/30 px-3 py-2" /><input value={targetFile} onChange={(event) => setTargetFile(event.target.value)} placeholder="Target file, e.g. lib/timeline/TimelineTypes.ts" className="w-full rounded border border-white/15 bg-black/30 px-3 py-2" /><div className="grid grid-cols-2 gap-2"><input value={startLine} onChange={(event) => setStartLine(event.target.value)} type="number" min="1" className="rounded border border-white/15 bg-black/30 px-3 py-2" /><input value={endLine} onChange={(event) => setEndLine(event.target.value)} type="number" min="1" className="rounded border border-white/15 bg-black/30 px-3 py-2" /></div><textarea value={expectedText} onChange={(event) => setExpectedText(event.target.value)} placeholder="Exact current lines that activation may replace" className="min-h-24 w-full rounded border border-white/15 bg-black/30 px-3 py-2 font-mono text-xs" /><div className="grid grid-cols-[130px_1fr] gap-2"><select value={requirementKind} onChange={(event) => setRequirementKind(event.target.value as typeof requirementKind)} className="rounded border border-white/15 bg-[#071016] px-2"><option value="symbol">symbol</option><option value="import">import</option><option value="export">export</option><option value="text">text</option></select><input value={requirementValue} onChange={(event) => setRequirementValue(event.target.value)} placeholder="Optional required piece" className="rounded border border-white/15 bg-black/30 px-3 py-2" /></div><button type="button" onClick={() => void createCapsule()} disabled={busy !== ""} className="rounded border border-violet-300/50 px-4 py-2 text-sm font-black text-violet-100 disabled:opacity-40">{busy === "create" ? "Creating…" : "Create inactive capsule"}</button></div></details>
        <div className="max-h-96 space-y-2 overflow-y-auto">{capsules.map((capsule) => <button key={capsule.id} type="button" onClick={() => { setSelected(capsule); setConfirmationToken(null); }} className={`w-full rounded-lg border p-3 text-left ${selected?.id === capsule.id ? "border-violet-300/60 bg-violet-300/10" : "border-white/10 bg-black/20"}`}><div className="flex justify-between gap-2"><span className="font-bold">{capsule.title}</span><span className="text-xs uppercase text-violet-100/65">{capsule.state}</span></div><div className="mt-1 truncate text-xs text-white/40">{capsule.target.file}:{capsule.target.startLine}-{capsule.target.endLine}</div><div className="mt-1 text-xs text-white/35">{capsule.fragments.length} fragment(s) · updated {new Date(capsule.updatedAt).toLocaleString()}</div></button>)}</div>
      </div>
      <div className="min-w-0 rounded-lg border border-white/10 bg-black/20 p-4">{selected ? <><div className="flex flex-wrap gap-1">{states.map((state) => <span key={state} className={`rounded border px-2 py-1 text-[10px] font-black uppercase ${state === selected.state ? "border-violet-200 bg-violet-200 text-black" : "border-white/10 text-white/30"}`}>{state}</span>)}</div><h3 className="mt-4 text-xl font-black">{selected.title}</h3><div className="mt-1 font-mono text-xs text-violet-100/60">{selected.id}</div><div className="mt-4 space-y-2">{selected.fragments.map((item) => <div key={item.id} className="rounded border border-white/10 p-3"><div className="flex justify-between gap-2 text-xs text-white/40"><span>Fragment {item.order + 1} · {item.note || "no note"}</span><span>{new Date(item.createdAt).toLocaleString()}</span></div><pre className="mt-2 overflow-auto whitespace-pre-wrap text-xs text-white/75">{item.content}</pre></div>)}</div>{["draft", "incomplete", "waiting-validation", "validated"].includes(selected.state) ? <div className="mt-4 rounded border border-white/10 p-3"><textarea value={fragment} onChange={(event) => setFragment(event.target.value)} placeholder="Add the next inactive code fragment" className="min-h-32 w-full rounded border border-white/15 bg-black/30 px-3 py-2 font-mono text-xs" /><input value={fragmentNote} onChange={(event) => setFragmentNote(event.target.value)} placeholder="What piece does this fragment add?" className="mt-2 w-full rounded border border-white/15 bg-black/30 px-3 py-2" /><button type="button" onClick={() => void addFragment()} disabled={busy !== "" || !fragment.trim()} className="mt-2 rounded border border-violet-300/40 px-3 py-2 text-sm font-black text-violet-100 disabled:opacity-40">{busy === "fragment" ? "Storing…" : "Store inactive fragment"}</button></div> : null}<div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => void validateCapsule()} disabled={busy !== "" || !selected.fragments.length || !["incomplete", "waiting-validation", "validated"].includes(selected.state)} className="rounded border border-cyan-300/50 px-4 py-2 text-sm font-black text-cyan-100 disabled:opacity-40">{busy === "validate" ? "Validating virtual project…" : "Validate assembled code"}</button>{selected.state === "validated" && confirmationToken ? <button type="button" onClick={() => void activateCapsule()} disabled={busy !== ""} className="rounded border border-emerald-300/60 bg-emerald-300/10 px-4 py-2 text-sm font-black text-emerald-100 disabled:opacity-40">{busy === "activate" ? "Activating and typechecking…" : "Confirm activation"}</button> : null}</div>{selected.validation ? <div className={`mt-4 rounded border p-3 text-sm ${selected.validation.projectTypecheckPassed ? "border-emerald-300/30 bg-emerald-300/5" : "border-red-300/30 bg-red-300/5"}`}><div className="font-black">{selected.validation.projectTypecheckPassed ? "Validation passed" : "Validation incomplete"}</div><div className="mt-1 text-xs text-white/50">syntax {selected.validation.syntaxPassed ? "passed" : "failed"} · requirements {selected.validation.requirementsPassed ? "passed" : "failed"} · project typecheck {selected.validation.projectTypecheckPassed ? "passed" : "failed"}</div>{selected.validation.diagnostics.length ? <div className="mt-2 space-y-1 font-mono text-xs text-red-100/75">{selected.validation.diagnostics.slice(0, 20).map((diagnostic) => <div key={diagnostic}>{diagnostic}</div>)}</div> : null}</div> : null}<details className="mt-4"><summary className="cursor-pointer text-sm font-black text-violet-100">Lifecycle ledger · {selected.transitions.length}</summary><div className="mt-2 space-y-2">{selected.transitions.map((transition) => <div key={transition.id} className="rounded border border-white/10 px-3 py-2 text-xs"><div className="font-bold">{transition.from ?? "created"} → {transition.to}</div><div className="mt-1 text-white/40">{new Date(transition.occurredAt).toLocaleString()} · {transition.actor} · {transition.reason}</div></div>)}</div></details></> : <div className="p-10 text-center text-sm text-white/35">Create or choose a capsule to assemble inactive code.</div>}</div>
    </div>{error ? <div className="mt-4 rounded border border-red-400/40 bg-red-400/10 p-3 text-sm text-red-100">{error}</div> : null}
  </section>;
}
