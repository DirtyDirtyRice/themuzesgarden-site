import { describe, expect, it } from "vitest";
import { withTimelineDawUploadDeadline } from "../../lib/timeline/TimelineDawUploadDeadline";

describe("DAW private upload deadline", () => {
  it("returns a completed upload", async () => {
    await expect(withTimelineDawUploadDeadline(Promise.resolve("done"), 25)).resolves.toBe("done");
  });

  it("releases a stalled upload with retry guidance", async () => {
    await expect(withTimelineDawUploadDeadline(new Promise(() => undefined), 5)).rejects.toThrow(/stopped responding.*retry/i);
  });
});
