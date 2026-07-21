"use client";

import { FormEvent, useEffect, useState } from "react";

type Configuration = { configured: boolean; model: string };
type AssistantResponse = { answer: string; model: string; citations: Array<{ path: string; startLine: number; endLine: number; reason: string }>; contextCharacters: number; context: { symbols: number; files: number; excerpts: number } };
type Exchange = { question: string; response: AssistantResponse };
type ApiError = { error: string };
function isApiError(value: unknown): value is ApiError { return typeof value === "object" && value !== null && "error" in value && typeof value.error === "string"; }

export default function AiCodingAssistant() {
  const [configuration, setConfiguration] = useState<Configuration | null>(null);
  const [question, setQuestion] = useState("Explain how TimelineEngine is initialized and cite the relevant code.");
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void fetch("/api/developer-workspace/assistant", { cache: "no-store" })
      .then(async (response) => {
        const body: unknown = await response.json();
        if (!response.ok || isApiError(body)) throw new Error(isApiError(body) ? body.error : "Assistant status failed.");
        setConfiguration(body as Configuration);
      })
      .catch((statusError) => setError(statusError instanceof Error ? statusError.message : "Assistant status failed."));
  }, []);

  async function ask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanQuestion = question.trim();
    if (!cleanQuestion || loading || !configuration?.configured) return;
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/developer-workspace/assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: cleanQuestion }) });
      const body: unknown = await response.json();
      if (!response.ok || isApiError(body)) throw new Error(isApiError(body) ? body.error : "Assistant request failed.");
      setExchanges((current) => [{ question: cleanQuestion, response: body as AssistantResponse }, ...current]);
      setQuestion("");
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Assistant request failed."); }
    finally { setLoading(false); }
  }

  return (
    <section className="mt-4 rounded-xl border border-emerald-300/25 bg-[#0b1720] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><div className="text-xs font-black uppercase tracking-[0.28em] text-emerald-300">AI Coding Assistant</div><h2 className="mt-1 text-2xl font-black">Ask questions without pasting files</h2><p className="mt-2 max-w-3xl text-sm text-white/60">Every question is automatically grounded with the symbol index and exact source excerpts.</p></div>
        <div className={`rounded-full border px-3 py-1 text-xs font-bold ${configuration?.configured ? "border-emerald-300/40 bg-emerald-300/10 text-emerald-100" : "border-amber-300/40 bg-amber-300/10 text-amber-100"}`}>{configuration ? (configuration.configured ? `Ready · ${configuration.model}` : "API key needed") : "Checking configuration…"}</div>
      </div>

      {configuration && !configuration.configured ? <div className="mt-4 rounded-lg border border-amber-300/30 bg-amber-300/10 p-4 text-sm text-amber-50"><div className="font-black">One-time configuration required</div><p className="mt-1 text-amber-50/75">Add <code className="rounded bg-black/25 px-1">OPENAI_API_KEY</code> to <code className="rounded bg-black/25 px-1">.env.local</code>, then restart the development server. The key remains server-only.</p></div> : null}

      <form onSubmit={ask} className="mt-4">
        <textarea value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={2000} rows={3} className="w-full resize-y rounded-lg border border-white/15 bg-black/30 px-3 py-3 outline-none focus:border-emerald-300/70" />
        <div className="mt-2 flex items-center justify-between gap-3"><span className="text-xs text-white/40">{question.length}/2,000</span><button type="submit" disabled={!configuration?.configured || loading || !question.trim()} className="rounded-lg border border-emerald-300/50 px-5 py-2 font-black text-emerald-100 hover:bg-emerald-300/10 disabled:opacity-40">{loading ? "Reading the project…" : "Ask assistant"}</button></div>
      </form>
      {error ? <div className="mt-3 rounded-lg border border-red-400/40 bg-red-400/10 p-3 text-red-100">{error}</div> : null}

      <div className="mt-4 space-y-4">{exchanges.map((exchange, index) => <article key={`${exchange.question}-${index}`} className="rounded-lg border border-white/10 bg-black/20 p-4"><div className="text-xs font-black uppercase tracking-wider text-emerald-300/70">Question</div><div className="mt-1 font-bold">{exchange.question}</div><div className="mt-4 whitespace-pre-wrap text-sm leading-6 text-white/80">{exchange.response.answer}</div><div className="mt-4 flex flex-wrap gap-2 text-xs text-white/45"><span>{exchange.response.context.symbols} symbols</span><span>·</span><span>{exchange.response.context.files} files</span><span>·</span><span>{exchange.response.context.excerpts} excerpts</span><span>·</span><span>{exchange.response.contextCharacters.toLocaleString()} characters</span></div><details className="mt-3"><summary className="cursor-pointer text-xs font-bold text-emerald-100/70">Evidence supplied to the assistant</summary><div className="mt-2 space-y-1 text-xs text-white/50">{exchange.response.citations.map((citation) => <div key={`${citation.path}:${citation.startLine}`}>{citation.path}:{citation.startLine}-{citation.endLine} · {citation.reason}</div>)}</div></details></article>)}</div>
    </section>
  );
}
