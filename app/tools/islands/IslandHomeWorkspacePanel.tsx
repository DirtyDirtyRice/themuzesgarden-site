// app/tools/islands/IslandHomeWorkspacePanel.tsx

"use client";

const homeSections = [
  {
    title: "Welcome To Your Island",
    items: [
      "An Island is not a website.",
      "An Island is a place where ideas are allowed to grow.",
      "Some ideas become songs.",
      "Some ideas become stories.",
      "Some ideas become projects.",
      "Some ideas become memories.",
      "Some ideas become communities.",
      "Some ideas become discoveries.",
      "Some ideas become things nobody imagined.",
    ],
  },
  {
    title: "What Is An Island?",
    items: [
      "Private Workspace",
      "Public Workspace",
      "Permission Based Workspace",
      "Creative Workspace",
      "Research Workspace",
      "Family Workspace",
      "Community Workspace",
      "Knowledge Workspace",
    ],
  },
  {
    title: "Why Is My Island Empty?",
    items: [
      "Blank Is The Default",
      "Ideas Need Room To Grow",
      "No Required Structure",
      "No Required Templates",
      "No Required Blueprints",
      "No Required Pages",
      "Possibility Before Complexity",
    ],
  },
  {
    title: "The Creator's Promise",
    items: [
      "You Are Free To Create",
      "You Are Free To Experiment",
      "You Are Free To Learn",
      "You Are Free To Change Your Mind",
      "You Are Free To Start Over",
      "You Are Free To Build Something New",
    ],
  },
];

export function IslandHomeWorkspacePanel() {
  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-white/20 bg-black p-6">
        <h1 className="text-3xl font-black text-white">
          Island Home Workspace
        </h1>

        <p className="mt-4 text-white/70">
          One Page. Infinite Depth.
        </p>
      </section>

      {homeSections.map((section) => (
        <section
          key={section.title}
          className="rounded-3xl border border-white/20 bg-black p-6"
        >
          <h2 className="text-2xl font-black text-white">
            {section.title}
          </h2>

          <div className="mt-4 space-y-2">
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