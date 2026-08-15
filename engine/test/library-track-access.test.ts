import { describe, expect, it } from "vitest";
import { canViewLibraryTrack } from "../../app/library/libraryTrackAccess";
import { buildLibraryGroundworkTracks } from "../../app/library/libraryTrackGroundwork";

describe("library track restoration access", () => {
  it("restores legacy seed songs as public library tracks", () => {
    const [track] = buildLibraryGroundworkTracks([{ id: "demo-1", title: "Public Song", url: "https://example.com/song.mp3" }]);
    expect(track.librarySource).toBe("seed");
    expect(track.libraryAccess.visibility).toBe("public");
    expect(canViewLibraryTrack(track, null)).toBe(true);
  });

  it("shows private songs only to their owner", () => {
    const [track] = buildLibraryGroundworkTracks([{ id: "upload-1", title: "Private Song", visibility: "private", ownerId: "owner-1" }]);
    expect(canViewLibraryTrack(track, null)).toBe(false);
    expect(canViewLibraryTrack(track, "another-member")).toBe(false);
    expect(canViewLibraryTrack(track, "owner-1")).toBe(true);
  });

  it("restores explicitly shared private songs only to named members", () => {
    const [track] = buildLibraryGroundworkTracks([{ id: "upload-2", title: "Shared Song", visibility: "private", sharedWithMemberIds: ["member-2"] }]);
    expect(canViewLibraryTrack(track, "member-1")).toBe(false);
    expect(canViewLibraryTrack(track, "member-2")).toBe(true);
  });

  it("keeps unowned non-seed tracks private by default", () => {
    const [track] = buildLibraryGroundworkTracks([{ id: "project-1", title: "Unknown Song", source: "project" }]);
    expect(track.libraryAccess.visibility).toBe("private");
    expect(canViewLibraryTrack(track, "member-1")).toBe(false);
  });
});
