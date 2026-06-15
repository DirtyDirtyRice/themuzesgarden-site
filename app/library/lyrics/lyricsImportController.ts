import type { Dispatch, RefObject, SetStateAction } from "react";

import { saveLyricsToFolder } from "./lyricsFileActions";
import { importLyricFilesFromFileList } from "./lyricsImportHelpers";
import { EMPTY_IMPORT_REPORT, type LyricImportReport } from "./lyricsImportTypes";
import type { LyricEntry } from "./lyricsTypes";

type SetString = Dispatch<SetStateAction<string>>;
type SetNullableString = Dispatch<SetStateAction<string | null>>;
type SetEntries = Dispatch<SetStateAction<LyricEntry[]>>;
type SetImportReport = Dispatch<SetStateAction<LyricImportReport>>;

export type SaveShownLyricsToFolderActions = {
  filteredEntries: LyricEntry[];
  setFolderStatus: SetString;
};

export type ImportLyricsFromInputActions = {
  files: FileList | null;
  sourceLabel: string;
  fileInputRef: RefObject<HTMLInputElement | null>;
  folderInputRef: RefObject<HTMLInputElement | null>;
  setEntries: SetEntries;
  setSelectedViewerEntryId: SetNullableString;
  setSearchValue: SetString;
  setSaveStatus: SetString;
  setImportReport: SetImportReport;
};

export async function saveShownLyricsToFolder({
  filteredEntries,
  setFolderStatus,
}: SaveShownLyricsToFolderActions) {
  try {
    setFolderStatus("Opening folder picker...");
    await saveLyricsToFolder(filteredEntries);
    setFolderStatus(`Saved ${filteredEntries.length} lyric text file(s).`);
  } catch {
    setFolderStatus("Folder save was canceled or blocked.");
  }
}

export async function importLyricsFromInput({
  files,
  sourceLabel,
  fileInputRef,
  folderInputRef,
  setEntries,
  setSelectedViewerEntryId,
  setSearchValue,
  setSaveStatus,
  setImportReport,
}: ImportLyricsFromInputActions) {
  if (!files || files.length === 0) {
    setImportReport({
      ...EMPTY_IMPORT_REPORT,
      status: `${sourceLabel} canceled or found 0 files`,
    });
    return;
  }

  try {
    const result = await importLyricFilesFromFileList({
      files,
      onProgress: setImportReport,
    });

    setEntries((current) => [...result.entries, ...current]);
    setSelectedViewerEntryId(result.entries[0]?.id || null);
    setSearchValue("");
    setSaveStatus(
      `Imported ${result.entries.length} readable lyric file(s). Skipped ${result.skippedFiles} file(s).`
    );
    setImportReport(result.report);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (folderInputRef.current) {
      folderInputRef.current.value = "";
    }
  } catch {
    setSaveStatus("Import failed");
    setImportReport({
      ...EMPTY_IMPORT_REPORT,
      status: "FAILED",
    });
  }
}