import { describe, expect, it } from "vitest";
import {
  memberSignInDestination,
  memberSignInErrorMessage,
} from "../../lib/auth/memberSignInPolicy";

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

  it("turns invalid credentials into a recoverable owner/public choice", () => {
    expect(memberSignInErrorMessage("Invalid login credentials")).toContain(
      "existing owner account",
    );
    expect(memberSignInErrorMessage("Invalid login credentials")).toContain(
      "public Library",
    );
    expect(memberSignInErrorMessage("Network unavailable")).toBe(
      "Network unavailable",
    );
  });
});
