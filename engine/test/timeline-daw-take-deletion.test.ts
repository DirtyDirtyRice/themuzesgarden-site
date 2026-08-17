import { describe, expect, it } from "vitest";
import { cleanTimelineDawDeletedTakeState } from "../../lib/timeline/TimelineDawTakeDeletion";

describe("TimelineDawTakeDeletion", () => {
  it("removes only the deleted take's private audition link", () => {
    expect(cleanTimelineDawDeletedTakeState({
      deletedTakeId: "take-1",
      auditionUrls: { "take-1": "private-1", "take-2": "private-2" },
      reviewingTakeId: "take-2",
    })).toEqual({ auditionUrls: { "take-2": "private-2" }, reviewingTakeId: "take-2" });
  });

  it("closes review controls when their take was deleted", () => {
    expect(cleanTimelineDawDeletedTakeState({
      deletedTakeId: "take-1",
      auditionUrls: {},
      reviewingTakeId: "take-1",
    })).toEqual({ auditionUrls: {}, reviewingTakeId: null });
  });
});
