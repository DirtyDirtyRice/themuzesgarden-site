"use client";

import SharedDownloadButtons from "../../../shared/downloads/SharedDownloadButtons";
import {
  buildProjectDownloadItems,
  downloadProjectFiles,
  downloadProjectFolder,
  type ProjectDownloadItem,
} from "./ProjectDownloadHelpers";

type Props = {
  tracks: unknown[];
};

const buttonClass =
  "rounded-xl border border-white/25 bg-black px-3 py-2 text-xs font-black text-white transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";

export default function ProjectDownloadPanel({ tracks }: Props) {
  const downloadItems: ProjectDownloadItem[] = buildProjectDownloadItems(
    tracks as Parameters<typeof buildProjectDownloadItems>[0],
  );

  if (downloadItems.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-white/25 bg-black p-4 text-white">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-black text-white">Project Downloads</div>

          <div className="mt-1 text-xs text-white/70">
            {downloadItems.length} downloadable file
            {downloadItems.length === 1 ? "" : "s"}
          </div>

          <div className="mt-1 text-xs text-white/70">
            Files downloads one track. Folder downloads every project track.
          </div>
        </div>

        <SharedDownloadButtons
          disabled={downloadItems.length === 0}
          onDownloadFiles={() => downloadProjectFiles(downloadItems)}
          onDownloadFolder={() => downloadProjectFolder(downloadItems)}
        />
      </div>

      <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
        {downloadItems.map((item) => (
          <div
            key={`${item.id}-${item.url}`}
            className="flex flex-wrap items-center justify-between gap-2 rounded border border-white/20 p-2"
          >
            <div className="min-w-0">
              <div className="truncate text-sm font-bold text-white">
                {item.title}
              </div>
              <div className="break-all text-xs text-white/70">{item.url}</div>
            </div>

            <button
              type="button"
              className={buttonClass}
              onClick={() => downloadProjectFiles([item])}
            >
              Download File
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}