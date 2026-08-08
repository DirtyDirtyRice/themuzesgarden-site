import { requireProjectSupabase } from "./projectSupabase";
import type { DawSession, DawSessionAction, DawSnapshot } from "./projectDawTypes";
import type {
  TimelineOfflineRenderJob,
  TimelineRenderFormat,
  TimelineRenderTarget,
} from "../../../../lib/timeline/TimelineOfflineRenderAndExportEngine";
import type { TimelineInterchangePackage } from "../../../../lib/timeline/TimelineInterchangeExportEngine";
import type { TimelineDawRecoveryCheckpoint } from "../../../../lib/timeline/TimelineDawRecoveryCheckpointStore";
import type {
  TimelineTransportEvent,
  TimelineTransportSynchronization,
} from "../../../../lib/timeline/TimelineTransportAndSynchronizationEngine";

async function accessToken(): Promise<string> {
  const { data, error } = await requireProjectSupabase().auth.getSession();
  if (error) throw error;
  const token = data.session?.access_token;
  if (!token) throw new Error("Your member session expired. Sign in again to use Studio.");
  return token;
}

export class ProjectDawApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "ProjectDawApiError";
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const token = await accessToken();
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.body && !(init.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ProjectDawApiError(body.error || "Studio request failed.", response.status);
  }
  return body as T;
}

export function loadDawSnapshot(projectId: string): Promise<DawSnapshot> {
  return request(`/api/timeline/daw-workspaces?projectId=${encodeURIComponent(projectId)}`);
}

export async function openDawSession(input: {
  projectId: string;
  songId: string;
  name: string;
  expectedWorkspaceRevision: number;
}) {
  return request<{ receipt: { workspaceRevision: number; session: DawSession } }>(
    "/api/timeline/daw-workspaces",
    { method: "POST", body: JSON.stringify({ action: "open", ...input }) },
  );
}

export async function changeDawSession(input: {
  action: DawSessionAction;
  sessionId: string;
  expectedSessionRevision: number;
  expectedWorkspaceRevision: number;
}) {
  return request<{ receipt: { workspaceRevision: number; session: DawSession } }>(
    "/api/timeline/daw-workspaces",
    { method: "POST", body: JSON.stringify(input) },
  );
}

export type DawTransportSnapshot = {
  workspaceRevision: number;
  session: DawSession;
  transport: TimelineTransportSynchronization | null;
  events: TimelineTransportEvent[];
};

export function loadDawTransport(sessionId: string): Promise<DawTransportSnapshot> {
  return request(`/api/timeline/daw-transports?sessionId=${encodeURIComponent(sessionId)}`);
}

export function changeDawTransport(input: {
  action:
    | "initialize"
    | "play"
    | "pause"
    | "stop"
    | "locate"
    | "set-loop"
    | "set-count-in"
    | "complete-count-in"
    | "set-metronome"
    | "set-cue"
    | "set-stop-return"
    | "set-scrub-snap"
    | "add-tempo" | "update-tempo" | "remove-tempo"
    | "add-signature" | "update-signature" | "remove-signature";
  sessionId: string;
  expectedWorkspaceRevision: number;
  expectedTransportHead?: number;
  returnToTick?: number;
  tick?: number;
  enabled?: boolean;
  startTick?: number;
  endTick?: number;
  bars?: number;
  cueTick?: number | null;
  returnToCue?: boolean;
  snap?: "free" | "beat" | "bar";
  pointId?: string;
  bpm?: number;
  numerator?: number;
  denominator?: 1 | 2 | 4 | 8 | 16 | 32;
}): Promise<{ receipt: DawTransportSnapshot }> {
  return request("/api/timeline/daw-transports", {
    method: "POST",
    keepalive: true,
    body: JSON.stringify(input),
  });
}

export type DawRenderSnapshot = {
  workspaceRevision: number;
  jobs: TimelineOfflineRenderJob[];
};

export function loadDawRenders(sessionId: string): Promise<DawRenderSnapshot> {
  return request(`/api/timeline/daw-renders?sessionId=${encodeURIComponent(sessionId)}`);
}

export function prepareDawRender(input: {
  sessionId: string;
  expectedWorkspaceRevision: number;
  name: string;
  target: TimelineRenderTarget;
  sourceIds: string[];
  startSample: number;
  endSample: number;
  sampleRate: number;
  bitDepth: 16 | 24 | 32;
  channels: number;
  format: TimelineRenderFormat;
  normalizePeakDb?: number | null;
  dither?: boolean;
}): Promise<{ receipt: { workspaceRevision: number; job: TimelineOfflineRenderJob } }> {
  return request("/api/timeline/daw-renders", {
    method: "POST",
    body: JSON.stringify({ action: "prepare", ...input }),
  });
}
export type DawRenderSource = {
  id: string;
  name: string;
  uri: string;
  byteLength: number;
  checksum: string;
};

export function uploadDawRenderSource(sessionId: string, file: File): Promise<{ source: DawRenderSource; audio: { sampleRate: number; channelCount: number; frameCount: number; durationSeconds: number } }> {
  const body = new FormData();
  body.set("sessionId", sessionId);
  body.set("file", file);
  return request("/api/timeline/daw-render-sources", { method: "POST", body });
}

export type DawRecordingTake = {
  id: string;
  sessionId: string;
  source: DawRenderSource;
  name: string;
  notes: string;
  rating: number;
  audio: { sampleRate: number; channelCount: number; frameCount: number; durationSeconds: number };
  preferred: boolean;
  createdAt: string;
};

export function loadDawRecordingTakes(sessionId: string): Promise<{ takes: DawRecordingTake[] }> {
  return request(`/api/timeline/daw-recording-takes?sessionId=${encodeURIComponent(sessionId)}`);
}

export function registerDawRecordingTake(
  sessionId: string,
  recorded: { source: DawRenderSource; audio: DawRecordingTake["audio"] },
): Promise<{ take: DawRecordingTake }> {
  return request("/api/timeline/daw-recording-takes", {
    method: "POST",
    body: JSON.stringify({ action: "register", sessionId, ...recorded }),
  });
}
export function reviewDawRecordingTake(
  sessionId: string,
  takeId: string,
  review: { name: string; notes: string; rating: number },
): Promise<{ take: DawRecordingTake }> {
  return request("/api/timeline/daw-recording-takes", {
    method: "POST",
    body: JSON.stringify({ action: "review", sessionId, takeId, ...review }),
  });
}


export function preferDawRecordingTake(sessionId: string, takeId: string): Promise<{ take: DawRecordingTake }> {
  return request("/api/timeline/daw-recording-takes", {
    method: "POST",
    body: JSON.stringify({ action: "prefer", sessionId, takeId }),
  });
}

export function createDawRecordingTakeAudition(
  sessionId: string,
  takeId: string,
): Promise<{ auditionUrl: string; expiresInSeconds: number }> {
  return request("/api/timeline/daw-recording-takes", {
    method: "POST",
    body: JSON.stringify({ action: "audition", sessionId, takeId }),
  });
}

export function deleteDawRecordingTake(sessionId: string, takeId: string): Promise<{ deletedTakeId: string }> {
  return request("/api/timeline/daw-recording-takes", {
    method: "POST",
    body: JSON.stringify({ action: "delete", sessionId, takeId }),
  });
}

export type DawPrivateAudioLane = {
  id: string;
  sessionId: string;
  name: string;
  source: { id: string; uri: string; checksum: string };
  audio: DawRecordingTake["audio"];
  timelineStartSeconds: number;
  sourceInSeconds: number;
  sourceOutSeconds: number;
  busId: string | null;
  mix: { muted: boolean; soloed: boolean; gain: number; pan: number };
  fade: { inSeconds: number; outSeconds: number };
  transform: { stretchRatio: number; pitchSemitones: number; algorithm: "preserve-pitch" | "resample"; quality: "draft" | "balanced" | "high"; bypassed: boolean };
  provenance: { compId: string; renderChecksum: string } | null;
  playbackUrl: string;
  createdAt: string;
  updatedAt: string;
};

export type DawPrivateLaneEditHistory = {
  id: string;
  operation: "arrange" | "split" | "duplicate" | "fade" | "remove" | "group";
  label: string;
  state: "applied" | "undone";
  createdAt: string;
  changedAt: string;
};

export function loadDawPrivateLaneHistory(sessionId: string): Promise<{ history: DawPrivateLaneEditHistory[] }> {
  return request(`/api/timeline/daw-private-lane-history?sessionId=${encodeURIComponent(sessionId)}`);
}

export function applyDawPrivateLaneHistory(sessionId: string, historyId: string, action: "undo" | "redo"): Promise<{ lanes: DawPrivateAudioLane[]; history: DawPrivateLaneEditHistory[] }> {
  return request("/api/timeline/daw-private-lane-history", { method: "POST", body: JSON.stringify({ sessionId, historyId, action }) });
}

export type DawPrivateBus = { id: string; sessionId: string; name: string; mix: { muted: boolean; soloed: boolean; gain: number; pan: number }; createdAt: string; updatedAt: string };
export function loadDawPrivateBuses(sessionId: string): Promise<{ buses: DawPrivateBus[] }> { return request(`/api/timeline/daw-private-buses?sessionId=${encodeURIComponent(sessionId)}`); }
export function saveDawPrivateBus(sessionId: string, input: { busId?: string; name: string; muted: boolean; soloed: boolean; gain: number; pan: number }): Promise<{ bus: DawPrivateBus }> { return request("/api/timeline/daw-private-buses", { method: "POST", body: JSON.stringify({ sessionId, ...input }) }); }
export function assignDawPrivateLaneBus(sessionId: string, laneId: string, busId: string | null): Promise<{ laneId: string; busId: string | null; updatedAt: string }> { return request("/api/timeline/daw-private-buses", { method: "POST", body: JSON.stringify({ action: "assign", sessionId, laneId, busId }) }); }
export function deleteDawPrivateBus(sessionId: string, busId: string): Promise<{ deletedBusId: string }> { return request("/api/timeline/daw-private-buses", { method: "POST", body: JSON.stringify({ action: "delete", sessionId, busId }) }); }
export type DawPrivateSend = { id: string; sourceKind: "lane" | "bus"; sourceId: string; destinationBusId: string; level: number; preFader: boolean; muted: boolean };
export type DawPrivateInsert = { id: string; sourceKind: "lane" | "bus"; sourceId: string; slot: number; effect: "gain" | "filter" | "compressor" | "gate"; bypassed: boolean; parameters: Record<string, number>; latencySamples?: number; sidechain?: { sourceKind: "lane" | "bus"; sourceId: string; preFader: boolean; listen: boolean; lookaheadSamples: number } | null };
export function loadDawPrivateBusProcessing(sessionId: string): Promise<{ sends: DawPrivateSend[]; inserts: DawPrivateInsert[] }> { return request(`/api/timeline/daw-private-bus-processing?sessionId=${encodeURIComponent(sessionId)}`); }
export function saveDawPrivateSend(sessionId: string, input: Omit<DawPrivateSend, "id"> & { id?: string }): Promise<{ send: DawPrivateSend }> { return request("/api/timeline/daw-private-bus-processing", { method: "POST", body: JSON.stringify({ sessionId, kind: "send", ...input }) }); }
export function saveDawPrivateInsert(sessionId: string, input: Omit<DawPrivateInsert, "id"> & { id?: string }): Promise<{ insert: DawPrivateInsert }> { return request("/api/timeline/daw-private-bus-processing", { method: "POST", body: JSON.stringify({ sessionId, kind: "insert", ...input }) }); }
export function deleteDawPrivateProcessing(sessionId: string, kind: "send" | "insert", id: string): Promise<{ deletedId: string }> { return request("/api/timeline/daw-private-bus-processing", { method: "POST", body: JSON.stringify({ action: "delete", sessionId, kind, id }) }); }
export type DawPrivateFreeze = { id: string; sourceKind: "lane" | "bus"; sourceId: string; recipeChecksum: string; artifact: { id: string; uri: string; checksum: string; byteLength: number; sampleRate: number; channelCount: number; frameCount: number; playbackUrl: string }; active: boolean; stale: boolean; createdAt: string; updatedAt: string };
export function loadDawPrivateFreezes(sessionId: string): Promise<{ freezes: DawPrivateFreeze[] }> { return request(`/api/timeline/daw-private-freezes?sessionId=${encodeURIComponent(sessionId)}`); }
export function freezeDawPrivateProcessing(sessionId: string, sourceKind: "lane" | "bus", sourceId: string): Promise<{ freeze: DawPrivateFreeze }> { return request("/api/timeline/daw-private-freezes", { method: "POST", body: JSON.stringify({ sessionId, sourceKind, sourceId }) }); }
export function unfreezeDawPrivateProcessing(sessionId: string, sourceKind: "lane" | "bus", sourceId: string): Promise<{ freeze: DawPrivateFreeze }> { return request("/api/timeline/daw-private-freezes", { method: "POST", body: JSON.stringify({ action: "unfreeze", sessionId, sourceKind, sourceId }) }); }

export type DawPrivateLaneWaveform = { binCount: number; frameCount: number; peaks: number[] };

export function loadDawPrivateLaneWaveform(sessionId: string, laneId: string): Promise<{ waveform: DawPrivateLaneWaveform; cached: boolean }> {
  return request(`/api/timeline/daw-private-waveforms?sessionId=${encodeURIComponent(sessionId)}&laneId=${encodeURIComponent(laneId)}`);
}

export function editDawPrivateLaneGroup(input: {
  sessionId: string;
  laneIds: string[];
  groupAction: "move" | "mix" | "fade";
  deltaSeconds?: number;
  muted?: boolean;
  gain?: number;
  pan?: number;
  fadeInSeconds?: number;
  fadeOutSeconds?: number;
}): Promise<{ lanes: DawPrivateAudioLane[] }> {
  return request("/api/timeline/daw-private-lane-groups", { method: "POST", body: JSON.stringify(input) });
}

export function loadDawPrivateAudioLanes(sessionId: string): Promise<{ lanes: DawPrivateAudioLane[] }> {
  return request(`/api/timeline/daw-private-audio-lanes?sessionId=${encodeURIComponent(sessionId)}`);
}

export function addDawPrivateAudioLane(input: {
  sessionId: string;
  name: string;
  sourceId: string;
  sourceUri: string;
  sourceChecksum: string;
  sampleRate: number;
  channelCount: number;
  frameCount: number;
  durationSeconds: number;
  timelineStartSeconds: number;
  compId?: string;
  compRenderChecksum?: string;
}): Promise<{ lane: DawPrivateAudioLane }> {
  return request("/api/timeline/daw-private-audio-lanes", {
    method: "POST",
    body: JSON.stringify({ action: "add", ...input }),
  });
}

export function arrangeDawPrivateAudioLane(
  sessionId: string,
  laneId: string,
  arrangement: { timelineStartSeconds: number; sourceInSeconds: number; sourceOutSeconds: number },
): Promise<{ lane: DawPrivateAudioLane }> {
  return request("/api/timeline/daw-private-audio-lanes", {
    method: "POST",
    body: JSON.stringify({ action: "arrange", sessionId, laneId, ...arrangement }),
  });
}

export function splitDawPrivateAudioLane(
  sessionId: string,
  laneId: string,
  timelineSplitSeconds: number,
): Promise<{ lanes: [DawPrivateAudioLane, DawPrivateAudioLane] }> {
  return request("/api/timeline/daw-private-audio-lanes", {
    method: "POST",
    body: JSON.stringify({ action: "split", sessionId, laneId, timelineSplitSeconds }),
  });
}

export function duplicateDawPrivateAudioLane(sessionId: string, laneId: string): Promise<{ lane: DawPrivateAudioLane }> {
  return request("/api/timeline/daw-private-audio-lanes", {
    method: "POST",
    body: JSON.stringify({ action: "duplicate", sessionId, laneId }),
  });
}

export function updateDawPrivateAudioLaneMix(
  sessionId: string,
  laneId: string,
  mix: DawPrivateAudioLane["mix"],
): Promise<{ lane: DawPrivateAudioLane }> {
  return request("/api/timeline/daw-private-audio-lanes", {
    method: "POST",
    body: JSON.stringify({ action: "mix", sessionId, laneId, ...mix }),
  });
}

export function updateDawPrivateAudioLaneTransform(sessionId:string,laneId:string,transform:DawPrivateAudioLane["transform"]):Promise<{lane:DawPrivateAudioLane}>{return request("/api/timeline/daw-private-audio-lanes",{method:"POST",body:JSON.stringify({action:"transform",sessionId,laneId,...transform})});}

export function updateDawPrivateAudioLaneFade(
  sessionId: string,
  laneId: string,
  fade: DawPrivateAudioLane["fade"],
): Promise<{ lane: DawPrivateAudioLane }> {
  return request("/api/timeline/daw-private-audio-lanes", {
    method: "POST",
    body: JSON.stringify({ action: "fade", sessionId, laneId, fadeInSeconds: fade.inSeconds, fadeOutSeconds: fade.outSeconds }),
  });
}

export function removeDawPrivateAudioLane(sessionId: string, laneId: string): Promise<{ removedLaneId: string }> {
  return request("/api/timeline/daw-private-audio-lanes", {
    method: "POST",
    body: JSON.stringify({ action: "remove", sessionId, laneId }),
  });
}

export type DawTakeCompRegion = {
  takeId: string;
  startSeconds: number;
  endSeconds: number;
};

export type DawTakeComp = {
  id: string;
  sessionId: string;
  name: string;
  regions: DawTakeCompRegion[];
  createdAt: string;
  updatedAt: string;
promotion: {
    sourceId: string;
    sourceUri: string;
    renderChecksum: string;
    promotedAt: string;
    current: boolean;
  } | null;
  render: {
    uri: string;
    checksum: string;
    byteLength: number;
    sampleRate: number;
    channelCount: number;
    frameCount: number;
    durationSeconds: number;
    renderedAt: string;
  } | null;
};

export function loadDawTakeComps(sessionId: string): Promise<{ comps: DawTakeComp[] }> {
  return request(`/api/timeline/daw-take-comps?sessionId=${encodeURIComponent(sessionId)}`);
}

export function saveDawTakeComp(input: {
  sessionId: string;
  compId?: string;
  name: string;
  regions: DawTakeCompRegion[];
}): Promise<{ comp: DawTakeComp }> {
  return request("/api/timeline/daw-take-comps", {
    method: "POST",
    body: JSON.stringify({ action: "save", ...input }),
  });
}

export function renderDawTakeComp(sessionId: string, compId: string): Promise<{
  comp: DawTakeComp;
  deliveryUrl: string;
  progress: Array<{ stage: "decoded" | "assembled" | "persisted"; percent: number }>;
}> {
  return request("/api/timeline/daw-take-comps", {
    method: "POST",
    body: JSON.stringify({ action: "render", sessionId, compId }),
  });
}

export function promoteDawTakeComp(sessionId: string, compId: string): Promise<{
  comp: DawTakeComp;
  source: DawRenderSource;
  audio: DawRecordingTake["audio"];
}> {
  return request("/api/timeline/daw-take-comps", {
    method: "POST",
    body: JSON.stringify({ action: "promote", sessionId, compId }),
  });
}

export function loadDawTakeCompDelivery(sessionId: string, compId: string): Promise<{ deliveryUrl: string }> {
  return request("/api/timeline/daw-take-comps", {
    method: "POST",
    body: JSON.stringify({ action: "delivery", sessionId, compId }),
  });
}

export function deleteDawTakeComp(sessionId: string, compId: string): Promise<{ deletedCompId: string }> {
  return request("/api/timeline/daw-take-comps", {
    method: "POST",
    body: JSON.stringify({ action: "delete", sessionId, compId }),
  });
}

export function executeDawWavRender(input: {
  sessionId: string;
  jobId: string;
  expectedWorkspaceRevision: number;
}): Promise<{
  receipt: {
    workspaceRevision: number;
    job: TimelineOfflineRenderJob;
    deliveryUrl: string;
    progress: Array<{ renderedFrames: number; totalFrames: number; percent: number }>;
  };
}> {
  return request("/api/timeline/daw-renders", {
    method: "POST",
    body: JSON.stringify({ action: "execute-wav", ...input }),
  });
}
export function loadDawRenderDelivery(sessionId: string, jobId: string): Promise<{ deliveryUrl: string }> {
  return request(`/api/timeline/daw-renders?sessionId=${encodeURIComponent(sessionId)}&jobId=${encodeURIComponent(jobId)}`);
}
export function executeDawStemPackage(input: {
  sessionId: string;
  jobId: string;
  expectedWorkspaceRevision: number;
}): Promise<{
  receipt: {
    workspaceRevision: number;
    job: TimelineOfflineRenderJob;
    deliveryUrl: string;
    progressUpdates: number;
    stems: Array<{ sourceId: string; name: string; byteLength: number; checksum: string }>;
  };
}> {
  return request("/api/timeline/daw-renders", {
    method: "POST",
    body: JSON.stringify({ action: "execute-stems", ...input }),
  });
}
export type DawInterchangeSnapshot = {
  workspaceRevision: number;
  packages: TimelineInterchangePackage[];
};

export function loadDawInterchange(sessionId: string): Promise<DawInterchangeSnapshot> {
  return request(`/api/timeline/daw-interchange?sessionId=${encodeURIComponent(sessionId)}`);
}

export function createDawInterchange(input: {
  sessionId: string;
  jobIds: string[];
  name: string;
  destination: string;
  expectedWorkspaceRevision: number;
}): Promise<{
  receipt: {
    workspaceRevision: number;
    package: TimelineInterchangePackage;
    deliveryUrl: string;
  };
}> {
  return request("/api/timeline/daw-interchange", {
    method: "POST",
    body: JSON.stringify({ action: "create", ...input }),
  });
}

export function loadDawInterchangeDelivery(
  sessionId: string,
  packageId: string,
): Promise<{ deliveryUrl: string }> {
  return request(
    `/api/timeline/daw-interchange?sessionId=${encodeURIComponent(sessionId)}&packageId=${encodeURIComponent(packageId)}`,
  );
}

export type DawRecoverySnapshot = {
  workspaceRevision: number;
  checkpoints: TimelineDawRecoveryCheckpoint[];
};

export function loadDawRecovery(sessionId: string): Promise<DawRecoverySnapshot> {
  return request(`/api/timeline/daw-recovery?sessionId=${encodeURIComponent(sessionId)}`);
}

export function captureDawRecovery(input: {
  sessionId: string;
  label: string;
  expectedWorkspaceRevision: number;
}): Promise<{ receipt: { workspaceRevision: number; checkpoint: TimelineDawRecoveryCheckpoint } }> {
  return request("/api/timeline/daw-recovery", {
    method: "POST",
    body: JSON.stringify({ action: "capture", ...input }),
  });
}

export function restoreDawRecovery(input: {
  sessionId: string;
  checkpointId: string;
  expectedWorkspaceRevision: number;
}): Promise<{ receipt: { workspaceRevision: number; checkpoint: TimelineDawRecoveryCheckpoint } }> {
  return request("/api/timeline/daw-recovery", {
    method: "POST",
    body: JSON.stringify({ action: "restore", ...input }),
  });
}
