"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildMomentInspectorHostFilterStateResult,
  createMomentInspectorHostFilterState,
  setMomentInspectorHostFilterVerdict,
} from "./momentInspectorHostFilterState";
import type { MomentInspectorRuntimeVerdictFilter } from "./momentInspectorHostFilter.types";
import {
  buildMomentInspectorPinnedFamiliesStateResult,
  createMomentInspectorPinnedFamiliesState,
  setMomentInspectorPinnedOnly,
} from "./momentInspectorPinnedFamiliesState";
import {
  loadMomentInspectorPinnedFamiliesState,
  saveMomentInspectorPinnedFamiliesState,
} from "./momentInspectorPinnedFamiliesStorage";
import { isPinnedFamily } from "./momentInspectorPinnedFamilies.utils";
import {
  buildCompareFamilyOptions,
  buildFilteredFamilyOptions,
  buildHostFilterFamilies,
  type HostFilterFamilyOption,
} from "./momentInspectorHostOptionHelpers";

export function useMomentInspectorHostFilters(params: {
  familyOptions: unknown[];
  selectedPhraseFamilyId: string;
}) {
  const { familyOptions, selectedPhraseFamilyId } = params;

  const [hostFilterState, setHostFilterState] = useState(() =>
    createMomentInspectorHostFilterState()
  );
  const [pinnedState, setPinnedState] = useState(() =>
    createMomentInspectorPinnedFamiliesState([], false)
  );

  useEffect(() => {
    setPinnedState(loadMomentInspectorPinnedFamiliesState());
  }, []);

  useEffect(() => {
    saveMomentInspectorPinnedFamiliesState(pinnedState);
  }, [pinnedState]);

  const hostFilterFamilies = useMemo<HostFilterFamilyOption[]>(() => {
    return buildHostFilterFamilies(familyOptions);
  }, [familyOptions]);

  const hostFilterResult = useMemo(() => {
    return buildMomentInspectorHostFilterStateResult(
      hostFilterFamilies,
      hostFilterState
    );
  }, [hostFilterFamilies, hostFilterState]);

  const pinnedResult = useMemo(() => {
    return buildMomentInspectorPinnedFamiliesStateResult(
      hostFilterResult.visibleFamilies,
      pinnedState
    );
  }, [hostFilterResult.visibleFamilies, pinnedState]);

  const filteredFamilyOptions = useMemo(() => {
    return buildFilteredFamilyOptions({
      familyOptions,
      visibleFamilyIds: pinnedResult.visibleFamilies.map((family) => family.familyId),
    });
  }, [familyOptions, pinnedResult.visibleFamilies]);

  const compareFamilyOptions = useMemo(() => {
    return buildCompareFamilyOptions(filteredFamilyOptions);
  }, [filteredFamilyOptions]);

  const isSelectedFamilyPinned = useMemo(() => {
    return isPinnedFamily(selectedPhraseFamilyId, pinnedState.pinnedFamilyIds);
  }, [selectedPhraseFamilyId, pinnedState.pinnedFamilyIds]);

  function handleChangeHostVerdictFilter(
    nextVerdict: MomentInspectorRuntimeVerdictFilter
  ) {
    setHostFilterState((currentState) =>
      setMomentInspectorHostFilterVerdict(currentState, nextVerdict)
    );
  }

  function handleTogglePinnedOnly() {
    setPinnedState((currentState) =>
      setMomentInspectorPinnedOnly(currentState, !currentState.pinnedOnly)
    );
  }

  function handleResetPins() {
    setPinnedState(createMomentInspectorPinnedFamiliesState([], false));
  }

  function handleToggleSelectedFamilyPin() {
    const familyId = String(selectedPhraseFamilyId ?? "").trim();
    if (!familyId) return;

    setPinnedState((currentState) => {
      const alreadyPinned = isPinnedFamily(
        familyId,
        currentState.pinnedFamilyIds
      );

      if (alreadyPinned) {
        return {
          ...currentState,
          pinnedFamilyIds: currentState.pinnedFamilyIds.filter(
            (id) => id !== familyId
          ),
        };
      }

      return {
        ...currentState,
        pinnedFamilyIds: [...currentState.pinnedFamilyIds, familyId],
      };
    });
  }

  return {
    hostFilterState,
    pinnedState,
    hostFilterResult,
    pinnedResult,
    filteredFamilyOptions,
    compareFamilyOptions,
    isSelectedFamilyPinned,
    handleChangeHostVerdictFilter,
    handleTogglePinnedOnly,
    handleResetPins,
    handleToggleSelectedFamilyPin,
  };
}