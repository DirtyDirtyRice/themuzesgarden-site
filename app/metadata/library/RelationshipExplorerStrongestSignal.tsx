import type { MetadataLibraryRecordSummary } from "./MetadataLibraryPageTypes";
import type { RelatedRecordSignal } from "./relationshipExplorerTypes";
import {
  getConfidenceLabel,
  getSignalStrengthSentence,
  RelationshipMiniMetric,
  RelationshipSignalPill,
  ScoreBreakdownPanel,
  WhyThisMatchPanel,
} from "./RelationshipExplorerDetailPanels";
import {
  getPreviewText,
  getRankedRelationshipReasons,
  getRecordLabel,
  getRelationshipReasonBreakdown,
  getScoreLabel,
} from "./relationshipExplorerUtils";

type Props = {
  strongestSignal: RelatedRecordSignal;
  onOpenRecordInExplorer: (record: MetadataLibraryRecordSummary) => void;
};

function getDominantSignalSentence(
  breakdown: ReturnType<typeof getRelationshipReasonBreakdown>
) {
  if (breakdown.dominantSignal && breakdown.dominantSignal !== "Loose") {
    return `${breakdown.dominantSignal} is the strongest reason this record is being surfaced.`;
  }

  if (breakdown.sharedWordCount > 0) {
    return "Shared language is helping this record surface as a nearby match.";
  }

  return "This record is being surfaced from lighter relationship signals.";
}

function getMatchedWordsPreview(words: string[]) {
  if (words.length === 0) return "No matched words available yet.";
  if (words.length <= 4) return words.join(", ");
  return `${words.slice(0, 4).join(", ")} +${words.length - 4} more`;
}

export default function RelationshipExplorerStrongestSignal({
  strongestSignal,
  onOpenRecordInExplorer,
}: Props) {
  const strongestPreview = getPreviewText(strongestSignal.record);
  const breakdown = getRelationshipReasonBreakdown(
    strongestSignal.record,
    strongestSignal.record
  );
  const rankedReasons = getRankedRelationshipReasons(breakdown).slice(0, 3);

  return (
    <div className="mt-4 rounded-lg border border-white/35 bg-black p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.16em] text-white/50">
            Strongest relationship signal
          </p>

          <h4 className="mt-2 text-sm font-semibold text-white">
            {getRecordLabel(strongestSignal.record)}
          </h4>

          <p className="mt-1 text-xs leading-5 text-white/60">
            {strongestSignal.reason}
          </p>

          <p className="mt-2 text-xs leading-5 text-white/55">
            {getSignalStrengthSentence(strongestSignal)}
          </p>

          <p className="mt-2 text-xs leading-5 text-white/50">
            {getDominantSignalSentence(breakdown)}
          </p>

          <div className="mt-2 flex flex-wrap gap-1.5">
            <RelationshipSignalPill
              label="shelf"
              active={strongestSignal.shelfMatch}
            />

            <RelationshipSignalPill
              label="section"
              active={strongestSignal.sectionMatch}
            />

            <RelationshipSignalPill
              label="language"
              active={strongestSignal.titleMatch}
            />

            <RelationshipSignalPill
              label={breakdown.dominantSignal}
              active={breakdown.dominantSignal !== "Loose"}
            />

            <RelationshipMiniMetric
              label="confidence"
              value={getConfidenceLabel(breakdown.confidence)}
            />

            <RelationshipMiniMetric
              label="shared"
              value={String(breakdown.sharedWordCount)}
            />
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg border border-white/15 p-2">
              <p className="text-[10px] uppercase tracking-[0.14em] text-white/35">
                Score
              </p>
              <p className="mt-1 text-xs text-white/70">
                {strongestSignal.score}
              </p>
            </div>

            <div className="rounded-lg border border-white/15 p-2">
              <p className="text-[10px] uppercase tracking-[0.14em] text-white/35">
                Label
              </p>
              <p className="mt-1 text-xs text-white/70">
                {getScoreLabel(strongestSignal.score)}
              </p>
            </div>

            <div className="rounded-lg border border-white/15 p-2">
              <p className="text-[10px] uppercase tracking-[0.14em] text-white/35">
                Words
              </p>
              <p className="mt-1 text-xs text-white/70">
                {getMatchedWordsPreview(breakdown.matchedWords)}
              </p>
            </div>
          </div>

          {rankedReasons.length > 0 ? (
            <div className="mt-3 rounded-lg border border-white/15 p-2">
              <p className="text-[10px] uppercase tracking-[0.14em] text-white/35">
                Top reasons
              </p>

              <div className="mt-1 space-y-1">
                {rankedReasons.map((reason) => (
                  <p key={reason} className="text-[10px] text-white/50">
                    {reason}
                  </p>
                ))}
              </div>
            </div>
          ) : null}

          {strongestPreview ? (
            <p className="mt-3 line-clamp-2 text-xs leading-5 text-white/65">
              {strongestPreview}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-white/35 px-2 py-1 text-white/65">
            {getScoreLabel(strongestSignal.score)}
          </span>

          <span className="rounded-full border border-white/35 px-2 py-1 text-white/65">
            Score {strongestSignal.score}
          </span>

          <button
            type="button"
            onClick={() => onOpenRecordInExplorer(strongestSignal.record)}
            className="rounded-full border border-white px-2 py-1 text-white transition hover:bg-white hover:text-black"
          >
            Open match
          </button>
        </div>
      </div>

      <WhyThisMatchPanel signal={strongestSignal} />
      <ScoreBreakdownPanel signal={strongestSignal} />
    </div>
  );
}