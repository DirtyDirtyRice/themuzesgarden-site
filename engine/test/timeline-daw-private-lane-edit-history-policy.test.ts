import { describe, expect, it } from "vitest";
import { createTimelineDawPrivateLaneEditReceipt } from "../../lib/timeline/TimelineDawPrivateLaneEditHistoryPolicy";

describe("private lane edit history policy", () => {
  it("labels operations and deterministically orders snapshots", () => {
    expect(createTimelineDawPrivateLaneEditReceipt({ operation: "split", beforeRows: [{ id: "b" }], afterRows: [{ id: "c" }, { id: "b" }] }))
      .toEqual({ operation: "split", label: "Split region", beforeRows: [{ id: "b" }], afterRows: [{ id: "b" }, { id: "c" }] });
  });

  it("rejects unsupported, empty, and unchanged receipts", () => {
    expect(() => createTimelineDawPrivateLaneEditReceipt({ operation: "mix", beforeRows: [{ id: "a" }], afterRows: [{ id: "b" }] })).toThrow(/operation/);
    expect(() => createTimelineDawPrivateLaneEditReceipt({ operation: "fade", beforeRows: [], afterRows: [] })).toThrow(/changed rows/);
    expect(() => createTimelineDawPrivateLaneEditReceipt({ operation: "arrange", beforeRows: [{ id: "a" }], afterRows: [{ id: "a" }] })).toThrow(/change lane state/);
  });
});
