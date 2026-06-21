"use client";

type Props = {
  disabled?: boolean;
  onDownloadFiles: () => void;
  onDownloadFolder: () => void;
};

const buttonClass =
  "inline-flex min-h-9 min-w-[104px] items-center justify-center rounded-xl border border-white/25 bg-black px-3 py-2 text-xs font-black text-white transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";

export default function SharedDownloadButtons({
  disabled = false,
  onDownloadFiles,
  onDownloadFolder,
}: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        className={buttonClass}
        disabled={disabled}
        onClick={onDownloadFiles}
      >
        Download Files
      </button>

      <button
        type="button"
        className={buttonClass}
        disabled={disabled}
        onClick={onDownloadFolder}
      >
        Download Folder
      </button>
    </div>
  );
}