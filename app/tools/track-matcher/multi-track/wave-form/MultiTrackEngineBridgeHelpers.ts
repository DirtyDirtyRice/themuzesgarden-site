import type {
  MultiTrackEngineBridgeAdapter,
  MultiTrackEngineBridgeSignal,
  MultiTrackEngineBridgeState,
} from "./MultiTrackEngineBridgeTypes";

export function getBridgeSignalCount(
  state: MultiTrackEngineBridgeState,
): number {
  return state.signals.length;
}

export function getBridgeAdapterCount(
  state: MultiTrackEngineBridgeState,
): number {
  return state.adapters.length;
}

export function getReadyBridgeSignals(
  state: MultiTrackEngineBridgeState,
): MultiTrackEngineBridgeSignal[] {
  return state.signals.filter((signal) => signal.ready);
}

export function getConnectedBridgeAdapters(
  state: MultiTrackEngineBridgeState,
): MultiTrackEngineBridgeAdapter[] {
  return state.adapters.filter((adapter) => adapter.connected);
}

export function getBridgeCompletionPercent(
  state: MultiTrackEngineBridgeState,
): number {
  if (state.signals.length === 0) {
    return 0;
  }

  return Math.round(
    (getReadyBridgeSignals(state).length / state.signals.length) * 100,
  );
}