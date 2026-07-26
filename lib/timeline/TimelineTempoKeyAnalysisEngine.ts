import type { TimelineDecodedAudioBuffer } from "./TimelineAudioDecodeEngine";
import type { TimelineTransientAnalysisRecord } from "./TimelineTransientAnalysisEngine";
import type { TimelineId, TimelineUserId } from "./TimelineTypes";

export type TimelinePitchClass =
  | "C" | "C#" | "D" | "D#" | "E" | "F"
  | "F#" | "G" | "G#" | "A" | "A#" | "B";

export type TimelineTempoKeyAnalysisConfiguration = {
  minimumBpm: number;
  maximumBpm: number;
  tempoResolution: number;
  spectralWindowSize: number;
  minimumFrequencyHz: number;
  maximumFrequencyHz: number;
};

export type TimelineTempoCandidate = {
  bpm: number;
  confidence: number;
  supportingIntervals: number;
};

export type TimelineKeyCandidate = {
  tonic: TimelinePitchClass;
  mode: "major" | "minor";
  confidence: number;
  correlation: number;
};

export type TimelineTempoKeyAnalysisRecord = {
  id: TimelineId;
  sourceArtifactId: TimelineId;
  sourceFingerprint: string;
  decodeEvidenceId: TimelineId;
  transientAnalysisId: TimelineId;
  sampleRate: number;
  frameCount: number;
  configuration: TimelineTempoKeyAnalysisConfiguration;
  tempoCandidates: TimelineTempoCandidate[];
  selectedTempo: TimelineTempoCandidate | null;
  keyCandidates: TimelineKeyCandidate[];
  selectedKey: TimelineKeyCandidate | null;
  chroma: Record<TimelinePitchClass, number>;
  tempoAmbiguous: boolean;
  keyAmbiguous: boolean;
  analyzedAt: string;
  analyzedBy: TimelineUserId;
};

export type TimelineTempoKeyAnalysisIssue = {
  code:
    | "source-required"
    | "fingerprint-required"
    | "decode-evidence-required"
    | "transient-analysis-required"
    | "audio-invalid"
    | "configuration-invalid"
    | "evidence-mismatch"
    | "analysis-empty";
  message: string;
};

export type TimelineTempoKeyAnalysisResult = {
  accepted: boolean;
  analysis: TimelineTempoKeyAnalysisRecord | null;
  issues: TimelineTempoKeyAnalysisIssue[];
};

export type TimelineTempoKeyAnalysisArchive = {
  analyses: TimelineTempoKeyAnalysisRecord[];
};

const PITCH_CLASSES: TimelinePitchClass[] = [
  "C", "C#", "D", "D#", "E", "F",
  "F#", "G", "G#", "A", "A#", "B",
];
const MAJOR_PROFILE = [
  6.35, 2.23, 3.48, 2.33, 4.38, 4.09,
  2.52, 5.19, 2.39, 3.66, 2.29, 2.88,
];
const MINOR_PROFILE = [
  6.33, 2.68, 3.52, 5.38, 2.60, 3.53,
  2.54, 4.75, 3.98, 2.69, 3.34, 3.17,
];
const DEFAULT_CONFIGURATION: TimelineTempoKeyAnalysisConfiguration = {
  minimumBpm: 40,
  maximumBpm: 240,
  tempoResolution: 0.1,
  spectralWindowSize: 4_096,
  minimumFrequencyHz: 55,
  maximumFrequencyHz: 4_186,
};

const clone = <T>(value: T): T => structuredClone(value);
const round = (value: number, places = 6): number => {
  const scale = 10 ** places;
  return Math.round(value * scale) / scale;
};

function normalizedConfiguration(
  input: Partial<TimelineTempoKeyAnalysisConfiguration> | undefined,
): TimelineTempoKeyAnalysisConfiguration | null {
  const value = { ...DEFAULT_CONFIGURATION, ...input };
  if (
    !Number.isFinite(value.minimumBpm) ||
    !Number.isFinite(value.maximumBpm) ||
    value.minimumBpm < 20 ||
    value.maximumBpm > 400 ||
    value.minimumBpm >= value.maximumBpm ||
    !Number.isFinite(value.tempoResolution) ||
    value.tempoResolution < 0.01 ||
    value.tempoResolution > 5 ||
    !Number.isInteger(value.spectralWindowSize) ||
    value.spectralWindowSize < 256 ||
    value.spectralWindowSize > 32_768 ||
    (value.spectralWindowSize & (value.spectralWindowSize - 1)) !== 0 ||
    !Number.isFinite(value.minimumFrequencyHz) ||
    !Number.isFinite(value.maximumFrequencyHz) ||
    value.minimumFrequencyHz < 20 ||
    value.maximumFrequencyHz <= value.minimumFrequencyHz
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
    !Number.isInteger(audio.frameCount) ||
    audio.frameCount < 1 ||
    audio.channels.length !== audio.channelCount
  ) return "Decoded audio metadata is invalid.";
  for (const channel of audio.channels) {
    if (!(channel instanceof Float32Array) || channel.length !== audio.frameCount) {
      return "Decoded channel buffers do not match the audio metadata.";
    }
  }
  return null;
}

function findTempoCandidates(
  evidence: TimelineTransientAnalysisRecord,
  configuration: TimelineTempoKeyAnalysisConfiguration,
): TimelineTempoCandidate[] {
  const seconds = evidence.transients
    .map((marker) => marker.seconds)
    .sort((left, right) => left - right);
  const scores = new Map<number, { score: number; intervals: number }>();
  for (let left = 0; left < seconds.length; left += 1) {
    for (
      let right = left + 1;
      right < Math.min(seconds.length, left + 9);
      right += 1
    ) {
      const interval = seconds[right] - seconds[left];
      if (interval <= 0) continue;
      let bpm = 60 * (right - left) / interval;
      while (bpm < configuration.minimumBpm) bpm *= 2;
      while (bpm > configuration.maximumBpm) bpm /= 2;
      if (bpm < configuration.minimumBpm || bpm > configuration.maximumBpm) {
        continue;
      }
      const bucket = round(
        Math.round(bpm / configuration.tempoResolution) *
          configuration.tempoResolution,
        3,
      );
      const current = scores.get(bucket) ?? { score: 0, intervals: 0 };
      current.score += 1 / (right - left);
      current.intervals += 1;
      scores.set(bucket, current);
    }
  }
  const ordered = [...scores.entries()]
    .map(([bpm, value]) => ({ bpm, ...value }))
    .sort((left, right) => right.score - left.score || left.bpm - right.bpm)
    .slice(0, 5);
  const total = ordered.reduce((sum, value) => sum + value.score, 0);
  return ordered.map((value) => ({
    bpm: value.bpm,
    confidence: round(total ? value.score / total : 0),
    supportingIntervals: value.intervals,
  }));
}

function monoSample(audio: TimelineDecodedAudioBuffer, frame: number): number {
  let sum = 0;
  for (const channel of audio.channels) sum += channel[frame] ?? 0;
  return sum / audio.channelCount;
}

function goertzelPower(
  audio: TimelineDecodedAudioBuffer,
  startFrame: number,
  frameCount: number,
  frequency: number,
): number {
  const coefficient = 2 * Math.cos(2 * Math.PI * frequency / audio.sampleRate);
  let previous = 0;
  let previousPrevious = 0;
  for (let index = 0; index < frameCount; index += 1) {
    const hann = frameCount === 1
      ? 1
      : 0.5 - 0.5 * Math.cos(2 * Math.PI * index / (frameCount - 1));
    const current =
      monoSample(audio, startFrame + index) * hann +
      coefficient * previous -
      previousPrevious;
    previousPrevious = previous;
    previous = current;
  }
  return Math.max(
    0,
    previousPrevious ** 2 + previous ** 2 -
      coefficient * previous * previousPrevious,
  );
}

function chromaVector(
  audio: TimelineDecodedAudioBuffer,
  configuration: TimelineTempoKeyAnalysisConfiguration,
): number[] {
  const size = Math.min(configuration.spectralWindowSize, audio.frameCount);
  const hop = Math.max(1, Math.floor(size / 2));
  const chroma = new Array<number>(12).fill(0);
  for (let start = 0; start + size <= audio.frameCount; start += hop) {
    for (let midi = 33; midi <= 107; midi += 1) {
      const frequency = 440 * 2 ** ((midi - 69) / 12);
      if (
        frequency < configuration.minimumFrequencyHz ||
        frequency > configuration.maximumFrequencyHz ||
        frequency >= audio.sampleRate / 2
      ) continue;
      chroma[midi % 12] += Math.sqrt(
        goertzelPower(audio, start, size, frequency),
      );
    }
  }
  const total = chroma.reduce((sum, value) => sum + value, 0);
  return chroma.map((value) => total ? value / total : 0);
}

function correlation(left: number[], right: number[]): number {
  const leftMean = left.reduce((sum, value) => sum + value, 0) / left.length;
  const rightMean = right.reduce((sum, value) => sum + value, 0) / right.length;
  let numerator = 0;
  let leftEnergy = 0;
  let rightEnergy = 0;
  for (let index = 0; index < left.length; index += 1) {
    const a = left[index] - leftMean;
    const b = right[index] - rightMean;
    numerator += a * b;
    leftEnergy += a * a;
    rightEnergy += b * b;
  }
  const denominator = Math.sqrt(leftEnergy * rightEnergy);
  return denominator ? numerator / denominator : 0;
}

function rotateProfile(profile: number[], tonic: number): number[] {
  return PITCH_CLASSES.map((_, pitchClass) => {
    const relativePitch = (pitchClass - tonic + 12) % 12;
    return profile[relativePitch];
  });
}

function findKeyCandidates(chroma: number[]): TimelineKeyCandidate[] {
  const values: Array<Omit<TimelineKeyCandidate, "confidence">> = [];
  for (let tonic = 0; tonic < 12; tonic += 1) {
    for (const mode of ["major", "minor"] as const) {
      const profile = mode === "major" ? MAJOR_PROFILE : MINOR_PROFILE;
      values.push({
        tonic: PITCH_CLASSES[tonic],
        mode,
        correlation: round(correlation(chroma, rotateProfile(profile, tonic))),
      });
    }
  }
  values.sort(
    (left, right) =>
      right.correlation - left.correlation ||
      left.tonic.localeCompare(right.tonic) ||
      left.mode.localeCompare(right.mode),
  );
  const top = values.slice(0, 5);
  const shifted = top.map((value) => Math.max(0, value.correlation + 1));
  const total = shifted.reduce((sum, value) => sum + value, 0);
  return top.map((value, index) => ({
    ...value,
    confidence: round(total ? shifted[index] / total : 0),
  }));
}

function chromaRecord(
  chroma: number[],
): Record<TimelinePitchClass, number> {
  return Object.fromEntries(
    PITCH_CLASSES.map((pitchClass, index) => [
      pitchClass,
      round(chroma[index]),
    ]),
  ) as Record<TimelinePitchClass, number>;
}

export class TimelineTempoKeyAnalysisEngine {
  private readonly analyses = new Map<TimelineId, TimelineTempoKeyAnalysisRecord>();
  private nextId = 1;

  constructor(private readonly now: () => Date = () => new Date()) {}

  analyze(input: {
    sourceArtifactId: TimelineId;
    sourceFingerprint: string;
    decodeEvidenceId: TimelineId;
    transientAnalysis: TimelineTransientAnalysisRecord;
    audio: TimelineDecodedAudioBuffer;
    configuration?: Partial<TimelineTempoKeyAnalysisConfiguration>;
    analyzedBy: TimelineUserId;
  }): TimelineTempoKeyAnalysisResult {
    const issues: TimelineTempoKeyAnalysisIssue[] = [];
    if (!input.sourceArtifactId.trim()) {
      issues.push({ code: "source-required", message: "A source artifact is required." });
    }
    if (!input.sourceFingerprint.trim()) {
      issues.push({ code: "fingerprint-required", message: "A source fingerprint is required." });
    }
    if (!input.decodeEvidenceId.trim()) {
      issues.push({ code: "decode-evidence-required", message: "Decode evidence is required." });
    }
    if (!input.transientAnalysis?.id?.trim()) {
      issues.push({
        code: "transient-analysis-required",
        message: "Transient analysis evidence is required.",
      });
    }
    const audioIssue = validateAudio(input.audio);
    if (audioIssue) issues.push({ code: "audio-invalid", message: audioIssue });
    const configuration = normalizedConfiguration(input.configuration);
    if (!configuration) {
      issues.push({
        code: "configuration-invalid",
        message: "Tempo/key analysis configuration is invalid.",
      });
    }
    if (
      input.transientAnalysis &&
      (
        input.transientAnalysis.sourceArtifactId !== input.sourceArtifactId ||
        input.transientAnalysis.sourceFingerprint !== input.sourceFingerprint ||
        input.transientAnalysis.decodeEvidenceId !== input.decodeEvidenceId ||
        input.transientAnalysis.sampleRate !== input.audio.sampleRate ||
        input.transientAnalysis.frameCount !== input.audio.frameCount
      )
    ) {
      issues.push({
        code: "evidence-mismatch",
        message: "Transient evidence does not describe the supplied decoded audio.",
      });
    }
    if (issues.length || !configuration) {
      return { accepted: false, analysis: null, issues };
    }

    const tempos = findTempoCandidates(input.transientAnalysis, configuration);
    const chroma = chromaVector(input.audio, configuration);
    const keys = chroma.some((value) => value > 0)
      ? findKeyCandidates(chroma)
      : [];
    if (!tempos.length && !keys.length) {
      return {
        accepted: false,
        analysis: null,
        issues: [{
          code: "analysis-empty",
          message: "Audio contains insufficient rhythmic and tonal evidence.",
        }],
      };
    }

    const record: TimelineTempoKeyAnalysisRecord = {
      id: `timeline-tempo-key-analysis-${this.nextId}`,
      sourceArtifactId: input.sourceArtifactId,
      sourceFingerprint: input.sourceFingerprint,
      decodeEvidenceId: input.decodeEvidenceId,
      transientAnalysisId: input.transientAnalysis.id,
      sampleRate: input.audio.sampleRate,
      frameCount: input.audio.frameCount,
      configuration,
      tempoCandidates: tempos,
      selectedTempo: tempos[0] ?? null,
      keyCandidates: keys,
      selectedKey: keys[0] ?? null,
      chroma: chromaRecord(chroma),
      tempoAmbiguous:
        tempos.length < 1 ||
        tempos[0].supportingIntervals < 3 ||
        tempos[0].confidence < 0.35 ||
        (
          tempos.length > 1 &&
          tempos[0].confidence - tempos[1].confidence < 0.08
        ),
      keyAmbiguous:
        keys.length < 1 ||
        keys[0].correlation < 0.25 ||
        (
          keys.length > 1 &&
          keys[0].correlation - keys[1].correlation < 0.08
        ),
      analyzedAt: this.now().toISOString(),
      analyzedBy: input.analyzedBy,
    };
    this.nextId += 1;
    this.analyses.set(record.id, clone(record));
    return { accepted: true, analysis: clone(record), issues: [] };
  }

  get(id: TimelineId): TimelineTempoKeyAnalysisRecord | null {
    const value = this.analyses.get(id);
    return value ? clone(value) : null;
  }

  list(sourceArtifactId?: TimelineId): TimelineTempoKeyAnalysisRecord[] {
    return [...this.analyses.values()]
      .filter((value) => !sourceArtifactId || value.sourceArtifactId === sourceArtifactId)
      .sort((left, right) => left.id.localeCompare(right.id))
      .map(clone);
  }

  exportArchive(): TimelineTempoKeyAnalysisArchive {
    return { analyses: this.list() };
  }

  restoreArchive(archive: TimelineTempoKeyAnalysisArchive): void {
    const restored = new Map<TimelineId, TimelineTempoKeyAnalysisRecord>();
    let maximumId = 0;
    for (const analysis of archive.analyses) {
      if (restored.has(analysis.id)) {
        throw new Error(`Duplicate tempo/key analysis id: ${analysis.id}`);
      }
      restored.set(analysis.id, clone(analysis));
      const match = /^timeline-tempo-key-analysis-(\d+)$/.exec(analysis.id);
      if (match) maximumId = Math.max(maximumId, Number(match[1]));
    }
    this.analyses.clear();
    for (const [id, analysis] of restored) this.analyses.set(id, analysis);
    this.nextId = maximumId + 1;
  }
}
