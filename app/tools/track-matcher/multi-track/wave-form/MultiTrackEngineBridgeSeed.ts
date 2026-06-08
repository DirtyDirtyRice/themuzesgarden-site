import type { MultiTrackEngineBridgeState } from "./MultiTrackEngineBridgeTypes";

export const DEFAULT_MULTI_TRACK_ENGINE_BRIDGE_STATE: MultiTrackEngineBridgeState =
{
  status: "waiting",
  summary:
    "Bridge workspace is waiting for engine and workstation systems to connect.",

  connectedAdapterCount: 0,
  readySignalCount: 0,

  signals: [
    {
      id: "bridge-track-analysis",
      label: "Track Analysis",
      source: "Engine",
      destination: "Workspace",
      detail:
        "Future analysis results can flow from engine systems into workspace panels.",
      direction: "engine-to-workspace",
      status: "waiting",
      ready: false,
    },

    {
      id: "bridge-sync-routing",
      label: "Sync Routing",
      source: "Sync",
      destination: "Timeline",
      detail:
        "Future sync recommendations can be routed into timeline workspaces.",
      direction: "engine-to-workspace",
      status: "waiting",
      ready: false,
    },

    {
      id: "bridge-decision-routing",
      label: "Decision Routing",
      source: "Decision Center",
      destination: "Save System",
      detail:
        "Future decision outcomes can automatically prepare save records.",
      direction: "engine-to-workspace",
      status: "waiting",
      ready: false,
    },
  ],

  adapters: [
    {
      id: "adapter-analysis",
      label: "Analysis Adapter",
      detail: "Connects analysis systems to workspace panels.",
      sourceWorkspace: "Analysis",
      destinationWorkspace: "Dashboard",
      connected: false,
    },

    {
      id: "adapter-sync",
      label: "Sync Adapter",
      detail: "Connects sync systems to timeline workspaces.",
      sourceWorkspace: "Sync",
      destinationWorkspace: "Timeline",
      connected: false,
    },

    {
      id: "adapter-save",
      label: "Save Adapter",
      detail: "Connects decisions to save systems.",
      sourceWorkspace: "Decision",
      destinationWorkspace: "Save",
      connected: false,
    },
  ],
};