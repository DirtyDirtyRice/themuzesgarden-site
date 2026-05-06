"use client";

import {
  getRelationshipLayerMomentum,
  getRelationshipLayerLabel,
  getRelationshipNextStep,
  type MetadataRelationshipLayerKey,
  type MetadataRelationshipMemoryItem,
  type MetadataRelationshipSnapshot,
} from "./MetadataLibraryRelationshipIntelligence";

type Props = {
  activeLayer: MetadataRelationshipLayerKey;
  memoryItems: MetadataRelationshipMemoryItem[];
  relationshipSnapshot: MetadataRelationshipSnapshot;
};

export default function MetadataLibraryRelationshipMemoryPanel({
  activeLayer,
  memoryItems,
  relationshipSnapshot,
}: Props) {
  return (
    <div className="rounded-xl border border-white bg-black p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">
            Relationship Memory System
          </p>

          <p className="mt-2 text-sm leading-6 text-white/70">
            The workspace now keeps a compact memory map for the active record,
            active layer, search context, and relationship candidate pool.
          </p>
        </div>

        <span className="rounded-full border border-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
          {getRelationshipLayerLabel(activeLayer)}
        </span>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {memoryItems.map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-white/30 px-3 py-2"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">
                {item.label}
              </p>

              <span className="rounded-full border border-white/30 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/65">
                {item.value}
              </span>
            </div>

            <p className="mt-2 text-xs leading-5 text-white/70">
              {item.detail}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-3 grid gap-2">
        <div className="rounded-lg border border-white/30 px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">
            Layer Momentum
          </p>

          <p className="mt-1 text-xs leading-5 text-white/70">
            {getRelationshipLayerMomentum(activeLayer)}
          </p>
        </div>

        <div className="rounded-lg border border-white/30 px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">
            Next Step
          </p>

          <p className="mt-1 text-xs leading-5 text-white/70">
            {getRelationshipNextStep(activeLayer)}
          </p>
        </div>

        <div className="rounded-lg border border-white/30 px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">
            Readiness
          </p>

          <p className="mt-1 text-xs leading-5 text-white/70">
            {relationshipSnapshot.relationshipReadiness}
          </p>
        </div>
      </div>
    </div>
  );
}