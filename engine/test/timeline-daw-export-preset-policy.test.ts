import { describe, expect, it } from "vitest";
import {
  getTimelineDawExportPreset,
  timelineDawExportPresets,
  validateTimelineDawLoudnessTarget,
} from "../../lib/timeline/TimelineDawExportPresetPolicy";

describe("TimelineDawExportPresetPolicy", () => {
  it("provides complete musician delivery presets", () => {
    expect(timelineDawExportPresets.map((preset) => preset.id)).toEqual([
      "streaming", "podcast", "cd", "master-archive", "stems",
    ]);
    expect(getTimelineDawExportPreset("cd")).toMatchObject({
      sampleRate: 44100, bitDepth: 16, targetLufs: -9, truePeakDbtp: -0.3, dither: true,
    });
    expect(getTimelineDawExportPreset("unknown").id).toBe("streaming");
  });

  it("bounds custom loudness and true-peak targets", () => {
    expect(validateTimelineDawLoudnessTarget(-14, -1)).toEqual({ targetLufs: -14, truePeakDbtp: -1 });
    expect(() => validateTimelineDawLoudnessTarget(-40, -1)).toThrow(/LUFS/);
    expect(() => validateTimelineDawLoudnessTarget(-14, 1)).toThrow(/dBTP/);
  });
});
