// app/tools/islands/IslandLearningWorkspacePanel.tsx

"use client";

const learningGroups = [
  {
    title: "Getting Started",
    lessons: [
      "What Is An Island",
      "Building Your First Page",
      "Using Templates",
      "Using Blueprints",
      "Using Experiences",
      "Finding Tools",
    ],
  },
  {
    title: "Creator Growth",
    lessons: [
      "Organizing Ideas",
      "Building Workflows",
      "Protecting Your Work",
      "Sharing Knowledge",
      "Teaching Others",
      "Building Communities",
    ],
  },
];

export function IslandLearningWorkspacePanel() {
  return (
    <div className="space-y-5">
      {learningGroups.map((group) => (
        <section
          key={group.title}
          className="rounded-3xl border border-white/20 bg-black p-6"
        >
          <h2 className="text-2xl font-black text-white">
            {group.title}
          </h2>

          <div className="mt-5 space-y-2">
            {group.lessons.map((lesson) => (
              <div
                key={lesson}
                className="rounded-xl border border-white/10 px-3 py-2 text-white/80"
              >
                ▶ {lesson}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}