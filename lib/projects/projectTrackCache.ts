const cache = new Map<string, any[]>();

export function getCachedProjectTracks(projectId: string) {
  return cache.get(String(projectId)) ?? null;
}

export function setCachedProjectTracks(
  projectId: string,
  tracks: any[]
) {
  cache.set(String(projectId), tracks);
}

export function clearProjectTrackCache(projectId?: string) {
  if (projectId) {
    cache.delete(String(projectId));
    return;
  }

  cache.clear();
}