// Pinned Families Module (SAFE BASELINE)
// Purpose: future logic for pinned moment families

export type PinnedFamily = {
  id: string;
};

export function getPinnedFamilies(): PinnedFamily[] {
  return [];
}

export function pinFamily(id: string): PinnedFamily {
  return { id };
}