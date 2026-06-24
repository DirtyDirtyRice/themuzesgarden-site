// app/tools/islands/IslandDiscoveryWorkspacePanel.tsx

"use client";

const discoverySections = [
  {
    title: "Discover Creators",
    items: [
      "Featured Creators",
      "New Creators",
      "Creator Spotlights",
      "Most Helpful Creators",
      "Most Followed Creators",
      "Community Favorites",
      "Rising Creators",
      "Island Of The Month",
    ],
  },
  {
    title: "Discover Islands",
    items: [
      "Featured Islands",
      "Newest Islands",
      "Most Shared Islands",
      "Most Remixed Islands",
      "Hidden Gems",
      "Educational Islands",
      "Research Islands",
      "Creative Islands",
    ],
  },
  {
    title: "Discover Knowledge",
    items: [
      "Blueprint Library",
      "Experience Library",
      "Community Guides",
      "Creator Guides",
      "Lessons Learned",
      "Mistakes To Avoid",
      "Time Saving Tips",
      "Best Practices",
    ],
  },
];

export function IslandDiscoveryWorkspacePanel() {
  return (
    <div className="space-y-5">
      {discoverySections.map((section) => (
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