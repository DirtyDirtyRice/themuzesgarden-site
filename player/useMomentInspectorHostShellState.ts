"use client";

import { buildMomentInspectorWorkspaceHostBridge } from "./momentInspectorWorkspaceHostBridge";
import type { AnyTrack } from "./playerTypes";
import { useMomentInspectorHostRuntime } from "./useMomentInspectorHostRuntime";
import { useMomentInspectorHostStackProps } from "./useMomentInspectorHostStackProps";

type GenericRecord = Record<string, unknown>;

function toRecord(value: unknown): GenericRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as GenericRecord;
}

function toRecordArray(value: unknown): GenericRecord[] {
  if (!Array.isArray(value)) return [];

  return value.filter(
    (item): item is GenericRecord =>
      !!item && typeof item === "object" && !Array.isArray(item)
  );
}

function getRuntimeWorkspaceFamilies(runtime: unknown): GenericRecord[] {
  const record = toRecord(runtime);
  if (!record) return [];

  const directCandidates = [
    record.familyRows,
    record.families,
    record.familySources,
    record.workspaceFamilies,
    record.runtimeDiagnostics,
    record.selectedFamilyRows,
  ];

  for (const candidate of directCandidates) {
    const rows = toRecordArray(candidate);
    if (rows.length > 0) return rows;
  }

  const shellState = toRecord(record.shellState);
  if (shellState) {
    const shellCandidates = [
      shellState.familyRows,
      shellState.families,
      shellState.familySources,
      shellState.workspaceFamilies,
      shellState.runtimeDiagnostics,
      shellState.selectedFamilyRows,
    ];

    for (const candidate of shellCandidates) {
      const rows = toRecordArray(candidate);
      if (rows.length > 0) return rows;
    }
  }

  const selectedTrack = shellState ? toRecord(shellState.selectedTrack) : null;
  if (selectedTrack) {
    const trackCandidates = [
      selectedTrack.familyRows,
      selectedTrack.families,
      selectedTrack.familySources,
      selectedTrack.workspaceFamilies,
      selectedTrack.runtimeDiagnostics,
    ];

    for (const candidate of trackCandidates) {
      const rows = toRecordArray(candidate);
      if (rows.length > 0) return rows;
    }
  }

  return [];
}

export function useMomentInspectorHostShellState(params: {
  allTracks: AnyTrack[];
}) {
  const runtimeSource = useMomentInspectorHostRuntime({
    allTracks: params.allTracks,
  }) as any;

  const runtime = {
    open: Boolean(runtimeSource?.open),
    setOpen:
      typeof runtimeSource?.setOpen === "function"
        ? runtimeSource.setOpen
        : (() => {}),
    shellState:
      runtimeSource?.shellState && typeof runtimeSource.shellState === "object"
        ? runtimeSource.shellState
        : {},
    ...((runtimeSource ?? {}) as any),
  } as any;

  const baseStackProps =
    (useMomentInspectorHostStackProps({
      runtime,
    }) as any) ?? {};

  const workspaceFamilies = getRuntimeWorkspaceFamilies(runtime);
  const workspaceSources =
    (buildMomentInspectorWorkspaceHostBridge({
      families: workspaceFamilies,
    }) as any) ?? [];

  const stackProps = {
    ...baseStackProps,
    workspaceStackProps: {
      families: workspaceFamilies,
      familySources: workspaceSources,
      title: "Inspector Repair / Watchlist Workspace",
      subtitle: "Review and act on families that need attention.",
    },
  } as any;

  return {
    runtime,
    stackProps,
  } as any;
}
