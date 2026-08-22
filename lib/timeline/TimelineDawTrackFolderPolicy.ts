export type TimelineDawTrackFolder = { id: string; name: string; laneIds: string[]; collapsed: boolean };
export type TimelineDawTrackFolders = Record<string, TimelineDawTrackFolder>;

export function parseTimelineDawTrackFolders(value: string | null, validLaneIds: string[]): TimelineDawTrackFolders {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const valid = new Set(validLaneIds);
    const claimed = new Set<string>();
    const result: TimelineDawTrackFolders = {};
    for (const [id, item] of Object.entries(parsed)) {
      if (!item || typeof item !== "object" || Array.isArray(item)) continue;
      const folder = item as Partial<TimelineDawTrackFolder>;
      const laneIds = Array.isArray(folder.laneIds) ? [...new Set(folder.laneIds.filter((laneId): laneId is string => typeof laneId === "string" && valid.has(laneId) && !claimed.has(laneId)))] : [];
      if (folder.id !== id || id.length < 1 || id.length > 100 || typeof folder.name !== "string" || !folder.name.trim() || folder.name.trim().length > 80 || laneIds.length < 2 || typeof folder.collapsed !== "boolean") continue;
      laneIds.forEach((laneId) => claimed.add(laneId));
      result[id] = { id, name: folder.name.trim(), laneIds, collapsed: folder.collapsed };
    }
    return result;
  } catch { return {}; }
}

export function createTimelineDawTrackFolder(folders: TimelineDawTrackFolders, folder: TimelineDawTrackFolder): TimelineDawTrackFolders {
  const name = folder.name.trim();
  const laneIds = [...new Set(folder.laneIds)];
  const claimed = new Set(Object.values(folders).flatMap((item) => item.laneIds));
  if (!folder.id || folder.id.length > 100 || !name || name.length > 80 || laneIds.length < 2 || laneIds.some((laneId) => !laneId || claimed.has(laneId))) return folders;
  return { ...folders, [folder.id]: { ...folder, name, laneIds } };
}

export function renameTimelineDawTrackFolder(folders: TimelineDawTrackFolders, id: string, name: string): TimelineDawTrackFolders {
  const folder = folders[id];
  const trimmed = name.trim();
  if (!folder || !trimmed || trimmed.length > 80) return folders;
  return { ...folders, [id]: { ...folder, name: trimmed } };
}

export function toggleTimelineDawTrackFolder(folders: TimelineDawTrackFolders, id: string): TimelineDawTrackFolders {
  const folder = folders[id];
  return folder ? { ...folders, [id]: { ...folder, collapsed: !folder.collapsed } } : folders;
}

export function removeTimelineDawTrackFolder(folders: TimelineDawTrackFolders, id: string): TimelineDawTrackFolders {
  if (!folders[id]) return folders;
  const next = { ...folders };
  delete next[id];
  return next;
}
