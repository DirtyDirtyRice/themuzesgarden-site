import type { MomentInspectorCompareFamilyOption } from "./momentInspectorCompare.types";
import type { MomentInspectorHostFilterableFamily } from "./momentInspectorHostFilter.types";

export type HostFilterFamilyOption = MomentInspectorHostFilterableFamily & {
  label?: string;
  value?: string;
  [key: string]: unknown;
};

export function getOptionFamilyId(option: HostFilterFamilyOption): string {
  const fromFamilyId = String(option.familyId ?? "").trim();
  if (fromFamilyId) return fromFamilyId;

  const fromValue = String(option.value ?? "").trim();
  if (fromValue) return fromValue;

  return "";
}

export function getOptionRuntimeVerdict(
  option: HostFilterFamilyOption
): string | null {
  const directVerdict = String(option.runtimeVerdict ?? "").trim();
  if (directVerdict) return directVerdict;

  const nestedRuntimeVerdict = String(
    (option as { verdict?: unknown }).verdict ?? ""
  ).trim();
  if (nestedRuntimeVerdict) return nestedRuntimeVerdict;

  return null;
}

export function buildHostFilterFamilies(
  familyOptions: unknown[]
): HostFilterFamilyOption[] {
  return (Array.isArray(familyOptions) ? familyOptions : []).map((option) => {
    const typedOption = option as HostFilterFamilyOption;

    return {
      ...typedOption,
      familyId: getOptionFamilyId(typedOption),
      runtimeVerdict: getOptionRuntimeVerdict(typedOption),
    };
  });
}

export function buildFilteredFamilyOptions(params: {
  familyOptions: unknown[];
  visibleFamilyIds: string[];
}): HostFilterFamilyOption[] {
  const visibleIds = new Set(params.visibleFamilyIds);

  return (Array.isArray(params.familyOptions) ? params.familyOptions : []).filter(
    (option) => {
      const typedOption = option as HostFilterFamilyOption;
      return visibleIds.has(getOptionFamilyId(typedOption));
    }
  ) as HostFilterFamilyOption[];
}

export function buildCompareFamilyOptions(
  familyOptions: HostFilterFamilyOption[]
): MomentInspectorCompareFamilyOption[] {
  return familyOptions.map((option) => ({
    familyId: getOptionFamilyId(option),
    label:
      String(
        option.label ?? option.value ?? option.familyId ?? ""
      ).trim() || getOptionFamilyId(option),
    runtimeVerdict: getOptionRuntimeVerdict(option),
  }));
}