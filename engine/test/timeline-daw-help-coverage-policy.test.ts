import { describe, expect, it } from "vitest";
import { TIMELINE_DAW_HELP_WORKFLOWS, findTimelineDawHelpWorkflow, timelineDawHelpCoverageByArea } from "../../lib/timeline/TimelineDawHelpCoveragePolicy";
import { TIMELINE_DAW_STUDIO_FOCUS_AREAS } from "../../lib/timeline/TimelineDawStudioFocusPolicy";

describe("timeline DAW important-control help coverage", () => {
it("covers every musician Studio area", () => {
  const coveredAreas = new Set(TIMELINE_DAW_HELP_WORKFLOWS.map((workflow) => workflow.area));
  const musicianAreas = TIMELINE_DAW_STUDIO_FOCUS_AREAS.filter((area) => area.musician).map((area) => area.id);
  for (const area of musicianAreas) expect(coveredAreas.has(area), `${area} must have help coverage`).toBe(true);
});

it("gives every important workflow a unique guide and named controls", () => {
  const ids = TIMELINE_DAW_HELP_WORKFLOWS.map((workflow) => workflow.id);
  expect(new Set(ids).size).toBe(ids.length);
  expect(ids).toHaveLength(13);
  for (const workflow of TIMELINE_DAW_HELP_WORKFLOWS) {
    expect(workflow.title.trim().length).toBeGreaterThan(5);
    expect(workflow.guide.trim().length).toBeGreaterThan(5);
    expect(workflow.controls.length, `${workflow.id} must name its important controls`).toBeGreaterThanOrEqual(3);
    expect(new Set(workflow.controls).size).toBe(workflow.controls.length);
    expect(findTimelineDawHelpWorkflow(workflow.id)?.area).toBe(workflow.area);
  }
  expect(findTimelineDawHelpWorkflow("not-real")).toBeNull();
});

it("exposes each distinct workflow inside dense work areas", () => {
  expect(timelineDawHelpCoverageByArea("arrange").map((workflow) => workflow.id)).toEqual(["import", "arrangement", "session-view", "midi"]);
  expect(timelineDawHelpCoverageByArea("mix").map((workflow) => workflow.id)).toEqual(["regions", "riff-comparison", "hybrid-edit", "mixing"]);
});
});
