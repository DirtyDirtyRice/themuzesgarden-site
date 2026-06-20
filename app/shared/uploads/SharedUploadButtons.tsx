"use client";

import { useRef } from "react";
import { projectUploadAccept } from "./projectUploadHelpers";

type Props = {
  disabled?: boolean;
  onFilesSelected: (files: File[]) => void;
};

const buttonClass =
  "inline-flex min-h-9 min-w-[104px] items-center justify-center rounded-xl border border-white/25 bg-black px-3 py-2 text-xs font-black text-white transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";

export default function SharedUploadButtons({
  disabled = false,
  onFilesSelected,
}: Props) {
  const uploadFileRef = useRef<HTMLInputElement | null>(null);
  const uploadFolderRef = useRef<HTMLInputElement | null>(null);

  function handleSelectedFiles(fileList: FileList | null) {
    const files = Array.from(fileList ?? []);
    onFilesSelected(files);

    if (uploadFileRef.current) uploadFileRef.current.value = "";
    if (uploadFolderRef.current) uploadFolderRef.current.value = "";
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        className={buttonClass}
        disabled={disabled}
        onClick={() => uploadFileRef.current?.click()}
      >
        Upload File
      </button>

      <button
        type="button"
        className={buttonClass}
        disabled={disabled}
        onClick={() => uploadFolderRef.current?.click()}
      >
        Upload Folder
      </button>

      <input
        ref={uploadFileRef}
        type="file"
        accept={projectUploadAccept}
        multiple
        className="hidden"
        onChange={(event) => handleSelectedFiles(event.target.files)}
      />

      <input
        ref={uploadFolderRef}
        type="file"
        accept={projectUploadAccept}
        multiple
        className="hidden"
        onChange={(event) => handleSelectedFiles(event.target.files)}
        {...({ webkitdirectory: "", directory: "" } as any)}
      />
    </div>
  );
}