import { describe, expect, it } from "vitest";
import {
  browseTimelineDawEffectPresets,
  getTimelineDawEffectPreset,
  timelineDawEffectPresetCatalog,
} from "../../lib/timeline/TimelineDawEffectPresetBrowserPolicy";

describe("TimelineDawEffectPresetBrowserPolicy", () => {
  it("provides musician-facing presets for every native effect", () => {
    expect(timelineDawEffectPresetCatalog).toHaveLength(20);
    expect(new Set(timelineDawEffectPresetCatalog.map((preset) => preset.kind)))
      .toEqual(new Set(["eq", "compressor", "reverb", "delay"]));
    expect(timelineDawEffectPresetCatalog.every((preset) => (
      preset.amount >= 0 && preset.amount <= 1 && preset.mix >= 0 && preset.mix <= 1
    ))).toBe(true);
  });

  it("filters by effect, musician category, description, and tags", () => {
    expect(browseTimelineDawEffectPresets({ kind: "reverb", category: "vocals" })
      .map((preset) => preset.name)).toEqual(["Plate"]);
    expect(browseTimelineDawEffectPresets({ kind: "compressor", query: "parallel" })
      .map((preset) => preset.name)).toEqual(["Parallel Energy"]);
    expect(browseTimelineDawEffectPresets({ kind: "delay", query: "stereo" })
      .map((preset) => preset.name)).toEqual(["Ping Pong"]);
  });

  it("resolves compatible presets without crossing effect kinds", () => {
    expect(getTimelineDawEffectPreset("eq", "Vocal Presence"))
      .toMatchObject({ amount: 0.62, mix: 1 });
    expect(getTimelineDawEffectPreset("delay", "Vocal Presence")).toBeNull();
  });
});
