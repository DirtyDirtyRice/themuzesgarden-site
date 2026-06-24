// app/tools/islands/IslandResearchWorkspacePanel.tsx

"use client";

const researchAreas = [
  "Research Projects",
  "Research Notes",
  "Knowledge Base",
  "References",
  "Sources",
  "Experiments",
  "Discoveries",
  "Timelines",
  "Documentation",
  "Future Research",
];

export function IslandResearchWorkspacePanel() {
  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-white/20 bg-black p-6">
        <h2 className="text-3xl font-black text-white">
          Research Workspace
        </h2>

        <p className="mt-4 text-white/70">
          Organize knowledge and discoveries.
        </p>
      </section>

      <section className="rounded-3xl border border-white/20 bg-black p-6">
        <div className="space-y-2">
          {researchAreas.map((area) => (
            <div
              key={area}
              className="rounded-xl border border-white/10 px-3 py-2 text-white/80"
            >
              ▶ {area}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}