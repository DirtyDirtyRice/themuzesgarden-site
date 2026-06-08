
"use client";

import { DEFAULT_MULTI_TRACK_ENGINE_BRIDGE_STATE } from "./MultiTrackEngineBridgeSeed";

const panelClass =
  "rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white shadow-2xl";

const cardClass =
  "rounded-2xl border border-white/10 bg-black/40 p-4 text-white";

const rowClass =
  "flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2";

const pillClass =
  "rounded-full border border-white/10 bg-white/[0.07] px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-white/70";

type RecoveryStatus = "done" | "active" | "blocked" | "future";

type RecoveryItem = {
  id: string;
  label: string;
  status: RecoveryStatus;
  detail: string;
  risk: string;
  keep: string;
  avoid: string;
};

function getRecoveryStatusLabel(status: RecoveryStatus): string {
  if (status === "done") return "Done";
  if (status === "active") return "Active";
  if (status === "blocked") return "Blocked";
  return "Future";
}

function buildRecoveryItems(): RecoveryItem[] {
  return [
    {
      id: "recovery-core-engine",
      label: "Core Engine Recovered",
      status: "done",
      detail:
        "Track, comparison, timeline, analysis, decision, snapshots, and helper layers are green.",
      risk: "Low",
      keep: "Keep active engine files stable and do not rename core exports.",
      avoid: "Avoid replacing recovered helpers with guessed bridge helpers.",
    },
    {
      id: "recovery-relationship-layer",
      label: "Relationship Layer Recovered",
      status: "done",
      detail:
        "Relationship types, seed, helpers, and UI panels are restored and compiling.",
      risk: "Low",
      keep: "Keep relationship scoring owned by the relationship layer.",
      avoid: "Avoid moving relationship scoring into bridge panels.",
    },
    {
      id: "recovery-sync-layer",
      label: "Sync Layer Recovered",
      status: "done",
      detail:
        "Sync types, seed, helpers, and UI panels are restored and compiling.",
      risk: "Medium",
      keep: "Keep sync behavior owned by sync files.",
      avoid: "Avoid letting bridge panels perform live sync actions.",
    },
    {
      id: "recovery-insight-layer",
      label: "Insight Layer Excluded",
      status: "blocked",
      detail:
        "Insight files were identified as incorrect copies or misnamed files. Do not restore yet.",
      risk: "High",
      keep: "Keep Insight excluded until a clean contract is designed.",
      avoid: "Avoid pasting old Insight imports or old missing types.",
    },
    {
      id: "recovery-dashboard-layer",
      label: "Dashboard Expansion Active",
      status: "active",
      detail:
        "Dashboard panels are expanding engine visibility without growing the page file.",
      risk: "Medium",
      keep: "Use dashboard wrappers for grouped visibility.",
      avoid: "Avoid direct page wiring for preserved bridge panels.",
    },
    {
      id: "recovery-bridge-layer",
      label: "Bridge Layer Expanding",
      status: "active",
      detail:
        "Bridge contracts are being built as future connectors between engine and workspaces.",
      risk: "Medium",
      keep: "Keep bridge panels seed-backed and self-contained in wave-form.",
      avoid: "Avoid phantom imports, phantom types, and controller ownership drift.",
    },
    {
      id: "recovery-future-audio",
      label: "Future Audio Ownership",
      status: "future",
      detail:
        "Real waveform, DSP, transient, stem, and sync ownership should connect only after contracts are verified.",
      risk: "High",
      keep: "Use future audio panels as planning surfaces first.",
      avoid: "Avoid connecting real audio routing before readiness and validation pass.",
    },
  ];
}

function getRecoveryCountByStatus(items: RecoveryItem[], status: RecoveryStatus) {
  return items.filter((item) => item.status === status).length;
}

function RecoverySummary({ items }: { items: RecoveryItem[] }) {
  return (
    <div className="mt-5 grid gap-4 md:grid-cols-4">
      <article className={cardClass}>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
          Recovery Items
        </p>
        <p className="mt-2 text-3xl font-black text-white">{items.length}</p>
      </article>

      <article className={cardClass}>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
          Done
        </p>
        <p className="mt-2 text-3xl font-black text-white">
          {getRecoveryCountByStatus(items, "done")}
        </p>
      </article>

      <article className={cardClass}>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
          Active
        </p>
        <p className="mt-2 text-3xl font-black text-white">
          {getRecoveryCountByStatus(items, "active")}
        </p>
      </article>

      <article className={cardClass}>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
          Blocked
        </p>
        <p className="mt-2 text-3xl font-black text-white">
          {getRecoveryCountByStatus(items, "blocked")}
        </p>
      </article>
    </div>
  );
}

function RecoveryCard({ item }: { item: RecoveryItem }) {
  return (
    <article className={cardClass}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
            Risk: {item.risk}
          </p>
          <h3 className="mt-2 text-lg font-black text-white">{item.label}</h3>
        </div>

        <span className={pillClass}>{getRecoveryStatusLabel(item.status)}</span>
      </div>

      <p className="mt-3 text-sm leading-6 text-white/70">{item.detail}</p>

      <div className="mt-4 grid gap-2">
        <div className={rowClass}>
          <span className="text-sm text-white/70">Keep</span>
          <span className="max-w-xl text-right text-sm font-black leading-6 text-white">
            {item.keep}
          </span>
        </div>

        <div className={rowClass}>
          <span className="text-sm text-white/70">Avoid</span>
          <span className="max-w-xl text-right text-sm font-black leading-6 text-white">
            {item.avoid}
          </span>
        </div>
      </div>
    </article>
  );
}

export function MultiTrackEngineBridgeRecoveryPanel() {
  const bridgeState = DEFAULT_MULTI_TRACK_ENGINE_BRIDGE_STATE;
  const recoveryItems = buildRecoveryItems();

  return (
    <section className={panelClass}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/70">
            Bridge Recovery
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">
            Recovery Status Memory
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-white/70">
            Tracks what was recovered, what is active, what is blocked, and
            what should not be restored until contracts are verified.
          </p>
        </div>

        <span className={pillClass}>{bridgeState.status}</span>
      </div>

      <RecoverySummary items={recoveryItems} />

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {recoveryItems.map((item) => (
          <RecoveryCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}