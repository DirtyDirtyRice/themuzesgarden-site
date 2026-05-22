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
            type="button"
            onClick={() => setTab(t.key)}
            className={[
              "min-w-[120px] rounded-xl border border-white/25 bg-black",
              "px-4 py-2 text-sm font-bold text-white",
              "transition-transform duration-150",
              "hover:scale-[1.03] active:scale-[0.98]",
              active ? "ring-1 ring-white/40" : "",
            ].join(" ")}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}