"use client";

import { multiTrackLineageIntelligenceWorkspaceState } from "./MultiTrackLineageIntelligenceSeed";
import {
  getMultiTrackLineageChainNodes,
  getMultiTrackLineageChainRelationships,
  getMultiTrackLineageConfidenceLabel,
  getMultiTrackLineageEvidenceSourceLabel,
  getMultiTrackLineageRelationshipNodeLabel,
  getMultiTrackLineageRelationshipTypeLabel,
  getMultiTrackLineageReviewLaneNodes,
  getMultiTrackLineageReviewLaneRelationships,
  getMultiTrackLineageRiskSummary,
  getMultiTrackLineageSourceTypeLabel,
  getMultiTrackLineageStatusClass,
  getMultiTrackLineageStatusLabel,
  getMultiTrackLineageWorkspaceSummary,
} from "./MultiTrackLineageIntelligenceHelpers";
import type {
  MultiTrackLineageChain,
  MultiTrackLineageChecklistItem,
  MultiTrackLineageNode,
  MultiTrackLineageRelationship,
  MultiTrackLineageReviewLane,
} from "./MultiTrackLineageIntelligenceTypes";

function LineageStatusPill({
  status,
}: {
  status: MultiTrackLineageChecklistItem["status"];
}) {
  return (
    <span
      className={`rounded-full border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${getMultiTrackLineageStatusClass(
        status,
      )}`}
    >
      {getMultiTrackLineageStatusLabel(status)}
    </span>
  );
}

function LineageSectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/60">
        {eyebrow}
      </p>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="max-w-4xl text-sm leading-6 text-white/70">
        {description}
      </p>
    </div>
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
    <div className="rounded-2xl border border-white/10 bg-black p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-white/65">{detail}</p>
    </div>
  );
}

function LineageNodeCard({ node }: { node: MultiTrackLineageNode }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-black p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
            {getMultiTrackLineageSourceTypeLabel(node.sourceType)}
          </p>
          <h4 className="mt-2 text-base font-semibold text-white">
            {node.title}
          </h4>
          <p className="mt-2 text-sm leading-6 text-white/70">
            {node.description}
          </p>
        </div>
        <LineageStatusPill status={node.readinessStatus} />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
            Confidence
          </p>
          <p className="mt-2 text-sm text-white/75">
            {getMultiTrackLineageConfidenceLabel(node.confidenceLevel)}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
            Evidence
          </p>
          <p className="mt-2 text-sm text-white/75">
            {getMultiTrackLineageEvidenceSourceLabel(node.evidenceSource)}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
            Risks
          </p>
          <p className="mt-2 text-sm text-white/75">
            {getMultiTrackLineageRiskSummary(node.risks)}
          </p>
        </div>
      </div>

      <p className="mt-4 rounded-xl border border-white/10 bg-black p-3 text-sm leading-6 text-white/65">
        {node.notes}
      </p>
    </article>
  );
}

function LineageRelationshipCard({
  relationship,
  nodes,
}: {
  relationship: MultiTrackLineageRelationship;
  nodes: MultiTrackLineageNode[];
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-black p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
            {getMultiTrackLineageRelationshipTypeLabel(
              relationship.relationshipType,
            )}
          </p>
          <h4 className="mt-2 text-base font-semibold text-white">
            {getMultiTrackLineageRelationshipNodeLabel(relationship, nodes)}
          </h4>
          <p className="mt-2 text-sm leading-6 text-white/70">
            {relationship.explanation}
          </p>
        </div>
        <LineageStatusPill status={relationship.readinessStatus} />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
            Confidence
          </p>
          <p className="mt-2 text-sm text-white/75">
            {getMultiTrackLineageConfidenceLabel(
              relationship.confidenceLevel,
            )}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
            Evidence
          </p>
          <p className="mt-2 text-sm text-white/75">
            {getMultiTrackLineageEvidenceSourceLabel(
              relationship.evidenceSource,
            )}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
            Risks
          </p>
          <p className="mt-2 text-sm text-white/75">
            {getMultiTrackLineageRiskSummary(relationship.risks)}
          </p>
        </div>
      </div>
    </article>
  );
}

function LineageChainCard({
  chain,
  nodes,
  relationships,
}: {
  chain: MultiTrackLineageChain;
  nodes: MultiTrackLineageNode[];
  relationships: MultiTrackLineageRelationship[];
}) {
  const chainNodes = getMultiTrackLineageChainNodes(chain, nodes);
  const chainRelationships = getMultiTrackLineageChainRelationships(
    chain,
    relationships,
  );

  return (
    <article className="rounded-2xl border border-white/10 bg-black p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h4 className="text-base font-semibold text-white">{chain.title}</h4>
          <p className="mt-2 text-sm leading-6 text-white/70">
            {chain.description}
          </p>
        </div>
        <LineageStatusPill status={chain.readinessStatus} />
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
          Node Path
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {chainNodes.map((node) => (
            <span
              key={node.id}
              className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-white/70"
            >
              {node.title}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
          Relationships
        </p>
        <div className="mt-3 space-y-2">
          {chainRelationships.map((relationship) => (
            <p key={relationship.id} className="text-sm text-white/70">
              {getMultiTrackLineageRelationshipNodeLabel(relationship, nodes)}
            </p>
          ))}
        </div>
      </div>

      <p className="mt-4 rounded-xl border border-white/10 bg-black p-3 text-sm leading-6 text-white/65">
        {chain.reviewNote}
      </p>
    </article>
  );
}

function LineageReviewLaneCard({
  lane,
  nodes,
  relationships,
}: {
  lane: MultiTrackLineageReviewLane;
  nodes: MultiTrackLineageNode[];
  relationships: MultiTrackLineageRelationship[];
}) {
  const laneNodes = getMultiTrackLineageReviewLaneNodes(lane, nodes);
  const laneRelationships = getMultiTrackLineageReviewLaneRelationships(
    lane,
    relationships,
  );

  return (
    <article className="rounded-2xl border border-white/10 bg-black p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h4 className="text-base font-semibold text-white">{lane.title}</h4>
          <p className="mt-2 text-sm leading-6 text-white/70">
            {lane.description}
          </p>
        </div>
        <LineageStatusPill status={lane.status} />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
            Nodes
          </p>
          <div className="mt-3 space-y-2">
            {laneNodes.map((node) => (
              <p key={node.id} className="text-sm text-white/75">
                {node.title}
              </p>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
            Relationships
          </p>
          <div className="mt-3 space-y-2">
            {laneRelationships.map((relationship) => (
              <p key={relationship.id} className="text-sm text-white/75">
                {getMultiTrackLineageRelationshipTypeLabel(
                  relationship.relationshipType,
                )}
              </p>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
            Required Evidence
          </p>
          <div className="mt-3 space-y-2">
            {lane.requiredEvidence.map((evidenceSource) => (
              <p key={evidenceSource} className="text-sm text-white/75">
                {getMultiTrackLineageEvidenceSourceLabel(evidenceSource)}
              </p>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-4 rounded-xl border border-white/10 bg-black p-3 text-sm leading-6 text-white/65">
        {lane.reviewNote}
      </p>
    </article>
  );
}

function LineageChecklistRow({
  item,
}: {
  item: MultiTrackLineageChecklistItem;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h4 className="text-sm font-semibold text-white">{item.label}</h4>
          <p className="mt-2 text-sm leading-6 text-white/65">{item.detail}</p>
        </div>
        <LineageStatusPill status={item.status} />
      </div>
    </div>
  );
}

export function MultiTrackLineageIntelligenceWorkspacePanel() {
  const workspace = multiTrackLineageIntelligenceWorkspaceState;
  const readyNodeCount = workspace.nodes.filter(
    (node) => node.readinessStatus === "ready",
  ).length;
  const reviewNodeCount = workspace.nodes.filter(
    (node) => node.readinessStatus === "needs-review",
  ).length;
  const readyRelationshipCount = workspace.relationships.filter(
    (relationship) => relationship.readinessStatus === "ready",
  ).length;
  const futureChainCount = workspace.chains.filter(
    (chain) => chain.readinessStatus === "future",
  ).length;

  return (
    <section className="space-y-6 rounded-3xl border border-white/10 bg-black p-5">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/50">
              Waveform Workstation
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              {workspace.title}
            </h2>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-white/70">
              {workspace.description}
            </p>
            <p className="mt-3 text-sm font-semibold text-white/75">
              {getMultiTrackLineageWorkspaceSummary(workspace)}
            </p>
          </div>
          <LineageStatusPill status={workspace.status} />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <LineageMetricCard
          label="Ready Nodes"
          value={String(readyNodeCount)}
          detail="Source nodes safe for read-only display."
        />
        <LineageMetricCard
          label="Review Nodes"
          value={String(reviewNodeCount)}
          detail="Nodes that need stronger source confirmation."
        />
        <LineageMetricCard
          label="Ready Links"
          value={String(readyRelationshipCount)}
          detail="Relationships safe for review without automation."
        />
        <LineageMetricCard
          label="Future Chains"
          value={String(futureChainCount)}
          detail="Reserved paths for future hybrid outputs."
        />
      </div>

      <div className="space-y-4">
        <LineageSectionHeader
          eyebrow="Nodes"
          title="Lineage source nodes"
          description="Read-only source cards for originals, demos, generated outputs, stems, masters, references, and future hybrid outputs."
        />
        <div className="grid gap-4 xl:grid-cols-2">
          {workspace.nodes.map((node) => (
            <LineageNodeCard key={node.id} node={node} />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <LineageSectionHeader
          eyebrow="Relationships"
          title="Lineage relationships"
          description="Parent, child, reference, and derived-from links with confidence labels and risk guards."
        />
        <div className="grid gap-4 xl:grid-cols-2">
          {workspace.relationships.map((relationship) => (
            <LineageRelationshipCard
              key={relationship.id}
              relationship={relationship}
              nodes={workspace.nodes}
            />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <LineageSectionHeader
          eyebrow="Chains"
          title="Lineage chains"
          description="Traceable source paths for checking how an original idea moves into generated, stemmed, mastered, and future hybrid outputs."
        />
        <div className="grid gap-4 xl:grid-cols-2">
          {workspace.chains.map((chain) => (
            <LineageChainCard
              key={chain.id}
              chain={chain}
              nodes={workspace.nodes}
              relationships={workspace.relationships}
            />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <LineageSectionHeader
          eyebrow="Review Lanes"
          title="Lineage review lanes"
          description="Guarded review lanes for source proof, reference safety, and future output tracing."
        />
        <div className="grid gap-4 xl:grid-cols-3">
          {workspace.reviewLanes.map((lane) => (
            <LineageReviewLaneCard
              key={lane.id}
              lane={lane}
              nodes={workspace.nodes}
              relationships={workspace.relationships}
            />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <LineageSectionHeader
          eyebrow="Checklist"
          title="Recovery-safe checklist"
          description="Guardrails for avoiding unsupported lineage, ownership, or reference claims."
        />
        <div className="grid gap-4 md:grid-cols-2">
          {workspace.checklist.map((item) => (
            <LineageChecklistRow key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}