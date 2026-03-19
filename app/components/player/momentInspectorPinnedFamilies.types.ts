export type MomentInspectorPinnedFamilyId = string;

export type MomentInspectorPinnedFamiliesState = {
  pinnedFamilyIds: MomentInspectorPinnedFamilyId[];
  pinnedOnly: boolean;
};

export type MomentInspectorPinnedFamilyOption = {
  familyId: string;
  label?: string;
  runtimeVerdict?: string | null;
};

export type MomentInspectorPinnedFamiliesStoragePayload = {
  pinnedFamilyIds: string[];
  pinnedOnly: boolean;
};

export type MomentInspectorPinnedFamiliesResult<TFamily> = {
  pinnedFamilyIds: string[];
  pinnedOnly: boolean;
  totalCount: number;
  pinnedCount: number;
  visibleCount: number;
  hiddenCount: number;
  visibleFamilies: TFamily[];
  hiddenFamilies: TFamily[];
};

export type MomentInspectorPinnedFamiliesSummary = {
  pinnedFamilyIds: string[];
  pinnedOnly: boolean;
  totalCount: number;
  pinnedCount: number;
  visibleCount: number;
  hiddenCount: number;
};