import { ComparisonScoringWorkspace, ComparisonWorkspace, ConfidenceSystemWorkspace, DecisionCenterWorkspace, PromptReferenceWorkspace, RelationshipRoutingWorkspace, RelationshipWorkspace, SyncPrepWorkspace } from "./components/MultiTrackCoreSections";
import { AnalysisHistoryWorkspace, ComparisonNotesWorkspace, ControllerAdapterPrepWorkspace, FutureWiringWorkspace, SaveAnalysisPlaceholder, SaveAnalysisWorkspace, SaveFieldChecklistWorkspace, SaveRecordShapeWorkspace, WorkflowWorkspace } from "./components/MultiTrackAnalysisSections";
import { AiAnalysisPlaceholderWorkspace, AiRoutingWorkspace, FutureWaveformWorkspace, MarkerLaneRoutingWorkspace, StemRoutingWorkspace, TimelineLaneSystemWorkspace, TimelineMarkerWorkspace, WaveformPrepWorkspace } from "./components/MultiTrackTimelineSections";
import { MetadataGraphPrepWorkspace, RelationshipRouteExpansionWorkspace, TrackAMetadataWorkspace, TrackARelationshipWorkspace, TrackBMetadataWorkspace, TrackBRelationshipWorkspace, TrackMetadataReadinessWorkspace } from "./components/MultiTrackMetadataSections";
import { TrackLoadRoutingWorkspace, TrackSlotHierarchyWorkspace, TrackWorkspace } from "./components/MultiTrackWorkspace";
import { InfoCard, StatusPill, panelClass } from "./components/MultiTrackShared";
import MultiTrackController from "./controller/MultiTrackController";
import { MultiTrackEngineDashboard } from "./components/engine-dashboard/MultiTrackEngineDashboard";

export default function MultiTrackAnalysisPage() {
  return (
    <main className="min-h-screen bg-black px-4 py-6 text-white">
      <section className="mx-auto grid max-w-7xl gap-5">
        <div className={panelClass}>
          <p className="text-xs uppercase tracking-[0.35em] text-white/50">
            Track Matcher
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">
            Multi-Track Analysis
          </h1>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-white/70">
            Expanded workspace for Track A, Track B, comparison notes, sync ideas,
            structure analysis, stems, instruments, future waveform inspection,
            confidence scoring, save records, and AI analysis prep.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <StatusPill label="Phase 4.1" />
            <StatusPill label="Split Files" />
            <StatusPill label="Main Page Safe" />
            <StatusPill label="Track A / Track B" />
            <StatusPill label="Decision Center" />
            <StatusPill label="Metadata Graph Prep" />
            <StatusPill label="Timeline Routing" />
            <StatusPill label="AI Routing" />
            <StatusPill label="Stem Prep" />
          </div>
        </div>

        <section className="grid gap-3 md:grid-cols-4">
          <InfoCard
            label="Workspace"
            value="Multi-Track"
            detail="A separate area for deeper work without crowding the normal Track Matcher page."
          />
          <InfoCard
            label="Phase 4.1 Upgrade"
            value="Real architecture"
            detail="Adds scoring signals, confidence systems, save record shape, AI routing, sync prep, and metadata graph prep."
          />
          <InfoCard
            label="Build Strategy"
            value="Split safe"
            detail="Keeps the Track Matcher main page and Finder cosmetics untouched while this page grows."
          />
          <InfoCard
            label="Next Wiring"
            value="Controller active"
            detail="The Multi-Track controller now owns session state, adapter previews, registry metrics, and future routing structure."
          />
        </section>

        <MultiTrackController />
        <MultiTrackEngineDashboard />

        <TrackLoadRoutingWorkspace />
        <TrackSlotHierarchyWorkspace />

        <section className="grid gap-4 lg:grid-cols-2">
          <TrackWorkspace
            title="Track A Workspace"
            description="Expanded Track A area for loaded song information."
            noteLabel="Track A Notes"
          />
          <TrackWorkspace
            title="Track B Workspace"
            description="Expanded Track B area for loaded song information."
            noteLabel="Track B Notes"
          />
        </section>

        <TrackAMetadataWorkspace />
        <TrackBMetadataWorkspace />
        <TrackMetadataReadinessWorkspace />
        <TrackARelationshipWorkspace />
        <TrackBRelationshipWorkspace />
        <RelationshipRouteExpansionWorkspace />
        <MetadataGraphPrepWorkspace />
        <ComparisonWorkspace />
        <ComparisonScoringWorkspace />
        <ConfidenceSystemWorkspace />
        <SyncPrepWorkspace />
        <TimelineMarkerWorkspace />
        <TimelineLaneSystemWorkspace />
        <MarkerLaneRoutingWorkspace />
        <ComparisonNotesWorkspace />
        <RelationshipWorkspace />
        <RelationshipRoutingWorkspace />
        <PromptReferenceWorkspace />
        <DecisionCenterWorkspace />
        <SaveAnalysisPlaceholder />
        <SaveFieldChecklistWorkspace />
        <SaveRecordShapeWorkspace />
        <SaveAnalysisWorkspace />
        <AnalysisHistoryWorkspace />
        <WorkflowWorkspace />
        <FutureWaveformWorkspace />
        <WaveformPrepWorkspace />
        <StemRoutingWorkspace />
        <AiAnalysisPlaceholderWorkspace />
        <AiRoutingWorkspace />
        <ControllerAdapterPrepWorkspace />
        <FutureWiringWorkspace />
      </section>
    </main>
  );
}