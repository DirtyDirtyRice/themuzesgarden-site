import { describe, expect, it } from "vitest";
import { createTimelineDawVerbalAcceptance, recordTimelineDawVerbalAcceptance, TIMELINE_DAW_VERBAL_ACCEPTANCE_LEVELS } from "../../lib/timeline/TimelineDawVerbalAcceptancePolicy";

describe("TimelineDawVerbalAcceptancePolicy", () => {
  it("starts with all five musical levels untested and protected", () => {
    expect(createTimelineDawVerbalAcceptance()).toMatchObject({ status: "incomplete", musicianAccepted: false, executionAllowed: false, sourceMutationAllowed: false, persistenceAllowed: false, results: { length: 5 } });
  });

  it("requires a listening note for every pass or revision request", () => {
    const acceptance = createTimelineDawVerbalAcceptance();
    expect(() => recordTimelineDawVerbalAcceptance({ acceptance, levelId: "sections", status: "pass", evidence: "" })).toThrow(/listening note/i);
  });

  it("cannot reach accepted until every level passes", () => {
    let acceptance = createTimelineDawVerbalAcceptance();
    for (const level of TIMELINE_DAW_VERBAL_ACCEPTANCE_LEVELS.slice(0, -1)) acceptance = recordTimelineDawVerbalAcceptance({ acceptance, levelId: level.id, status: "pass", evidence: `${level.label} sounds correct.` });
    expect(acceptance).toMatchObject({ status: "incomplete", musicianAccepted: false });
    acceptance = recordTimelineDawVerbalAcceptance({ acceptance, levelId: "notes", status: "pass", evidence: "Pitch and timing sound correct." });
    expect(acceptance).toMatchObject({ status: "accepted", musicianAccepted: true, executionAllowed: false });
  });

  it("a single needs-revision decision prevents acceptance", () => {
    let acceptance = createTimelineDawVerbalAcceptance();
    acceptance = recordTimelineDawVerbalAcceptance({ acceptance, levelId: "chords", status: "needs-revision", evidence: "Second chord clashes with the melody." });
    expect(acceptance).toMatchObject({ status: "needs-revision", musicianAccepted: false });
  });
});
