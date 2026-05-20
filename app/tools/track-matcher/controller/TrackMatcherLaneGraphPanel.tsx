"use client";

import {
  createTrackMatcherLaneGraphSummary,
  getTrackMatcherLaneGraphActiveNodes,
  getTrackMatcherLaneGraphEdgesForLane,
  getTrackMatcherLaneGraphPlannedNodes,
} from "./trackMatcherLaneGraphHelpers";
import {
  describeTrackMatcherLaneGraphSystem,
  getTrackMatcherLaneGraphNextFocus,
} from "./trackMatcherLaneGraphNarratives";
import {
  getTrackMatcherLaneGraphEdgeKindLabel,
  getTrackMatcherLaneGraphNodeKindLabel,
  getTrackMatcherLaneGraphStrengthLabel,
  type TrackMatcherLaneGraphNode,
} from "./trackMatcherLaneGraphTypes";

function GraphStatCard({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
        {label}
      </p>

      <p className="mt-3 text-3xl font-bold text-white">
        {value}
      </p>

      <p className="mt-2 text-sm leading-6 text-white/65">
        {description}
      </p>
    </div>
  );
}

function GraphNodeCard({
  node,
}: {
  node: TrackMatcherLaneGraphNode;
}) {
  const edges = getTrackMatcherLaneGraphEdgesForLane(node.laneId);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
            {getTrackMatcherLaneGraphNodeKindLabel(node.kind)}
          </p>

          <h3 className="mt-2 text-lg font-bold text-white">
            {node.title}
          </h3>
        </div>

        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/65">
          {node.active ? "Active" : "Planned"}
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-white/65">
        {node.description}
      </p>

      <div className="mt-4 space-y-2">
        {edges.map((edge) => (
          <div
            key={edge.id}
            className="rounded-xl border border-white/10 bg-black/25 p-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-bold text-white">
                {edge.title}
              </p>

              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-100/75">
                {getTrackMatcherLaneGraphStrengthLabel(edge.strength)}
              </p>
            </div>

            <p className="mt-2 text-xs leading-5 text-white/55">
              {getTrackMatcherLaneGraphEdgeKindLabel(edge.kind)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TrackMatcherLaneGraphPanel() {
  const summary = createTrackMatcherLaneGraphSummary();
  const activeNodes = getTrackMatcherLaneGraphActiveNodes();
  const plannedNodes = getTrackMatcherLaneGraphPlannedNodes();

  return (
    <section className="rounded-3xl border border-white/10 bg-black/30 p-5">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">
          Lane Relationship Graph
        </p>

        <h2 className="mt-2 text-2xl font-bold text-white">
          Audio Intelligence Graph Map
        </h2>

        <p className="mt-4 max-w-3xl text-sm leading-7 text-white/65">
          {describeTrackMatcherLaneGraphSystem()}
        </p>

        <p className="mt-3 max-w-3xl text-sm leading-7 text-cyan-100/75">
          {getTrackMatcherLaneGraphNextFocus()}
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <GraphStatCard
          label="Graph Nodes"
          value={summary.nodeCount}
          description="Mapped lane graph nodes across active and future workflows."
        />

        <GraphStatCard
          label="Graph Edges"
          value={summary.edgeCount}
          description="Mapped relationships between lane graph nodes."
        />

        <GraphStatCard
          label="Planned Edges"
          value={summary.plannedEdgeCount}
          description="Future edges reserved for lineage, stems, and generation review."
        />
      </div>

      <div className="mt-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
          Active Nodes
        </p>

        <div className="mt-3 grid gap-4 xl:grid-cols-2">
          {activeNodes.map((node) => (
            <GraphNodeCard
              key={node.id}
              node={node}
            />
          ))}
        </div>
      </div>

      <div className="mt-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
          Planned Nodes
        </p>

        <div className="mt-3 grid gap-4 xl:grid-cols-3">
          {plannedNodes.map((node) => (
            <GraphNodeCard
              key={node.id}
              node={node}
            />
          ))}
        </div>
      </div>
    </section>
  );
}