import type { DirectoryPickerWindow, MultiStemEntry } from "./multiStemsTypes";

export function makeMultiStemSafeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function makeMultiStemFileName(entry: MultiStemEntry): string {
  const safeTitle = makeMultiStemSafeSlug(entry.title);
  return `${safeTitle || "multi-stems"}.txt`;
}

export function buildMultiStemTextFile(entry: MultiStemEntry): string {
  return [
    `Stem Set Title: ${entry.title}`,
    `Song Title: ${entry.songTitle || "Unknown"}`,
    `BPM: ${entry.bpm || "Unknown"}`,
    `Key: ${entry.songKey || "Unknown"}`,
    `Stem Types: ${entry.stemTypes || "None"}`,
    `Source Folder: ${entry.sourceFolder || "None"}`,
    `Tags: ${entry.tags || "None"}`,
    `Track Link: ${entry.trackLink || "None"}`,
    `Project Link: ${entry.projectLink || "None"}`,
    `Metadata Link: ${entry.metadataLink || "None"}`,
    `Created: ${entry.createdAt}`,
    `Updated: ${entry.updatedAt}`,
    "",
    "NOTES",
    "",
    entry.notes || "No notes.",
  ].join("\n");
}

export function downloadMultiStemTextFile(entry: MultiStemEntry) {
  const blob = new Blob([buildMultiStemTextFile(entry)], {
    type: "text/plain;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = makeMultiStemFileName(entry);
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

export async function saveMultiStemsToFolder(entries: MultiStemEntry[]) {
  const pickerWindow = window as DirectoryPickerWindow;

  if (!pickerWindow.showDirectoryPicker) {
    entries.forEach((entry) => {
      downloadMultiStemTextFile(entry);
    });

    return;
  }

  const directoryHandle = await pickerWindow.showDirectoryPicker();

  await Promise.all(
    entries.map(async (entry) => {
      const fileHandle = await directoryHandle.getFileHandle(
        makeMultiStemFileName(entry),
        { create: true }
      );
      const writable = await fileHandle.createWritable();

      await writable.write(buildMultiStemTextFile(entry));
      await writable.close();
    })
  );
}

export function getMultiStemTitleFromImportedFileName(fileName: string): string {
  const withoutExtension = fileName.replace(/\.[^/.]+$/, "");
  const cleaned = withoutExtension.replace(/[-_]+/g, " ").trim();

  return cleaned || "Imported Stem Set";
}

export function readMultiStemTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(typeof reader.result === "string" ? reader.result : "");
    };

    reader.onerror = () => {
      reject(new Error("Could not read text file."));
    };

    reader.readAsText(file);
  });
}