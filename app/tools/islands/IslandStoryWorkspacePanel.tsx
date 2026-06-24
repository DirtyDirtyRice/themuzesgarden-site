// app/tools/islands/IslandStoryWorkspacePanel.tsx

"use client";

const storyAreas = [
  "Personal Stories",
  "Family Stories",
  "Song Stories",
  "Project Stories",
  "Success Stories",
  "Failure Stories",
  "Creator Stories",
  "Community Stories",
  "Historical Stories",
  "Future Stories",
];

export function IslandStoryWorkspacePanel() {
  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-white/20 bg-black p-6">
        <h2 className="text-3xl font-black text-white">
          Story Workspace
        </h2>

        <p className="mt-4 text-white/70">
          Stories help ideas survive.
        </p>
      </section>

      <section className="rounded-3xl border border-white/20 bg-black p-6">
        <div className="space-y-2">
          {storyAreas.map((area) => (
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