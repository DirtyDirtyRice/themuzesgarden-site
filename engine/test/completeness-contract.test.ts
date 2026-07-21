import { describe, expect, it } from "vitest";

import {
  evaluateCompletenessContract,
  type CompletenessContract,
} from "../../lib/developer-workspace/completenessContract";

const contract: CompletenessContract = {
  id: "timeline-runtime-completeness",
  title: "Timeline runtime must be usable before activation",
  description: "Requires the runtime, its configuration, validation path, and public entry point.",
  requireDeclaration: true,
  requireExportedEntryPoint: true,
  rejectUnusedImports: true,
  clauses: [
    {
      id: "runtime-class",
      kind: "declaration",
      subject: "TimelineRuntime",
      declarationKinds: ["class"],
      description: "TimelineRuntime class exists",
    },
    {
      id: "runtime-export",
      kind: "export",
      subject: "TimelineRuntime",
      description: "TimelineRuntime is exported",
    },
    {
      id: "configuration-companion",
      kind: "companion",
      subject: "TimelineRuntime",
      value: "TimelineRuntimeConfiguration",
      description: "Runtime and configuration exist together",
    },
    {
      id: "initialize-method",
      kind: "member",
      subject: "TimelineRuntime",
      value: "initialize",
      declarationKinds: ["method"],
      description: "Runtime provides initialize",
    },
    {
      id: "validator-import",
      kind: "import",
      subject: "validateTimelineRuntime",
      moduleSpecifier: "./validation",
      description: "Runtime imports its validator",
    },
    {
      id: "validator-call",
      kind: "invocation",
      subject: "validateTimelineRuntime",
      description: "Runtime actually invokes its validator",
    },
  ],
};

const completeSource = `
import { validateTimelineRuntime } from "./validation";

export interface TimelineRuntimeConfiguration {
  strict: boolean;
}

export class TimelineRuntime {
  initialize(configuration: TimelineRuntimeConfiguration): void {
    validateTimelineRuntime(configuration);
  }
}
`;

describe("Completeness Contracts", () => {
  it("accepts code only when every declared obligation is present", () => {
    const report = evaluateCompletenessContract(contract, completeSource, "TimelineRuntime.ts");

    expect(report.complete).toBe(true);
    expect(report.score).toBe(100);
    expect(report.satisfiedClauses).toBe(contract.clauses.length);
    expect(report.findings).toEqual([]);
  });

  it("holds syntactically valid code when required companion pieces are missing", () => {
    const report = evaluateCompletenessContract(
      contract,
      `
import { validateTimelineRuntime } from "./validation";
export class TimelineRuntime {}
`,
      "TimelineRuntime.ts"
    );

    expect(report.complete).toBe(false);
    expect(report.score).toBeLessThan(100);
    expect(report.evidence.find((item) => item.clauseId === "configuration-companion")?.satisfied).toBe(false);
    expect(report.evidence.find((item) => item.clauseId === "initialize-method")?.satisfied).toBe(false);
    expect(report.evidence.find((item) => item.clauseId === "validator-call")?.satisfied).toBe(false);
  });

  it("holds an imported dependency that is never used", () => {
    const report = evaluateCompletenessContract(
      contract,
      completeSource.replace("    validateTimelineRuntime(configuration);", "    void configuration;"),
      "TimelineRuntime.ts"
    );

    expect(report.complete).toBe(false);
    expect(report.findings.some((item) => item.code === "COMPLETENESS_UNUSED_IMPORT")).toBe(true);
    expect(report.evidence.find((item) => item.clauseId === "validator-call")?.satisfied).toBe(false);
  });

  it("holds private code when the contract requires a public entry point", () => {
    const report = evaluateCompletenessContract(
      contract,
      completeSource.replace("export class TimelineRuntime", "class TimelineRuntime"),
      "TimelineRuntime.ts"
    );

    expect(report.complete).toBe(false);
    expect(report.evidence.find((item) => item.clauseId === "runtime-export")?.satisfied).toBe(false);
  });

  it("rejects ambiguous contracts with duplicate clause identities", () => {
    expect(() => evaluateCompletenessContract(
      { ...contract, clauses: [...contract.clauses, { ...contract.clauses[0] }] },
      completeSource,
      "TimelineRuntime.ts"
    )).toThrow("duplicated");
  });
});
