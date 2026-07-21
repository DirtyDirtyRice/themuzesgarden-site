"use client";

import { useState } from "react";
import Link from "next/link";
import { PROJECT_TAB_CONFIG } from "./projectTabConfig";
import type { Tab } from "./projectDetailsTypes";

type Props = {
  tab: Tab | null;
  setTab: (t: Tab | null) => void;
};

const buttonClass = [
  "min-w-[120px] rounded-xl border border-white/25 bg-black",
  "px-4 py-2 text-sm font-bold text-white",
  "transition-transform duration-150",
  "hover:scale-[1.03] active:scale-[0.98]",
].join(" ");

export default function ProjectTabs({ tab, setTab }: Props) {
  const [howToOpen, setHowToOpen] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {PROJECT_TAB_CONFIG.map((t) => {
          const active = t.key === tab;

          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(active ? null : t.key)}
              className={[buttonClass, active ? "ring-1 ring-white/40" : ""].join(" ")}
            >
              {t.label}
            </button>
          );
        })}

        <Link
          href="/workspace/projects"
          className={buttonClass}
          title="Edit project name and privacy"
        >
          Edit Project
        </Link>

        <button
          type="button"
          onClick={() => setHowToOpen((current) => !current)}
          className={[
            "min-w-[120px] rounded-xl border border-white/25",
            "bg-white px-4 py-2 text-sm font-black text-black",
            "transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98]",
          ].join(" ")}
        >
          {howToOpen ? "Close Help" : "How To"}
        </button>
      </div>

      {howToOpen ? (
        <section className="rounded-2xl border border-white/20 bg-black p-4 text-sm leading-6 text-white/75">
          <h2 className="text-base font-black text-white">Project Page Help</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5">
            <li><span className="font-black text-white">Overview</span> shows project status and playback readiness.</li>
            <li><span className="font-black text-white">Library</span> shows the songs/files linked to this project.</li>
            <li><span className="font-black text-white">Upload File</span> and <span className="font-black text-white">Upload Folder</span> add new files into this project.</li>
            <li><span className="font-black text-white">Project Liaison</span> sends existing Library songs into projects.</li>
            <li><span className="font-black text-white">Play Project</span> uses the linked songs as the project setlist.</li>
          </ol>
        </section>
      ) : null}
    </div>
  );
}