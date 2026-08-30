import { describe, expect, it } from "vitest";
import { appendTimelineDawVerbalDraftRevision, createTimelineDawVerbalAbComparison, createTimelineDawVerbalRevisionHistory, decideTimelineDawVerbalEditPlan, editTimelineDawVerbalDraftRevision, parseTimelineDawVerbalEditRequest } from "../../lib/timeline/TimelineDawVerbalEditRequestPolicy";

const request = parseTimelineDawVerbalEditRequest({ instruction: "Repeat the guitar riff after the chorus.", scope: "phrase", preserveSources: true });
const approved = decideTimelineDawVerbalEditPlan({ decision: "approved" });

describe("TimelineDawVerbal A/B and editable history", () => {
  it("edits protected draft metadata without changing the immutable original", () => {
    const history = createTimelineDawVerbalRevisionHistory({ request, decision: approved });
    const edited = editTimelineDawVerbalDraftRevision(history, { revisionId: history.revisions[1].id, label: "Guitar repeat v1", note: "Try a shorter tail." });
    expect(edited.revisions[1]).toMatchObject({ label: "Guitar repeat v1", note: "Try a shorter tail.", sourceMutable: false });
    expect(edited.revisions[0]).toEqual(history.revisions[0]);
    expect(() => editTimelineDawVerbalDraftRevision(history, { revisionId: history.revisions[0].id, label: "Changed original", note: "No" })).toThrow(/locked/i);
  });

  it("appends an editable child draft with a recoverable parent", () => {
    const history = createTimelineDawVerbalRevisionHistory({ request, decision: approved });
    const next = appendTimelineDawVerbalDraftRevision(history, { label: "Guitar repeat v2", instruction: "Shorten the repeated riff by one beat.", note: "Musician revision." });
    expect(next.revisions).toHaveLength(3);
    expect(next.revisions[2]).toMatchObject({ parentRevisionId: history.revisions[1].id, kind: "protected-draft", sourceMutable: false });
    expect(next.activeIndex).toBe(2);
  });

  it("pairs immutable A with a selected protected B and never unlocks execution", () => {
    const history = createTimelineDawVerbalRevisionHistory({ request, decision: approved });
    expect(createTimelineDawVerbalAbComparison(history, { draftRevisionId: history.revisions[1].id, activeSide: "B" })).toMatchObject({ activeSide: "B", a: { kind: "immutable-source" }, b: { kind: "protected-draft" }, sourceMutable: false, executionAllowed: false });
  });
});
