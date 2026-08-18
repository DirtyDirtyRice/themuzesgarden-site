import { describe, expect, it } from "vitest";
import {
  projectUploadProgressMessage,
  shouldStartProjectUpload,
} from "../../app/shared/uploads/projectUploadHelpers";

describe("one-step project upload flow", () => {
  it("starts as soon as files are selected", () => {
    expect(shouldStartProjectUpload([{} as File], false)).toBe(true);
    expect(shouldStartProjectUpload([], false)).toBe(false);
  });

  it("does not start a second upload while one is running", () => {
    expect(shouldStartProjectUpload([{} as File], true)).toBe(false);
  });

  it("explains that both upload and project linking are happening", () => {
    expect(projectUploadProgressMessage(1)).toBe(
      "Uploading and linking 1 file...",
    );
    expect(projectUploadProgressMessage(3)).toBe(
      "Uploading and linking 3 files...",
    );
  });
});
