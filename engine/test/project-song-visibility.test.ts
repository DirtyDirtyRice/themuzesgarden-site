import { describe, expect, it } from "vitest";
import {
  isProjectSongPublic,
  normalizeProjectSongVisibility,
  summarizeProjectSongVisibility,
} from "../../lib/projects/projectSongVisibility";

describe("project song privacy", () => {
  it("publishes only an explicitly public song inside a public project", () => {
    expect(isProjectSongPublic({ projectVisibility: "public", songVisibility: "public" })).toBe(true);
    expect(isProjectSongPublic({ projectVisibility: "public", songVisibility: "private" })).toBe(false);
    expect(isProjectSongPublic({ projectVisibility: "private", songVisibility: "public" })).toBe(false);
  });

  it("treats absent or invalid song privacy as private", () => {
    expect(normalizeProjectSongVisibility(undefined)).toBe("private");
    expect(normalizeProjectSongVisibility("shared")).toBe("private");
  });

  it("summarizes linked songs without counting unrelated tracks", () => {
    expect(summarizeProjectSongVisibility(["one", "two", "three"], {
      one: "public", two: "private", three: "private", unrelated: "public",
    })).toEqual({ privateCount: 2, publicCount: 1, totalCount: 3 });
  });
});
