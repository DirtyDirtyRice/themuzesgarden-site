"use client";

import { TRACK_MATCHER_FINDER_PRESETS } from "./trackMatcherFinderQueryPresets";

type Props = {
  onSelectPreset: (searchText: string) => void;
};

const finderPresetRailClass =
  "rounded-xl border border-white/10 bg-white/[0.035] px-2.5 py-2";

const finderPresetHeaderClass =
  "text-[0.65rem] font-black uppercase tracking-[0.2em] text-white/45";

const finderPresetButtonClass =
  "rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[0.7rem] font-black leading-none text-white/70 transition-transform duration-150 hover:-translate-y-px hover:bg-white/[0.09] hover:text-white active:scale-[0.98]";

export default function TrackMatcherFinderPresetRail({
  onSelectPreset,
}: Props) {
  return (
    <div className={finderPresetRailClass}>
      <div className="flex flex-wrap items-center gap-2">
        <p className={finderPresetHeaderClass}>Presets</p>

        <div className="flex flex-1 flex-wrap gap-1.5">
          {TRACK_MATCHER_FINDER_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelectPreset(preset.requiredTokens.join(" "))}
              title={preset.description}
              className={finderPresetButtonClass}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
