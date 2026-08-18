type StoredSend = { destination_bus_id: unknown; level: unknown; pre_fader: unknown; muted: unknown };
type StoredInsert = { slot: unknown; effect: unknown; bypassed: unknown; parameters: unknown; latency_samples?: unknown; sidechain?: unknown };

export function buildTimelineDawMusicianTrackProcessingCopies(input: {
  ownerId: string;
  sessionId: string;
  targetLaneIds: string[];
  sends: StoredSend[];
  inserts: StoredInsert[];
  id: () => string;
}) {
  if (!input.ownerId || !input.sessionId || !input.targetLaneIds.length || input.targetLaneIds.some((id) => !id)) {
    throw new Error("Track processing copy targets are invalid.");
  }
  return {
    sends: input.targetLaneIds.flatMap((sourceId) => input.sends.map((send) => ({
      id: `timeline-daw-private-send-${input.id()}`, owner_id: input.ownerId, session_id: input.sessionId,
      source_kind: "lane", source_id: sourceId, destination_bus_id: send.destination_bus_id,
      level: send.level, pre_fader: send.pre_fader, muted: send.muted,
    }))),
    inserts: input.targetLaneIds.flatMap((sourceId) => input.inserts.map((insert) => ({
      id: `timeline-daw-private-insert-${input.id()}`, owner_id: input.ownerId, session_id: input.sessionId,
      source_kind: "lane", source_id: sourceId, slot: insert.slot, effect: insert.effect,
      bypassed: insert.bypassed, parameters: insert.parameters, latency_samples: insert.latency_samples ?? 0,
      sidechain: insert.sidechain ?? null,
    }))),
  };
}
