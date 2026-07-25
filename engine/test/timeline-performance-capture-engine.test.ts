import { describe, expect, it } from "vitest";

import { TimelinePerformanceCaptureEngine } from "../../lib/timeline/TimelinePerformanceCaptureEngine";

function create(engine = new TimelinePerformanceCaptureEngine()) {
  const capture = engine.createCapture({
    projectId: "song-1",
    name: "Studio performance",
    location: "Garden Studio A",
    performers: [
      { userId: "artist-1", displayName: "Frankie", role: "Guitar and vocal" },
    ],
    sources: [
      {
        name: "Vocal microphone",
        kind: "audio",
        sampleRate: 48_000,
        channelCount: 1,
        syncOffsetMs: 0,
      },
      {
        name: "Front camera",
        kind: "video",
        frameRate: 30,
        syncOffsetMs: 12,
      },
    ],
    takes: [
      {
        name: "Take one",
        performerIndexes: [0],
        durationMs: 180_000,
        assets: [
          {
            sourceIndex: 0,
            assetId: "audio-1",
            checksum: "sha256-audio-1",
            durationMs: 180_000,
          },
          {
            sourceIndex: 1,
            assetId: "video-1",
            checksum: "sha256-video-1",
            durationMs: 180_012,
          },
        ],
      },
      {
        name: "Take two",
        performerIndexes: [0],
        durationMs: 181_000,
        assets: [
          {
            sourceIndex: 0,
            assetId: "audio-2",
            checksum: "sha256-audio-2",
            durationMs: 181_000,
          },
          {
            sourceIndex: 1,
            assetId: "video-2",
            checksum: "sha256-video-2",
            durationMs: 181_010,
          },
        ],
      },
    ],
    selectedTakeIndex: 0,
    markers: [
      { takeIndex: 0, positionMs: 42_000, kind: "highlight", label: "Strong chorus" },
    ],
    createdBy: "engineer-1",
  });
  return { engine, capture };
}

describe("TimelinePerformanceCaptureEngine", () => {
  it("holds takes with missing synchronized sources", () => {
    const engine = new TimelinePerformanceCaptureEngine();
    expect(() =>
      engine.createCapture({
        projectId: "song-1",
        name: "Incomplete",
        location: "Studio",
        performers: [{ userId: "artist-1", displayName: "Artist", role: "Singer" }],
        sources: [
          { name: "Mic", kind: "audio", sampleRate: 48_000, channelCount: 1, syncOffsetMs: 0 },
          { name: "Camera", kind: "video", frameRate: 30, syncOffsetMs: 0 },
        ],
        takes: [
          {
            name: "Take one",
            performerIndexes: [0],
            durationMs: 10_000,
            assets: [
              { sourceIndex: 0, assetId: "audio-1", checksum: "hash", durationMs: 10_000 },
            ],
          },
        ],
        selectedTakeIndex: 0,
        createdBy: "engineer-1",
      }),
    ).toThrow("all declared capture sources");
  });

  it("creates non-destructive review revisions over immutable raw assets", () => {
    const { engine, capture } = create();
    const revised = engine.revise({
      captureId: capture.id,
      selectedTakeId: capture.takes[1].id,
      markers: [
        {
          takeId: capture.takes[1].id,
          positionMs: 80_000,
          kind: "highlight",
          label: "Preferred bridge",
        },
      ],
      createdBy: "engineer-1",
    });
    expect(revised.parentCaptureId).toBe(capture.id);
    expect(revised.selectedTakeId).toBe(capture.takes[1].id);
    expect(revised.takes).toEqual(capture.takes);
    expect(engine.getCapture(capture.id)?.selectedTakeId).toBe(capture.takes[0].id);
  });

  it("requires independent approval", () => {
    const { engine, capture } = create();
    engine.submitForApproval({ captureId: capture.id, submittedBy: "engineer-1" });
    expect(() =>
      engine.approve({ captureId: capture.id, approvedBy: "engineer-1" }),
    ).toThrow("independent");
    expect(engine.approve({ captureId: capture.id, approvedBy: "producer-1" }).status).toBe(
      "approved",
    );
  });

  it("keeps exactly one active capture per project", () => {
    const { engine, capture } = create();
    engine.submitForApproval({ captureId: capture.id, submittedBy: "engineer-1" });
    engine.approve({ captureId: capture.id, approvedBy: "producer-1" });
    engine.activate({ captureId: capture.id, activatedBy: "producer-1" });
    const revised = engine.revise({
      captureId: capture.id,
      selectedTakeId: capture.takes[1].id,
      createdBy: "engineer-1",
    });
    engine.submitForApproval({ captureId: revised.id, submittedBy: "engineer-1" });
    engine.approve({ captureId: revised.id, approvedBy: "producer-1" });
    engine.activate({ captureId: revised.id, activatedBy: "producer-1" });
    expect(engine.activeCapture("song-1")?.id).toBe(revised.id);
    expect(engine.getCapture(capture.id)?.status).toBe("archived");
  });

  it("restores fingerprinted captures and continues stable identities", () => {
    const { engine, capture } = create();
    const restored = new TimelinePerformanceCaptureEngine();
    restored.restoreArchive(engine.exportArchive());
    expect(restored.getCapture(capture.id)?.fingerprint).toBe(capture.fingerprint);
    expect(restored.listReceipts("song-1")[0].id).toBe("timeline-capture-receipt-1");
    const next = create(restored).capture;
    expect(next.id).toBe("timeline-performance-capture-2");
    expect(next.takes[0].id).toBe("timeline-performance-take-3");
  });
});
