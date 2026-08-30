import { describe, expect, it } from "vitest";
import { assessTimelineDawPluginCompatibility } from "../../lib/timeline/TimelineDawPluginCompatibilityPolicy";

const evidence = { fingerprintVerified: true, vendorVerified: true, sampleRateSupported: true, channelLayoutSupported: true, latencyMeasured: true, stateRecallPassed: true, bypassRecoveryPassed: true, renderedAudioVerified: false };

describe("timeline DAW third-party plug-in compatibility", () => {
  it("qualifies verified WASM for direct browser processing", () => expect(assessTimelineDawPluginCompatibility({ format: "wasm", executionPath: "browser-native", ...evidence })).toMatchObject({ status: "qualified", capability: "live-browser-processing", directBinaryLoadAllowed: true, sourceMutationAllowed: false }));
  it("never claims Chrome directly loads a desktop VST3 binary", () => expect(assessTimelineDawPluginCompatibility({ format: "vst3", executionPath: "browser-native", ...evidence })).toMatchObject({ status: "held", capability: "unsupported", directBinaryLoadAllowed: false }));
  it("qualifies a desktop format only through a fully verified bridge", () => expect(assessTimelineDawPluginCompatibility({ format: "aax", executionPath: "desktop-bridge", ...evidence })).toMatchObject({ status: "qualified", capability: "live-bridged-processing", directBinaryLoadAllowed: false }));
  it("holds a bridge when state recall or recovery is untested", () => expect(assessTimelineDawPluginCompatibility({ format: "au", executionPath: "desktop-bridge", ...evidence, stateRecallPassed: false, bypassRecoveryPassed: false }).requirements.join(" ")).toMatch(/state recall.*bypass/i));
  it("permits verified rendered-audio exchange without calling it a live plug-in", () => expect(assessTimelineDawPluginCompatibility({ format: "vst3", executionPath: "rendered-exchange", ...evidence, renderedAudioVerified: true })).toMatchObject({ status: "qualified", capability: "offline-rendered-audio", directBinaryLoadAllowed: false }));
});
