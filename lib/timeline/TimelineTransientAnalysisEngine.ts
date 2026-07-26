import type {
  TimelineDecodedAudioBuffer,
} from "./TimelineAudioDecodeEngine";
import type { TimelineId, TimelineUserId } from "./TimelineTypes";

export type TimelineTransientAnalysisConfiguration = {
  analysisWindowMilliseconds: number;
  minimumTransientSpacingMilliseconds: number;
  sensitivity: number;
  silenceThresholdDb: number;
  minimumSilenceMilliseconds: number;
  minimumPhraseMilliseconds: number;
};

export type TimelineTransientMarker = {
  id: TimelineId;
  frame: number;
  seconds: number;
  strength: number;
  peakAmplitude: number;
};

export type TimelineAudioRegion = {
  id: TimelineId;
  startFrame: number;
  endFrame: number;
  startSeconds: number;
  endSeconds: number;
  durationSeconds: number;
};

export type TimelineSliceBoundarySuggestion = {
  id: TimelineId;
  frame: number;
  seconds: number;
  kind: "start" | "transient" | "silence-edge" | "end";
  confidence: number;
};

export type TimelineTransientAnalysisRecord = {
  id: TimelineId;
  sourceArtifactId: TimelineId;
  sourceFingerprint: string;
  decodeEvidenceId: TimelineId;
  sampleRate: number;
  channelCount: number;
  frameCount: number;
  configuration: TimelineTransientAnalysisConfiguration;
  transients: TimelineTransientMarker[];
  silenceRegions: TimelineAudioRegion[];
  phraseRegions: TimelineAudioRegion[];
  boundaries: TimelineSliceBoundarySuggestion[];
  analyzedAt: string;
  analyzedBy: TimelineUserId;
};

export type TimelineTransientAnalysisIssue = {
  code:
    | "source-required"
    | "fingerprint-required"
    | "decode-evidence-required"
    | "audio-invalid"
    | "configuration-invalid"
    | "analysis-empty";
  message: string;
};

export type TimelineTransientAnalysisResult = {
  accepted: boolean;
  analysis: TimelineTransientAnalysisRecord | null;
  issues: TimelineTransientAnalysisIssue[];
};

export type TimelineTransientAnalysisArchive = {
  analyses: TimelineTransientAnalysisRecord[];
};

const DEFAULT_CONFIGURATION: TimelineTransientAnalysisConfiguration = {
  analysisWindowMilliseconds: 5,
  minimumTransientSpacingMilliseconds: 35,
  sensitivity: 0.55,
  silenceThresholdDb: -48,
  minimumSilenceMilliseconds: 80,
  minimumPhraseMilliseconds: 40,
};

const clone = <T>(value: T): T => structuredClone(value);
const millisecondsToFrames = (
  milliseconds: number,
  sampleRate: number,
): number => Math.max(1, Math.round(milliseconds * sampleRate / 1_000));

function normalizedConfiguration(
  input: Partial<TimelineTransientAnalysisConfiguration> | undefined,
): TimelineTransientAnalysisConfiguration | null {
  const value = { ...DEFAULT_CONFIGURATION, ...input };
  if (
    !Number.isFinite(value.analysisWindowMilliseconds) ||
    value.analysisWindowMilliseconds < 1 ||
    value.analysisWindowMilliseconds > 100 ||
    !Number.isFinite(value.minimumTransientSpacingMilliseconds) ||
    value.minimumTransientSpacingMilliseconds < 1 ||
    value.minimumTransientSpacingMilliseconds > 2_000 ||
    !Number.isFinite(value.sensitivity) ||
    value.sensitivity < 0 ||
    value.sensitivity > 1 ||
    !Number.isFinite(value.silenceThresholdDb) ||
    value.silenceThresholdDb < -120 ||
    value.silenceThresholdDb > -6 ||
    !Number.isFinite(value.minimumSilenceMilliseconds) ||
    value.minimumSilenceMilliseconds < 1 ||
    value.minimumSilenceMilliseconds > 60_000 ||
    !Number.isFinite(value.minimumPhraseMilliseconds) ||
    value.minimumPhraseMilliseconds < 1 ||
    value.minimumPhraseMilliseconds > 60_000
  ) return null;
  return value;
}

function validateAudio(audio: TimelineDecodedAudioBuffer): string | null {
  if (
    !Number.isInteger(audio.sampleRate) ||
    audio.sampleRate < 8_000 ||
    audio.sampleRate > 384_000 ||
    !Number.isInteger(audio.channelCount) ||
    audio.channelCount < 1 ||
    audio.channelCount > 64 ||
    !Number.isInteger(audio.frameCount) ||
    audio.frameCount < 1 ||
    audio.channels.length !== audio.channelCount
  ) return "Decoded audio metadata is invalid.";
  for (const channel of audio.channels) {
    if (!(channel instanceof Float32Array) || channel.length !== audio.frameCount) {
      return "Decoded channel buffers do not match the audio metadata.";
    }
    for (const sample of channel) {
      if (!Number.isFinite(sample) || sample < -1 || sample > 1) {
        return "Decoded audio contains a sample outside normalized bounds.";
      }
    }
  }
  return null;
}

function amplitudeEnvelope(
  audio: TimelineDecodedAudioBuffer,
  windowFrames: number,
): { rms: number[]; peak: number[] } {
  const windowCount = Math.ceil(audio.frameCount / windowFrames);
  const rms = new Array<number>(windowCount).fill(0);
  const peak = new Array<number>(windowCount).fill(0);
  for (let window = 0; window < windowCount; window += 1) {
    const start = window * windowFrames;
    const end = Math.min(audio.frameCount, start + windowFrames);
    let sumSquares = 0;
    let maximum = 0;
    let values = 0;
    for (let frame = start; frame < end; frame += 1) {
      let mixedSquare = 0;
      let mixedPeak = 0;
      for (const channel of audio.channels) {
        const sample = channel[frame];
        mixedSquare += sample * sample;
        mixedPeak = Math.max(mixedPeak, Math.abs(sample));
      }
      sumSquares += mixedSquare / audio.channelCount;
      maximum = Math.max(maximum, mixedPeak);
      values += 1;
    }
    rms[window] = values ? Math.sqrt(sumSquares / values) : 0;
    peak[window] = maximum;
  }
  return { rms, peak };
}

function noveltyCurve(rms: number[]): number[] {
  const novelty = new Array<number>(rms.length).fill(0);
  let baseline = rms[0] ?? 0;
  for (let index = 1; index < rms.length; index += 1) {
    const current = rms[index];
    const previous = rms[index - 1];
    novelty[index] = Math.max(
      0,
      current - previous,
      current - baseline,
    );
    baseline = baseline * 0.92 + current * 0.08;
  }
  return novelty;
}

function statistics(values: number[]): { mean: number; deviation: number } {
  if (!values.length) return { mean: 0, deviation: 0 };
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce(
    (sum, value) => sum + (value - mean) ** 2,
    0,
  ) / values.length;
  return { mean, deviation: Math.sqrt(variance) };
}

function detectTransients(input: {
  novelty: number[];
  peak: number[];
  windowFrames: number;
  frameCount: number;
  sampleRate: number;
  sensitivity: number;
  minimumSpacingFrames: number;
  analysisId: TimelineId;
}): TimelineTransientMarker[] {
  const positive = input.novelty.filter((value) => value > 0);
  const { mean, deviation } = statistics(positive);
  const threshold = Math.max(
    1e-5,
    mean + deviation * (0.2 + input.sensitivity * 1.8),
  );
  const candidates: Array<{ window: number; novelty: number }> = [];
  for (let index = 1; index < input.novelty.length; index += 1) {
    const value = input.novelty[index];
    if (
      value >= threshold &&
      value >= (input.novelty[index - 1] ?? 0) &&
      value >= (input.novelty[index + 1] ?? 0)
    ) candidates.push({ window: index, novelty: value });
  }

  const selected: Array<{ window: number; novelty: number }> = [];
  for (const candidate of candidates.sort((a, b) => b.novelty - a.novelty)) {
    const frame = candidate.window * input.windowFrames;
    if (
      selected.every(
        (existing) =>
          Math.abs(existing.window * input.windowFrames - frame) >=
          input.minimumSpacingFrames,
      )
    ) selected.push(candidate);
  }
  const strongest = Math.max(...selected.map((value) => value.novelty), 1e-5);
  return selected
    .sort((a, b) => a.window - b.window)
    .map((value, index) => {
      const frame = Math.min(
        input.frameCount - 1,
        value.window * input.windowFrames,
      );
      return {
        id: `${input.analysisId}-transient-${index + 1}`,
        frame,
        seconds: frame / input.sampleRate,
        strength: Math.min(1, value.novelty / strongest),
        peakAmplitude: input.peak[value.window] ?? 0,
      };
    });
}

function detectSilenceRegions(input: {
  rms: number[];
  thresholdAmplitude: number;
  windowFrames: number;
  minimumFrames: number;
  frameCount: number;
  sampleRate: number;
  analysisId: TimelineId;
}): TimelineAudioRegion[] {
  const regions: TimelineAudioRegion[] = [];
  let startWindow: number | null = null;
  const close = (endWindow: number) => {
    if (startWindow === null) return;
    const startFrame = startWindow * input.windowFrames;
    const endFrame = Math.min(input.frameCount, endWindow * input.windowFrames);
    if (endFrame - startFrame >= input.minimumFrames) {
      regions.push({
        id: `${input.analysisId}-silence-${regions.length + 1}`,
        startFrame,
        endFrame,
        startSeconds: startFrame / input.sampleRate,
        endSeconds: endFrame / input.sampleRate,
        durationSeconds: (endFrame - startFrame) / input.sampleRate,
      });
    }
    startWindow = null;
  };
  input.rms.forEach((value, index) => {
    if (value <= input.thresholdAmplitude) {
      if (startWindow === null) startWindow = index;
    } else close(index);
  });
  close(input.rms.length);
  return regions;
}

function phraseRegions(input: {
  silence: TimelineAudioRegion[];
  frameCount: number;
  minimumFrames: number;
  sampleRate: number;
  analysisId: TimelineId;
}): TimelineAudioRegion[] {
  const regions: TimelineAudioRegion[] = [];
  let cursor = 0;
  const add = (startFrame: number, endFrame: number) => {
    if (endFrame - startFrame < input.minimumFrames) return;
    regions.push({
      id: `${input.analysisId}-phrase-${regions.length + 1}`,
      startFrame,
      endFrame,
      startSeconds: startFrame / input.sampleRate,
      endSeconds: endFrame / input.sampleRate,
      durationSeconds: (endFrame - startFrame) / input.sampleRate,
    });
  };
  for (const silence of input.silence) {
    add(cursor, silence.startFrame);
    cursor = silence.endFrame;
  }
  add(cursor, input.frameCount);
  return regions;
}

function sliceBoundaries(input: {
  transients: TimelineTransientMarker[];
  silence: TimelineAudioRegion[];
  frameCount: number;
  sampleRate: number;
  analysisId: TimelineId;
}): TimelineSliceBoundarySuggestion[] {
  const candidates = new Map<
    number,
    Omit<TimelineSliceBoundarySuggestion, "id" | "seconds">
  >();
  candidates.set(0, { frame: 0, kind: "start", confidence: 1 });
  candidates.set(input.frameCount, {
    frame: input.frameCount,
    kind: "end",
    confidence: 1,
  });
  for (const marker of input.transients) {
    candidates.set(marker.frame, {
      frame: marker.frame,
      kind: "transient",
      confidence: 0.5 + marker.strength * 0.5,
    });
  }
  for (const region of input.silence) {
    for (const frame of [region.startFrame, region.endFrame]) {
      if (frame <= 0 || frame >= input.frameCount) continue;
      const existing = candidates.get(frame);
      if (!existing || existing.confidence < 0.9) {
        candidates.set(frame, {
          frame,
          kind: "silence-edge",
          confidence: 0.9,
        });
      }
    }
  }
  return [...candidates.values()]
    .sort((a, b) => a.frame - b.frame)
    .map((value, index) => ({
      ...value,
      id: `${input.analysisId}-boundary-${index + 1}`,
      seconds: value.frame / input.sampleRate,
    }));
}

export class TimelineTransientAnalysisEngine {
  private readonly analyses = new Map<TimelineId, TimelineTransientAnalysisRecord>();
  private sequence = 0;

  constructor(private readonly now: () => Date = () => new Date()) {}

  analyze(input: {
    sourceArtifactId: TimelineId;
    sourceFingerprint: string;
    decodeEvidenceId: TimelineId;
    audio: TimelineDecodedAudioBuffer;
    configuration?: Partial<TimelineTransientAnalysisConfiguration>;
    analyzedBy: TimelineUserId;
  }): TimelineTransientAnalysisResult {
    const issues: TimelineTransientAnalysisIssue[] = [];
    if (!input.sourceArtifactId.trim()) {
      issues.push({ code: "source-required", message: "Source artifact ID is required." });
    }
    if (!input.sourceFingerprint.trim()) {
      issues.push({ code: "fingerprint-required", message: "Source fingerprint is required." });
    }
    if (!input.decodeEvidenceId.trim()) {
      issues.push({
        code: "decode-evidence-required",
        message: "Verified audio decode evidence is required.",
      });
    }
    const audioIssue = validateAudio(input.audio);
    if (audioIssue) issues.push({ code: "audio-invalid", message: audioIssue });
    const configuration = normalizedConfiguration(input.configuration);
    if (!configuration) {
      issues.push({
        code: "configuration-invalid",
        message: "Transient analysis configuration is outside supported bounds.",
      });
    }
    if (issues.length || !configuration) {
      return { accepted: false, analysis: null, issues };
    }

    const id = `timeline-transient-analysis-${++this.sequence}`;
    const windowFrames = millisecondsToFrames(
      configuration.analysisWindowMilliseconds,
      input.audio.sampleRate,
    );
    const envelope = amplitudeEnvelope(input.audio, windowFrames);
    if (!envelope.peak.some((value) => value > 0)) {
      return {
        accepted: false,
        analysis: null,
        issues: [{
          code: "analysis-empty",
          message: "Audio contains no measurable signal to analyze.",
        }],
      };
    }
    const transients = detectTransients({
      novelty: noveltyCurve(envelope.rms),
      peak: envelope.peak,
      windowFrames,
      frameCount: input.audio.frameCount,
      sampleRate: input.audio.sampleRate,
      sensitivity: configuration.sensitivity,
      minimumSpacingFrames: millisecondsToFrames(
        configuration.minimumTransientSpacingMilliseconds,
        input.audio.sampleRate,
      ),
      analysisId: id,
    });
    const silenceRegions = detectSilenceRegions({
      rms: envelope.rms,
      thresholdAmplitude: 10 ** (configuration.silenceThresholdDb / 20),
      windowFrames,
      minimumFrames: millisecondsToFrames(
        configuration.minimumSilenceMilliseconds,
        input.audio.sampleRate,
      ),
      frameCount: input.audio.frameCount,
      sampleRate: input.audio.sampleRate,
      analysisId: id,
    });
    const phrases = phraseRegions({
      silence: silenceRegions,
      frameCount: input.audio.frameCount,
      minimumFrames: millisecondsToFrames(
        configuration.minimumPhraseMilliseconds,
        input.audio.sampleRate,
      ),
      sampleRate: input.audio.sampleRate,
      analysisId: id,
    });
    const analysis: TimelineTransientAnalysisRecord = {
      id,
      sourceArtifactId: input.sourceArtifactId,
      sourceFingerprint: input.sourceFingerprint,
      decodeEvidenceId: input.decodeEvidenceId,
      sampleRate: input.audio.sampleRate,
      channelCount: input.audio.channelCount,
      frameCount: input.audio.frameCount,
      configuration,
      transients,
      silenceRegions,
      phraseRegions: phrases,
      boundaries: sliceBoundaries({
        transients,
        silence: silenceRegions,
        frameCount: input.audio.frameCount,
        sampleRate: input.audio.sampleRate,
        analysisId: id,
      }),
      analyzedAt: this.now().toISOString(),
      analyzedBy: input.analyzedBy,
    };
    this.analyses.set(id, clone(analysis));
    return { accepted: true, analysis: clone(analysis), issues: [] };
  }

  getAnalysis(id: TimelineId): TimelineTransientAnalysisRecord | null {
    const value = this.analyses.get(id);
    return value ? clone(value) : null;
  }

  history(sourceArtifactId?: TimelineId): TimelineTransientAnalysisRecord[] {
    return [...this.analyses.values()]
      .filter((value) => !sourceArtifactId || value.sourceArtifactId === sourceArtifactId)
      .map(clone);
  }

  exportArchive(): TimelineTransientAnalysisArchive {
    return { analyses: this.history() };
  }

  restoreArchive(archive: TimelineTransientAnalysisArchive): void {
    const next = new Map<TimelineId, TimelineTransientAnalysisRecord>();
    let sequence = 0;
    for (const analysis of archive.analyses) {
      if (next.has(analysis.id)) {
        throw new Error(`Duplicate transient analysis ID ${analysis.id}.`);
      }
      if (
        !analysis.sourceArtifactId.trim() ||
        !analysis.sourceFingerprint.trim() ||
        !analysis.decodeEvidenceId.trim() ||
        !normalizedConfiguration(analysis.configuration) ||
        analysis.boundaries[0]?.frame !== 0 ||
        analysis.boundaries.at(-1)?.frame !== analysis.frameCount
      ) {
        throw new Error(`Transient analysis ${analysis.id} is invalid.`);
      }
      next.set(analysis.id, clone(analysis));
      const match = /^timeline-transient-analysis-(\d+)$/.exec(analysis.id);
      if (match) sequence = Math.max(sequence, Number(match[1]));
    }
    this.analyses.clear();
    for (const [id, value] of next) this.analyses.set(id, value);
    this.sequence = sequence;
  }
}
