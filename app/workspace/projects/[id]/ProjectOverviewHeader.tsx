"use client";

import { useMemo, useState } from "react";
import type { MetadataTargetType } from "../../../../lib/metadata/metadataTypes";
import type { Project } from "./projectDetailsTypes";

type TrackLike = {
  id: string;
  title?: string | null;
  artist?: string | null;
};

type ProjectDownloadFormat = "wav" | "mp3" | "flac" | "aiff" | "original";

type MetadataContext = {
  safeMetadataTargetType: MetadataTargetType;
  metadataTargetId: string | null;
  selectedMetadataTrack: TrackLike | null;
  selectedMetadataTrackTitle: string;
  selectedMetadataTrackArtist: string;
};

type Props = {
  project: Project | null;
  overviewLoading: boolean;
  overviewErr: string | null;
  playerErr: string | null;
  linkedTracks: TrackLike[];
  orderedLinkedTracks: TrackLike[];
  metadataContext: MetadataContext;
  onRefreshOverview: () => void;
  onPlayProject: () => void;
  onStopPlayer: () => void;
  nowPlayingId: string | null;
};

const panelClass = "space-y-4 rounded-2xl border border-white/25 bg-black p-4";
const insetPanelClass = "rounded-2xl border border-white/25 bg-black p-3";
const titleClass = "text-sm font-bold text-white";
const subTextClass = "text-sm text-white/70";
const tinyTextClass = "text-xs text-white/70";
const eyebrowClass = "text-xs font-bold uppercase tracking-wide text-white";
const actionButtonClass =
  "inline-flex min-h-9 min-w-[92px] items-center justify-center rounded-xl border border-white/25 bg-black px-3 py-2 text-xs font-bold text-white transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";
const menuButtonClass =
  "flex w-full items-center justify-between px-4 py-3 text-left text-sm font-bold text-white transition-transform duration-150 hover:translate-x-1";

const downloadFormats: {
  value: ProjectDownloadFormat;
  label: string;
}[] = [
  { value: "wav", label: "WAV" },
  { value: "mp3", label: "MP3" },
  { value: "flac", label: "FLAC" },
  { value: "aiff", label: "AIFF" },
  { value: "original", label: "Original" },
];

function getMetadataContextLabel(metadataTargetType: MetadataTargetType) {
  if (metadataTargetType === "moment") return "Moment metadata target";
  if (metadataTargetType === "section") return "Section metadata target";
  return "Track metadata target";
}

function getDownloadFormatLabel(format: ProjectDownloadFormat) {
  return downloadFormats.find((option) => option.value === format)?.label ?? "WAV";
}

function slugifyFileName(value: string) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 70) || "project"
  );
}

function downloadProjectOverviewManifest(options: {
  project: Project | null;
  format: ProjectDownloadFormat;
  linkedTracks: TrackLike[];
  orderedLinkedTracks: TrackLike[];
}) {
  const projectTitle = options.project?.title ?? "Untitled Project";
  const payload = {
    exportedAtIso: new Date().toISOString(),
    source: "The Muzes Garden",
    downloadKind: "project-overview-manifest",
    requestedFormat: options.format,
    project: options.project,
    linkedTrackCount: options.linkedTracks.length,
    orderedTrackCount: options.orderedLinkedTracks.length,
    linkedTracks: options.linkedTracks,
    orderedLinkedTracks: options.orderedLinkedTracks,
    note:
      "This is the project overview download manifest. Future exports should create WAV-first project folders with linked audio assets.",
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `${slugifyFileName(projectTitle)}-${options.format}-overview.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function StatusPill({ label }: { label: string }) {
  return (
    <span className="rounded-xl border border-white/25 bg-black px-2 py-1 text-[11px] font-bold text-white">
      {label}
    </span>
  );
}

function RouteCard({
  title,
  route,
  note,
}: {
  title: string;
  route: string[];
  note: string;
}) {
  return (
    <div className={insetPanelClass}>
      <div className="text-sm font-bold text-white">{title}</div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {route.map((step, index) => (
          <span key={`${title}-${step}-${index}`} className="flex items-center gap-2">
            <span className="rounded-xl border border-white/25 bg-black px-2 py-1 text-[11px] font-bold text-white">
              {step}
            </span>
            {index < route.length - 1 ? (
              <span className="text-xs font-bold text-white/70">↓</span>
            ) : null}
          </span>
        ))}
      </div>
      <div className="mt-2 text-xs text-white/70">{note}</div>
    </div>
  );
}

function ProjectMetadataContextCard({ context }: { context: MetadataContext }) {
  const contextLabel = useMemo(
    () => getMetadataContextLabel(context.safeMetadataTargetType),
    [context.safeMetadataTargetType]
  );

  return (
    <div className={insetPanelClass}>
      <div className={eyebrowClass}>Metadata workspace context</div>

      {!context.metadataTargetId ? (
        <div className="mt-2 text-sm text-white/70">
          No metadata target selected yet. Use any <strong>Metadata</strong> or{" "}
          <strong>Inspect</strong> button below to focus the metadata panel on a
          specific track.
        </div>
      ) : (
        <div className="mt-2 space-y-2">
          <div className="flex flex-wrap gap-2">
            <StatusPill label={contextLabel} />
            <StatusPill label="SELECTED" />
          </div>

          {context.safeMetadataTargetType === "track" ? (
            <div className="space-y-1">
              <div className="text-sm font-bold text-white">
                {context.selectedMetadataTrackTitle}
              </div>
              <div className="text-xs text-white/70">
                {context.selectedMetadataTrackArtist}
              </div>
            </div>
          ) : (
            <div className="text-sm text-white/70">
              Target ID: {context.metadataTargetId}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ProjectOverviewHeader({
  project,
  overviewLoading,
  overviewErr,
  playerErr,
  linkedTracks,
  orderedLinkedTracks,
  metadataContext,
  onRefreshOverview,
  onPlayProject,
  onStopPlayer,
  nowPlayingId,
}: Props) {
  const [downloadFormat, setDownloadFormat] =
    useState<ProjectDownloadFormat>("wav");
  const [downloadOpen, setDownloadOpen] = useState(false);

  const hasLinkedTracks = linkedTracks.length > 0;
  const hasOrderedTracks = orderedLinkedTracks.length > 0;
  const hasMetadataTarget = Boolean(metadataContext.metadataTargetId);

  return (
    <div className={panelClass}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className={titleClass}>Overview</div>
          <div className="text-xs text-white/70">
            {project?.title ?? "Untitled Project"}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <button
              type="button"
              className={actionButtonClass}
              onClick={() => setDownloadOpen((value) => !value)}
            >
              {getDownloadFormatLabel(downloadFormat)} ▾
            </button>

            {downloadOpen ? (
              <div className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-2xl border border-white/25 bg-black">
                {downloadFormats.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={menuButtonClass}
                    onClick={() => {
                      setDownloadFormat(option.value);
                      setDownloadOpen(false);
                    }}
                  >
                    <span>{option.label}</span>
                    <span className="text-white/70">
                      {downloadFormat === option.value ? "Selected" : ""}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <button
            className={actionButtonClass}
            onClick={() =>
              downloadProjectOverviewManifest({
                project,
                format: downloadFormat,
                linkedTracks,
                orderedLinkedTracks,
              })
            }
          >
            Download
          </button>

          <button
            className={actionButtonClass}
            onClick={onRefreshOverview}
            disabled={overviewLoading}
          >
            {overviewLoading ? "Refreshing…" : "Refresh"}
          </button>

          <button
            className={actionButtonClass}
            onClick={onPlayProject}
            disabled={!hasLinkedTracks}
          >
            Play Project
          </button>

          <button
            className={actionButtonClass}
            onClick={onStopPlayer}
            disabled={!nowPlayingId}
          >
            Stop
          </button>
        </div>
      </div>

      {overviewErr ? (
        <div className={`${insetPanelClass} text-sm text-white/70`}>
          {overviewErr}
        </div>
      ) : null}

      {playerErr ? (
        <div className={`${insetPanelClass} text-sm text-white/70`}>
          {playerErr}
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-3">
        <div className={insetPanelClass}>
          <div className={eyebrowClass}>Project status</div>
          <div className="mt-2 flex flex-wrap gap-2">
            <StatusPill label={`${linkedTracks.length} LINKED`} />
            <StatusPill label={`${orderedLinkedTracks.length} ORDERED`} />
            <StatusPill label={nowPlayingId ? "PLAYING" : "IDLE"} />
          </div>
          <div className="mt-2 text-xs text-white/70">
            {hasLinkedTracks
              ? "This project has tracks ready for playback and metadata work."
              : "No tracks are linked yet. Use Library to send tracks into this project."}
          </div>
        </div>

        <div className={insetPanelClass}>
          <div className={eyebrowClass}>Playback readiness</div>
          <div className="mt-2 text-sm font-bold text-white">
            {hasLinkedTracks ? "Ready" : "Needs tracks"}
          </div>
          <div className="mt-1 text-xs text-white/70">
            {hasOrderedTracks
              ? "Setlist order is available for this project."
              : "Ordered tracks will appear after tracks are sent into the project."}
          </div>
        </div>

        <div className={insetPanelClass}>
          <div className={eyebrowClass}>Metadata target</div>
          <div className="mt-2 text-sm font-bold text-white">
            {hasMetadataTarget ? "Selected" : "Not selected"}
          </div>
          <div className="mt-1 text-xs text-white/70">
            {hasMetadataTarget
              ? "The metadata panel is focused on the selected item."
              : "Use Metadata or Inspect on a track to choose a metadata target."}
          </div>
        </div>
      </div>

      <ProjectMetadataContextCard context={metadataContext} />

      <div className={insetPanelClass}>
        <div className={eyebrowClass}>New here?</div>
        <div className="mt-2 text-sm text-white/70">
          This project page is where linked songs become a playable project. Start
          with Upload, send tracks from Library, then return here to play,
          inspect, and edit metadata.
        </div>

        <div className="mt-3 grid gap-2 text-xs text-white/70 sm:grid-cols-4">
          <div>
            <span className="font-bold text-white">1.</span> Upload songs
          </div>
          <div>
            <span className="font-bold text-white">2.</span> Send to project
          </div>
          <div>
            <span className="font-bold text-white">3.</span> Play project
          </div>
          <div>
            <span className="font-bold text-white">4.</span> Edit metadata
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className={eyebrowClass}>Quick routes</div>
            <div className={tinyTextClass}>
              First HELP-style routes for getting from here to the next action.
            </div>
          </div>

          <StatusPill label="HELP SEED" />
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          <RouteCard
            title="Upload songs"
            route={["Upload", "Choose Folder", "Library"]}
            note="Use this when songs are still on your computer."
          />

          <RouteCard
            title="Add tracks to this project"
            route={["Library", "Select Tracks", "Choose Project", "Send To"]}
            note="Use this when songs are already uploaded but not linked here yet."
          />

          <RouteCard
            title="Edit track metadata"
            route={["Project", "Play or Inspect", "Metadata Panel"]}
            note="Use this when you want the metadata panel focused on a track."
          />
        </div>
      </div>
    </div>
  );
}