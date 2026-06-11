import {
  buildMultiTrackIdeaLineageBranchSummaries,
  buildMultiTrackIdeaLineageNodeSummaries,
  buildMultiTrackIdeaLineageReviewPacket,
  formatMultiTrackIdeaLineageRange,
  getMultiTrackIdeaLineageConfidenceLabel,
  getMultiTrackIdeaLineageKindLabel,
  getMultiTrackIdeaLineageMutationLabel,
  getMultiTrackIdeaLineageReadinessLabel,
  validateMultiTrackIdeaLineageState,
} from "./MultiTrackIdeaLineageHelpers";
import { multiTrackIdeaLineageSeed } from "./MultiTrackIdeaLineageSeed";
import type {
  MultiTrackIdeaLineageBranchSummary,
  MultiTrackIdeaLineageLane,
  MultiTrackIdeaLineageNode,
  MultiTrackIdeaLineageNodeSummary,
  MultiTrackIdeaLineageRisk,
  MultiTrackIdeaLineageScore,
  MultiTrackIdeaLineageWorkspaceState,
} from "./MultiTrackIdeaLineageTypes";

const panelClass =
  "rounded-3xl border border-white/15 bg-black p-5 text-white shadow-2xl";
const cardClass = "rounded-2xl border border-white/10 bg-white/[0.03] p-4";
const labelClass = "text-xs uppercase tracking-[0.24em] text-white/70";
const bodyClass = "mt-2 text-sm leading-6 text-white/70";

type MultiTrackIdeaLineageWorkspacePanelProps = {
  state?: MultiTrackIdeaLineageWorkspaceState;
};

export function MultiTrackIdeaLineageWorkspacePanel({
  state = multiTrackIdeaLineageSeed,
}: MultiTrackIdeaLineageWorkspacePanelProps) {
  const validation = validateMultiTrackIdeaLineageState(state);
  const branchSummaries = buildMultiTrackIdeaLineageBranchSummaries(state);
  const nodeSummaries = buildMultiTrackIdeaLineageNodeSummaries(state);
  const reviewPacket = buildMultiTrackIdeaLineageReviewPacket(
    state,
    state.activeBranchId,
    state.activeNodeId,
  );

  return (
    <section className={panelClass}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className={labelClass}>Multi Track Idea Lineage</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-white">
            {state.title}
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-white/70">
            {state.description}
          </p>
        </div>

        <div className="rounded-2xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-white">
          <p className="font-semibold">
            {getMultiTrackIdeaLineageReadinessLabel(state.readinessStatus)}
          </p>
          <p className="mt-1 text-xs text-white/70">
            {validation.isValid ? "No missing seed references" : "Review map"}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <LineageMetricCard
          label="Nodes"
          value={state.nodes.length.toString()}
          detail="Originals, descendants, and mutations."
        />
        <LineageMetricCard
          label="Branches"
          value={state.branches.length.toString()}
          detail="Idea family trees."
        />
        <LineageMetricCard
          label="Ready"
          value={validation.readyCount.toString()}
          detail="Safe lineage claims."
        />
        <LineageMetricCard
          label="Review"
          value={validation.reviewCount.toString()}
          detail="Needs ears or analyzer evidence."
        />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_1.15fr]">
        <LineageBranchPanel branches={branchSummaries} />
        <LineageActivePanel
          activeNode={reviewPacket.activeNode}
          branchNodes={reviewPacket.branchNodes}
          scores={reviewPacket.scores}
          risks={reviewPacket.risks}
        />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <LineageNodePanel nodes={nodeSummaries} />
        <LineageLanePanel lanes={state.lanes} />
      </div>

      <div className="mt-6">
        <LineageGuardrailPanel
          notes={state.guardrailNotes}
          validationMessages={validation.messages}
          futureCount={validation.futureCount}
          blockedCount={validation.blockedCount}
        />
      </div>
    </section>
  );
}

function LineageMetricCard({
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

function LineageBranchPanel({
  branches,
}: {
  branches: MultiTrackIdeaLineageBranchSummary[];
}) {
  return (
    <article className={cardClass}>
      <p className={labelClass}>Lineage Branches</p>
      <h3 className="mt-2 text-xl font-bold text-white">
        Same idea family trees
      </h3>

      <div className="mt-4 space-y-3">
        {branches.map((branch) => (
          <div
            key={branch.branchId}
            className="rounded-2xl border border-white/10 bg-black p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-white">{branch.title}</p>
              <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/70">
                {branch.nodeCount} nodes
              </span>
            </div>
            <p className="mt-2 text-xs text-white/70">
              Root: {branch.rootTitle}
            </p>
            <p className="mt-2 text-xs text-white/70">
              Survivor: {branch.survivorTitle}
            </p>
          </div>
        ))}
      </div>
    </article>
  );
}

function LineageActivePanel({
  activeNode,
  branchNodes,
  scores,
  risks,
}: {
  activeNode: MultiTrackIdeaLineageNode | null;
  branchNodes: MultiTrackIdeaLineageNode[];
  scores: MultiTrackIdeaLineageScore[];
  risks: MultiTrackIdeaLineageRisk[];
}) {
  return (
    <article className={cardClass}>
      <p className={labelClass}>Active Lineage Node</p>
      <h3 className="mt-2 text-xl font-bold text-white">
        {activeNode?.title ?? "No active node"}
      </h3>
      <p className={bodyClass}>
        {activeNode?.summary ?? "Select a lineage node after wiring."}
      </p>

      <div className="mt-4 rounded-2xl border border-white/10 bg-black p-4">
        <p className="text-sm font-semibold text-white">Node Window</p>
        <p className="mt-2 text-xs text-white/70">
          {activeNode
            ? formatMultiTrackIdeaLineageRange(
                activeNode.timeRange.startSeconds,
                activeNode.timeRange.endSeconds,
              )
            : "0:00 - 0:00"}
        </p>
        <p className="mt-2 text-xs text-white/70">
          Mutation:{" "}
          {activeNode
            ? getMultiTrackIdeaLineageMutationLabel(activeNode.mutationKind)
            : "None"}
        </p>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <LineageMiniList
          title="Branch Nodes"
          items={branchNodes.map(
            (node) =>
              `${node.versionId}: ${node.title} · ${getMultiTrackIdeaLineageMutationLabel(
                node.mutationKind,
              )}`,
          )}
        />
        <LineageMiniList
          title="Scores"
          items={scores.map((score) => `${score.label}: ${score.value}`)}
        />
        <LineageMiniList
          title="Risks"
          items={risks.map((risk) => `${risk.label} · ${risk.severity}`)}
        />
        <LineageMiniList
          title="Children"
          items={activeNode?.childNodeIds ?? []}
        />
      </div>
    </article>
  );
}

function LineageMiniList({
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

function LineageNodePanel({
  nodes,
}: {
  nodes: MultiTrackIdeaLineageNodeSummary[];
}) {
  return (
    <article className={cardClass}>
      <p className={labelClass}>Node Summary</p>
      <h3 className="mt-2 text-xl font-bold text-white">
        Versions and mutations
      </h3>

      <div className="mt-4 space-y-3">
        {nodes.map((node) => (
          <div
            key={node.nodeId}
            className="rounded-2xl border border-white/10 bg-black p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-white">{node.title}</p>
              <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/70">
                {node.versionId}
              </span>
            </div>
            <div className="mt-3 grid gap-2 text-xs text-white/70 sm:grid-cols-3">
              <p>{getMultiTrackIdeaLineageKindLabel(node.ideaKind)}</p>
              <p>{getMultiTrackIdeaLineageMutationLabel(node.mutationKind)}</p>
              <p>
                {getMultiTrackIdeaLineageConfidenceLabel(
                  node.confidenceBucket,
                )}
              </p>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function LineageLanePanel({
  lanes,
}: {
  lanes: MultiTrackIdeaLineageLane[];
}) {
  return (
    <article className={cardClass}>
      <p className={labelClass}>Lineage Lanes</p>
      <h3 className="mt-2 text-xl font-bold text-white">
        Survivors, support, review
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
                {getMultiTrackIdeaLineageReadinessLabel(lane.readinessStatus)}
              </span>
            </div>
            <p className={bodyClass}>{lane.detail}</p>
            <p className="mt-3 text-xs text-white/70">
              {lane.branchIds.length} branch
              {lane.branchIds.length === 1 ? "" : "es"}
            </p>
          </div>
        ))}
      </div>
    </article>
  );
}

function LineageGuardrailPanel({
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
        Lineage map only, no DSP claims
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
          <LineageMetricCard
            label="Future"
            value={futureCount.toString()}
            detail="Waiting for analyzer wiring."
          />
          <LineageMetricCard
            label="Blocked"
            value={blockedCount.toString()}
            detail="Stopped lineage claims."
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