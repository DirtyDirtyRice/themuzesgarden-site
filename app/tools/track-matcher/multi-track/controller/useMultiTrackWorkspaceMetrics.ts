"use client";

import { useMemo } from "react";
import {
  createLargestWorkspaceGroupLabel,
  createWorkspaceRegistryMetrics,
  createWorkspaceStatusSummary,
} from "./multiTrackWorkspaceRegistryMetrics";
import { useMultiTrackWorkspaceRegistry } from "./useMultiTrackWorkspaceRegistry";

export function useMultiTrackWorkspaceMetrics() {
  const {
    groups,
    registry,
  } = useMultiTrackWorkspaceRegistry();

  const metrics = useMemo(
    () => createWorkspaceRegistryMetrics(registry),
    [registry],
  );

  const summary = useMemo(
    () => createWorkspaceStatusSummary(metrics),
    [metrics],
  );

  const largestGroupLabel = useMemo(
    () => createLargestWorkspaceGroupLabel(groups),
    [groups],
  );

  return {
    groups,
    largestGroupLabel,
    metrics,
    registry,
    summary,
  };
}