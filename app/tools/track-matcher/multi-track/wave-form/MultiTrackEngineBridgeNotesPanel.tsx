"use client";

import type {
  MultiTrackEngineBridgeAdapter,
  MultiTrackEngineBridgeSignal,
  MultiTrackEngineBridgeState,
} from "./MultiTrackEngineBridgeTypes";
import { DEFAULT_MULTI_TRACK_ENGINE_BRIDGE_STATE } from "./MultiTrackEngineBridgeSeed";

const panelClass =
  "rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white shadow-2xl";

const cardClass =
  "rounded-2xl border border-white/10 bg-black/40 p-4 text-white";

const pillClass =
  "rounded-full border border-white/10 bg-white/[0.07] px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-white/70";

type BridgeNoteCategory = "Summary" | "Signal" | "Adapter" | "Future" | "Recovery";

type BridgeNote = {
  id: string;
  source: string;
  label: string;
  detail: string;
  category: BridgeNoteCategory;
  ready: boolean;
  memory: string;
};

function buildSignalNotes(signals: MultiTrackEngineBridgeSignal[]): BridgeNote[] {
  return signals.map((signal) => ({
    id: `signal-note-${signal.id}`,
    source: signal.source,
    label: signal.label,
    detail: signal.detail,
    category: "Signal",
    ready: signal.ready,
    memory: "Signal must stay descriptive until real source data exists.",
  }));
}

function buildAdapterNotes(adapters: MultiTrackEngineBridgeAdapter[]): BridgeNote[] {
  return adapters.map((adapter) => ({
    id: `adapter-note-${adapter.id}`,
    source: adapter.sourceWorkspace,
    label: adapter.label,
    detail: adapter.detail,
    category: "Adapter",
    ready: adapter.connected,
    memory: "Adapter must stay inactive until both workspaces are verified.",
  }));
}

function buildBridgeNotes(state: MultiTrackEngineBridgeState): BridgeNote[] {
  return [
    {
      id: "bridge-summary-note",
      source: "Bridge",
      label: "Bridge Summary",
      detail: state.summary,
      category: "Summary",
      ready: state.status === "connected",
      memory: "Bridge state is the shared memory anchor for this preserved panel set.",
    },
    {
      id: "bridge-recovery-note",
      source: "Recovery",
      label: "Recovery Boundary",
      detail:
        "Bridge panels were preserved outside active engine wiring and should stay self-contained until green wrapper wiring exists.",
      category: "Recovery",
      ready: true,
      memory: "Do not move bridge logic back into active engine or page files without a wrapper.",
    },
    ...buildSignalNotes(state.signals),
    ...buildAdapterNotes(state.adapters),
    {
      id: "bridge-future-note",
      source: "Future Wiring",
      label: "Future Bridge Expansion",
      detail:
        "Bridge notes will later include controller events, workspace adapters, save records, sync decisions, timeline handoffs, and AI analysis traces.",
      category: "Future",
      ready: false,
      memory: "Future work should be added only after verified contracts and green builds.",
    },
  ];
}

function getReadyNoteCount(notes: BridgeNote[]): number {
  return notes.filter((note) => note.ready).length;
}

function getWaitingNoteCount(notes: BridgeNote[]): number {
  return notes.filter((note) => !note.ready).length;
}

function getCategoryCount(notes: BridgeNote[], category: BridgeNoteCategory): number {
  return notes.filter((note) => note.category === category).length;
}

function BridgeNoteSummary({ notes }: { notes: BridgeNote[] }) {
  return (
    <div className="mt-5 grid gap-4 md:grid-cols-4">
      <article className={cardClass}>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
          Total Notes
        </p>
        <p className="mt-2 text-3xl font-black text-white">{notes.length}</p>
      </article>

      <article className={cardClass}>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
          Ready
        </p>
        <p className="mt-2 text-3xl font-black text-white">{getReadyNoteCount(notes)}</p>
      </article>

      <article className={cardClass}>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
          Waiting
        </p>
        <p className="mt-2 text-3xl font-black text-white">{getWaitingNoteCount(notes)}</p>
      </article>

      <article className={cardClass}>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
          Signals
        </p>
        <p className="mt-2 text-3xl font-black text-white">
          {getCategoryCount(notes, "Signal")}
        </p>
      </article>
    </div>
  );
}

function BridgeNoteCard({ note }: { note: BridgeNote }) {
  return (
    <article className={cardClass}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
            {note.category} · {note.source}
          </p>
          <h3 className="mt-2 text-lg font-black text-white">{note.label}</h3>
        </div>

        <span className={pillClass}>{note.ready ? "Ready" : "Waiting"}</span>
      </div>

      <p className="mt-3 text-sm leading-6 text-white/70">{note.detail}</p>
      <p className="mt-3 text-sm font-black leading-6 text-white">{note.memory}</p>
    </article>
  );
}

export function MultiTrackEngineBridgeNotesPanel() {
  const bridgeState = DEFAULT_MULTI_TRACK_ENGINE_BRIDGE_STATE;
  const notes = buildBridgeNotes(bridgeState);

  return (
    <section className={panelClass}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/70">
            Bridge Notes
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">
            Bridge Notes & Future Wiring Memory
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-white/70">
            Notes gathered from bridge state, signal definitions, adapter
            plans, and future wiring goals. This provides a visible memory
            surface for what the bridge is supposed to connect.
          </p>
        </div>

        <span className={pillClass}>{bridgeState.status}</span>
      </div>

      <BridgeNoteSummary notes={notes} />

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {notes.map((note) => (
          <BridgeNoteCard key={note.id} note={note} />
        ))}
      </div>
    </section>
  );
}