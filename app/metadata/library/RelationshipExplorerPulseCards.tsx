import type { MapPulseSummary } from "./relationshipExplorerMapSummaryTypes";
import { ExplorerStatusPill } from "./RelationshipExplorerHeaderBadges";
import {
  getPulseDetail,
  getPulseRows,
  getPulseTone,
} from "./RelationshipExplorerCardHelpers";
import {
  CardShell,
  MiniMeter,
  ReadoutMiniRows,
  SectionEyebrow,
} from "./RelationshipExplorerMetricCardBasics";

function getSavedPercent(pulse: MapPulseSummary) {
  if (pulse.totalCount <= 0) return 0;
  return Math.round((pulse.savedCount / pulse.totalCount) * 100);
}

function getSuggestedPercent(pulse: MapPulseSummary) {
  if (pulse.totalCount <= 0) return 0;
  return Math.round((pulse.suggestedCount / pulse.totalCount) * 100);
}

function getPulseBalanceLabel(pulse: MapPulseSummary) {
  if (pulse.totalCount <= 0) return "waiting for signals";
  if (pulse.savedCount > pulse.suggestedCount) return "saved-led pulse";
  if (pulse.suggestedCount > pulse.savedCount) return "suggestion-led pulse";
  return "balanced pulse";
}

function getPulseBalanceDetail(pulse: MapPulseSummary) {
  if (pulse.totalCount <= 0) {
    return "Saved and suggested counts will become useful after relationship material appears.";
  }

  if (pulse.savedCount > pulse.suggestedCount) {
    return "Saved links are currently carrying more of the map than suggestions.";
  }

  if (pulse.suggestedCount > pulse.savedCount) {
    return "Suggestions are carrying more of the map, so review before saving permanent links.";
  }

  return "Saved and suggested signals are evenly balanced for this record.";
}

export function RelationshipMapPulse({
  pulse,
}: {
  pulse: MapPulseSummary;
}) {
  return (
    <CardShell>
      <SectionEyebrow label="Map pulse" />

      <p className="mt-1 text-xs font-medium text-white/65">{pulse.label}</p>

      <p className="mt-1 text-[10px] leading-4 text-white/35">
        {getPulseDetail(pulse)}
      </p>

      <div className="mt-2 flex flex-wrap gap-1.5">
        <ExplorerStatusPill label={getPulseTone(pulse)} />
        <ExplorerStatusPill label={`${pulse.savedCount} saved`} />
        <ExplorerStatusPill label={`${pulse.suggestedCount} suggested`} />
      </div>

      <MiniMeter
        label="Saved share"
        percent={getSavedPercent(pulse)}
        detail="How much of the pulse comes from permanent relationship links."
      />

      <MiniMeter
        label="Suggested share"
        percent={getSuggestedPercent(pulse)}
        detail="How much of the pulse comes from suggested nearby records."
      />

      <div className="mt-2 rounded-md border border-white/10 px-2 py-1.5">
        <p className="text-[10px] font-medium text-white/50">
          {getPulseBalanceLabel(pulse)}
        </p>
        <p className="mt-0.5 text-[10px] leading-4 text-white/30">
          {getPulseBalanceDetail(pulse)}
        </p>
      </div>

      <ReadoutMiniRows rows={getPulseRows(pulse)} />
    </CardShell>
  );
}