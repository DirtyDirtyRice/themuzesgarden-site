export type LyricImportReport = {
  status: string;
  selectedFiles: number;
  readableFiles: number;
  txtFiles: number;
  docxFiles: number;
  pdfFiles: number;
  futureFiles: number;
  blockedFiles: number;
  skippedFiles: number;
  importedFiles: number;
  failedFiles: number;
  skippedExtensions: string;
};

export const EMPTY_IMPORT_REPORT: LyricImportReport = {
  status: "No import running",
  selectedFiles: 0,
  readableFiles: 0,
  txtFiles: 0,
  docxFiles: 0,
  pdfFiles: 0,
  futureFiles: 0,
  blockedFiles: 0,
  skippedFiles: 0,
  importedFiles: 0,
  failedFiles: 0,
  skippedExtensions: "None",
};