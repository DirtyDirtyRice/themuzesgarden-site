import type { DirectoryPickerWindow, StoryEntry } from "./storiesTypes";

export function makeStorySafeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function makeStoryFileName(entry: StoryEntry): string {
  const safeTitle = makeStorySafeSlug(entry.title);
  return `${safeTitle || "story"}.txt`;
}

export function buildStoryTextFile(entry: StoryEntry): string {
  return [
    `Story Title: ${entry.title}`,
    `Song Title: ${entry.songTitle || "Unknown"}`,
    `Inspiration: ${entry.inspiration || "None"}`,
    `Tags: ${entry.tags || "None"}`,
    `Lyric Link: ${entry.lyricLink || "None"}`,
    `Track Link: ${entry.trackLink || "None"}`,
    `Metadata Link: ${entry.metadataLink || "None"}`,
    `Created: ${entry.createdAt}`,
    `Updated: ${entry.updatedAt}`,
    "",
    "STORY",
    "",
    entry.body,
    "",
    "NOTES",
    "",
    entry.notes || "No notes.",
  ].join("\n");
}

export function downloadStoryTextFile(entry: StoryEntry) {
  const blob = new Blob([buildStoryTextFile(entry)], {
    type: "text/plain;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = makeStoryFileName(entry);
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

export async function saveStoriesToFolder(entries: StoryEntry[]) {
  const pickerWindow = window as DirectoryPickerWindow;

  if (!pickerWindow.showDirectoryPicker) {
    entries.forEach((entry) => {
      downloadStoryTextFile(entry);
    });

    return;
  }

  const directoryHandle = await pickerWindow.showDirectoryPicker();

  await Promise.all(
    entries.map(async (entry) => {
      const fileHandle = await directoryHandle.getFileHandle(
        makeStoryFileName(entry),
        { create: true }
      );
      const writable = await fileHandle.createWritable();

      await writable.write(buildStoryTextFile(entry));
      await writable.close();
    })
  );
}

export function getStoryTitleFromImportedFileName(fileName: string): string {
  const withoutExtension = fileName.replace(/\.[^/.]+$/, "");
  const cleaned = withoutExtension.replace(/[-_]+/g, " ").trim();

  return cleaned || "Imported Story";
}

export function readStoryTextFile(file: File): Promise<string> {
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