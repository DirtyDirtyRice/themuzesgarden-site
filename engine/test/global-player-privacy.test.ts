import { describe, expect, it } from "vitest";
import type { AnyTrack } from "../../player/playerTypes";
import { filterGlobalPlayerPublicTracks, isGlobalPlayerPublicTrack } from "../../player/globalPlayerPrivacy";

function track(id: string, visibility?: AnyTrack["visibility"], path?: string): AnyTrack {
  return { id, visibility, path };
}

describe("Global Player public-only boundary", () => {
  it("accepts tracks explicitly marked public", () => {
    expect(isGlobalPlayerPublicTrack(track("public", "public"), new Set())).toBe(true);
  });

  it("rejects private, shared, and missing visibility by default", () => {
    expect(isGlobalPlayerPublicTrack(track("private", "private"), new Set())).toBe(false);
    expect(isGlobalPlayerPublicTrack(track("shared", "shared"), new Set())).toBe(false);
    expect(isGlobalPlayerPublicTrack(track("missing"), new Set())).toBe(false);
  });

  it("accepts a track linked to an explicitly public project", () => {
    expect(isGlobalPlayerPublicTrack(track("project-track", "private"), new Set(["project-track"]))).toBe(true);
  });

  it("recognizes public-project membership through stable storage keys", () => {
    const candidate = track("track-id", "shared", "folder/song.mp3");
    expect(isGlobalPlayerPublicTrack(candidate, new Set(["sb:audio:folder/song.mp3"]))).toBe(true);
  });

  it("filters mixed lists without changing their public order", () => {
    const tracks = [track("private", "private"), track("public", "public"), track("project", "shared")];
    expect(filterGlobalPlayerPublicTracks(tracks, new Set(["project"])).map((item) => item.id)).toEqual(["public", "project"]);
  });
});
