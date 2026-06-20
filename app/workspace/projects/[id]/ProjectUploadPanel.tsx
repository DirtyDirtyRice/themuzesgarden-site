"use client";

import type { UploadedProjectItem } from "../../../shared/uploads/projectUploadHelpers";

type Props = {
  selectedFiles: File[];
  uploadedItems: UploadedProjectItem[];
  uploading: boolean;
  uploadError: string | null;
  onUploadFiles: () => void;
  onClearFiles: () => void;
};

export default function ProjectUploadPanel({
  selectedFiles,
  uploadedItems,
  uploading,
  uploadError,
  onUploadFiles,
  onClearFiles,
}: Props) {
  if (selectedFiles.length === 0 && uploadedItems.length === 0 && !uploadError) {
    return null;
  }

  const totalMb =
    selectedFiles.reduce((sum, file) => sum + file.size, 0) / 1024 / 1024;

  return (
    <div className="rounded-2xl border border-white/25 bg-black p-4 text-white">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-black text-white">Project Uploads</div>
          <div className="mt-1 text-xs text-white/70">
            {selectedFiles.length} pending files · {totalMb.toFixed(2)} MB
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onUploadFiles}
            disabled={uploading || selectedFiles.length === 0}
            className="rounded-xl border border-white/25 bg-black px-3 py-2 text-xs font-black text-white transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uploading ? "Uploading..." : "Upload To Library"}
          </button>

          <button
            type="button"
            onClick={onClearFiles}
            disabled={uploading}
            className="rounded-xl border border-white/25 bg-black px-3 py-2 text-xs font-black text-white transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Clear
          </button>
        </div>
      </div>

      {uploadError ? (
        <div className="mb-3 rounded-xl border border-white/25 bg-black p-3 text-sm text-white/70">
          {uploadError}
        </div>
      ) : null}

      {selectedFiles.length > 0 ? (
        <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
          {selectedFiles.map((file) => (
            <div
              key={`${file.name}-${file.size}-${file.lastModified}`}
              className="rounded border border-white/20 p-2"
            >
              <div className="text-sm font-bold">{file.name}</div>
              <div className="text-xs text-white/70">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {uploadedItems.length > 0 ? (
        <div className="mt-4 space-y-2">
          <div className="text-xs font-black uppercase tracking-[0.2em] text-white/70">
            Uploaded
          </div>

          {uploadedItems.map((item) => (
            <div
              key={item.path}
              className="rounded border border-white/20 p-2"
            >
              <div className="text-sm font-bold text-white">{item.name}</div>
              <div className="break-all text-xs text-white/70">{item.path}</div>
              <div className="mt-1 text-xs text-white/70">
                Added to Library
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}