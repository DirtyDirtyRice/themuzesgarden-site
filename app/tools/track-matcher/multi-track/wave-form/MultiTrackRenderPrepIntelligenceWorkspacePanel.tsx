"use client";

import { multiTrackRenderPrepIntelligenceWorkspaceState } from "./MultiTrackRenderPrepIntelligenceSeed";
import {
  getMultiTrackRenderPrepFormatLabel,
  getMultiTrackRenderPrepLaneItems,
  getMultiTrackRenderPrepRiskSummary,
  getMultiTrackRenderPrepSourceLabel,
  getMultiTrackRenderPrepStatusClass,
  getMultiTrackRenderPrepStatusLabel,
  getMultiTrackRenderPrepTargetLabel,
  getMultiTrackRenderPrepWorkspaceSummary,
} from "./MultiTrackRenderPrepIntelligenceHelpers";
import type {
  MultiTrackRenderPrepChecklistItem,
  MultiTrackRenderPrepItem,
  MultiTrackRenderPrepLane,
} from "./MultiTrackRenderPrepIntelligenceTypes";

function RenderPrepStatusPill({
  status,
}: {
  status: MultiTrackRenderPrepChecklistItem["status"];
}) {
  return (
    <span
      className={`rounded-full border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${getMultiTrackRenderPrepStatusClass(
        status,
      )}`}
    >
      {getMultiTrackRenderPrepStatusLabel(status)}
    </span>
  );
}

function RenderPrepBlockHeader({
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

function RenderPrepMetricCard({
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

function RenderPrepItemCard({ item }: { item: MultiTrackRenderPrepItem }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-black p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
            {getMultiTrackRenderPrepTargetLabel(item.target)}
          </p>
          <h4 className="mt-2 text-base font-semibold text-white">
            {item.title}
          </h4>
          <p className="mt-2 text-sm leading-6 text-white/70">
            {item.summary}
          </p>
        </div>
        <RenderPrepStatusPill status={item.readinessStatus} />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
            Format
          </p>
          <p className="mt-2 text-sm text-white/75">
            {getMultiTrackRenderPrepFormatLabel(item.format)}
          </p>
          <p className="mt-1 text-xs text-white/50">{item.priorityLabel}</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
            Source
          </p>
          <p className="mt-2 text-sm text-white/75">
            {getMultiTrackRenderPrepSourceLabel(item.source)}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
            Risks
          </p>
          <p className="mt-2 text-sm text-white/75">
            {getMultiTrackRenderPrepRiskSummary(item.risks)}
          </p>
        </div>
      </div>

      <p className="mt-4 rounded-xl border border-white/10 bg-black p-3 text-sm leading-6 text-white/65">
        {item.reviewNote}
      </p>
    </article>
  );
}

function RenderPrepLaneCard({
  lane,
  items,
}: {
  lane: MultiTrackRenderPrepLane;
  items: MultiTrackRenderPrepItem[];
}) {
  const laneItems = getMultiTrackRenderPrepLaneItems(lane, items);

  return (
    <article className="rounded-2xl border border-white/10 bg-black p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h4 className="text-base font-semibold text-white">{lane.title}</h4>
          <p className="mt-2 text-sm leading-6 text-white/70">
            {lane.description}
          </p>
        </div>
        <RenderPrepStatusPill status={lane.status} />
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
          Lane Items
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {laneItems.map((item) => (
            <span
              key={item.id}
              className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-white/70"
            >
              {item.title}
            </span>
          ))}
        </div>
      </div>

      <p className="mt-4 rounded-xl border border-white/10 bg-black p-3 text-sm leading-6 text-white/65">
        {lane.outputGoal}
      </p>
    </article>
  );
}

function RenderPrepChecklistRow({
  item,
}: {
  item: MultiTrackRenderPrepChecklistItem;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h4 className="text-sm font-semibold text-white">{item.label}</h4>
          <p className="mt-2 text-sm leading-6 text-white/65">{item.detail}</p>
        </div>
        <RenderPrepStatusPill status={item.status} />
      </div>
    </div>
  );
}

export function MultiTrackRenderPrepIntelligenceWorkspacePanel() {
  const workspace = multiTrackRenderPrepIntelligenceWorkspaceState;
  const readyItemCount = workspace.items.filter(
    (item) => item.readinessStatus === "ready",
  ).length;
  const reviewItemCount = workspace.items.filter(
    (item) => item.readinessStatus === "needs-review",
  ).length;
  const wavItemCount = workspace.items.filter((item) => item.format === "wav")
    .length;
  const futureLaneCount = workspace.lanes.filter(
    (lane) => lane.status === "future",
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
              {getMultiTrackRenderPrepWorkspaceSummary(workspace)}
            </p>
          </div>
          <RenderPrepStatusPill status={workspace.status} />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <RenderPrepMetricCard
          label="Ready Items"
          value={String(readyItemCount)}
          detail="Render prep items safe for read-only display."
        />
        <RenderPrepMetricCard
          label="Review Items"
          value={String(reviewItemCount)}
          detail="Items that need confidence or ownership review."
        />
        <RenderPrepMetricCard
          label="WAV Paths"
          value={String(wavItemCount)}
          detail="Musician-first WAV planning paths."
        />
        <RenderPrepMetricCard
          label="Future Lanes"
          value={String(futureLaneCount)}
          detail="Reserved actual render-engine lanes."
        />
      </div>

      <div className="space-y-4">
        <RenderPrepBlockHeader
          eyebrow="Items"
          title="Render prep items"
          description="Read-only preparation cards for WAV, MP3, stems, hybrid preview, Suno reference, metadata package, project package, and future rendering."
        />
        <div className="grid gap-4 xl:grid-cols-2">
          {workspace.items.map((item) => (
            <RenderPrepItemCard key={item.id} item={item} />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <RenderPrepBlockHeader
          eyebrow="Lanes"
          title="Render prep lanes"
          description="Grouped lanes for musician export prep, reference export prep, hybrid export prep, and future render-engine isolation."
        />
        <div className="grid gap-4 xl:grid-cols-2">
          {workspace.lanes.map((lane) => (
            <RenderPrepLaneCard
              key={lane.id}
              lane={lane}
              items={workspace.items}
            />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <RenderPrepBlockHeader
          eyebrow="Checklist"
          title="Recovery-safe checklist"
          description="Guardrails for keeping render prep read-only, WAV-first, confidence-gated, and future-render isolated."
        />
        <div className="grid gap-4 md:grid-cols-2">
          {workspace.checklist.map((item) => (
            <RenderPrepChecklistRow key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}