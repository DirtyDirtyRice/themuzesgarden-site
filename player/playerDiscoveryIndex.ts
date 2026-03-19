import type {
  DiscoveryIndex,
  DiscoveryMoment,
  DiscoveryTrack,
} from "./playerDiscoveryTypes";

function normalizeTag(tag: unknown): string | null {
  const clean = String(tag ?? "").trim().toLowerCase();
  return clean || null;
}

function buildMomentKey(moment: DiscoveryMoment): string {
  const trackId = String(moment.trackId ?? "").trim();
  const sectionId = String(moment.sectionId ?? "").trim();
  const startTime = Number.isFinite(moment.startTime) ? Number(moment.startTime) : 0;
  const label = String(moment.label ?? "").trim().toLowerCase();

  return `${trackId}::${sectionId}::${startTime}::${label}`;
}

function sortMoments(moments: DiscoveryMoment[]): DiscoveryMoment[] {
  return [...moments].sort((a, b) => {
    const byTrack = String(a.trackId ?? "").localeCompare(String(b.trackId ?? ""), undefined, {
      sensitivity: "base",
    });
    if (byTrack !== 0) return byTrack;

    if (a.startTime !== b.startTime) return a.startTime - b.startTime;

    const bySection = String(a.sectionId ?? "").localeCompare(String(b.sectionId ?? ""), undefined, {
      sensitivity: "base",
    });
    if (bySection !== 0) return bySection;

    return String(a.label ?? "").localeCompare(String(b.label ?? ""), undefined, {
      sensitivity: "base",
    });
  });
}

function pushMoment(
  map: Map<string, DiscoveryMoment[]>,
  tag: string,
  moment: DiscoveryMoment
) {
  const list = map.get(tag);

  if (list) {
    const key = buildMomentKey(moment);
    const exists = list.some((item) => buildMomentKey(item) === key);
    if (!exists) list.push(moment);
    return;
  }

  map.set(tag, [moment]);
}

function pushTrack(
  map: Map<string, string[]>,
  tag: string,
  trackId: string
) {
  const list = map.get(tag);

  if (list) {
    if (!list.includes(trackId)) list.push(trackId);
    return;
  }

  map.set(tag, [trackId]);
}

function sortTrackIds(trackIds: string[]): string[] {
  return [...trackIds].sort((a, b) =>
    String(a).localeCompare(String(b), undefined, { sensitivity: "base" })
  );
}

function finalizeMomentIndex(
  input: Map<string, DiscoveryMoment[]>
): Map<string, DiscoveryMoment[]> {
  const out = new Map<string, DiscoveryMoment[]>();

  for (const [tag, moments] of input.entries()) {
    out.set(tag, sortMoments(moments));
  }

  return out;
}

function finalizeTrackIndex(
  input: Map<string, string[]>
): Map<string, string[]> {
  const out = new Map<string, string[]>();

  for (const [tag, trackIds] of input.entries()) {
    out.set(tag, sortTrackIds(trackIds));
  }

  return out;
}

export function buildDiscoveryIndex(
  tracks: DiscoveryTrack[]
): DiscoveryIndex {
  const trackMap = new Map<string, DiscoveryTrack>();
  const tagIndex = new Map<string, DiscoveryMoment[]>();
  const trackTagIndex = new Map<string, string[]>();

  for (const track of tracks) {
    const trackId = String(track.trackId ?? "").trim();
    if (!trackId) continue;

    trackMap.set(trackId, track);

    for (const tag of Array.isArray(track.trackTags) ? track.trackTags : []) {
      const normalized = normalizeTag(tag);
      if (!normalized) continue;

      pushTrack(trackTagIndex, normalized, trackId);
    }

    for (const moment of Array.isArray(track.moments) ? track.moments : []) {
      for (const tag of Array.isArray(moment.tags) ? moment.tags : []) {
        const normalized = normalizeTag(tag);
        if (!normalized) continue;

        pushMoment(tagIndex, normalized, moment);
      }

      const label = normalizeTag(moment.label);
      if (label) {
        pushMoment(tagIndex, label, moment);
      }

      const description = normalizeTag(moment.description);
      if (description) {
        pushMoment(tagIndex, description, moment);
      }
    }
  }

  return {
    tracks: trackMap,
    tagIndex: finalizeMomentIndex(tagIndex),
    trackTagIndex: finalizeTrackIndex(trackTagIndex),
  };
}