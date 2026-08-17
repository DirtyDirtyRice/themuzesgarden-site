import { describe, expect, it } from "vitest";
import { decideTimelineDawAuditionRecovery } from "../../lib/timeline/TimelineDawAuditionRecovery";

describe("TimelineDawAuditionRecovery", () => {
  it("allows one automatic private-link refresh", () => {
    expect(decideTimelineDawAuditionRecovery({ automaticRefreshAttempts: 0, online: true }))
      .toMatchObject({ refresh: true, guidance: expect.stringMatching(/refreshing it once/i) });
  });

  it("stops automatic retry loops after one refresh", () => {
    expect(decideTimelineDawAuditionRecovery({ automaticRefreshAttempts: 1, online: true }))
      .toMatchObject({ refresh: false, guidance: expect.stringMatching(/still failed/i) });
  });

  it("waits for a connection instead of retrying while offline", () => {
    expect(decideTimelineDawAuditionRecovery({ automaticRefreshAttempts: 0, online: false }))
      .toMatchObject({ refresh: false, guidance: expect.stringMatching(/offline/i) });
  });
});
