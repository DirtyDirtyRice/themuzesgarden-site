import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("timeline DAW owner test schema", () => {
  it("allows every guided test step, including leave and return", () => {
    const migration = readFileSync(
      resolve("supabase/migrations/20260903173500_allow_timeline_daw_owner_return_step.sql"),
      "utf8",
    );

    expect(migration).toContain("'recover','return','export'");
    expect(migration).toContain("timeline_daw_owner_test_observations_step_check");
  });
});
