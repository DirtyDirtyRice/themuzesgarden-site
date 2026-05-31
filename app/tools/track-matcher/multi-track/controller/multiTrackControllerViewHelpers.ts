import type {
  MultiTrackControllerPanelSummary,
  MultiTrackControllerView,
} from "./multiTrackControllerTypes";

export const multiTrackControllerViewLabels: Record<
  MultiTrackControllerView,
  string
> = {
  overview: "Overview",
  tracks: "Tracks",
  comparison: "Comparison",
  metadata: "Metadata",
  timeline: "Timeline",
  save: "Save",
  ai: "AI",
};

export function getMultiTrackControllerViewLabel(
  view: MultiTrackControllerView,
): string {
  return multiTrackControllerViewLabels[view];
}

export function getMultiTrackPanelsForView(
  panels: MultiTrackControllerPanelSummary[],
  view: MultiTrackControllerView,
): MultiTrackControllerPanelSummary[] {
  if (view === "overview") {
    return panels;
  }

  return panels.filter((panel) => panel.view === view);
}

export function getMultiTrackViewPanelCountLabel(
  panels: MultiTrackControllerPanelSummary[],
  view: MultiTrackControllerView,
): string {
  const count = getMultiTrackPanelsForView(panels, view).length;

  if (count === 1) {
    return "1 mapped panel";
  }

  return `${count} mapped panels`;
}