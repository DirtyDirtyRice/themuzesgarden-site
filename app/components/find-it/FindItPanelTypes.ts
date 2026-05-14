import type { NavigationSearchResult } from "@/lib/navigation/navigationSearch";

export type FindItSystemStatus = {
  label: string;
  detail: string;
  toneClasses: string;
};

export type FindItPanelPhase = {
  eyebrow: string;
  headline: string;
  body: string;
  nextStep: string;
};

export type FindItSyncCard = {
  title: string;
  value: string;
  detail: string;
};

export type FindItPanelLayoutModel = {
  label: string;
  copy: string;
  targetFirst: boolean;
};

export type FindItCommandCenterModel = {
  phase: FindItPanelPhase;
  status: FindItSystemStatus;
  syncCards: FindItSyncCard[];
  commandStripCopy: string;
  cleanSearchValue: string;
};

export type FindItPanelModelInput = {
  hasFocusedTarget: boolean;
  hasSearchText: boolean;
  isWaitingForDebounce: boolean;
  matches: NavigationSearchResult[];
  pathname: string;
  safeSelectedIndex: number;
  searchValue: string;
  selectedResult: NavigationSearchResult | null;
};

export type FindItPanelModel = {
  activeResult: NavigationSearchResult | null;
  cleanSearchValue: string;
  commandCenter: FindItCommandCenterModel;
  layout: FindItPanelLayoutModel;
  matchCount: number;
  resultKindLabel: string;
};

export type FindItLayerTone = "default" | "emerald" | "indigo" | "amber";

export type FindItLayerShellProps = {
  badge?: string;
  children: React.ReactNode;
  description: string;
  title: string;
  tone?: FindItLayerTone;
};

export type FindItPanelSectionName =
  | "command"
  | "search"
  | "layout"
  | "target"
  | "grid"
  | "meaning"
  | "moreInfo";

export type FindItPanelSectionState = {
  name: FindItPanelSectionName;
  label: string;
  isActive: boolean;
  detail: string;
};

export function isNavigationSearchResult(
  result: NavigationSearchResult | null | undefined,
): result is NavigationSearchResult {
  return !!result;
}