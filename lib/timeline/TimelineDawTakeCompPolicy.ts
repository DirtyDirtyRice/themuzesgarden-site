export type TimelineDawTakeCompRegion = {
  takeId: string;
  startSeconds: number;
  endSeconds: number;
};

export type TimelineDawTakeCompRecipe = {
  name: string;
  regions: TimelineDawTakeCompRegion[];
};

const MAX_REGIONS = 100;

function finiteTime(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a finite non-negative number.`);
  }
  return value;
}

export function parseTimelineDawTakeCompRecipe(
  value: unknown,
  takeDurations: ReadonlyMap<string, number>,
): TimelineDawTakeCompRecipe {
  if (!value || typeof value !== "object") throw new Error("Comp recipe is required.");
  const input = value as Record<string, unknown>;
  const name = typeof input.name === "string" ? input.name.trim().replace(/\s+/g, " ") : "";
  if (!name || name.length > 120) throw new Error("Comp name must contain 1 to 120 characters.");
  if (!Array.isArray(input.regions) || input.regions.length < 2 || input.regions.length > MAX_REGIONS) {
    throw new Error(`Comp recipe must contain 2 to ${MAX_REGIONS} regions.`);
  }

  const regions = input.regions.map((candidate, index) => {
    if (!candidate || typeof candidate !== "object") throw new Error(`Region ${index + 1} is invalid.`);
    const region = candidate as Record<string, unknown>;
    const takeId = typeof region.takeId === "string" ? region.takeId.trim() : "";
    const duration = takeDurations.get(takeId);
    if (!takeId || duration === undefined) throw new Error(`Region ${index + 1} references an unavailable take.`);
    const startSeconds = finiteTime(region.startSeconds, `Region ${index + 1} start`);
    const endSeconds = finiteTime(region.endSeconds, `Region ${index + 1} end`);
    if (endSeconds <= startSeconds) throw new Error(`Region ${index + 1} must end after it starts.`);
    if (endSeconds > duration) throw new Error(`Region ${index + 1} exceeds its take duration.`);
    return { takeId, startSeconds, endSeconds };
  });

  if (new Set(regions.map((region) => region.takeId)).size < 2) {
    throw new Error("A comp must use at least two different takes.");
  }
  for (let left = 0; left < regions.length; left += 1) {
    for (let right = left + 1; right < regions.length; right += 1) {
      const a = regions[left];
      const b = regions[right];
      if (a.takeId === b.takeId && a.startSeconds < b.endSeconds && b.startSeconds < a.endSeconds) {
        throw new Error(`Regions ${left + 1} and ${right + 1} overlap within the same take.`);
      }
    }
  }
  return { name, regions };
}
