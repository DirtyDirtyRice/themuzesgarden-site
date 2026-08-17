export function parseTimelineDawMusicianTrackName(value: unknown): string {
  const name = typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
  if (!name) throw new Error("Enter a track name.");
  if (name.length > 120) throw new Error("Track name must be 120 characters or fewer.");
  return name;
}
