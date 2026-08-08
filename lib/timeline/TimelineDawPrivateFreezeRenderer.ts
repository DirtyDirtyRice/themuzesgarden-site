import type { TimelineDecodedAudioBuffer } from "./TimelineAudioDecodeEngine";
import type { TimelineDawPrivateInsert } from "./TimelineDawPrivateBusProcessingPolicy";

export type TimelineDawPrivateFreezeLaneInput = {
  id: string; audio: TimelineDecodedAudioBuffer; timelineStartSeconds: number; sourceInSeconds: number; sourceOutSeconds: number;
  gain: number; pan: number; inserts: TimelineDawPrivateInsert[];
};

function process(channels: Float32Array[], sampleRate: number, inserts: TimelineDawPrivateInsert[]): void {
  for (const insert of [...inserts].filter((item) => !item.bypassed).sort((a, b) => a.slot - b.slot)) {
    if (insert.effect === "gain") { const gain = insert.parameters.gain ?? 1; for (const channel of channels) for (let i = 0; i < channel.length; i += 1) channel[i] = Math.max(-1, Math.min(1, channel[i] * gain)); }
    if (insert.effect === "filter") { const cutoff = insert.parameters.frequency ?? 12000; const alpha = 1 - Math.exp(-2 * Math.PI * cutoff / sampleRate); for (const channel of channels) { let previous = 0; for (let i = 0; i < channel.length; i += 1) { previous += alpha * (channel[i] - previous); channel[i] = previous; } } }
    if (insert.effect === "compressor") { const threshold = 10 ** ((insert.parameters.threshold ?? -24) / 20); const ratio = insert.parameters.ratio ?? 4; for (const channel of channels) for (let i = 0; i < channel.length; i += 1) { const sample = channel[i], magnitude = Math.abs(sample); if (magnitude > threshold) channel[i] = Math.sign(sample) * (threshold + (magnitude - threshold) / ratio); } }
  }
}

export class TimelineDawPrivateFreezeRenderer {
  render(lanes: TimelineDawPrivateFreezeLaneInput[], outputInserts: TimelineDawPrivateInsert[] = []): { channels: Float32Array[]; sampleRate: number; frameCount: number } {
    if (!lanes.length) throw new Error("A private freeze requires at least one audible lane.");
    const sampleRate = lanes[0].audio.sampleRate;
    if (lanes.some((lane) => lane.audio.sampleRate !== sampleRate)) throw new Error("Private freeze lanes must use one sample rate.");
    const frameCount = Math.max(...lanes.map((lane) => Math.round((lane.timelineStartSeconds + lane.sourceOutSeconds - lane.sourceInSeconds) * sampleRate)));
    if (frameCount <= 0) throw new Error("Private freeze duration must contain audio frames.");
    const output = [new Float32Array(frameCount), new Float32Array(frameCount)];
    for (const lane of lanes) {
      const start = Math.round(lane.timelineStartSeconds * sampleRate), sourceStart = Math.round(lane.sourceInSeconds * sampleRate), count = Math.round((lane.sourceOutSeconds - lane.sourceInSeconds) * sampleRate);
      const local = [new Float32Array(count), new Float32Array(count)];
      for (let frame = 0; frame < count; frame += 1) { const left = lane.audio.channels[0]?.[sourceStart + frame] ?? 0; const right = lane.audio.channels[Math.min(1, lane.audio.channelCount - 1)]?.[sourceStart + frame] ?? left; local[0][frame] = left; local[1][frame] = right; }
      process(local, sampleRate, lane.inserts); const leftGain = lane.gain * Math.cos((lane.pan + 1) * Math.PI / 4), rightGain = lane.gain * Math.sin((lane.pan + 1) * Math.PI / 4);
      for (let frame = 0; frame < count; frame += 1) { output[0][start + frame] += local[0][frame] * leftGain; output[1][start + frame] += local[1][frame] * rightGain; }
    }
    process(output, sampleRate, outputInserts); for (const channel of output) for (let frame = 0; frame < frameCount; frame += 1) channel[frame] = Math.max(-1, Math.min(1, channel[frame]));
    return { channels: output, sampleRate, frameCount };
  }
}
