import type { TimelineDawPrivateBusMix } from "./TimelineDawPrivateBusPolicy";
import type { TimelineDawPrivateLaneMeter } from "./TimelineDawPrivateLaneMonitorGraph";

export class TimelineDawPrivateBusGraph {
  readonly input: GainNode;
  private readonly gain: GainNode;
  private readonly panner: StereoPannerNode;
  private readonly analyser: AnalyserNode;
  private readonly samples: Float32Array<ArrayBuffer>;

  constructor(private readonly context: AudioContext) {
    this.input = context.createGain(); this.gain = context.createGain(); this.panner = context.createStereoPanner(); this.analyser = context.createAnalyser();
    this.analyser.fftSize = 256; this.analyser.smoothingTimeConstant = 0.55; this.samples = new Float32Array(this.analyser.fftSize);
    this.input.connect(this.gain).connect(this.panner).connect(this.analyser).connect(context.destination);
  }
  apply(mix: TimelineDawPrivateBusMix, audible: boolean): void {
    const at = this.context.currentTime; this.gain.gain.setTargetAtTime(audible && !mix.muted ? mix.gain : 0, at, 0.008); this.panner.pan.setTargetAtTime(mix.pan, at, 0.008);
  }
  meter(): TimelineDawPrivateLaneMeter {
    this.analyser.getFloatTimeDomainData(this.samples); let peakAmplitude = 0;
    for (const sample of this.samples) peakAmplitude = Math.max(peakAmplitude, Math.abs(sample));
    return { peakAmplitude, peakDbfs: peakAmplitude > 0 ? Math.max(-96, 20 * Math.log10(peakAmplitude)) : -96, clipped: peakAmplitude >= 0.999 };
  }
  dispose(): void { this.input.disconnect(); this.gain.disconnect(); this.panner.disconnect(); this.analyser.disconnect(); }
}
