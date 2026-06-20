"use client";

type Props = {
  selectedFiles: File[];
  onClearFiles: () => void;
};

export default function ProjectUploadPanel({
  selectedFiles,
  onClearFiles,
}: Props) {
  if (selectedFiles.length === 0) {
    return null;
  }

  const totalMb = selectedFiles.reduce((sum, file) => sum + file.size, 0) / 1024 / 1024;

  return (
    <div className="rounded-2xl border border-white/25 bg-black p-4 text-white">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-black text-white">Pending Uploads</div>
          <div className="mt-1 text-xs text-white/70">
            {selectedFiles.length} files · {totalMb.toFixed(2)} MB
          </div>
        </div>

        <button
          type="button"
          onClick={onClearFiles}
          className="rounded-xl border border-white/25 bg-black px-3 py-2 text-xs font-black text-white transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98]"
        >
          Clear
        </button>
      </div>

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
    </div>
  );
}