

export type MultiTrackBridgeStep = {
  step: string;
  title: string;
  status: string;
  detail: string;
};

export type MultiTrackBridgePathRow = {
  label: string;
  value: string;
  detail: string;
};

export type MultiTrackBridgeLock = {
  title: string;
  body: string;
};

export type MultiTrackBridgeMetric = {
  label: string;
  value: string | number;
  detail: string;
};

export type MultiTrackBridgeWorkspace = {
  title: string;
  summary: string;
  metrics: MultiTrackBridgeMetric[];
  steps: MultiTrackBridgeStep[];
  pathRows: MultiTrackBridgePathRow[];
  locks: MultiTrackBridgeLock[];
};