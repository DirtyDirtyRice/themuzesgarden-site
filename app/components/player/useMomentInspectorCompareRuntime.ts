"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createMomentInspectorCompareState,
  setMomentInspectorComparePrimaryFamily,
  setMomentInspectorCompareSecondaryFamily,
  syncMomentInspectorCompareState,
} from "./momentInspectorCompareState";
import type { MomentInspectorCompareFamilyOption } from "./momentInspectorCompare.types";
import {
  buildMomentInspectorCompareResult,
  findFamilyRowById,
} from "./momentInspectorCompare.utils";

export function useMomentInspectorCompareRuntime(params: {
  familyOptions: MomentInspectorCompareFamilyOption[];
  driftRows: Array<{ familyId?: unknown }>;
  stabilityRows: Array<{ familyId?: unknown }>;
  actionRows: Array<{ familyId?: unknown }>;
  repairRows: Array<{ familyId?: unknown }>;
  trustRows: Array<{ familyId?: unknown }>;
}) {
  const {
    familyOptions,
    driftRows,
    stabilityRows,
    actionRows,
    repairRows,
    trustRows,
  } = params;

  const [compareState, setCompareState] = useState(() =>
    createMomentInspectorCompareState("", "")
  );

  useEffect(() => {
    setCompareState((currentState) =>
      syncMomentInspectorCompareState({
        state: currentState,
        familyOptions,
      })
    );
  }, [familyOptions]);

  const compareResult = useMemo(() => {
    const primaryFamilyId = compareState.primaryFamilyId;
    const secondaryFamilyId = compareState.secondaryFamilyId;

    return buildMomentInspectorCompareResult({
      primaryFamilyId,
      secondaryFamilyId,
      driftPrimary: findFamilyRowById(driftRows, primaryFamilyId),
      driftSecondary: findFamilyRowById(driftRows, secondaryFamilyId),
      stabilityPrimary: findFamilyRowById(stabilityRows, primaryFamilyId),
      stabilitySecondary: findFamilyRowById(stabilityRows, secondaryFamilyId),
      actionPrimary: findFamilyRowById(actionRows, primaryFamilyId),
      actionSecondary: findFamilyRowById(actionRows, secondaryFamilyId),
      repairPrimary: findFamilyRowById(repairRows, primaryFamilyId),
      repairSecondary: findFamilyRowById(repairRows, secondaryFamilyId),
      trustPrimary: findFamilyRowById(trustRows, primaryFamilyId),
      trustSecondary: findFamilyRowById(trustRows, secondaryFamilyId),
    });
  }, [
    compareState,
    driftRows,
    stabilityRows,
    actionRows,
    repairRows,
    trustRows,
  ]);

  function handleChangePrimaryFamilyId(familyId: string) {
    setCompareState((currentState) =>
      setMomentInspectorComparePrimaryFamily(currentState, familyId)
    );
  }

  function handleChangeSecondaryFamilyId(familyId: string) {
    setCompareState((currentState) =>
      setMomentInspectorCompareSecondaryFamily(currentState, familyId)
    );
  }

  return {
    compareState,
    compareResult,
    handleChangePrimaryFamilyId,
    handleChangeSecondaryFamilyId,
  };
}