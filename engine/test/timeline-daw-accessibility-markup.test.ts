import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const markup = readFileSync(
  "app/workspace/projects/[id]/ProjectDawTimeline.tsx",
  "utf8",
);

describe("DAW arrangement accessibility surface", () => {
  it("announces edits and publishes clip keyboard help", () => {
    expect(markup).toContain('role="status" aria-live="polite" aria-atomic="true"');
    expect(markup).toContain('aria-describedby="daw-clip-keyboard-help"');
    expect(markup).toContain('aria-keyshortcuts="Enter Space ArrowLeft ArrowRight');
    expect(markup).toContain('id="daw-clip-keyboard-help"');
  });

  it("makes every visible clip edge keyboard adjustable", () => {
    expect(markup.match(/role="slider"/g)).toHaveLength(4);
    expect(markup).toContain("Fade in for ${track?.title || lane.trackId}");
    expect(markup).toContain("Fade out for ${track?.title || lane.trackId}");
    expect(markup).toContain("Trim start of ${track?.title || lane.trackId}");
    expect(markup).toContain("Trim end of ${track?.title || lane.trackId}");
  });
});
