"use client";

import { buildTrackMatcherFinderCommands } from "./trackMatcherFinderCommandHelpers";
import type { TrackMatcherFinderResultCardProps } from "./trackMatcherFinderPanelTypes";
import type { TrackMatcherFinderDestination } from "./trackMatcherFinderTypes";

const finderActionButtonClass =
  "rounded-xl border border-white/10 bg-white/[0.07] px-3 py-2 text-xs font-black text-white/75 transition-transform duration-150 hover:-translate-y-0.5 hover:bg-white/[0.10] hover:text-white active:scale-[0.98] disabled:cursor-not-allowed disabled:border-white/5 disabled:bg-white/[0.03] disabled:text-white/30 disabled:hover:translate-y-0 disabled:hover:bg-white/[0.03] disabled:hover:text-white/30";

const finderPillClass =
  "rounded-full border border-white/10 bg-white/[0.07] px-2 py-1 text-xs font-black text-white/60";

const finderInfoCardClass =
  "rounded-2xl border border-white/10 bg-black/25 px-3 py-2";

const finderDetailBranchClass =
  "group rounded-2xl border border-white/10 bg-black/25 p-3";

const finderDetailSummaryClass =
  "flex cursor-pointer list-none items-center justify-between gap-3 marker:hidden [&::-webkit-details-marker]:hidden";

const destinationLabels: Record<TrackMatcherFinderDestination, string> = {
  "track-a": "Track A",
  "track-b": "Track B",
  "original-idea": "Original Idea",
  "suno-result": "Suno Result",
  "reference-song": "Reference",
  melody: "Melody",
  harmony: "Harmony",
  drums: "Drums",
  bass: "Bass",
  vocal: "Vocal",
  instrument: "Instrument",
  stem: "Stem",
  hybrid: "Hybrid",
  analysis: "Analysis",
};

function formatDestination(destination: TrackMatcherFinderDestination) {
  return destinationLabels[destination] ?? destination;
}

function compactTags(tags: readonly string[], limit = 16) {
  const visibleTags = tags.slice(0, limit);
  const hiddenCount = Math.max(0, tags.length - visibleTags.length);

  return {
    visibleTags,
    hiddenCount,
  };
}

function getTrackTypeLabels(track: TrackMatcherFinderResultCardProps["track"]) {
  const labels: string[] = [];

  if (track.isStem) labels.push("Stem");
  if (track.isInstrumental) labels.push("Instrumental");
  if (track.isReferenceSong) labels.push("Reference");
  if (track.isHybridCandidate) labels.push("Hybrid");

  return labels;
}

function getReadyCommandCount(
  commands: ReturnType<typeof buildTrackMatcherFinderCommands>,
  hasAudioUrl: boolean,
) {
  return commands.filter((command) => {
    const isDeckLoad =
      command.destination === "track-a" || command.destination === "track-b";

    return !command.disabled && (!isDeckLoad || hasAudioUrl);
  }).length;
}

function ResultInfoCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className={finderInfoCardClass}>
      <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>
      <p className="mt-1 text-sm font-black text-white/80">{value}</p>
    </div>
  );
}

function DetailBranch({
  title,
  detail,
  defaultOpen = false,
  children,
}: {
  title: string;
  detail: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details className={finderDetailBranchClass} open={defaultOpen}>
      <summary className={finderDetailSummaryClass}>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/70">
            {title}
          </p>
          <p className="mt-1 text-xs leading-5 text-white/50">{detail}</p>
        </div>

        <span className="rounded-full border border-white/10 bg-white/[0.07] px-2 py-1 text-xs font-black text-white/60 transition group-open:rotate-90">
          ▶
        </span>
      </summary>

      <div className="mt-3">{children}</div>
    </details>
  );
}

export default function TrackMatcherFinderResultCard({
  track,
  onLoadTrack,
}: TrackMatcherFinderResultCardProps) {
  const commands = buildTrackMatcherFinderCommands(track);
  const hasAudioUrl = Boolean(track.audioUrl);
  const typeLabels = getTrackTypeLabels(track);
  const readyCommandCount = getReadyCommandCount(commands, hasAudioUrl);
  const { visibleTags, hiddenCount } = compactTags(track.tags);

  return (
    <details className="group rounded-2xl border border-white/10 bg-white/[0.04] p-3 transition-transform duration-150 hover:-translate-y-0.5">
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 marker:hidden [&::-webkit-details-marker]:hidden">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold text-white">
              {track.title}
            </h3>

            <span className={finderPillClass}>{track.source}</span>

            {hasAudioUrl ? (
              <span className="rounded-full border border-white/10 bg-white/[0.07] px-2 py-1 text-xs font-black text-white/70">
                playable
              </span>
            ) : (
              <span className="rounded-full border border-white/10 bg-white/[0.07] px-2 py-1 text-xs font-black text-white/60">
                no audio url
              </span>
            )}
          </div>

          <p className="mt-1 truncate text-sm text-white/60">{track.artist}</p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="rounded-full border border-white/10 bg-white/[0.07] px-3 py-1 text-xs font-black text-white/60">
            Score {track.score}
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.07] px-3 py-1 text-xs font-black text-white/60">
            {readyCommandCount} ready
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.07] px-2 py-1 text-xs font-black text-white/70 transition group-open:rotate-90">
            ▶
          </span>
        </div>
      </summary>

      <div className="mt-4 grid gap-3">
        <DetailBranch
          title="Metadata"
          detail="Song description, source status, score, and ready-command count."
          defaultOpen
        >
          <div className="grid gap-3 md:grid-cols-[1fr_12rem]">
            <div>
              {track.description ? (
                <p className="max-w-3xl text-sm leading-6 text-white/70">
                  {track.description}
                </p>
              ) : (
                <p className="text-sm leading-6 text-white/50">
                  No description has been added for this track yet.
                </p>
              )}

              {!hasAudioUrl ? (
                <p className="mt-3 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-bold text-white/60">
                  No playable audio URL found yet. Search works, but this result
                  cannot load into Track A or Track B until an audio path is
                  available.
                </p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <ResultInfoCard label="Score" value={track.score} />
              <ResultInfoCard label="Ready" value={readyCommandCount} />
            </div>
          </div>
        </DetailBranch>

        <DetailBranch
          title="Track Types"
          detail="Stem, instrumental, reference, hybrid, or general track."
        >
          <div className="flex flex-wrap gap-2">
            {typeLabels.length > 0 ? (
              typeLabels.map((label) => (
                <span key={label} className={finderPillClass}>
                  {label}
                </span>
              ))
            ) : (
              <span className="text-xs text-white/50">
                Full song / general track
              </span>
            )}
          </div>
        </DetailBranch>

        <DetailBranch
          title="Tags"
          detail="Metadata-derived search tags for this song."
        >
          <div className="flex flex-wrap gap-2">
            {visibleTags.map((tag) => (
              <span key={tag} className={finderPillClass}>
                {tag}
              </span>
            ))}

            {hiddenCount > 0 ? (
              <span className={finderPillClass}>+{hiddenCount} more</span>
            ) : null}

            {visibleTags.length === 0 && hiddenCount === 0 ? (
              <span className="text-xs text-white/50">No tags yet.</span>
            ) : null}
          </div>
        </DetailBranch>

        <DetailBranch
          title="Routing"
          detail="Destination hints and future lane paths."
        >
          <div className="flex flex-wrap gap-2">
            {track.destinationHints.map((destination) => (
              <span key={destination} className={finderPillClass}>
                {formatDestination(destination)}
              </span>
            ))}
          </div>
        </DetailBranch>

        <DetailBranch
          title="Load To"
          detail="Send this selected song to Track A, Track B, analysis, or future lanes."
        >
          <div className="flex flex-wrap gap-2">
            {commands.map((command) => {
              const isDeckLoad =
                command.destination === "track-a" ||
                command.destination === "track-b";
              const disabled = command.disabled || (isDeckLoad && !hasAudioUrl);

              return (
                <button
                  key={command.id}
                  type="button"
                  disabled={disabled}
                  onClick={() =>
                    !disabled && onLoadTrack?.(track, command.destination)
                  }
                  title={
                    !hasAudioUrl && isDeckLoad
                      ? "No playable audio URL found for this track yet."
                      : command.disabledReason ?? command.detail
                  }
                  className={finderActionButtonClass}
                >
                  {command.label}
                </button>
              );
            })}
          </div>
        </DetailBranch>
      </div>
    </details>
  );
}