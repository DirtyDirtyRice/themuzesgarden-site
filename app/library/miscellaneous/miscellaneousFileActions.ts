import type {
  DirectoryPickerWindow,
  MiscellaneousEntry,
} from "./miscellaneousTypes";

export function makeMiscellaneousSafeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function makeMiscellaneousFileName(entry: MiscellaneousEntry): string {
  const safeTitle = makeMiscellaneousSafeSlug(entry.title);
  return `${safeTitle || "miscellaneous"}.txt`;
}

export function buildMiscellaneousTextFile(entry: MiscellaneousEntry): string {
  return [
    `Title: ${entry.title}`,
    `Category: ${entry.category || "Uncategorized"}`,
    `Related Song: ${entry.relatedSong || "None"}`,
    `Tags: ${entry.tags || "None"}`,
    `Lyric Link: ${entry.lyricLink || "None"}`,
    `Story Link: ${entry.storyLink || "None"}`,
    `Track Link: ${entry.trackLink || "None"}`,
    `Project Link: ${entry.projectLink || "None"}`,
    `Metadata Link: ${entry.metadataLink || "None"}`,
    `Created: ${entry.createdAt}`,
    `Updated: ${entry.updatedAt}`,
    "",
    "MAIN TEXT",
    "",
    entry.body || "No body text.",
    "",
    "NOTES",
    "",
    entry.notes || "No notes.",
  ].join("\n");
}

export function downloadMiscellaneousTextFile(entry: MiscellaneousEntry) {
  const blob = new Blob([buildMiscellaneousTextFile(entry)], {
    type: "text/plain;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = makeMiscellaneousFileName(entry);
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

export async function saveMiscellaneousToFolder(
  entries: MiscellaneousEntry[]
) {
  const pickerWindow = window as DirectoryPickerWindow;

  if (!pickerWindow.showDirectoryPicker) {
    entries.forEach((entry) => {
      downloadMiscellaneousTextFile(entry);
    });

    return;
  }

  const directoryHandle = await pickerWindow.showDirectoryPicker();

  await Promise.all(
    entries.map(async (entry) => {
      const fileHandle = await directoryHandle.getFileHandle(
        makeMiscellaneousFileName(entry),
        { create: true }
      );
      const writable = await fileHandle.createWritable();

      await writable.write(buildMiscellaneousTextFile(entry));
      await writable.close();
    })
  );
}

export function getMiscellaneousTitleFromImportedFileName(
  fileName: string
): string {
  const withoutExtension = fileName.replace(/\.[^/.]+$/, "");
  const cleaned = withoutExtension.replace(/[-_]+/g, " ").trim();

  return cleaned || "Imported Miscellaneous Note";
}

export function readMiscellaneousTextFile(file: File): Promise<string> {
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