"use client";

import MetadataPanel from "../../../../player/MetadataPanel";
import type { MetadataTargetType } from "../../../../lib/metadata/metadataTypes";

type TrackLike = {
  id: string;
  title?: string | null;
  artist?: string | null;
};

type MetadataContext = {
  safeMetadataTargetType: MetadataTargetType;
  metadataTargetId: string | null;
  selectedMetadataTrack: TrackLike | null;
  selectedMetadataTrackTitle: string;
  selectedMetadataTrackArtist: string;
};

type Props = {
  metadataContext: MetadataContext;
};

const panelClass = "space-y-4 rounded-2xl border border-white/25 bg-black p-4";
const insetPanelClass = "rounded-2xl border border-white/25 bg-black p-3";
const titleClass = "text-sm font-bold text-white";
const subTextClass = "text-sm text-white/70";
const tinyTextClass = "text-xs text-white/70";
const eyebrowClass = "text-xs font-bold uppercase tracking-wide text-white";

function getMetadataContextLabel(metadataTargetType: MetadataTargetType) {
  if (metadataTargetType === "moment") return "Moment metadata target";
  if (metadataTargetType === "section") return "Section metadata target";
  return "Track metadata target";
}

function getMetadataContextHelp(metadataTargetType: MetadataTargetType) {
  if (metadataTargetType === "moment") {
    return "This panel is focused on a specific musical moment inside the project.";
  }

  if (metadataTargetType === "section") {
    return "This panel is focused on a larger section, arrangement part, or song area.";
  }

  return "This panel is focused on the selected track and its searchable project metadata.";
}

function getMetadataTargetDisplayName(options: {
  safeMetadataTargetType: MetadataTargetType;
  metadataTargetId: string;
  selectedMetadataTrackTitle: string;
  selectedMetadataTrackArtist: string;
}) {
  if (options.safeMetadataTargetType === "track") {
    return `${options.selectedMetadataTrackTitle} • ${options.selectedMetadataTrackArtist}`;
  }

  return `${getMetadataContextLabel(options.safeMetadataTargetType)} • ${options.metadataTargetId}`;
}

function MetadataStatusPill({ label }: { label: string }) {
  return (
    <span className="rounded-xl border border-white/25 bg-black px-2 py-1 text-[11px] font-bold text-white">
      {label}
    </span>
  );
}

export default function ProjectMetadataWorkspace({ metadataContext }: Props) {
  const {
    safeMetadataTargetType,
    metadataTargetId,
    selectedMetadataTrack,
    selectedMetadataTrackTitle,
    selectedMetadataTrackArtist,
  } = metadataContext;

  if (!metadataTargetId) return null;

  const targetDisplayName = getMetadataTargetDisplayName({
    safeMetadataTargetType,
    metadataTargetId,
    selectedMetadataTrackTitle,
    selectedMetadataTrackArtist,
  });

  return (
    <div className={panelClass}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className={titleClass}>Metadata</div>
          <div className={tinyTextClass}>{targetDisplayName}</div>
        </div>

        <div className="flex flex-wrap gap-2">
          <MetadataStatusPill label={getMetadataContextLabel(safeMetadataTargetType)} />
          {safeMetadataTargetType === "track" && selectedMetadataTrack ? (
            <MetadataStatusPill label="TRACK LINKED" />
          ) : null}
        </div>
      </div>

      <div className={insetPanelClass}>
        <div className={eyebrowClass}>Active metadata focus</div>
        <div className="mt-2 space-y-2">
          <div className={subTextClass}>
            {getMetadataContextHelp(safeMetadataTargetType)}
          </div>

          <div className="grid gap-2 text-xs text-white/70 sm:grid-cols-3">
            <div>
              <span className="font-bold text-white">Type:</span>{" "}
              {safeMetadataTargetType}
            </div>
            <div>
              <span className="font-bold text-white">Target:</span>{" "}
              {metadataTargetId}
            </div>
            <div>
              <span className="font-bold text-white">Title:</span>{" "}
              {selectedMetadataTrackTitle}
            </div>
          </div>
        </div>
      </div>

      <MetadataPanel targetType={safeMetadataTargetType} targetId={metadataTargetId} />
    </div>
  );
}