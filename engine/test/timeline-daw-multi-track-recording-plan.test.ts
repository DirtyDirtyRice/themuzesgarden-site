import { describe, expect, it } from "vitest";
import {
  assessTimelineDawMultiTrackRecordingPlan,
  createTimelineDawArmedInputRoute,
} from "../../lib/timeline/TimelineDawMultiTrackRecordingPlan";

describe("multi-track recording plan", () => {
  const vocal = createTimelineDawArmedInputRoute({ id: "route-1", trackName: " Lead Vocal ", inputId: "mic-1", inputLabel: " Studio Mic " });
  const guitar = createTimelineDawArmedInputRoute({ id: "route-2", trackName: "Guitar", inputId: "line-2", inputLabel: "Interface 2" });

  it("prepares distinct connected inputs for simultaneous recording", () => {
    expect(assessTimelineDawMultiTrackRecordingPlan({ routes: [vocal, guitar], availableInputIds: ["mic-1", "line-2"] })).toMatchObject({ ready: true, errors: [] });
    expect(vocal).toMatchObject({ trackName: "Lead Vocal", inputLabel: "Studio Mic" });
  });

  it("blocks duplicate input routes and track names", () => {
    const duplicate = { ...guitar, trackName: "lead vocal", inputId: "mic-1", inputLabel: "Studio Mic" };
    const result = assessTimelineDawMultiTrackRecordingPlan({ routes: [vocal, duplicate], availableInputIds: ["mic-1"] });
    expect(result.ready).toBe(false);
    expect(result.errors).toEqual(expect.arrayContaining([
      "Track name “lead vocal” is armed more than once.",
      "Studio Mic is already routed to another armed track.",
    ]));
  });

  it("holds routes when an input disconnects or the safe limit is exceeded", () => {
    const result = assessTimelineDawMultiTrackRecordingPlan({ routes: [vocal, guitar], availableInputIds: ["mic-1"], maximumRoutes: 1 });
    expect(result.ready).toBe(false);
    expect(result.errors).toEqual(expect.arrayContaining([
      "A maximum of 1 recording tracks can be armed at once.",
      "Interface 2 is no longer connected.",
    ]));
  });
});
