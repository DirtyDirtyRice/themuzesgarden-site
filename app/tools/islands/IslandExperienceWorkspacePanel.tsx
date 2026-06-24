// app/tools/islands/IslandExperienceWorkspacePanel.tsx

"use client";

export function IslandExperienceWorkspacePanel() {
  const experiences = [
    "Lessons Learned",
    "Mistakes To Avoid",
    "Time Saving Tips",
    "Recommended Workflows",
    "Creator Stories",
    "Success Stories",
    "Failure Stories",
    "Shared Knowledge",
    "Experience Library",
    "Community Wisdom",
  ];

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-white/20 bg-black p-6">
        <p className="text-xs uppercase tracking-[0.4em] text-white/50">
          EXPERIENCES
        </p>

        <h2 className="mt-3 text-3xl font-black text-white">
          Experience Library
        </h2>

        <p className="mt-4 text-white/70">
          One of the most valuable things a creator can share is experience.
        </p>

        <p className="mt-2 text-white/70">
          Learn from others. Improve upon it. Then share what you learned.
        </p>
      </section>

      <section className="rounded-3xl border border-white/20 bg-black p-6">
        <div className="grid gap-2">
          {experiences.map((item) => (
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