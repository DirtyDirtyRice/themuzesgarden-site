import { describe, expect, it } from "vitest";
import { TIMELINE_SAMPLE_EVENTS, TIMELINE_WORKSPACE } from "../../lib/timeline/TimelineSeed";
import { TimelineVersionEngine } from "../../lib/timeline/TimelineVersionEngine";

function workspace(title: string) {
  return {
    ...TIMELINE_WORKSPACE,
    events: [{ ...TIMELINE_SAMPLE_EVENTS[0], title, relationships: [] }],
  };
}

describe("TimelineVersionEngine", () => {
  it("creates immutable versions and compares exact event changes", () => {
    const engine = new TimelineVersionEngine();
    engine.createBranch("main", "Main", "member");
    const first = engine.createVersion("main", workspace("Start"), "member", "First");
    const second = engine.createVersion("main", workspace("New Start"), "member", "Second");
    const comparison = engine.compare(first.id, second.id);

    expect(comparison.changed).toBe(1);
    expect(comparison.changes[0].fields).toContain("title");
    const restored = engine.restore(first.id);
    restored.events[0].title = "Mutated copy";
    expect(engine.restore(first.id).events[0].title).toBe("Start");
  });

  it("merges non-conflicting branch changes with ancestry", () => {
    const engine = new TimelineVersionEngine();
    engine.createBranch("main", "Main", "member");
    const base = engine.createVersion("main", workspace("Start"), "member", "Base");
    engine.createBranch("idea", "Idea", "member", { fromVersionId: base.id });
    engine.createVersion("idea", workspace("Idea title"), "member", "Idea edit");
    engine.createVersion("main", {
      ...workspace("Start"),
      events: [{ ...workspace("Start").events[0], favorite: true }],
    }, "member", "Favorite");

    const plan = engine.planMerge("idea", "main");
    expect(plan.canMerge).toBe(true);
    expect(plan.mergedWorkspace.events[0].title).toBe("Idea title");
    expect(plan.mergedWorkspace.events[0].favorite).toBe(true);
  });

  it("blocks merge completion when both branches change the same field", () => {
    const engine = new TimelineVersionEngine();
    engine.createBranch("main", "Main", "member");
    const base = engine.createVersion("main", workspace("Start"), "member", "Base");
    engine.createBranch("idea", "Idea", "member", { fromVersionId: base.id });
    engine.createVersion("idea", workspace("Idea"), "member", "Idea");
    engine.createVersion("main", workspace("Main"), "member", "Main");

    const plan = engine.planMerge("idea", "main");
    expect(plan.canMerge).toBe(false);
    expect(plan.conflicts.some((conflict) => conflict.field === "title")).toBe(true);
    expect(() => engine.completeMerge(plan, "member", "Merge")).toThrow();
  });
});
