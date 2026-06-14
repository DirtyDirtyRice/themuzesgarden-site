import {
  getFileExtension,
  getTitleFromImportedFileName,
  isBlockedLyricFile,
  isFutureLyricFile,
  isReadableLyricFile,
  readLyricImportFile,
} from "./lyricsFileActions";
import type { LyricImportReport } from "./lyricsImportTypes";
import type { LyricEntry } from "./lyricsTypes";

type ImportLyricFilesResult = {
  entries: LyricEntry[];
  report: LyricImportReport;
  skippedFiles: number;
};

type ImportLyricFilesOptions = {
  files: FileList;
  onProgress: (report: LyricImportReport) => void;
};

export function summarizeLyricExtensions(files: File[]): string {
  const counts = new Map<string, number>();

  files.forEach((file) => {
    const extension = getFileExtension(file.name) || "no extension";
    counts.set(extension, (counts.get(extension) || 0) + 1);
  });

  if (counts.size === 0) return "None";

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([extension, count]) => `${extension}: ${count}`)
    .join(" · ");
}

export function buildBaseImportReport(
  status: string,
  allFiles: File[],
  readableFiles: File[],
  importedFiles: number,
  failedFiles: number
): LyricImportReport {
  const txtFiles = allFiles.filter((file) =>
    [".txt", ".text", ".md", ".markdown"].includes(
      getFileExtension(file.name)
    )
  );
  const docxFiles = allFiles.filter(
    (file) => getFileExtension(file.name) === ".docx"
  );
  const pdfFiles = allFiles.filter(
    (file) => getFileExtension(file.name) === ".pdf"
  );
  const futureFiles = allFiles.filter((file) => isFutureLyricFile(file.name));
  const blockedFiles = allFiles.filter((file) => isBlockedLyricFile(file.name));
  const skippedFiles = allFiles.filter(
    (file) => !isReadableLyricFile(file.name)
  );

  return {
    status,
    selectedFiles: allFiles.length,
    readableFiles: readableFiles.length,
    txtFiles: txtFiles.length,
    docxFiles: docxFiles.length,
    pdfFiles: pdfFiles.length,
    futureFiles: futureFiles.length,
    blockedFiles: blockedFiles.length,
    skippedFiles: skippedFiles.length,
    importedFiles,
    failedFiles,
    skippedExtensions: summarizeLyricExtensions(skippedFiles),
  };
}

export async function importLyricFilesFromFileList({
  files,
  onProgress,
}: ImportLyricFilesOptions): Promise<ImportLyricFilesResult> {
  const allFiles = Array.from(files);
  const readableFiles = allFiles.filter((file) => isReadableLyricFile(file.name));

  onProgress(buildBaseImportReport("READING - - - -", allFiles, readableFiles, 0, 0));

  if (readableFiles.length === 0) {
    const report = buildBaseImportReport(
      "Done: no readable lyric files found",
      allFiles,
      readableFiles,
      0,
      0
    );

    return {
      entries: [],
      report,
      skippedFiles: allFiles.length,
    };
  }

  const importStartedAt = Date.now();
  const importedEntries: LyricEntry[] = [];
  let failedFiles = 0;

  for (let index = 0; index < readableFiles.length; index += 1) {
    const file = readableFiles[index];

    try {
      const now = new Date().toLocaleString();
      const fileText = await readLyricImportFile(file);

      importedEntries.push({
        id: `lyric-import-${importStartedAt}-${index}-${file.name}`,
        title: getTitleFromImportedFileName(file.name),
        artist: "Unknown artist",
        tags: `imported, ${getFileExtension(file.name).replace(".", "")}`,
        body: fileText.trim() || "Empty imported lyric file.",
        createdAt: now,
        updatedAt: now,
      });
    } catch {
      failedFiles += 1;
    }

    onProgress(
      buildBaseImportReport(
        `READING - - - - ${index + 1} / ${readableFiles.length}`,
        allFiles,
        readableFiles,
        importedEntries.length,
        failedFiles
      )
    );
  }

  onProgress(
    buildBaseImportReport(
      "SAVING - - - -",
      allFiles,
      readableFiles,
      importedEntries.length,
      failedFiles
    )
  );

  const report = buildBaseImportReport(
    "DONE",
    allFiles,
    readableFiles,
    importedEntries.length,
    failedFiles
  );

  return {
    entries: importedEntries,
    report,
    skippedFiles: allFiles.length - readableFiles.length,
  };
}