"use client";

import { useEffect, useState } from "react";
import {
  parseTimelineDawOpenSessionPreferences,
  timelineDawOpenSessionPreferenceKey,
  type TimelineDawOpenSessionFilter,
  type TimelineDawOpenSessionSort,
} from "../../../lib/timeline/TimelineDawSongStartPolicy";

type PreferenceStorage = Pick<Storage, "getItem" | "setItem">;
type PreferenceScope = "global" | { projectId: string };

export function readRecentSessionViewPreferences(
  storage: PreferenceStorage,
  key: string,
) {
  try {
    return parseTimelineDawOpenSessionPreferences(storage.getItem(key));
  } catch {
    return parseTimelineDawOpenSessionPreferences(null);
  }
}

export function writeRecentSessionViewPreferences(
  storage: PreferenceStorage,
  key: string,
  stateFilter: TimelineDawOpenSessionFilter,
  sort: TimelineDawOpenSessionSort,
) {
  try {
    storage.setItem(key, JSON.stringify({ stateFilter, sort }));
    return true;
  } catch {
    return false;
  }
}

export function useRecentSessionViewPreferences(scope: PreferenceScope) {
  const key = timelineDawOpenSessionPreferenceKey(scope);
  const [stateFilter, setStateFilter] =
    useState<TimelineDawOpenSessionFilter>("all");
  const [sort, setSort] = useState<TimelineDawOpenSessionSort>("newest");
  const [hydratedKey, setHydratedKey] = useState<string | null>(null);
  const loaded = hydratedKey === key;

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      const saved = readRecentSessionViewPreferences(window.localStorage, key);
      if (cancelled) return;
      setStateFilter(saved.stateFilter);
      setSort(saved.sort);
      setHydratedKey(key);
    });
    return () => {
      cancelled = true;
    };
  }, [key]);

  useEffect(() => {
    if (!loaded) return;
    writeRecentSessionViewPreferences(
      window.localStorage,
      key,
      stateFilter,
      sort,
    );
  }, [key, loaded, sort, stateFilter]);

  return {
    loaded,
    stateFilter,
    sort,
    setStateFilter,
    setSort,
  };
}
