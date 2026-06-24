// app/tools/islands/IslandPermissionsWorkspacePanel.tsx

"use client";

export function IslandPermissionsWorkspacePanel() {
  const permissions = [
    "Private Island",
    "Public Island",
    "Permission Based Island",
    "Shared Island",
    "Owner",
    "Builder",
    "Editor",
    "Contributor",
    "Viewer",
    "Guest",
  ];

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-white/20 bg-black p-6">
        <h2 className="text-3xl font-black text-white">
          Permissions
        </h2>

        <p className="mt-4 text-white/70">
          Your Island belongs to you.
        </p>

        <p className="mt-2 text-white/70">
          You decide who can see it, edit it, and contribute to it.
        </p>
      </section>

      <section className="rounded-3xl border border-white/20 bg-black p-6">
        <div className="grid gap-2">
          {permissions.map((item) => (
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