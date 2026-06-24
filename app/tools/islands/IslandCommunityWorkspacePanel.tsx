// app/tools/islands/IslandCommunityWorkspacePanel.tsx

"use client";

const communitySections = [
  {
    title: "Featured Members",
    items: [
      "Creator Spotlights",
      "Featured Members",
      "Most Helpful Members",
      "Rising Creators",
      "Community Favorites",
      "Mentors",
      "Teachers",
      "Contributors",
    ],
  },
  {
    title: "Featured Islands",
    items: [
      "Island Of The Month",
      "Most Shared Islands",
      "Most Visited Islands",
      "Most Remixed Islands",
      "Newest Islands",
      "Hidden Gems",
      "Educational Islands",
      "Creative Islands",
    ],
  },
  {
    title: "Community Experiences",
    items: [
      "Lessons Learned",
      "Mistakes To Avoid",
      "Success Stories",
      "Failure Stories",
      "Time Saving Tips",
      "Workflow Improvements",
      "Creator Advice",
      "Shared Discoveries",
    ],
  },
  {
    title: "Community Participation",
    items: [
      "Questions",
      "Answers",
      "Challenges",
      "Events",
      "Contests",
      "Collaborations",
      "Volunteer Projects",
      "Community Goals",
    ],
  },
  {
    title: "Community Knowledge",
    items: [
      "Knowledge Base",
      "Blueprint Library",
      "Experience Library",
      "Creator Guides",
      "Community Guides",
      "Research Library",
      "Educational Resources",
      "Future Ideas",
    ],
  },
];

export function IslandCommunityWorkspacePanel() {
  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-white/20 bg-black p-6">
        <p className="text-xs uppercase tracking-[0.4em] text-white/50">
          COMMUNITY
        </p>

        <h1 className="mt-3 text-3xl font-black text-white">
          Community Workspace
        </h1>

        <p className="mt-4 text-white/70">
          Learn from others. Share what you discover.
        </p>
      </section>

      {communitySections.map((section) => (
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