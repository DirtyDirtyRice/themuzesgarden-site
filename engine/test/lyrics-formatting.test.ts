import { describe, expect, it } from "vitest";
import { formatLyricSectionSpacing, getLyricFileFormat } from "../../app/library/lyrics/lyricsFormatting";

describe("lyric formatting and file filters", () => {
  it("adds readable space around named song sections without changing lyric lines", () => {
    expect(formatLyricSectionSpacing("Verse 1\nline one\nline two\nChorus\nhook one\nhook two\nBridge:\nlast line")).toBe(
      "Verse 1\n\nline one\nline two\n\nChorus\n\nhook one\nhook two\n\nBridge:\n\nlast line",
    );
  });

  it("recognizes persisted and legacy TXT/PDF imports", () => {
    const base = { id: "1", title: "Song", artist: "", body: "Words", createdAt: "now", updatedAt: "now" };
    expect(getLyricFileFormat({ ...base, tags: "imported", sourceFileExtension: "pdf" })).toBe("pdf");
    expect(getLyricFileFormat({ ...base, tags: "imported, txt" })).toBe("txt");
    expect(getLyricFileFormat({ ...base, tags: "manual" })).toBe("other");
  });
});
