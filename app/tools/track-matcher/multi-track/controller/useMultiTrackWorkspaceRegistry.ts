"use client";

import { useMemo } from "react";
import {
  createMultiTrackWorkspaceGroups,
  getMultiTrackWorkspaceRegistry,
} from "./multiTrackWorkspaceRegistryHelpers";

export function useMultiTrackWorkspaceRegistry() {
  const registry = useMemo(
    () => getMultiTrackWorkspaceRegistry(),
    [],
  );

  const groups = useMemo(
    () => createMultiTrackWorkspaceGroups(),
    [],
  );

  return {
    groups,
    registry,
  };
}