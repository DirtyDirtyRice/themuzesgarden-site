import type { Tab } from "./projectDetailsTypes";

export type ProjectTabConfigItem = {
  key: Tab;
  label: string;
};

export const PROJECT_TAB_CONFIG: ProjectTabConfigItem[] = [
  { key: "overview", label: "Overview" },
  { key: "notes", label: "Notes" },
  { key: "library", label: "Library" },
  { key: "activity", label: "Activity" },
];