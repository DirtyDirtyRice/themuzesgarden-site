"use client";

import { useEffect } from "react";

type AnyFn = (...args: any[]) => any;

export default function useMomentInspectorHostRuntime(props: any) {
  const {
    filteredFamilyOptions,
    selectedPhraseFamilyId,
    setSelectedPhraseFamilyId,
    syncPhraseFamilySelection,
  } = props ?? {};

  useEffect(() => {
    if (typeof syncPhraseFamilySelection === "function") {
      (syncPhraseFamilySelection as AnyFn)({
        familyOptions: (filteredFamilyOptions as unknown as any[]) ?? [],
        selectedPhraseFamilyId,
        setSelectedPhraseFamilyId,
      });
    }
  }, [
    filteredFamilyOptions,
    selectedPhraseFamilyId,
    setSelectedPhraseFamilyId,
    syncPhraseFamilySelection,
  ]);

  return {};
}
