import { describe, expect, it } from "vitest";
import { createTimelineDawLifecycleConfirmation } from "../../lib/timeline/TimelineDawLifecycleConfirmationPolicy";

describe("DAW lifecycle confirmation policy", () => {
  it("explains that suspension is reversible and non-destructive", () => {
    const view = createTimelineDawLifecycleConfirmation("suspend", "Morning Mix");
    expect(view.title).toContain("Morning Mix");
    expect(view.message).toContain("resume");
    expect(view.message).toContain("not deleted");
  });

  it("makes permanent closure explicit without claiming audio deletion", () => {
    const view = createTimelineDawLifecycleConfirmation("close", "Morning Mix");
    expect(view.title).toContain("Permanently close");
    expect(view.confirmLabel).toContain("permanently");
    expect(view.message).toContain("not deleted");
  });
});
