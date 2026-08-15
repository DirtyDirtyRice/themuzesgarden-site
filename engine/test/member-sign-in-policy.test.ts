import { describe, expect, it } from "vitest";
import { memberSignInDestination } from "../../lib/auth/memberSignInPolicy";

describe("member sign-in destination", () => {
  it("returns protected project sign-ins to Projects", () => {
    expect(memberSignInDestination("?next=%2Fworkspace%2Fprojects")).toBe(
      "/workspace/projects",
    );
  });

  it("defaults direct member sign-ins to the workspace", () => {
    expect(memberSignInDestination("")).toBe("/workspace");
  });

  it("rejects external and invented redirects", () => {
    expect(memberSignInDestination("?next=https://example.com")).toBe(
      "/workspace",
    );
    expect(memberSignInDestination("?next=/admin")).toBe("/workspace");
  });
});
