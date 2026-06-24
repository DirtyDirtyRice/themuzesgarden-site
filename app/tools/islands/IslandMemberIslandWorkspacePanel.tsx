// app/tools/islands/IslandMemberIslandWorkspacePanel.tsx

"use client";

export function IslandMemberIslandWorkspacePanel() {
  const islands = [
    "See What Members Built",
    "Featured Islands",
    "New Islands",
    "Creator Spotlights",
    "Community Favorites",
    "Most Installed Blueprints",
    "Most Remixed Islands",
    "Most Shared Experiences",
    "Island Of The Month",
    "Explore Public Islands",
  ];

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-white/20 bg-black p-6">
        <h2 className="text-3xl font-black text-white">
          Member Islands
        </h2>

        <p className="mt-4 text-white/70">
          Discover what other creators have built.
        </p>
      </section>

      <section className="rounded-3xl border border-white/20 bg-black p-6">
        <div className="grid gap-2">
          {islands.map((item) => (
            <div
              key={item}
              className="rounded-xl border border-white/10 px-3 py-2 text-white/80"
            >
              ▶ {item}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}