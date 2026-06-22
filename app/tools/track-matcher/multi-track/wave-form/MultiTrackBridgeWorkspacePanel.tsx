"use client";

import { getMultiTrackBridgeWorkspace } from "./MultiTrackBridgeHelpers";

export default function MultiTrackBridgeWorkspacePanel() {
  const workspace = getMultiTrackBridgeWorkspace();

  return (
    <section className="rounded-3xl border border-white/15 bg-black p-5 text-white">
      <p className="text-xs font-black uppercase tracking-[0.28em] text-white/60">
        Five Engine Bridge
      </p>

      <h2 className="mt-2 text-2xl font-black text-white">
        {workspace.title}
      </h2>

      <p className="mt-3 max-w-5xl text-sm font-semibold leading-6 text-white/70">
        {workspace.summary}
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {workspace.metrics.map((metric) => (
          <MetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            detail={metric.detail}
          />
        ))}
      </div>

      <div className="mt-5 grid gap-3 xl:grid-cols-5">
        {workspace.steps.map((step) => (
          <BridgeStepCard
            key={step.step}
            step={step.step}
            title={step.title}
            status={step.status}
            detail={step.detail}
          />
        ))}
      </div>

      <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
        <h3 className="text-lg font-black text-white">Promotion Path</h3>

        <div className="mt-4 grid gap-3">
          {workspace.pathRows.map((row) => (
            <BridgePathRow
              key={row.label}
              label={row.label}
              value={row.value}
              detail={row.detail}
            />
          ))}
        </div>
      </div>

      <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
        <h3 className="text-lg font-black text-white">Bridge Lock</h3>

        <div className="mt-3 grid gap-2 md:grid-cols-3">
          {workspace.locks.map((lock) => (
            <LockCard
              key={lock.title}
              title={lock.title}
              body={lock.body}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-white/50">
        {label}
      </p>

      <p className="mt-2 text-3xl font-black text-white">
        {value}
      </p>

      <p className="mt-2 text-sm font-semibold leading-5 text-white/70">
        {detail}
      </p>
    </article>
  );
}

function BridgeStepCard({
  step,
  title,
  status,
  detail,
}: {
  step: string;
  title: string;
  status: string;
  detail: string;
}) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-white/50">
        Step {step}
      </p>

      <h3 className="mt-2 text-lg font-black text-white">
        {title}
      </h3>

      <p className="mt-2 rounded-full border border-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-white/70">
        {status}
      </p>

      <p className="mt-3 text-sm font-semibold leading-5 text-white/70">
        {detail}
      </p>
    </article>
  );
}

function BridgePathRow({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-white/50">
        {label}
      </p>

      <p className="mt-2 text-base font-black text-white">
        {value}
      </p>

      <p className="mt-1 text-sm font-semibold leading-5 text-white/70">
        {detail}
      </p>
    </div>
  );
}

function LockCard({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black p-4">
      <h4 className="text-sm font-black text-white">
        {title}
      </h4>

      <p className="mt-2 text-sm font-semibold leading-5 text-white/70">
        {body}
      </p>
    </div>
  );
}