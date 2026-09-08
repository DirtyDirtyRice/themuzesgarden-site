import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const docs = readFileSync(new URL("../../app/developer-workspace/docs/page.tsx", import.meta.url), "utf8");
const feedback = readFileSync(new URL("../../app/developer-workspace/beta-feedback/BetaFeedbackForm.tsx", import.meta.url), "utf8");
const requestContext = readFileSync(new URL("../../lib/developer-workspace/workspaceRequestContext.ts", import.meta.url), "utf8");
const packager = readFileSync(new URL("../../scripts/package-developer-workspace.mjs", import.meta.url), "utf8");
const nextConfig = readFileSync(new URL("../../next.config.ts", import.meta.url), "utf8");
const layout = readFileSync(new URL("../../app/developer-workspace/layout.tsx", import.meta.url), "utf8");
const workspace = readFileSync(new URL("../../app/tools/developer-workspace/DeveloperWorkspace.tsx", import.meta.url), "utf8");
const buildDiagnostics = readFileSync(new URL("../../lib/developer-workspace/buildDiagnostics.ts", import.meta.url), "utf8");
const supportDownload = readFileSync(new URL("../../app/developer-workspace/SupportReportDownloadButton.tsx", import.meta.url), "utf8");
const liveTimeline = readFileSync(new URL("../../app/tools/developer-workspace/LiveEventTimeline.tsx", import.meta.url), "utf8");
const windowsRelease = readFileSync(new URL("../../.github/workflows/developer-workspace-beta-release.yml", import.meta.url), "utf8");

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

  it("packages a loopback-only Windows runtime that opens Chrome", () => {
    expect(requestContext).toContain('DEVELOPER_WORKSPACE_LOCAL_RUNTIME === "1"');
    expect(requestContext).toContain('hostname === "127.0.0.1"');
    expect(packager).toContain('"runtime", "node.exe"');
    expect(packager).toContain("dereference: true");
    expect(packager).not.toContain('cp(standalone, output');
    expect(packager).not.toContain('path.join(root, "public")');
    expect(packager).toContain('Google", "Chrome"');
    expect(packager).toContain("Start Developer Workspace.cmd");
    expect(packager).not.toContain("msedge");
    expect(nextConfig).toContain("outputFileTracingExcludes");
    expect(nextConfig).toContain('"./code-map-reports/**/*"');
  });

  it("keeps standalone navigation visible and usable from every workspace page", () => {
    expect(layout).toContain('href={`/developer-workspace${href}`}');
    expect(workspace).toContain('id="build-errors" className="scroll-mt-56"');
    expect(workspace).toContain('id="event-timeline" className="scroll-mt-56"');
  });

  it("downloads support reports explicitly and can use runtime-bundled TypeScript", () => {
    expect(supportDownload).toContain('URL.createObjectURL');
    expect(supportDownload).toContain('anchor.download = filename');
    expect(buildDiagnostics).toContain('path.join(process.cwd(), "node_modules", "typescript", "bin", "tsc")');
    expect(liveTimeline).toContain("Open source");
    expect(liveTimeline).toContain("Opening the event's exact source");
  });

  it("publishes the Windows beta only after packaged smoke tests pass", () => {
    expect(windowsRelease).toContain("runs-on: windows-latest");
    expect(windowsRelease).toContain("Smoke-test packaged application");
    expect(windowsRelease).toContain('if ($check.status -ne "passed")');
    expect(windowsRelease).toContain("gh release create $env:RELEASE_TAG");
  });
});
