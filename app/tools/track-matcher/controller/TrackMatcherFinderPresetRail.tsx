"use client";

import { TRACK_MATCHER_FINDER_PRESETS } from "./trackMatcherFinderQueryPresets";

type Props = {
  onSelectPreset: (searchText: string) => void;
};

const finderSmallButtonClass =
  "rounded-full border border-white/10 bg-white/[0.07] px-3 py-1 text-xs font-black text-white/70 transition-transform duration-150 hover:-translate-y-0.5 hover:bg-white/[0.10] hover:text-white active:scale-[0.98]";

export default function TrackMatcherFinderPresetRail({
  onSelectPreset,
}: Props) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
      <p className="text-xs uppercase tracking-[0.28em] text-white/50">
        Presets
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {TRACK_MATCHER_FINDER_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onSelectPreset(preset.requiredTokens.join(" "))}
            title={preset.description}
            className={finderSmallButtonClass}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}