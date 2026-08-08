import type { TimelineDawPrivateLaneMix } from "./TimelineDawPrivateLaneMixerPolicy";
import { timelineDawEqualPowerEnvelope } from "./TimelineDawPrivateLaneFadePolicy";
import type { TimelineDawPrivateInsert, TimelineDawPrivateSend } from "./TimelineDawPrivateBusProcessingPolicy";

export type TimelineDawPrivateLaneMeter = {
  peakAmplitude: number;
  peakDbfs: number;
  clipped: boolean;
};

export class TimelineDawPrivateLaneMonitorGraph {
  private readonly source: MediaElementAudioSourceNode;
  private readonly insertGain: GainNode;
  private readonly filter: BiquadFilterNode;
  private readonly compressor: DynamicsCompressorNode;
  private readonly gain: GainNode;
  private readonly panner: StereoPannerNode;
  private readonly analyser: AnalyserNode;
  private readonly samples: Float32Array<ArrayBuffer>;
  private readonly sends = new Map<string, GainNode>();

  constructor(private readonly context: AudioContext, element: HTMLMediaElement, output: AudioNode = context.destination) {
    this.source = context.createMediaElementSource(element);
    this.insertGain = context.createGain();
    this.filter = context.createBiquadFilter();
    this.compressor = context.createDynamicsCompressor();
    this.gain = context.createGain();
    this.panner = context.createStereoPanner();
    this.analyser = context.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.55;
    this.samples = new Float32Array(this.analyser.fftSize);
    this.filter.type = "lowpass"; this.filter.frequency.value = 20000; this.compressor.threshold.value = 0; this.compressor.ratio.value = 1;
    this.source.connect(this.insertGain).connect(this.filter).connect(this.compressor).connect(this.gain).connect(this.panner).connect(this.analyser).connect(output);
  }

  applyProcessing(inserts: TimelineDawPrivateInsert[], sends: Array<TimelineDawPrivateSend & { output: AudioNode }>): void {
    const active = (effect: TimelineDawPrivateInsert["effect"]) => inserts.find((item) => item.effect === effect && !item.bypassed);
    const gain = active("gain"), filter = active("filter"), compressor = active("compressor"), at = this.context.currentTime;
    this.insertGain.gain.setTargetAtTime(gain?.parameters.gain ?? 1, at, 0.008); this.filter.frequency.setTargetAtTime(filter?.parameters.frequency ?? 20000, at, 0.008); this.filter.Q.setTargetAtTime(filter?.parameters.q ?? 0.0001, at, 0.008); this.compressor.threshold.setTargetAtTime(compressor?.parameters.threshold ?? 0, at, 0.008); this.compressor.ratio.setTargetAtTime(compressor?.parameters.ratio ?? 1, at, 0.008);
    this.sends.forEach((node) => node.disconnect()); this.sends.clear(); for (const send of sends) { const node = this.context.createGain(); node.gain.value = send.muted ? 0 : send.level; (send.preFader ? this.source : this.analyser).connect(node).connect(send.output); this.sends.set(send.id, node); }
  }
  apply(mix: TimelineDawPrivateLaneMix, audible: boolean): void {
    const at = this.context.currentTime;
    this.gain.gain.setTargetAtTime(audible ? mix.gain : 0, at, 0.008);
    this.panner.pan.setTargetAtTime(mix.pan, at, 0.008);
  }

  applyEnvelope(
    mix: TimelineDawPrivateLaneMix,
    audible: boolean,
    localSeconds: number,
    durationSeconds: number,
    fadeInSeconds: number,
    fadeOutSeconds: number,
  ): void {
    const at = this.context.currentTime;
    this.panner.pan.setTargetAtTime(mix.pan, at, 0.008);
    this.gain.gain.cancelScheduledValues(at);
    if (!audible || localSeconds < 0 || localSeconds >= durationSeconds) {
      this.gain.gain.setTargetAtTime(0, at, 0.008);
      return;
    }
    const parameter = this.gain.gain;
    parameter.setValueAtTime(mix.gain * timelineDawEqualPowerEnvelope(localSeconds, durationSeconds, fadeInSeconds, fadeOutSeconds), at);
    if (fadeInSeconds > 0 && localSeconds < fadeInSeconds) {
      const remainingFadeIn = fadeInSeconds - localSeconds;
      const curve = new Float32Array(128);
      for (let index = 0; index < curve.length; index += 1) {
        const position = localSeconds + remainingFadeIn * index / (curve.length - 1);
        curve[index] = mix.gain * timelineDawEqualPowerEnvelope(position, durationSeconds, fadeInSeconds, fadeOutSeconds);
      }
      parameter.setValueCurveAtTime(curve, at, remainingFadeIn);
    }
    if (fadeOutSeconds > 0) {
      const fadeOutStart = durationSeconds - fadeOutSeconds;
      const curveStart = Math.max(localSeconds, fadeOutStart);
      const curveDuration = durationSeconds - curveStart;
      if (curveDuration > 0.002) {
        const curveAt = at + curveStart - localSeconds;
        const curve = new Float32Array(128);
        for (let index = 0; index < curve.length; index += 1) {
          const position = curveStart + curveDuration * index / (curve.length - 1);
          curve[index] = mix.gain * timelineDawEqualPowerEnvelope(position, durationSeconds, fadeInSeconds, fadeOutSeconds);
        }
        parameter.setValueAtTime(curve[0], curveAt);
        parameter.setValueCurveAtTime(curve, curveAt, curveDuration);
      }
    }
  }

  connect(output: AudioNode): void {
    this.analyser.disconnect();
    this.analyser.connect(output);
  }

  async resume(): Promise<void> {
    if (this.context.state === "suspended") await this.context.resume();
  }

  meter(): TimelineDawPrivateLaneMeter {
    this.analyser.getFloatTimeDomainData(this.samples);
    let peakAmplitude = 0;
    for (const sample of this.samples) peakAmplitude = Math.max(peakAmplitude, Math.abs(sample));
    return {
      peakAmplitude,
      peakDbfs: peakAmplitude > 0 ? Math.max(-96, 20 * Math.log10(peakAmplitude)) : -96,
      clipped: peakAmplitude >= 0.999,
    };
  }

  dispose(): void {
    this.sends.forEach((node) => node.disconnect());
    this.source.disconnect();
    this.insertGain.disconnect();
    this.filter.disconnect();
    this.compressor.disconnect();
    this.gain.disconnect();
    this.panner.disconnect();
    this.analyser.disconnect();
  }
}
