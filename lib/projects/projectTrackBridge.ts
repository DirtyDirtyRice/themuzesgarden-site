import { resolveProjectTracks } from "./projectTrackResolver";

export async function buildProjectTrackBridge(
  projectTrackIds: string[]
) {
  return await resolveProjectTracks(projectTrackIds);
}