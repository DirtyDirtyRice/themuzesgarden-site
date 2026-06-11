import {
  buildMultiTrackMutationMapPathSummaries,
  buildMultiTrackMutationMapPointSummaries,
  buildMultiTrackMutationMapReviewPacket,
  formatMultiTrackMutationMapRange,
  getMultiTrackMutationMapConfidenceLabel,
  getMultiTrackMutationMapIdeaKindLabel,
  getMultiTrackMutationMapMutationLabel,
  getMultiTrackMutationMapReadinessLabel,
  validateMultiTrackMutationMapState,
} from "./MultiTrackMutationMapHelpers";
import { multiTrackMutationMapSeed } from "./MultiTrackMutationMapSeed";
import type {
  MultiTrackMutationMapLane,
  MultiTrackMutationMapPathSummary,
  MultiTrackMutationMapPoint,
  MultiTrackMutationMapPointSummary,
  MultiTrackMutationMapRisk,
  MultiTrackMutationMapSignal,
  MultiTrackMutationMapWorkspaceState,
} from "./MultiTrackMutationMapTypes";

const panelClass =
  "rounded-3xl border border-white/15 bg-black p-5 text-white shadow-2xl";
const cardClass = "rounded-2xl border border-white/10 bg-white/[0.03] p-4";
const labelClass = "text-xs uppercase tracking-[0.24em] text-white/70";
const bodyClass = "mt-2 text-sm leading-6 text-white/70";

type MultiTrackMutationMapWorkspacePanelProps = {
  state?: MultiTrackMutationMapWorkspaceState;
};

export function MultiTrackMutationMapWorkspacePanel({
  state = multiTrackMutationMapSeed,
}: MultiTrackMutationMapWorkspacePanelProps) {
  const validation = validateMultiTrackMutationMapState(state);
  const pathSummaries = buildMultiTrackMutationMapPathSummaries(state);
  const pointSummaries = buildMultiTrackMutationMapPointSummaries(state);
  const reviewPacket = buildMultiTrackMutationMapReviewPacket(
    state,
    state.activePathId,
    state.activePointId,
  );

  return (
    <section className={panelClass}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className={labelClass}>Multi Track Mutation Map</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-white">
            {state.title}
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-white/70">
            {state.description}
          </p>
        </div>

        <div className="rounded-2xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-white">
          <p className="font-semibold">
            {getMultiTrackMutationMapReadinessLabel(state.readinessStatus)}
          </p>
          <p className="mt-1 text-xs text-white/70">
            {validation.isValid ? "No missing seed references" : "Review map"}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MutationMetricCard
          label="Points"
          value={state.points.length.toString()}
          detail="Original ideas and mutations."
        />
        <MutationMetricCard
          label="Paths"
          value={state.paths.length.toString()}
          detail="Mutation family paths."
        />
        <MutationMetricCard
          label="Ready"
          value={validation.readyCount.toString()}
          detail="Safe seed mutation claims."
        />
        <MutationMetricCard
          label="Review"
          value={validation.reviewCount.toString()}
          detail="Needs analyzer or ears."
        />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_1.15fr]">
        <MutationPathPanel paths={pathSummaries} />
        <MutationActivePanel
          activePoint={reviewPacket.activePoint}
          pathPoints={reviewPacket.pathPoints}
          signals={reviewPacket.signals}
          risks={reviewPacket.risks}
        />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <MutationPointPanel points={pointSummaries} />
        <MutationLanePanel lanes={state.lanes} />
      </div>

      <div className="mt-6">
        <MutationGuardrailPanel
          notes={state.guardrailNotes}
          validationMessages={validation.messages}
          futureCount={validation.futureCount}
          blockedCount={validation.blockedCount}
        />
      </div>
    </section>
  );
}

function MutationMetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className={cardClass}>
      <p className={labelClass}>{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
      <p className={bodyClass}>{detail}</p>
    </article>
  );
}

function MutationPathPanel({
  paths,
}: {
  paths: MultiTrackMutationMapPathSummary[];
}) {
  return (
    <article className={cardClass}>
      <p className={labelClass}>Mutation Paths</p>
      <h3 className="mt-2 text-xl font-bold text-white">
        How the idea changes
      </h3>

      <div className="mt-4 space-y-3">
        {paths.map((path) => (
          <div
            key={path.pathId}
            className="rounded-2xl border border-white/10 bg-black p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-white">{path.title}</p>
              <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/70">
                {path.pointCount} points
              </span>
            </div>
            <p className="mt-2 text-xs text-white/70">
              Strongest: {path.strongestPointTitle}
            </p>
            <p className="mt-2 text-xs text-white/70">
              {getMultiTrackMutationMapReadinessLabel(path.readinessStatus)}
            </p>
          </div>
        ))}
      </div>
    </article>
  );
}

function MutationActivePanel({
  activePoint,
  pathPoints,
  signals,
  risks,
}: {
  activePoint: MultiTrackMutationMapPoint | null;
  pathPoints: MultiTrackMutationMapPoint[];
  signals: MultiTrackMutationMapSignal[];
  risks: MultiTrackMutationMapRisk[];
}) {
  return (
    <article className={cardClass}>
      <p className={labelClass}>Active Mutation</p>
      <h3 className="mt-2 text-xl font-bold text-white">
        {activePoint?.title ?? "No active mutation"}
      </h3>
      <p className={bodyClass}>
        {activePoint?.summary ?? "Select a mutation after wiring."}
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <MutationMetricCard
          label="Strength"
          value={(activePoint?.mutationStrength ?? 0).toString()}
          detail="How far it changed."
        />
        <MutationMetricCard
          label="Keeper"
          value={(activePoint?.keeperScore ?? 0).toString()}
          detail="How useful it may be."
        />
        <MutationMetricCard
          label="Window"
          value={
            activePoint
              ? formatMultiTrackMutationMapRange(
                  activePoint.timeRange.startSeconds,
                  activePoint.timeRange.endSeconds,
                )
              : "0:00 - 0:00"
          }
          detail="Seed timing."
        />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <MutationMiniList
          title="Path Points"
          items={pathPoints.map(
            (point) =>
              `${point.versionId}: ${point.title} · ${getMultiTrackMutationMapMutationLabel(
                point.mutationKind,
              )}`,
          )}
        />
        <MutationMiniList
          title="Signals"
          items={signals.map((signal) => `${signal.label}: ${signal.value}`)}
        />
        <MutationMiniList
          title="Risks"
          items={risks.map((risk) => `${risk.label} · ${risk.severity}`)}
        />
        <MutationMiniList
          title="Parent"
          items={activePoint?.parentPointId ? [activePoint.parentPointId] : []}
        />
      </div>
    </article>
  );
}

function MutationMiniList({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black p-4">
      <p className="text-sm font-semibold text-white">{title}</p>
      <div className="mt-3 space-y-2">
        {items.length > 0 ? (
          items.map((item) => (
            <p key={item} className="text-xs leading-5 text-white/70">
              {item}
            </p>
          ))
        ) : (
          <p className="text-xs text-white/70">Nothing listed yet.</p>
        )}
      </div>
    </div>
  );
}

function MutationPointPanel({
  points,
}: {
  points: MultiTrackMutationMapPointSummary[];
}) {
  return (
    <article className={cardClass}>
      <p className={labelClass}>Mutation Points</p>
      <h3 className="mt-2 text-xl font-bold text-white">
        Version-by-version changes
      </h3>

      <div className="mt-4 space-y-3">
        {points.map((point) => (
          <div
            key={point.pointId}
            className="rounded-2xl border border-white/10 bg-black p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-white">{point.title}</p>
              <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/70">
                {point.versionId}
              </span>
            </div>
            <div className="mt-3 grid gap-2 text-xs text-white/70 sm:grid-cols-3">
              <p>{getMultiTrackMutationMapMutationLabel(point.mutationKind)}</p>
              <p>Keeper {point.keeperScore}</p>
              <p>
                {getMultiTrackMutationMapConfidenceLabel(
                  point.confidenceBucket,
                )}
              </p>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function MutationLanePanel({
  lanes,
}: {
  lanes: MultiTrackMutationMapLane[];
}) {
  return (
    <article className={cardClass}>
      <p className={labelClass}>Mutation Lanes</p>
      <h3 className="mt-2 text-xl font-bold text-white">
        Keepers, support, review
      </h3>

      <div className="mt-4 space-y-3">
        {lanes.map((lane) => (
          <div
            key={lane.id}
            className="rounded-2xl border border-white/10 bg-black p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-white">{lane.label}</p>
              <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/70">
                {getMultiTrackMutationMapReadinessLabel(lane.readinessStatus)}
              </span>
            </div>
            <p className={bodyClass}>{lane.detail}</p>
            <p className="mt-3 text-xs text-white/70">
              {lane.pathIds.length} path{lane.pathIds.length === 1 ? "" : "s"}
            </p>
          </div>
        ))}
      </div>
    </article>
  );
}

function MutationGuardrailPanel({
  notes,
  validationMessages,
  futureCount,
  blockedCount,
}: {
  notes: string[];
  validationMessages: string[];
  futureCount: number;
  blockedCount: number;
}) {
  return (
    <article className={cardClass}>
      <p className={labelClass}>Guardrails</p>
      <h3 className="mt-2 text-xl font-bold text-white">
        Mutation map only, no analyzer claims
      </h3>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <div className="space-y-2">
          {notes.map((note) => (
            <p key={note} className="text-sm leading-6 text-white/70">
              {note}
            </p>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <MutationMetricCard
            label="Future"
            value={futureCount.toString()}
            detail="Waiting for analyzer wiring."
          />
          <MutationMetricCard
            label="Blocked"
            value={blockedCount.toString()}
            detail="Stopped claims."
          />
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-black p-4">
        <p className="text-sm font-semibold text-white">Validation</p>
        <div className="mt-3 space-y-2">
          {validationMessages.length === 0 ? (
            <p className="text-sm text-white/70">No missing seed references.</p>
          ) : (
            validationMessages.map((message) => (
              <p key={message} className="text-sm text-white/70">
                {message}
              </p>
            ))
          )}
        </div>
      </div>
    </article>
  );
}