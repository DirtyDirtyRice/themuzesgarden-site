import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const docs = readFileSync(new URL("../../app/developer-workspace/docs/page.tsx", import.meta.url), "utf8");
const feedback = readFileSync(new URL("../../app/developer-workspace/beta-feedback/BetaFeedbackForm.tsx", import.meta.url), "utf8");

describe("Developer Workspace coder beta handoff", () => {
  it("documents both real-coder adoption scenarios and existing validation", () => {
    expect(docs).toContain("Coder at the beginning of a project");
    expect(docs).toContain("Coder in the middle of a project");
    expect(docs).toContain("What has already been validated");
    expect(docs).toContain("Beta safety boundaries");
  });

  it("keeps feedback local and exports a privacy-reminded report", () => {
    expect(feedback).toContain("localStorage.setItem");
    expect(feedback).toContain("Download feedback report");
    expect(feedback).toContain("No source code, credentials, environment variables, or absolute paths");
    expect(feedback).not.toContain("fetch(");
  });
});
