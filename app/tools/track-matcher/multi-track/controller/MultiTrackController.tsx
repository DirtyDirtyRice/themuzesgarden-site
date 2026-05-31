"use client";

import { MultiTrackAdapterCandidatePanel } from "./MultiTrackAdapterCandidatePanel";
import { MultiTrackAnalysisNotesPanel } from "./MultiTrackAnalysisNotesPanel";
import { MultiTrackControllerSummary } from "./MultiTrackControllerSummary";
import { MultiTrackDecisionPanel } from "./MultiTrackDecisionPanel";
import { MultiTrackSavePreviewPanel } from "./MultiTrackSavePreviewPanel";
import { MultiTrackWorkspaceRegistryPanel } from "./MultiTrackWorkspaceRegistryPanel";
import type {
  MultiTrackAdapterSource,
  MultiTrackAdapterTrackCandidate,
} from "../adapters/multiTrackAdapterTypes";
import { adaptTrackCandidate } from "../adapters/multiTrackAdapterHelpers";
import { useMultiTrackAnalysisNotes } from "./useMultiTrackAnalysisNotes";
import { useMultiTrackDecision } from "./useMultiTrackDecision";
import { useMultiTrackSavePreview } from "./useMultiTrackSavePreview";
import { useMultiTrackSelectionCoordinator } from "./useMultiTrackSelectionCoordinator";
import { useMultiTrackSelectionMetrics } from "./useMultiTrackSelectionMetrics";
import { useMultiTrackSession } from "./useMultiTrackSession";
import type {
  MultiTrackControllerTrackSlot,
} from "./multiTrackControllerTypes";

const controllerButtonClass =
  "rounded-xl border border-white/10 bg-white/[0.07] px-3 py-2 text-xs font-black text-white/75 transition-transform duration-150 hover:-translate-y-0.5 active:scale-[0.98]";

const controllerCardClass =
  "rounded-2xl border border-white/10 bg-black/40 p-4 text-white";

type CandidateSource = Extract<
  MultiTrackAdapterSource,
  "finder" | "library" | "metadata"
>;

function SelectionMetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: number | string;
  detail: string;
}) {
  return (
    <article className={controllerCardClass}>
      <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-white/45">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
      <p className="mt-2 text-xs leading-5 text-white/55">{detail}</p>
    </article>
  );
}

function SelectionHistoryPreview({
  history,
}: {
  history: {
    id: string;
    trackSlotId: "track-a" | "track-b";
    title: string;
    source: string;
    detail: string;
    status: string;
    createdAt: string;
  }[];
}) {
  return (
    <div className="grid gap-2">
      {history.slice(0, 5).map((item) => (
        <article
          key={`${item.id}-${item.createdAt}`}
          className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="text-xs font-black text-white/80">{item.title}</p>
            <span className="rounded-full border border-white/10 bg-black/40 px-2 py-1 text-[0.6rem] font-black uppercase tracking-[0.12em] text-white/45">
              {item.trackSlotId} / {item.source}
            </span>
          </div>
          <p className="mt-1 text-xs leading-5 text-white/55">{item.detail}</p>
        </article>
      ))}
    </div>
  );
}

export default function MultiTrackController() {
  const {
    activeTrackSlot,
    activeViewPanels,
    foundation,
    setActiveTrackSlot,
    setActiveView,
    snapshot,
  } = useMultiTrackSession();

  const {
    filteredNotes,
    addNote,
    selectedKind,
    setSelectedKind,
    summary: notesSummary,
  } = useMultiTrackAnalysisNotes();

  const {
    history,
    recordAdapterSelection,
    trackALoads,
    trackBLoads,
  } = useMultiTrackSelectionCoordinator();

  const selectionMetrics = useMultiTrackSelectionMetrics();

  const {
    activeConfidenceLabel,
    activeDecision,
    decisionHistory,
    decisionOptions,
    selectDecision,
  } = useMultiTrackDecision();

  const {
    destination,
    routeOptions,
    savePreview,
    setDestination,
  } = useMultiTrackSavePreview({
    decision: activeDecision,
    history,
  });

  function handleSelectCandidate(
    source: CandidateSource,
    trackSlotId: MultiTrackControllerTrackSlot["id"],
    candidate: MultiTrackAdapterTrackCandidate,
  ) {
    const result = adaptTrackCandidate(source, {
      trackSlotId,
      candidate,
    });

    recordAdapterSelection(source, result);
    setActiveTrackSlot(trackSlotId);
    setActiveView(source === "metadata" ? "metadata" : "tracks");
  }

  return (
    <section className="grid gap-5">
      <MultiTrackControllerSummary snapshot={snapshot} />

      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white shadow-2xl">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-white/45">
              Multi-Track Controller Shell
            </p>
            <h2 className="mt-2 text-xl font-black text-white">
              {activeTrackSlot.label} / {snapshot.activeView}
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-white/70">
              This controller now owns session state, adapter selection
              coordination, selection history, selection metrics, workspace
              registry visibility, candidate routing previews, decision state,
              save preview state, and analysis notes. It still does not own
              playback, audio processing, or Track Matcher runtime behavior.
            </p>
          </div>

          <span className="rounded-full border border-white/10 bg-white/[0.07] px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-white/65">
            {activeViewPanels.length} active panels
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button className={controllerButtonClass} type="button" onClick={() => setActiveView("tracks")}>
            Show Tracks
          </button>
          <button className={controllerButtonClass} type="button" onClick={() => setActiveView("comparison")}>
            Show Comparison
          </button>
          <button className={controllerButtonClass} type="button" onClick={() => setActiveView("metadata")}>
            Show Metadata
          </button>
          <button className={controllerButtonClass} type="button" onClick={() => setActiveView("timeline")}>
            Show Timeline
          </button>
          <button className={controllerButtonClass} type="button" onClick={() => setActiveTrackSlot("track-a")}>
            Activate Track A
          </button>
          <button className={controllerButtonClass} type="button" onClick={() => setActiveTrackSlot("track-b")}>
            Activate Track B
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <SelectionMetricCard
            label="Total Selection Events"
            value={selectionMetrics.totalSelections}
            detail="Counts foundation and candidate selection events in the controller session."
          />
          <SelectionMetricCard
            label="Track A Loads"
            value={trackALoads.length}
            detail="Tracks selection history for the Track A slot."
          />
          <SelectionMetricCard
            label="Track B Loads"
            value={trackBLoads.length}
            detail="Tracks selection history for the Track B slot."
          />
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <article className={controllerCardClass}>
            <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-white/45">
              Session Foundation
            </p>
            <p className="mt-2 text-sm font-black text-white/80">
              {foundation.health.label}
            </p>
            <p className="mt-2 text-xs leading-5 text-white/55">
              {foundation.health.detail}
            </p>
          </article>

          <article className={controllerCardClass}>
            <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-white/45">
              Recent Selection History
            </p>
            <div className="mt-3">
              <SelectionHistoryPreview history={history} />
            </div>
          </article>
        </div>
      </section>

      <MultiTrackAdapterCandidatePanel onSelectCandidate={handleSelectCandidate} />

      <MultiTrackDecisionPanel
        activeConfidenceLabel={activeConfidenceLabel}
        activeDecision={activeDecision}
        decisionHistory={decisionHistory}
        decisionOptions={decisionOptions}
        onSelectDecision={selectDecision}
      />

      <MultiTrackSavePreviewPanel
        activeDestination={destination}
        onSelectDestination={setDestination}
        routeOptions={routeOptions}
        savePreview={savePreview}
      />

      <MultiTrackAnalysisNotesPanel
        filteredNotes={filteredNotes}
        onAddNote={addNote}
        onSelectKind={setSelectedKind}
        selectedKind={selectedKind}
        summary={notesSummary}
      />

      <MultiTrackWorkspaceRegistryPanel />
    </section>
  );
}