import { describe, expect, it } from "vitest";
import {
  memberSignInDestination,
  memberSignInErrorMessage,
  memberNewPasswordError,
  memberRecoveryEmailError,
  memberRecoveryRedirect,
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

  it("validates recovery email and keeps the redirect on the current origin", () => {
    expect(memberRecoveryEmailError("")).toContain("owner account");
    expect(memberRecoveryEmailError("owner@example.com")).toBeNull();
    expect(memberRecoveryRedirect("https://www.themuzesgarden.com")).toBe(
      "https://www.themuzesgarden.com/members/reset-password",
    );
    expect(memberRecoveryRedirect("http://localhost:3000")).toBe(
      "http://localhost:3000/members/reset-password",
    );
  });

  it("requires a matching eight-character replacement password", () => {
    expect(memberNewPasswordError("short", "short")).toContain("8 characters");
    expect(memberNewPasswordError("new-password", "different-password")).toContain("do not match");
    expect(memberNewPasswordError("new-password", "new-password")).toBeNull();
  });
});
