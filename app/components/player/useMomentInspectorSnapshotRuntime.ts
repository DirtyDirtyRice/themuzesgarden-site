"use client";

import { useMemo } from "react";
import { downloadMomentInspectorSnapshot } from "./momentInspectorSnapshotExport";
import { buildMomentInspectorSnapshotExportResult } from "./momentInspectorSnapshot.utils";
import type { MomentInspectorSnapshotRuntimeInput } from "./momentInspectorSnapshot.types";

export function useMomentInspectorSnapshotRuntime(
  input: MomentInspectorSnapshotRuntimeInput
) {
  const exportResult = useMemo(() => {
    return buildMomentInspectorSnapshotExportResult(input);
  }, [
    input.selectedTrackId,
    input.selectedPhraseFamilyId,
    input.selectedVerdict,
    input.pinnedFamilyIds,
    input.pinnedOnly,
    input.comparePrimaryFamilyId,
    input.compareSecondaryFamilyId,
  ]);

  function handleExportSnapshot() {
    downloadMomentInspectorSnapshot(exportResult);
  }

  return {
    snapshotFilename: exportResult.filename,
    snapshotExportResult: exportResult,
    handleExportSnapshot,
  };
}