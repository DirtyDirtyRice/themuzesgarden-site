import { describe, expect, it } from "vitest";
import {
  applyTimelineDawPreferredTakeDeletion,
  timelineDawPreferredTakeReplacementWarning,
} from "../../lib/timeline/TimelineDawPreferredTakeDeletion";

const takes = [
  { id: "preferred", preferred: true, name: "Best take" },
  { id: "newest", preferred: false, name: "Newest remaining" },
  { id: "older", preferred: false, name: "Older remaining" },
];

describe("TimelineDawPreferredTakeDeletion", () => {
  it("uses the server-selected replacement after deleting the preferred take", () => {
    expect(applyTimelineDawPreferredTakeDeletion({
      takes,
      deletedTakeId: "preferred",
      deletedTakeWasPreferred: true,
      replacementPreferredTakeId: "newest",
    })).toEqual([
      { id: "newest", preferred: true, name: "Newest remaining" },
      { id: "older", preferred: false, name: "Older remaining" },
    ]);
  });

  it("does not disturb the preferred choice when deleting another take", () => {
    expect(applyTimelineDawPreferredTakeDeletion({
      takes,
      deletedTakeId: "older",
      deletedTakeWasPreferred: false,
      replacementPreferredTakeId: null,
    })).toEqual(takes.slice(0, 2));
  });

  it("supports deleting the only take without inventing a replacement", () => {
    expect(applyTimelineDawPreferredTakeDeletion({
      takes: [takes[0]],
      deletedTakeId: "preferred",
      deletedTakeWasPreferred: true,
      replacementPreferredTakeId: null,
    })).toEqual([]);
  });

  it("gives a direct recovery action if automatic replacement fails", () => {
    expect(timelineDawPreferredTakeReplacementWarning()).toMatch(/choose Use as Preferred/i);
  });
});
