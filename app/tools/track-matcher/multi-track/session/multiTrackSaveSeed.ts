import type { MultiTrackSaveRouteOption } from "./multiTrackSaveTypes";

export const MULTI_TRACK_SAVE_ROUTE_OPTIONS: MultiTrackSaveRouteOption[] = [
  {
    destination: "project",
    label: "Save to Project",
    detail: "Store the comparison inside a project workspace.",
    status: "foundation",
  },
  {
    destination: "library",
    label: "Save to Library",
    detail: "Create or update reusable Library relationship records.",
    status: "foundation",
  },
  {
    destination: "metadata",
    label: "Save to Metadata Graph",
    detail: "Create relationship nodes and route the decision into metadata.",
    status: "foundation",
  },
  {
    destination: "finder",
    label: "Save to Finder Path",
    detail: "Preserve the route that discovered the pair.",
    status: "planned",
  },
  {
    destination: "export",
    label: "Export Analysis",
    detail: "Prepare a portable analysis summary for later export tools.",
    status: "planned",
  },
];