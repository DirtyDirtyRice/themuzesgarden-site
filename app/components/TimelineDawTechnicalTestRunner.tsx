"use client";

import { useCallback, useEffect, useState } from "react";
import { requireProjectSupabase } from "@/app/workspace/projects/[id]/projectSupabase";
import type {
  TimelineDawTechnicalTestResult,
  TimelineDawTechnicalTestStatus,
} from "@/lib/timeline/TimelineDawTechnicalTestPolicy";

type Receipt = {
  id: string;
  verified_count: number;
  held_count: number;
  human_required_count: number;
  ready_for_human: boolean;
  receipt_checksum: string;
  created_at: string;
};

type Data = {
  evaluation: {
    results: TimelineDawTechnicalTestResult[];
    verifiedCount: number;
    heldCount: number;
    humanRequiredCount: number;
    readyForHuman: boolean;
  };
  latestReceipt: Receipt | null;
};

const button =
  "rounded-xl border border-white/20 bg-white px-4 py-2 font-black text-black disabled:opacity-40";

const statusStyle: Record<TimelineDawTechnicalTestStatus, string> = {
  verified: "border-emerald-300/35 bg-emerald-300/10 text-emerald-100",
  held: "border-amber-300/35 bg-amber-300/10 text-amber-100",
  "human-required": "border-sky-300/35 bg-sky-300/10 text-sky-100",
};

const statusLabel: Record<TimelineDawTechnicalTestStatus, string> = {
  verified: "Verified",
  held: "Held",
  "human-required": "Human check",
};

export default function TimelineDawTechnicalTestRunner({
  sessionId,
}: {
  sessionId: string;
}) {
  const [data, setData] = useState<Data | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const request = useCallback(
    async (run = false) => {
      const token = (await requireProjectSupabase().auth.getSession()).data.session
        ?.access_token;
      if (!token) throw new Error("Sign in again before running technical checks.");
      const response = await fetch(
        run
          ? "/api/timeline/daw-technical-test"
          : `/api/timeline/daw-technical-test?sessionId=${encodeURIComponent(sessionId)}`,
        {
          method: run ? "POST" : "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            ...(run ? { "Content-Type": "application/json" } : {}),
          },
          body: run ? JSON.stringify({ action: "run", sessionId }) : undefined,
        },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Technical checks failed.");
      setData(result);
    },
    [sessionId],
  );

  useEffect(() => {
    let active = true;
    queueMicrotask(() =>
      void request().catch((cause) => {
        if (active) {
          setError(
            cause instanceof Error ? cause.message : "Technical checks could not be loaded.",
          );
        }
      }),
    );
    return () => {
      active = false;
    };
  }, [request]);

  async function run() {
    setBusy(true);
    setError("");
    try {
      await request(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Technical checks failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-3xl border-2 border-emerald-300/40 bg-emerald-300/[.05] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[.22em] text-emerald-200">
            Automated DAW technical test
          </p>
          <h2 className="mt-1 text-2xl font-black">Check the core workflow in one action</h2>
          <p className="mt-1 max-w-3xl text-sm text-white/60">
            The runner reads saved DAW evidence and writes a checksum receipt. It never
            claims what the music sounds like or how clear a control feels.
          </p>
        </div>
        <button className={button} disabled={busy} onClick={() => void run()}>
          {busy ? "Checking..." : "Run technical checks"}
        </button>
      </div>

      {data ? (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-emerald-300/25 p-3">
              <p className="text-xs uppercase text-white/45">Verified</p>
              <strong className="text-2xl">{data.evaluation.verifiedCount}/6</strong>
            </div>
            <div className="rounded-xl border border-amber-300/25 p-3">
              <p className="text-xs uppercase text-white/45">Held</p>
              <strong className="text-2xl">{data.evaluation.heldCount}</strong>
            </div>
            <div className="rounded-xl border border-sky-300/25 p-3">
              <p className="text-xs uppercase text-white/45">Human checks</p>
              <strong className="text-2xl">{data.evaluation.humanRequiredCount}</strong>
            </div>
          </div>

          <div className="mt-4 grid gap-2">
            {data.evaluation.results.map((result) => (
              <article
                className={`rounded-xl border p-3 ${statusStyle[result.status]}`}
                key={result.step}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <strong>{result.title}</strong>
                    <p className="mt-1 text-sm opacity-80">{result.detail}</p>
                    {result.evidenceCount !== null ? (
                      <small>Saved evidence count: {result.evidenceCount}</small>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-current px-3 py-1 text-xs font-black uppercase">
                      {statusLabel[result.status]}
                    </span>
                    <a className="underline" href={result.anchor}>
                      Open lesson control
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-white/15 p-3 text-sm">
            {data.evaluation.readyForHuman ? (
              <strong className="text-emerald-200">
                Technical path verified. A musician can now perform the short audition check.
              </strong>
            ) : (
              <strong className="text-amber-200">
                Technical path remains held. Open the held lesson controls above to create the
                missing evidence.
              </strong>
            )}
            {data.latestReceipt ? (
              <p className="mt-2 text-white/50">
                Latest receipt {data.latestReceipt.receipt_checksum.slice(0, 22)}... saved{" "}
                {new Date(data.latestReceipt.created_at).toLocaleString()}.
              </p>
            ) : (
              <p className="mt-2 text-white/50">
                Press Run technical checks to preserve the first receipt.
              </p>
            )}
          </div>
        </>
      ) : null}

      {error ? (
        <p role="alert" className="mt-3 rounded-xl border border-red-300/30 p-3 text-red-100">
          {error}
        </p>
      ) : null}
    </section>
  );
}
