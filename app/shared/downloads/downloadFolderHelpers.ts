import {
  createDownloadStamp,
  downloadJsonFile,
  slugifyDownloadFileName,
} from "./downloadFileHelpers";

export type DownloadFolderFile = {
  path: string;
  payload: unknown;
};

export type DownloadFolderOptions = {
  folderName: string;
  files: DownloadFolderFile[];
};

export function createDownloadFolderManifest({
  folderName,
  files,
}: DownloadFolderOptions) {
  return {
    exportedAtIso: new Date().toISOString(),
    source: "The Muzes Garden",
    downloadKind: "folder-manifest",
    folderName,
    fileCount: files.length,
    files,
    duplicateHandling: {
      currentMode: "manifest-only",
      futureOptions: ["replace", "skip", "keep-both", "compare"],
    },
    note:
      "This manifest represents a future downloadable folder. Browser folder writing and duplicate handling will be wired in a later step.",
  };
}

export function downloadFolderManifest({
  folderName,
  files,
}: DownloadFolderOptions) {
  const safeFolderName = slugifyDownloadFileName(folderName);

  downloadJsonFile({
    fileName: `${safeFolderName}-folder-${createDownloadStamp()}.json`,
    payload: createDownloadFolderManifest({
      folderName,
      files,
    }),
  });
}