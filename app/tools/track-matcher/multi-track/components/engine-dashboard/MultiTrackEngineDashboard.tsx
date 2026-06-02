"use client";

import { useMultiTrackEngine } from "../../engine/useMultiTrackEngine";
import { MultiTrackInsightV2Panel } from "../insight-v2/MultiTrackInsightV2Panel";
import { MultiTrackOverviewPanel } from "../dashboard/MultiTrackOverviewPanel";
import { MultiTrackReadinessPanel } from "../dashboard/MultiTrackReadinessPanel";
import { MultiTrackEngineHealthPanel } from "../dashboard/MultiTrackEngineHealthPanel";
import { MultiTrackSnapshotPanel } from "../dashboard/MultiTrackSnapshotPanel";
import { MultiTrackQuickActionsPanel } from "../dashboard/MultiTrackQuickActionsPanel";
import { MultiTrackRelationshipPanel } from "../relationship/MultiTrackRelationshipPanel";
import { MultiTrackActionQueuePanel } from "./MultiTrackActionQueuePanel";
import { MultiTrackComparisonMatrixPanel } from "./MultiTrackComparisonMatrixPanel";
import { MultiTrackDecisionCenterPanel } from "./MultiTrackDecisionCenterPanel";
import { MultiTrackDecisionRouteControlPanel } from "./MultiTrackDecisionRouteControlPanel";
import { MultiTrackEngineAlertsPanel } from "./MultiTrackEngineAlertsPanel";
import { MultiTrackEngineLoadDemoPanel } from "./MultiTrackEngineLoadDemoPanel";
import { MultiTrackEngineMetricsPanel } from "./MultiTrackEngineMetricsPanel";
import { MultiTrackEngineReadinessRail } from "./MultiTrackEngineReadinessRail";
import { MultiTrackFindingControlPanel } from "./MultiTrackFindingControlPanel";
import { MultiTrackLaneStatusPanel } from "./MultiTrackLaneStatusPanel";
import { MultiTrackMarkerCueControlPanel } from "./MultiTrackMarkerCueControlPanel";
import { MultiTrackSessionNotesPanel } from "./MultiTrackSessionNotesPanel";
import { MultiTrackSnapshotControlPanel } from "./MultiTrackSnapshotControlPanel";
import { MultiTrackTimelineWorkspacePanel } from "./MultiTrackTimelineWorkspacePanel";
import { MultiTrackTrackPrepPanel } from "./MultiTrackTrackPrepPanel";
import { MultiTrackTransportControlPanel } from "./MultiTrackTransportControlPanel";

const panelClass =
  "rounded-3xl border border-white/10 bg-black p-5 text-white shadow-2xl";

export function MultiTrackEngineDashboard() {
  const engine = useMultiTrackEngine();
  const {
    engineState,
    trackPair,
    readiness,
    readinessLabel,
    readinessDetail,
    snapshotCount,
    markerCount,
    cueCount,
    findingCount,
    longestTrackDurationSeconds,
    visibleMarkers,
    visibleCues,
    canSaveSnapshot,
    canExportComparison,
    updateTrack,
    muteTrack,
    soloTrack,
    lockTrack,
    addMarker,
    removeMarker,
    addCue,
    removeCue,
    addFinding,
    clearFindings,
    setDecisionRoute,
    setPlayhead,
    setLoop,
    setTransportStatus,
    toggleSnapToMarkers,
    saveSnapshot,
    resetEngine,
  } = engine;

  return (
    <section className={panelClass}>
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-white/70">
          Recovered Engine Dashboard
        </p>

        <h2 className="mt-2 text-3xl font-black text-white">
          Multi Track Engine Status
        </h2>

        <p className="mt-3 max-w-4xl text-sm leading-6 text-white/70">
          This dashboard connects the recovered engine hook to visible Multi Track workspace panels.
          It keeps the large page clean while giving the engine a real display area.
        </p>
      </div>

      <div className="mt-5 grid gap-5">
        <MultiTrackOverviewPanel engineState={engineState} />

        <MultiTrackEngineReadinessRail
          readiness={readiness}
          readinessLabel={readinessLabel}
          readinessDetail={readinessDetail}
          snapshotCount={snapshotCount}
          markerCount={markerCount}
          cueCount={cueCount}
          findingCount={findingCount}
        />

        <MultiTrackReadinessPanel engineState={engineState} />

        <MultiTrackEngineLoadDemoPanel trackPair={trackPair} updateTrack={updateTrack} />

        <MultiTrackTrackPrepPanel
          trackPair={trackPair}
          muteTrack={muteTrack}
          soloTrack={soloTrack}
          lockTrack={lockTrack}
        />

        <MultiTrackEngineMetricsPanel engineState={engineState} />

        <MultiTrackInsightV2Panel engineState={engineState} />

        <MultiTrackComparisonMatrixPanel engineState={engineState} />

        <MultiTrackLaneStatusPanel engineState={engineState} />

        <MultiTrackRelationshipPanel relationshipState={engineState.relationship} />

        <MultiTrackDecisionCenterPanel
          engineState={engineState}
          canSaveSnapshot={canSaveSnapshot}
          canExportComparison={canExportComparison}
        />

        <MultiTrackDecisionRouteControlPanel
          engineState={engineState}
          setDecisionRoute={setDecisionRoute}
        />

        <MultiTrackTimelineWorkspacePanel
          engineState={engineState}
          markerCount={markerCount}
          cueCount={cueCount}
          visibleMarkers={visibleMarkers}
          visibleCues={visibleCues}
          longestTrackDurationSeconds={longestTrackDurationSeconds}
        />

        <MultiTrackTransportControlPanel
          engineState={engineState}
          setTransportStatus={setTransportStatus}
          setPlayhead={setPlayhead}
          setLoop={setLoop}
          toggleSnapToMarkers={toggleSnapToMarkers}
        />

        <MultiTrackMarkerCueControlPanel
          visibleMarkers={visibleMarkers}
          visibleCues={visibleCues}
          addMarker={addMarker}
          removeMarker={removeMarker}
          addCue={addCue}
          removeCue={removeCue}
        />

        <MultiTrackActionQueuePanel engineState={engineState} />

        <MultiTrackEngineAlertsPanel
          engineState={engineState}
          findingCount={findingCount}
        />

        <MultiTrackFindingControlPanel
          engineState={engineState}
          addFinding={addFinding}
          clearFindings={clearFindings}
        />

        <MultiTrackSnapshotControlPanel
          engineState={engineState}
          snapshotCount={snapshotCount}
          canSaveSnapshot={canSaveSnapshot}
          saveSnapshot={saveSnapshot}
          resetEngine={resetEngine}
        />

        <MultiTrackSessionNotesPanel engineState={engineState} />

        <MultiTrackEngineHealthPanel engineState={engineState} />

        <MultiTrackSnapshotPanel engineState={engineState} />

        <MultiTrackQuickActionsPanel />
      </div>
    </section>
  );
}