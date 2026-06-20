import type { DirectoryPickerWindow, LyricEntry } from "./lyricsTypes";

const READABLE_EXTENSIONS = [
  "txt",
  "pdf",
  "doc",
  "docx",
  "rtf",
  "odt",
  "md",
  "text",
];

const FUTURE_EXTENSIONS = [
  "pages",
  "wps",
  "wpsx",
  "abw",
];

type PdfTextItem = {
  str?: string;
};

type PdfTextContent = {
  items: PdfTextItem[];
};

type PdfPage = {
  getTextContent: () => Promise<PdfTextContent>;
};

type PdfDocument = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfPage>;
};

type PdfLoadTask = {
  promise: Promise<PdfDocument>;
};

type PdfJsModule = {
  GlobalWorkerOptions: {
    workerSrc: string;
  };
  getDocument: (options: {
    data: Uint8Array;
  }) => PdfLoadTask;
};

export function getFileExtension(fileName: string): string {
  const parts = fileName.toLowerCase().split(".");
  return parts.length > 1 ? parts.pop() || "" : "";
}

export function isReadableLyricFile(fileName: string): boolean {
  return READABLE_EXTENSIONS.includes(getFileExtension(fileName));
}

export function isFutureLyricFile(fileName: string): boolean {
  return FUTURE_EXTENSIONS.includes(getFileExtension(fileName));
}

export function isBlockedLyricFile(fileName: string): boolean {
  const extension = getFileExtension(fileName);

  return (
    extension === "exe" ||
    extension === "dll" ||
    extension === "bat" ||
    extension === "cmd" ||
    extension === "msi" ||
    extension === "zip" ||
    extension === "rar" ||
    extension === "7z"
  );
}

export async function readLyricImportFile(file: File): Promise<string> {
  const extension = getFileExtension(file.name);

  if (extension === "txt" || extension === "text" || extension === "md") {
    return readTextFile(file);
  }

  if (extension === "pdf") {
    return readPdfTextFile(file);
  }

  return `[Imported ${extension.toUpperCase()} file]

${file.name}

File type accepted for future processing.

Current version imports TXT and PDF content only.`;
}

export function makeSafeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function makeLyricFileName(entry: LyricEntry): string {
  const safeTitle = makeSafeSlug(entry.title);
  return `${safeTitle || "lyrics"}.txt`;
}

export function buildLyricTextFile(entry: LyricEntry): string {
  return [
    `Title: ${entry.title}`,
    `Artist: ${entry.artist || "Unknown"}`,
    `Tags: ${entry.tags || "None"}`,
    `Created: ${entry.createdAt}`,
    `Updated: ${entry.updatedAt}`,
    "",
    "LYRICS",
    "",
    entry.body,
  ].join("\n");
}

export function downloadTextFile(fileName: string, fileText: string) {
  const blob = new Blob([fileText], {
    type: "text/plain;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

export function downloadLyricTextFile(entry: LyricEntry) {
  downloadTextFile(
    makeLyricFileName(entry),
    buildLyricTextFile(entry),
  );
}

export async function saveLyricsToFolder(entries: LyricEntry[]) {
  const pickerWindow = window as DirectoryPickerWindow;

  if (!pickerWindow.showDirectoryPicker) {
    entries.forEach((entry) => {
      downloadLyricTextFile(entry);
    });

    return;
  }

  const directoryHandle = await pickerWindow.showDirectoryPicker();

  await Promise.all(
    entries.map(async (entry) => {
      const fileHandle = await directoryHandle.getFileHandle(
        makeLyricFileName(entry),
        { create: true },
      );

      const writable = await fileHandle.createWritable();

      await writable.write(buildLyricTextFile(entry));
      await writable.close();
    }),
  );
}

export function getTitleFromImportedFileName(
  fileName: string,
): string {
  const withoutExtension = fileName.replace(/\.[^/.]+$/, "");

  const cleaned = withoutExtension
    .replace(/[-_]+/g, " ")
    .trim();

  return cleaned || "Imported Lyrics";
}

export function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(
        typeof reader.result === "string"
          ? reader.result
          : "",
      );
    };

    reader.onerror = () => {
      reject(
        new Error("Could not read text file."),
      );
    };

    reader.readAsText(file);
  });
}

function getPdfImportErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message || error.name;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Unknown PDF import error.";
}

export async function readPdfTextFile(file: File): Promise<string> {
  try {
    const pdfjs = (await import("pdfjs-dist/legacy/build/pdf.mjs")) as PdfJsModule;

    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/legacy/build/pdf.worker.mjs",
      import.meta.url,
    ).toString();

    const fileBytes = new Uint8Array(await file.arrayBuffer());

    const pdfDocument = await pdfjs.getDocument({
      data: fileBytes,
    }).promise;

    const pageTexts: string[] = [];

    for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
      const page = await pdfDocument.getPage(pageNumber);
      const textContent = await page.getTextContent();

      const pageText = textContent.items
        .map((item) => item.str || "")
        .join("\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

      if (pageText) {
        pageTexts.push(pageText);
      }
    }

    const extractedText = pageTexts.join("\n\n").trim();

    return extractedText || `[Imported PDF file]

${file.name}

PDF text extraction found no readable lyric text.`;
  } catch (error) {
    const errorMessage = getPdfImportErrorMessage(error);

    console.error("PDF IMPORT ERROR:", error);

    return `[Imported PDF file]

${file.name}

PDF text extraction failed.

Error:
${errorMessage}`;
  }
}