"use client";

import MomentInspectorIntelligenceSection from "./MomentInspectorIntelligenceSection";

export default function MomentInspectorRuntimeLegendPanel() {
  return (
    <MomentInspectorIntelligenceSection
      title="Runtime Legend"
      subtitle="what each score means"
    >
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded border border-zinc-200 bg-white px-2 py-2">
          <div className="text-[10px] font-medium text-zinc-700">Outcome</div>
          <div className="mt-1 text-[10px] text-zinc-600">
            What happened after execution and whether the family produced a useful result.
          </div>
        </div>

        <div className="rounded border border-zinc-200 bg-white px-2 py-2">
          <div className="text-[10px] font-medium text-zinc-700">Learning</div>
          <div className="mt-1 text-[10px] text-zinc-600">
            What the system learned from the result and whether the family should be reinforced.
          </div>
        </div>

        <div className="rounded border border-zinc-200 bg-white px-2 py-2">
          <div className="text-[10px] font-medium text-zinc-700">Optimization</div>
          <div className="mt-1 text-[10px] text-zinc-600">
            Whether the system should reuse, reinforce, avoid, or redirect this family.
          </div>
        </div>

        <div className="rounded border border-zinc-200 bg-white px-2 py-2">
          <div className="text-[10px] font-medium text-zinc-700">Repair</div>
          <div className="mt-1 text-[10px] text-zinc-600">
            How much repair attention this family may need before it becomes more reliable.
          </div>
        </div>
      </div>
    </MomentInspectorIntelligenceSection>
  );
}