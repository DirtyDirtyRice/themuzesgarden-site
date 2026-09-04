import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  new URL("../../app/workspace/projects/[id]/ProjectDawExportWorkspace.tsx", import.meta.url),
  "utf8",
);

describe("DAW export upload recovery", () => {
  it("reports an upload interrupted by a page remount", () => {
    expect(source).toContain("daw-export-upload-attempt");
    expect(source).toContain("previous private-audio upload was interrupted");
    expect(source).toContain('sessionStorage.setItem(uploadAttemptKey, "pending")');
  });

  it("clears selected files only after a successful upload", () => {
    const success = source.indexOf("setSources(uploaded.map");
    const clearFiles = source.indexOf("setSourceFiles([])");
    const failure = source.indexOf("} catch (cause)", clearFiles);
    expect(success).toBeGreaterThan(-1);
    expect(clearFiles).toBeGreaterThan(success);
    expect(failure).toBeGreaterThan(clearFiles);
    expect(source).toContain("Retry Private Audio Upload");
  });
});
