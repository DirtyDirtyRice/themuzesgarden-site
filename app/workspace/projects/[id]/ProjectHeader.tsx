"use client";

import { useState } from "react";
import { formatKind, formatDate } from "./projectDetailsUtils";
import type { Project } from "./projectDetailsTypes";

type ProjectDownloadFormat = "wav" | "mp3" | "flac" | "aiff" | "original";

type Props = {
  project: Project | null;
  rightSlot?: React.ReactNode;
};

const buttonClass =
  "inline-flex min-h-9 min-w-[104px] items-center justify-center rounded-xl border border-white/25 bg-black px-3 py-2 text-xs font-black text-white transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";

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

function downloadProjectManifest(
  project: Project,
  format: ProjectDownloadFormat,
) {
  const payload = {
    exportedAtIso: new Date().toISOString(),
    source: "The Muzes Garden",
    downloadKind: "project-manifest",
    requestedFormat: format,
    project,
    note:
      "This manifest is the project download placeholder. Future exports should include linked tracks, assets, WAV/MP3 format packages, and folder downloads.",
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `${slugifyFileName(project.title)}-${format}-project.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function ProjectHeader({ project, rightSlot }: Props) {
  const [downloadFormat, setDownloadFormat] =
    useState<ProjectDownloadFormat>("wav");
  const [downloadOpen, setDownloadOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <div className="text-lg font-semibold text-white">
          {project?.title ?? "Untitled Project"}
        </div>

        <div className="mt-1 flex flex-wrap gap-2 text-sm text-white/70">
          <span>{formatKind(project?.kind ?? "music")}</span>
          {project?.updated_at ? (
            <span>• Updated {formatDate(project.updated_at)}</span>
          ) : null}
        </div>

        {rightSlot ? <div className="mt-2 text-white/70">{rightSlot}</div> : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <button
            type="button"
            className={buttonClass}
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
          type="button"
          className={buttonClass}
          disabled={!project}
          onClick={() => {
            if (!project) return;
            downloadProjectManifest(project, downloadFormat);
          }}
        >
          Download
        </button>

        <button type="button" className={buttonClass}>
          Send To
        </button>

        <button type="button" className={buttonClass}>
          Assets
        </button>
      </div>
    </div>
  );
}