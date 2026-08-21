export type TimelineDawRiffTrack = {
  laneId: string;
  name: string;
  peaks: number[];
  durationSeconds: number;
};

export type TimelineDawRiffRegion = {
  laneId: string;
  startSeconds: number;
  endSeconds: number;
  similarity: number;
};

export type TimelineDawRiffMatch = {
  id: string;
  color: string;
  similarity: number;
  regions: TimelineDawRiffRegion[];
};

export function createTimelineDawRiffAudition(input: {
  sourceInSeconds: number;
  regionStartSeconds: number;
  regionEndSeconds: number;
  stretchRatio: number;
  transformBypassed: boolean;
  playbackRate: number;
}) {
  const regionDuration = input.regionEndSeconds - input.regionStartSeconds;
  if (!Number.isFinite(regionDuration) || regionDuration <= 0) throw new Error("Matching region has no audio to play.");
  if (!Number.isFinite(input.playbackRate) || input.playbackRate <= 0) throw new Error("Track playback speed is invalid.");
  const arrangedDuration = regionDuration * (input.transformBypassed ? 1 : input.stretchRatio);
  return {
    sourceStartSeconds: input.sourceInSeconds + input.regionStartSeconds,
    playbackRate: input.playbackRate,
    durationSeconds: arrangedDuration,
    stopAfterMilliseconds: Math.max(1, Math.ceil(arrangedDuration * 1000)),
  };
}

export function createTimelineDawRiffAuditionSequence(inputs: Array<{
  laneId: string;
  sourceInSeconds: number;
  regionStartSeconds: number;
  regionEndSeconds: number;
  stretchRatio: number;
  transformBypassed: boolean;
  playbackRate: number;
}>, repeatCount = 1) {
  const safeRepeatCount = Math.min(10, Math.max(1, Math.floor(repeatCount)));
  const singlePass = inputs.map(({ laneId, ...input }) => ({ laneId, ...createTimelineDawRiffAudition(input) }));
  return Array.from({ length: safeRepeatCount }, (_, passIndex) => singlePass.map((plan) => ({ ...plan, passIndex }))).flat();
}

export function isTimelineDawRiffAuditionCurrent(expectedGeneration: number, currentGeneration: number) {
  return Number.isInteger(expectedGeneration) && expectedGeneration === currentGeneration;
}

const COLORS = ["#2563eb", "#16a34a", "#9333ea", "#ea580c", "#db2777", "#0891b2"];

function cosine(left: number[], right: number[]): number {
  let product = 0;
  let leftEnergy = 0;
  let rightEnergy = 0;
  for (let index = 0; index < left.length; index += 1) {
    product += left[index] * right[index];
    leftEnergy += left[index] ** 2;
    rightEnergy += right[index] ** 2;
  }
  if (!leftEnergy || !rightEnergy) return 0;
  return product / Math.sqrt(leftEnergy * rightEnergy);
}

function shape(values: number[]): number[] {
  const mean = values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
  return values.map((value, index) => {
    const previous = values[Math.max(0, index - 1)] ?? value;
    return Math.max(0, value - mean + 0.5) * 0.65 + Math.abs(value - previous) * 0.35;
  });
}

function hasMusicalActivity(values: number[]): boolean {
  return Math.max(...values) - Math.min(...values) >= 0.08;
}

export function findTimelineDawRiffMatches(
  tracks: TimelineDawRiffTrack[],
  options: { threshold?: number; windowBins?: number; stepBins?: number; maxMatches?: number } = {},
): TimelineDawRiffMatch[] {
  if (tracks.length < 2 || tracks.some((track) => track.peaks.length < 8)) return [];
  const threshold = options.threshold ?? 0.9;
  const windowBins = Math.max(8, options.windowBins ?? 16);
  const stepBins = Math.max(2, options.stepBins ?? Math.floor(windowBins / 2));
  const reference = tracks[0];
  const matches: TimelineDawRiffMatch[] = [];

  for (let referenceStart = 0; referenceStart + windowBins <= reference.peaks.length; referenceStart += stepBins) {
    const referenceWindow = reference.peaks.slice(referenceStart, referenceStart + windowBins);
    if (!hasMusicalActivity(referenceWindow)) continue;
    const referenceShape = shape(referenceWindow);
    const regions: TimelineDawRiffRegion[] = [{
      laneId: reference.laneId,
      startSeconds: reference.durationSeconds * referenceStart / reference.peaks.length,
      endSeconds: reference.durationSeconds * (referenceStart + windowBins) / reference.peaks.length,
      similarity: 1,
    }];
    const scores: number[] = [];
    for (const track of tracks.slice(1)) {
      let best = { score: 0, start: 0 };
      for (let start = 0; start + windowBins <= track.peaks.length; start += stepBins) {
        const candidateWindow = track.peaks.slice(start, start + windowBins);
        if (!hasMusicalActivity(candidateWindow)) continue;
        const score = cosine(referenceShape, shape(candidateWindow));
        if (score > best.score) best = { score, start };
      }
      if (best.score < threshold) break;
      scores.push(best.score);
      regions.push({
        laneId: track.laneId,
        startSeconds: track.durationSeconds * best.start / track.peaks.length,
        endSeconds: track.durationSeconds * (best.start + windowBins) / track.peaks.length,
        similarity: best.score,
      });
    }
    if (regions.length !== tracks.length) continue;
    const similarity = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const overlapsExisting = matches.some((match) => {
      const prior = match.regions[0];
      return regions[0].startSeconds < prior.endSeconds && regions[0].endSeconds > prior.startSeconds;
    });
    if (!overlapsExisting) matches.push({
      id: `riff-${matches.length + 1}`,
      color: COLORS[matches.length % COLORS.length],
      similarity,
      regions,
    });
    if (matches.length >= (options.maxMatches ?? COLORS.length)) break;
  }
  return matches;
}
