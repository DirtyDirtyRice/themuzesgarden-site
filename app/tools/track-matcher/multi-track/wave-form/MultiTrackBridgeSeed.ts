import type { MultiTrackBridgeWorkspace } from "./MultiTrackBridgeTypes";

export const multiTrackBridgeWorkspaceSeed: MultiTrackBridgeWorkspace = {
  title: "Similarity to Strongest Idea Bridge",
  summary:
    "Seed-safe bridge connecting the existing Similarity, Riff Grouping, Extraction, Keeper, and Strongest Idea engines without creating a new analysis engine.",
  metrics: [],
  steps: [],
  pathRows: [],
  locks: [
    {
      title: "No new engine",
      body: "This bridge only connects existing seed-safe engine outputs.",
    },
    {
      title: "No controller wiring",
      body: "This does not touch the page, route, controller, or audio runtime.",
    },
    {
      title: "Safe bridge",
      body: "The bridge reads existing workspaces and displays the current promotion chain.",
    },
  ],
};