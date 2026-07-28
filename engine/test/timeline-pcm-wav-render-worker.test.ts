import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { TimelineAudioDecodeEngine } from "../../lib/timeline/TimelineAudioDecodeEngine";
import {
  TimelineOfflineRenderAndExportEngine,
  type TimelineOfflineRenderJob,
} from "../../lib/timeline/TimelineOfflineRenderAndExportEngine";
import {
  TimelinePcmWavRenderWorker,
  type TimelinePcmWavRenderProgress,
} from "../../lib/timeline/TimelinePcmWavRenderWorker";

function queuedJob(bitDepth: 16 | 24 | 32, channels = 2): TimelineOfflineRenderJob {
  const engine = new TimelineOfflineRenderAndExportEngine();
  let job = engine.createJob({
    projectId: "project-1",
    name: "PCM Mix",
    target: "mix",
    sourceIds: ["master"],
    startSample: 0,
    endSample: 5,
    sampleRate: 48_000,
    bitDepth,
    channels,
    format: "wav",
    createdBy: "owner-1",
  });
  job = engine.validate({ jobId: job.id, expectedHead: job.head, validatedBy: "owner-1" });
  return engine.queue({ jobId: job.id, expectedHead: job.head, queuedBy: "owner-1" });
}

describe("TimelinePcmWavRenderWorker", () => {
  it.each([16, 24, 32] as const)(
    "writes a decodable %i-bit WAV and fingerprints the exact bytes",
    (bitDepth) => {
      const job = queuedJob(bitDepth);
      const progress: TimelinePcmWavRenderProgress[] = [];
      const result = new TimelinePcmWavRenderWorker().render({
        job,
        channels: [
          new Float32Array([-1, -0.5, 0, 0.5, 1]),
          new Float32Array([1, 0.25, 0, -0.25, -1]),
        ],
        workerId: "worker-1",
        chunkFrames: 2,
        onProgress: (event) => progress.push(event),
      });

      const ascii = new TextDecoder("ascii");
      expect(ascii.decode(result.bytes.subarray(0, 4))).toBe("RIFF");
      expect(ascii.decode(result.bytes.subarray(8, 12))).toBe("WAVE");
      expect(new DataView(result.bytes.buffer).getUint32(4, true)).toBe(result.byteLength - 8);
      expect(result).toMatchObject({
        frameCount: 5,
        sampleRate: 48_000,
        channelCount: 2,
        bitDepth,
        mimeType: "audio/wav",
      });
      expect(result.checksum).toBe(
        `sha256:${createHash("sha256").update(result.bytes).digest("hex")}`,
      );
      expect(progress.map((event) => event.renderedFrames)).toEqual([2, 4, 5]);
      expect(progress.at(-1)?.percent).toBe(100);

      const decoded = new TimelineAudioDecodeEngine().decode({
        sourceArtifactId: "render-1",
        sourceFingerprint: result.checksum,
        bytes: result.bytes,
        fileName: "mix.wav",
        decodedBy: "owner-1",
      });
      expect(decoded.accepted).toBe(true);
      expect(decoded.audio).toMatchObject({
        sampleRate: 48_000,
        channelCount: 2,
        frameCount: 5,
      });
      expect(decoded.audio?.channels[0][0]).toBeCloseTo(-1, 4);
      expect(decoded.audio?.channels[0][4]).toBeCloseTo(1, 4);
    },
  );

  it("rejects jobs and sample buffers that cannot produce truthful PCM output", () => {
    const job = queuedJob(24, 1);
    const worker = new TimelinePcmWavRenderWorker();
    expect(() => worker.render({
      job: { ...job, format: "flac" },
      channels: [new Float32Array(5)],
      workerId: "worker-1",
    })).toThrow(/only WAV/i);
    expect(() => worker.render({
      job,
      channels: [new Float32Array([0, 0, Number.NaN, 0, 0])],
      workerId: "worker-1",
    })).toThrow(/finite values/i);
    expect(() => worker.render({
      job,
      channels: [new Float32Array(4)],
      workerId: "worker-1",
    })).toThrow(/exactly the requested frame count/i);
  });
});
