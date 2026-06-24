// app/tools/islands/IslandCreateWorkspacePanel.tsx

"use client";

const createGroups = [
  {
    title: "Start From Scratch",
    items: [
      "Blank Island",
      "Blank Page",
      "Blank Project",
      "Blank Library",
      "Blank Story",
      "Blank Research Area",
    ],
  },
  {
    title: "Start With Ideas",
    items: [
      "Suggestions",
      "Popular Ideas",
      "Creator Favorites",
      "Community Favorites",
      "Featured Examples",
    ],
  },
  {
    title: "Start With Structure",
    items: [
      "Templates",
      "Blueprints",
      "Experiences",
      "Guided Setup",
      "Remix Existing Island",
    ],
  },
];

export function IslandCreateWorkspacePanel() {
  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-white/20 bg-black p-6">
        <h1 className="text-3xl font-black text-white">
          Create Workspace
        </h1>

        <p className="mt-4 text-white/70">
          Blank Is The Default.
        </p>
      </section>

      {createGroups.map((group) => (
        <section
          key={group.title}
          className="rounded-3xl border border-white/20 bg-black p-6"
        >
          <h2 className="text-2xl font-black text-white">
            {group.title}
          </h2>

          <div className="mt-5 space-y-2">
            {group.items.map((item) => (
              <div
                key={item}
                className="rounded-xl border border-white/10 px-3 py-2 text-white/80"
              >
                ▶ {item}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}