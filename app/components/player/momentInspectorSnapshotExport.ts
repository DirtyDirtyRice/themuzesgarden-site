import type { MomentInspectorSnapshotExportResult } from "./momentInspectorSnapshot.types";

function canUseDom(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

export function downloadMomentInspectorSnapshot(
  result: MomentInspectorSnapshotExportResult
): boolean {
  if (!canUseDom()) {
    return false;
  }

  try {
    const blob = new Blob([result.json], {
      type: "application/json;charset=utf-8",
    });

    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = result.filename;
    anchor.style.display = "none";

    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    window.URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}