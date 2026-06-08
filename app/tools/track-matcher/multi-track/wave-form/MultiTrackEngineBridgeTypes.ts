export type MultiTrackEngineBridgeDirection =
  | "engine-to-workspace"
  | "workspace-to-engine"
  | "bidirectional";

export type MultiTrackEngineBridgeStatus =
  | "idle"
  | "waiting"
  | "connected"
  | "warning"
  | "blocked";

export type MultiTrackEngineBridgeSignal = {
  id: string;
  label: string;
  source: string;
  destination: string;
  detail: string;
  direction: MultiTrackEngineBridgeDirection;
  status: MultiTrackEngineBridgeStatus;
  ready: boolean;
};

export type MultiTrackEngineBridgeAdapter = {
  id: string;
  label: string;
  detail: string;
  sourceWorkspace: string;
  destinationWorkspace: string;
  connected: boolean;
};

export type MultiTrackEngineBridgeState = {
  status: MultiTrackEngineBridgeStatus;
  summary: string;
  connectedAdapterCount: number;
  readySignalCount: number;
  signals: MultiTrackEngineBridgeSignal[];
  adapters: MultiTrackEngineBridgeAdapter[];
};