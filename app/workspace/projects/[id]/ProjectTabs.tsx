"use client";

import { PROJECT_TAB_CONFIG } from "./projectTabConfig";
import type { Tab } from "./projectDetailsTypes";

type Props = {
  tab: Tab;
  setTab: (t: Tab) => void;
};

export default function ProjectTabs({ tab, setTab }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {PROJECT_TAB_CONFIG.map((t) => {
        const active = t.key === tab;

        return (
          <button
            key={t.key}
            className={`rounded border px-3 py-2 text-sm ${
              active ? "bg-black text-white" : "bg-white"
            }`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}