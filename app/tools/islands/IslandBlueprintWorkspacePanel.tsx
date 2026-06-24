// app/tools/islands/IslandBlueprintWorkspacePanel.tsx

"use client";

const blueprintSections = [
  {
    title: "Official Blueprints",
    items: [
      "Musician Island",
      "Songwriter Island",
      "Band Island",
      "Producer Island",
      "Research Island",
      "Family History Island",
      "Teacher Island",
      "Photography Island",
      "Writer Island",
      "Community Island",
    ],
  },
  {
    title: "Community Blueprints",
    items: [
      "Most Installed",
      "Most Remixed",
      "Most Shared",
      "Highest Rated",
      "Fastest Growing",
      "Community Favorites",
      "Creator Favorites",
      "Featured Blueprints",
    ],
  },
  {
    title: "Blueprint Management",
    items: [
      "Install Blueprint",
      "Duplicate Blueprint",
      "Remix Blueprint",
      "Export Blueprint",
      "Import Blueprint",
      "Archive Blueprint",
      "Restore Blueprint",
      "Version History",
    ],
  },
  {
    title: "Blueprint Categories",
    items: [
      "Music",
      "Writing",
      "Research",
      "Education",
      "Photography",
      "Video",
      "Family",
      "Business",
      "Community",
      "Experimental",
    ],
  },
  {
    title: "Future Blueprint Systems",
    items: [
      "Blueprint Marketplace",
      "Blueprint Reviews",
      "Blueprint Ratings",
      "Blueprint Authors",
      "Blueprint Revenue Sharing",
      "Blueprint Collaboration",
      "Blueprint Analytics",
      "Blueprint Intelligence",
    ],
  },
];

export function IslandBlueprintWorkspacePanel() {
  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-white/20 bg-black p-6">
        <p className="text-xs uppercase tracking-[0.4em] text-white/50">
          BLUEPRINTS
        </p>

        <h1 className="mt-3 text-3xl font-black text-white">
          Blueprint Workspace
        </h1>

        <p className="mt-4 text-white/70">
          Borrow ideas. Do not borrow limits.
        </p>
      </section>

      {blueprintSections.map((section) => (
        <section
          key={section.title}
          className="rounded-3xl border border-white/20 bg-black p-6"
        >
          <h2 className="text-2xl font-black text-white">
            {section.title}
          </h2>

          <div className="mt-5 space-y-2">
            {section.items.map((item) => (
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