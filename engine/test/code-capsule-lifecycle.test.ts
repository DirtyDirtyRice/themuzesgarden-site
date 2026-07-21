import { describe, expect, it } from "vitest";

import {
  appendCodeCapsuleFragment,
  assembledCodeCapsuleText,
  createCodeCapsule,
  transitionCodeCapsule,
} from "../../lib/developer-workspace/codeCapsule";

function capsule() {
  return createCodeCapsule(
    {
      title: "Timeline runtime type",
      description: "Assemble an inactive type before activation.",
      target: {
        file: "lib/timeline/TimelineTypes.ts",
        startLine: 1,
        endLine: 1,
        expectedLines: ["export {};"],
      },
      requirements: [
        { id: "type", kind: "symbol", value: "TimelineRuntime", description: "Type must exist." },
      ],
    },
    "2026-07-20T01:00:00.000Z",
    "capsule-1"
  );
}

describe("code capsule lifecycle", () => {
  it("keeps timestamped fragments inactive and assembles them deterministically", () => {
    const draft = capsule();
    const first = appendCodeCapsuleFragment(
      draft,
      "export type TimelineRuntime = {",
      "type opening",
      "2026-07-20T01:01:00.000Z",
      "fragment-1"
    );
    const complete = appendCodeCapsuleFragment(
      first,
      "  ready: boolean;\n};",
      "required member and closing brace",
      "2026-07-20T01:02:00.000Z",
      "fragment-2"
    );

    expect(draft.state).toBe("draft");
    expect(first.state).toBe("incomplete");
    expect(complete.fragments.map((fragment) => fragment.createdAt)).toEqual([
      "2026-07-20T01:01:00.000Z",
      "2026-07-20T01:02:00.000Z",
    ]);
    expect(assembledCodeCapsuleText(complete)).toBe(
      "export type TimelineRuntime = {\n  ready: boolean;\n};"
    );
  });

  it("enforces the validation and activation sequence", () => {
    const incomplete = appendCodeCapsuleFragment(capsule(), "export type Ready = true;", "");
    const waiting = transitionCodeCapsule(
      incomplete,
      "waiting-validation",
      "All declared requirements are present.",
      "validator"
    );
    const validated = transitionCodeCapsule(
      waiting,
      "validated",
      "Virtual project validation passed.",
      "validator"
    );
    const active = transitionCodeCapsule(
      validated,
      "active",
      "Developer confirmed activation after validation.",
      "activator"
    );

    expect(active.state).toBe("active");
    expect(active.transitions.map((transition) => transition.to)).toEqual([
      "draft",
      "incomplete",
      "waiting-validation",
      "validated",
      "active",
    ]);
    expect(() => appendCodeCapsuleFragment(active, "type Late = never;", "")).toThrow(
      "Fragments cannot be added"
    );
  });

  it("rejects shortcuts that could activate incomplete code", () => {
    expect(() => transitionCodeCapsule(capsule(), "active", "skip checks", "activator")).toThrow(
      "cannot transition from draft to active"
    );
  });
});
