import { createHash } from "node:crypto";
import { TimelineAudioDecodeEngine } from "./TimelineAudioDecodeEngine";
import type { TimelineDawRenderSourceStore } from "./TimelineDawRenderSourceStore";
import type { TimelineOfflineRenderJob } from "./TimelineOfflineRenderAndExportEngine";
import type { TimelineUserId } from "./TimelineTypes";

export class TimelineDawRenderSourceMixer {
  constructor(private readonly sourceStore: TimelineDawRenderSourceStore) {}

  async resolve(job: TimelineOfflineRenderJob, ownerId: TimelineUserId): Promise<Float32Array[]> {
    if (job.format !== "wav") throw new Error("Live PCM execution currently supports WAV jobs only.");
    if (!job.sourceIds.length) throw new Error("Render job has no source artifacts.");
    const decoded = [];
    for (const sourceId of job.sourceIds) {
      const bytes = await this.sourceStore.load(ownerId, sourceId);
      const checksum = `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
      const result = new TimelineAudioDecodeEngine().decode({
        sourceArtifactId: sourceId,
        sourceFingerprint: checksum,
        bytes,
        fileName: "source.wav",
        decodedBy: ownerId,
      });
      if (!result.accepted || !result.audio) {
        throw new Error(result.issues[0]?.message ?? "Render source could not be decoded.");
      }
      if (result.audio.sampleRate !== job.sampleRate) {
        throw new Error(`Render source sample rate ${result.audio.sampleRate} does not match job rate ${job.sampleRate}.`);
      }
      if (result.audio.channelCount !== job.channels) {
        throw new Error(`Render source channel count ${result.audio.channelCount} does not match job channels ${job.channels}.`);
      }
      if (result.audio.frameCount < job.endSample) {
        throw new Error("Render source is shorter than the requested render range.");
      }
      decoded.push(result.audio);
    }
    const channels = Array.from(
      { length: job.channels },
      () => new Float32Array(job.totalFrames),
    );
    for (const audio of decoded) {
      for (let channel = 0; channel < job.channels; channel += 1) {
        for (let frame = 0; frame < job.totalFrames; frame += 1) {
          channels[channel][frame] += audio.channels[channel][job.startSample + frame] / decoded.length;
        }
      }
    }
    return channels;
  }
}
