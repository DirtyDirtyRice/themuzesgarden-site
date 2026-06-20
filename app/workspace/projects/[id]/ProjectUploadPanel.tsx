"use client";

type Props = {
  selectedFiles: File[];
};

export default function ProjectUploadPanel({ selectedFiles }: Props) {
  if (selectedFiles.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-white/25 bg-black p-4 text-white">
      <div className="mb-3 text-sm font-black text-white">
        Pending Uploads
      </div>

      <div className="space-y-2">
        {selectedFiles.map((file) => (
          <div
            key={`${file.name}-${file.size}`}
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