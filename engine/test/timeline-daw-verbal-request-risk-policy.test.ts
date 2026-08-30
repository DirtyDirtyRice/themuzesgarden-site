import { describe, expect, it } from "vitest";
import { assessTimelineDawVerbalRequestRisk } from "../../lib/timeline/TimelineDawVerbalRequestRiskPolicy";

describe("TimelineDawVerbalRequestRiskPolicy", () => {
  it("reports high confidence only with a concrete action, target, and location", () => {
    const report = assessTimelineDawVerbalRequestRisk("Repeat the guitar riff after the second chorus.");
    expect(report).toMatchObject({ confidence: "high", destructiveRequest: false, executionAllowed: false, clarificationQuestions: [], sourceMutationAllowed: false, persistenceAllowed: false });
  });

  it("asks exact questions for missing action, target, and location", () => {
    const report = assessTimelineDawVerbalRequestRisk("Make it better somehow.");
    expect(report.confidence).toBe("low");
    expect(report.clarificationQuestions.join(" ")).toMatch(/exact action.*exact song section.*Where should.*measurably different/i);
  });

  it("blocks destructive source requests and offers a protected revision", () => {
    const report = assessTimelineDawVerbalRequestRisk("Permanently delete the original vocal track after the bridge.");
    expect(report).toMatchObject({ confidence: "blocked", destructiveRequest: true, executionAllowed: false, sourceMutationAllowed: false });
    expect(report.warnings.join(" ")).toMatch(/blocked.*recoverable/i);
    expect(report.protectedAlternative).toMatch(/new private revision.*unchanged source.*undo/i);
  });

  it("keeps a partially specified safe request held at medium confidence", () => {
    const report = assessTimelineDawVerbalRequestRisk("Harmonize the sax solo.");
    expect(report).toMatchObject({ confidence: "medium", destructiveRequest: false, executionAllowed: false });
    expect(report.clarificationQuestions.join(" ")).toMatch(/Where should/i);
  });
});
