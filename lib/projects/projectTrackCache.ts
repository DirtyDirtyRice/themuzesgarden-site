type ProjectTrackCacheEntry = {
  tracks: any[];
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
  hits: number;
};

const DEFAULT_TTL = 5 * 60 * 1000;

const cache = new Map<string, ProjectTrackCacheEntry>();

let cacheHits = 0;
let cacheMisses = 0;

function now(): number {
  return Date.now();
}

function isExpired(entry: ProjectTrackCacheEntry): boolean {
  return now() > entry.expiresAt;
}

export function getCachedProjectTracks(
  projectId: string
): any[] | null {
  const key = String(projectId);
  const entry = cache.get(key);

  if (!entry) {
    cacheMisses++;
    return null;
  }

  if (isExpired(entry)) {
    cache.delete(key);
    cacheMisses++;
    return null;
  }

  entry.hits++;
  cacheHits++;

  return entry.tracks;
}

export function setCachedProjectTracks(
  projectId: string,
  tracks: any[],
  ttl = DEFAULT_TTL
): void {
  const time = now();

  cache.set(String(projectId), {
    tracks: Array.isArray(tracks) ? [...tracks] : [],
    createdAt: time,
    updatedAt: time,
    expiresAt: time + ttl,
    hits: 0,
  });
}

export function refreshCachedProjectTracks(
  projectId: string,
  ttl = DEFAULT_TTL
): boolean {
  const entry = cache.get(String(projectId));

  if (!entry) {
    return false;
  }

  const time = now();

  entry.updatedAt = time;
  entry.expiresAt = time + ttl;

  return true;
}

export function hasCachedProjectTracks(
  projectId: string
): boolean {
  return getCachedProjectTracks(projectId) !== null;
}

export function removeCachedProjectTracks(
  projectId: string
): boolean {
  return cache.delete(String(projectId));
}

export function clearProjectTrackCache(
  projectId?: string
): void {
  if (projectId) {
    cache.delete(String(projectId));
    return;
  }

  cache.clear();
}

export function cleanupExpiredProjectTrackCache(): number {
  let removed = 0;

  for (const [key, entry] of cache.entries()) {
    if (isExpired(entry)) {
      cache.delete(key);
      removed++;
    }
  }

  return removed;
}

export function getProjectTrackCacheEntry(
  projectId: string
): ProjectTrackCacheEntry | null {
  return cache.get(String(projectId)) ?? null;
}

export function getProjectTrackCacheKeys(): string[] {
  return [...cache.keys()];
}

export function getProjectTrackCacheSize(): number {
  return cache.size;
}

export function getProjectTrackCacheStatistics() {
  let totalTracks = 0;

  for (const entry of cache.values()) {
    totalTracks += entry.tracks.length;
  }

  return {
    projectsCached: cache.size,
    totalTracks,
    cacheHits,
    cacheMisses,
    hitRate:
      cacheHits + cacheMisses === 0
        ? 0
        : Number(
            (
              (cacheHits / (cacheHits + cacheMisses)) *
              100
            ).toFixed(2)
          ),
  };
}

export function resetProjectTrackCacheStatistics(): void {
  cacheHits = 0;
  cacheMisses = 0;
}

export function forEachCachedProject(
  callback: (
    projectId: string,
    entry: ProjectTrackCacheEntry
  ) => void
): void {
  for (const [projectId, entry] of cache.entries()) {
    callback(projectId, entry);
  }
}