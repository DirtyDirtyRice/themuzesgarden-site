// app/tools/islands/IslandTemplateWorkspacePanel.tsx

"use client";

export function IslandTemplateWorkspacePanel() {
  const templates = [
    "Musician Island",
    "Songwriter Island",
    "Band Island",
    "Producer Island",
    "Family History Island",
    "Research Island",
    "Teacher Island",
    "Photography Island",
    "Writer Island",
    "Blank Island",
  ];

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-white/20 bg-black p-6">
        <h2 className="text-3xl font-black text-white">
          Template Library
        </h2>

        <p className="mt-4 text-white/70">
          Templates show possibilities.
        </p>

        <p className="mt-2 text-white/70">
          Borrow ideas. Do not borrow limits.
        </p>
      </section>

      <section className="rounded-3xl border border-white/20 bg-black p-6">
        <div className="grid gap-2">
          {templates.map((item) => (
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