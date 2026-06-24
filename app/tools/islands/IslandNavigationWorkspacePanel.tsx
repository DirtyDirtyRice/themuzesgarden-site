// app/tools/islands/IslandNavigationWorkspacePanel.tsx

"use client";

const navigationGroups = [
  {
    title: "Primary Navigation",
    items: [
      "Home",
      "Create",
      "Tools",
      "Discover",
      "Community",
      "Protect",
      "Learn",
    ],
  },
  {
    title: "Creator Navigation",
    items: [
      "Pages",
      "Projects",
      "Library",
      "Stories",
      "Research",
      "Media",
      "Blueprints",
      "Experiences",
    ],
  },
  {
    title: "Future Navigation",
    items: [
      "AI",
      "Music Intelligence",
      "Knowledge Systems",
      "Publishing",
      "Ownership",
      "Collaboration",
    ],
  },
];

export function IslandNavigationWorkspacePanel() {
  return (
    <div className="space-y-5">
      {navigationGroups.map((group) => (
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