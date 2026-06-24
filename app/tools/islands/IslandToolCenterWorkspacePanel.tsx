// app/tools/islands/IslandToolCenterWorkspacePanel.tsx

"use client";

import { islandVisionWorkspaceSeed } from "./IslandVisionSeed";

export function IslandToolCenterWorkspacePanel() {
  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-white/20 bg-black p-6">
        <p className="text-xs uppercase tracking-[0.4em] text-white/50">
          TOOL CENTER
        </p>

        <h2 className="mt-3 text-3xl font-black text-white">
          Show Me The Tools
        </h2>

        <p className="mt-4 text-white/70">
          Creators often arrive with ideas already forming in
          their minds.
        </p>

        <p className="mt-2 text-white/70">
          The purpose of the Tool Center is to help creators
          find the tools they need to bring those ideas to life.
        </p>
      </section>

      {islandVisionWorkspaceSeed.toolCategories.map(
        (category) => (
          <section
            key={category.title}
            className="rounded-3xl border border-white/20 bg-black p-6"
          >
            <h3 className="text-xl font-black text-white">
              {category.title}
            </h3>

            <p className="mt-2 text-white/60">
              {category.description}
            </p>

            <div className="mt-5 grid gap-2">
              {category.tools.map((tool) => (
                <div
                  key={tool}
                  className="rounded-xl border border-white/10 px-3 py-2 text-white/80"
                >
                  ▶ {tool}
                </div>
              ))}
            </div>
          </section>
        )
      )}
    </div>
  );
}