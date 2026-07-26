import type {
  TimelineSliceBoundarySuggestion,
  TimelineTransientAnalysisRecord,
} from "./TimelineTransientAnalysisEngine";
import type {
  TimelineKeyCandidate,
  TimelineTempoKeyAnalysisRecord,
  TimelineTempoCandidate,
} from "./TimelineTempoKeyAnalysisEngine";
import type { TimelineId, TimelineUserId } from "./TimelineTypes";

export type TimelineSliceMapConfiguration = {
  minimumSliceMilliseconds: number;
  includeSilenceEdges: boolean;
  minimumBoundaryConfidence: number;
  beatsPerBar: number;
};

export type TimelineSliceBoundaryEvidence = {
  boundaryId: TimelineId;
  kind: TimelineSliceBoundarySuggestion["kind"];
  confidence: number;
};

export type TimelineAudioSlice = {
  id: TimelineId;
  index: number;
  startFrame: number;
  endFrame: number;
  startSeconds: number;
  endSeconds: number;
  durationSeconds: number;
  startBeat: number | null;
  endBeat: number | null;
  bar: number | null;
  beatInBar: number | null;
  openingBoundary: TimelineSliceBoundaryEvidence;
  closingBoundary: TimelineSliceBoundaryEvidence;
};

export type TimelineSliceMapRecord = {
  id: TimelineId;
  sourceArtifactId: TimelineId;
  sourceFingerprint: string;
  decodeEvidenceId: TimelineId;
  transientAnalysisId: TimelineId;
  tempoKeyAnalysisId: TimelineId;
  sampleRate: number;
  frameCount: number;
  durationSeconds: number;
  configuration: TimelineSliceMapConfiguration;
  tempo: TimelineTempoCandidate | null;
  key: TimelineKeyCandidate | null;
  slices: TimelineAudioSlice[];
  discardedBoundaryIds: TimelineId[];
  createdAt: string;
  createdBy: TimelineUserId;
};

export type TimelineSliceMapIssue = {
  code:
    | "source-required"
    | "fingerprint-required"
    | "decode-evidence-required"
    | "transient-analysis-required"
    | "tempo-key-analysis-required"
    | "configuration-invalid"
    | "evidence-mismatch"
    | "boundaries-invalid"
    | "slice-map-empty";
  message: string;
};

export type TimelineSliceMapResult = {
  accepted: boolean;
  sliceMap: TimelineSliceMapRecord | null;
  issues: TimelineSliceMapIssue[];
};

export type TimelineSliceMapArchive = { sliceMaps: TimelineSliceMapRecord[] };

const DEFAULT_CONFIGURATION: TimelineSliceMapConfiguration = {
  minimumSliceMilliseconds: 20,
  includeSilenceEdges: true,
  minimumBoundaryConfidence: 0.25,
  beatsPerBar: 4,
};
const clone = <T>(value: T): T => structuredClone(value);
const round = (value: number): number => Math.round(value * 1_000_000) / 1_000_000;

function configuration(
  input?: Partial<TimelineSliceMapConfiguration>,
): TimelineSliceMapConfiguration | null {
  const value = { ...DEFAULT_CONFIGURATION, ...input };
  if (
    !Number.isFinite(value.minimumSliceMilliseconds) ||
    value.minimumSliceMilliseconds < 1 ||
    value.minimumSliceMilliseconds > 10_000 ||
    typeof value.includeSilenceEdges !== "boolean" ||
    !Number.isFinite(value.minimumBoundaryConfidence) ||
    value.minimumBoundaryConfidence < 0 ||
    value.minimumBoundaryConfidence > 1 ||
    !Number.isInteger(value.beatsPerBar) ||
    value.beatsPerBar < 1 ||
    value.beatsPerBar > 32
  ) return null;
  return value;
}

function boundaryEvidence(
  boundary: TimelineSliceBoundarySuggestion,
): TimelineSliceBoundaryEvidence {
  return {
    boundaryId: boundary.id,
    kind: boundary.kind,
    confidence: boundary.confidence,
  };
}

function validateBoundaries(
  evidence: TimelineTransientAnalysisRecord,
): string | null {
  if (evidence.boundaries.length < 2) return "At least two boundaries are required.";
  let previous = -1;
  for (const boundary of evidence.boundaries) {
    if (
      !Number.isInteger(boundary.frame) ||
      boundary.frame < 0 ||
      boundary.frame > evidence.frameCount ||
      boundary.frame < previous ||
      !Number.isFinite(boundary.confidence) ||
      boundary.confidence < 0 ||
      boundary.confidence > 1
    ) return "Transient boundaries are malformed or out of order.";
    previous = boundary.frame;
  }
  return null;
}

function selectedBoundaries(
  evidence: TimelineTransientAnalysisRecord,
  config: TimelineSliceMapConfiguration,
): {
  selected: TimelineSliceBoundarySuggestion[];
  discarded: TimelineId[];
} {
  const start = evidence.boundaries.find((value) => value.kind === "start") ?? {
    id: `${evidence.id}-source-start`,
    frame: 0,
    seconds: 0,
    kind: "start" as const,
    confidence: 1,
  };
  const end = [...evidence.boundaries].reverse().find(
    (value) => value.kind === "end",
  ) ?? {
    id: `${evidence.id}-source-end`,
    frame: evidence.frameCount,
    seconds: evidence.frameCount / evidence.sampleRate,
    kind: "end" as const,
    confidence: 1,
  };
  const candidates = evidence.boundaries.filter((value) =>
    value.kind !== "start" &&
    value.kind !== "end" &&
    value.confidence >= config.minimumBoundaryConfidence &&
    (config.includeSilenceEdges || value.kind !== "silence-edge")
  );
  const minimumFrames = Math.max(
    1,
    Math.round(config.minimumSliceMilliseconds * evidence.sampleRate / 1_000),
  );
  const selected = [start];
  const discarded: TimelineId[] = [];
  for (const candidate of candidates) {
    const prior = selected[selected.length - 1];
    if (
      candidate.frame <= prior.frame ||
      candidate.frame - prior.frame < minimumFrames ||
      end.frame - candidate.frame < minimumFrames
    ) {
      discarded.push(candidate.id);
      continue;
    }
    selected.push(candidate);
  }
  selected.push(end);
  const selectedIds = new Set(selected.map((value) => value.id));
  for (const boundary of evidence.boundaries) {
    if (!selectedIds.has(boundary.id) && !discarded.includes(boundary.id)) {
      discarded.push(boundary.id);
    }
  }
  return { selected, discarded };
}

function slicePosition(seconds: number, bpm: number, beatsPerBar: number) {
  const beat = seconds * bpm / 60;
  return {
    beat: round(beat),
    bar: Math.floor(beat / beatsPerBar) + 1,
    beatInBar: round(beat % beatsPerBar + 1),
  };
}

export class TimelineSliceMapEngine {
  private readonly maps = new Map<TimelineId, TimelineSliceMapRecord>();
  private nextId = 1;

  constructor(private readonly now: () => Date = () => new Date()) {}

  create(input: {
    sourceArtifactId: TimelineId;
    sourceFingerprint: string;
    decodeEvidenceId: TimelineId;
    transientAnalysis: TimelineTransientAnalysisRecord;
    tempoKeyAnalysis: TimelineTempoKeyAnalysisRecord;
    configuration?: Partial<TimelineSliceMapConfiguration>;
    createdBy: TimelineUserId;
  }): TimelineSliceMapResult {
    const issues: TimelineSliceMapIssue[] = [];
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
      issues.push({ code: "transient-analysis-required", message: "Transient analysis is required." });
    }
    if (!input.tempoKeyAnalysis?.id?.trim()) {
      issues.push({ code: "tempo-key-analysis-required", message: "Tempo/key analysis is required." });
    }
    const config = configuration(input.configuration);
    if (!config) {
      issues.push({ code: "configuration-invalid", message: "Slice-map configuration is invalid." });
    }
    const boundaryIssue = input.transientAnalysis
      ? validateBoundaries(input.transientAnalysis)
      : null;
    if (boundaryIssue) {
      issues.push({ code: "boundaries-invalid", message: boundaryIssue });
    }
    if (
      input.transientAnalysis &&
      input.tempoKeyAnalysis &&
      (
        input.transientAnalysis.sourceArtifactId !== input.sourceArtifactId ||
        input.transientAnalysis.sourceFingerprint !== input.sourceFingerprint ||
        input.transientAnalysis.decodeEvidenceId !== input.decodeEvidenceId ||
        input.tempoKeyAnalysis.sourceArtifactId !== input.sourceArtifactId ||
        input.tempoKeyAnalysis.sourceFingerprint !== input.sourceFingerprint ||
        input.tempoKeyAnalysis.decodeEvidenceId !== input.decodeEvidenceId ||
        input.tempoKeyAnalysis.transientAnalysisId !== input.transientAnalysis.id ||
        input.tempoKeyAnalysis.sampleRate !== input.transientAnalysis.sampleRate ||
        input.tempoKeyAnalysis.frameCount !== input.transientAnalysis.frameCount
      )
    ) {
      issues.push({ code: "evidence-mismatch", message: "Analysis evidence does not describe one source." });
    }
    if (issues.length || !config) {
      return { accepted: false, sliceMap: null, issues };
    }

    const boundaries = selectedBoundaries(input.transientAnalysis, config);
    const trustedTempo = input.tempoKeyAnalysis.tempoAmbiguous
      ? null
      : input.tempoKeyAnalysis.selectedTempo;
    const trustedKey = input.tempoKeyAnalysis.keyAmbiguous
      ? null
      : input.tempoKeyAnalysis.selectedKey;
    const slices: TimelineAudioSlice[] = [];
    for (let index = 0; index < boundaries.selected.length - 1; index += 1) {
      const opening = boundaries.selected[index];
      const closing = boundaries.selected[index + 1];
      if (closing.frame <= opening.frame) continue;
      const startSeconds = opening.frame / input.transientAnalysis.sampleRate;
      const endSeconds = closing.frame / input.transientAnalysis.sampleRate;
      const start = trustedTempo
        ? slicePosition(startSeconds, trustedTempo.bpm, config.beatsPerBar)
        : null;
      const end = trustedTempo
        ? slicePosition(endSeconds, trustedTempo.bpm, config.beatsPerBar)
        : null;
      slices.push({
        id: `timeline-slice-map-${this.nextId}-slice-${index + 1}`,
        index,
        startFrame: opening.frame,
        endFrame: closing.frame,
        startSeconds: round(startSeconds),
        endSeconds: round(endSeconds),
        durationSeconds: round(endSeconds - startSeconds),
        startBeat: start?.beat ?? null,
        endBeat: end?.beat ?? null,
        bar: start?.bar ?? null,
        beatInBar: start?.beatInBar ?? null,
        openingBoundary: boundaryEvidence(opening),
        closingBoundary: boundaryEvidence(closing),
      });
    }
    if (!slices.length) {
      return {
        accepted: false,
        sliceMap: null,
        issues: [{ code: "slice-map-empty", message: "No safe slices could be produced." }],
      };
    }
    const record: TimelineSliceMapRecord = {
      id: `timeline-slice-map-${this.nextId}`,
      sourceArtifactId: input.sourceArtifactId,
      sourceFingerprint: input.sourceFingerprint,
      decodeEvidenceId: input.decodeEvidenceId,
      transientAnalysisId: input.transientAnalysis.id,
      tempoKeyAnalysisId: input.tempoKeyAnalysis.id,
      sampleRate: input.transientAnalysis.sampleRate,
      frameCount: input.transientAnalysis.frameCount,
      durationSeconds: round(
        input.transientAnalysis.frameCount / input.transientAnalysis.sampleRate,
      ),
      configuration: config,
      tempo: trustedTempo,
      key: trustedKey,
      slices,
      discardedBoundaryIds: boundaries.discarded,
      createdAt: this.now().toISOString(),
      createdBy: input.createdBy,
    };
    this.nextId += 1;
    this.maps.set(record.id, clone(record));
    return { accepted: true, sliceMap: clone(record), issues: [] };
  }

  get(id: TimelineId): TimelineSliceMapRecord | null {
    const value = this.maps.get(id);
    return value ? clone(value) : null;
  }

  list(sourceArtifactId?: TimelineId): TimelineSliceMapRecord[] {
    return [...this.maps.values()]
      .filter((value) => !sourceArtifactId || value.sourceArtifactId === sourceArtifactId)
      .sort((left, right) => left.id.localeCompare(right.id))
      .map(clone);
  }

  exportArchive(): TimelineSliceMapArchive {
    return { sliceMaps: this.list() };
  }

  restoreArchive(archive: TimelineSliceMapArchive): void {
    const restored = new Map<TimelineId, TimelineSliceMapRecord>();
    let maximumId = 0;
    for (const sliceMap of archive.sliceMaps) {
      if (restored.has(sliceMap.id)) throw new Error(`Duplicate slice-map id: ${sliceMap.id}`);
      restored.set(sliceMap.id, clone(sliceMap));
      const match = /^timeline-slice-map-(\d+)$/.exec(sliceMap.id);
      if (match) maximumId = Math.max(maximumId, Number(match[1]));
    }
    this.maps.clear();
    for (const [id, sliceMap] of restored) this.maps.set(id, sliceMap);
    this.nextId = maximumId + 1;
  }
}
