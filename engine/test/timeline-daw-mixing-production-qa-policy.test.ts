import { describe, expect, it } from "vitest";
import { assessTimelineDawMixingProductionQa, TIMELINE_DAW_MIXING_PRODUCTION_QA_CHECKS } from "../../lib/timeline/TimelineDawMixingProductionQaPolicy";

const identities = { bridgeName: "Verified Desktop Bridge 1.0", pluginIdentity: "Example VST3 2.4", controlSurfaceName: "Example MIDI Mixer" };

describe("timeline DAW mixing production QA", () => {
  it("requires named real equipment before evidence can pass", () => expect(assessTimelineDawMixingProductionQa({ bridgeName: "", pluginIdentity: "", controlSurfaceName: "", evidence: {} })).toMatchObject({ status: "equipment-required", productionEvidenceComplete: false }));
  it("keeps partial physical evidence in progress", () => expect(assessTimelineDawMixingProductionQa({ ...identities, evidence: { "plugin-instantiation": "pass", "state-recall": "pass" } })).toMatchObject({ status: "in-progress", productionEvidenceComplete: false, passedChecks: ["plugin-instantiation", "state-recall"] }));
  it("holds the report when any real trial reports an issue", () => expect(assessTimelineDawMixingProductionQa({ ...identities, evidence: { "plugin-instantiation": "pass", "latency-compensation": "issue" } })).toMatchObject({ status: "needs-review", productionEvidenceComplete: false, issues: ["latency-compensation"] }));
  it("passes only all twelve real-world checks with complete identities", () => {
    const evidence = Object.fromEntries(TIMELINE_DAW_MIXING_PRODUCTION_QA_CHECKS.map((check) => [check, "pass" as const]));
    expect(assessTimelineDawMixingProductionQa({ ...identities, evidence })).toMatchObject({ status: "passed", productionEvidenceComplete: true, passedChecks: TIMELINE_DAW_MIXING_PRODUCTION_QA_CHECKS, remainingChecks: [] });
  });
});
