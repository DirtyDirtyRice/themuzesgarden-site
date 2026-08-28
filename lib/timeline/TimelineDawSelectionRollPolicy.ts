export type TimelineDawSelectionRollPlan = {
  selectionStartTick: number;
  selectionEndTick: number;
  playbackStartTick: number;
  playbackEndTick: number;
  preRollTicks: number;
  postRollTicks: number;
};

type TimelineSignaturePoint = {
  tick: number;
  numerator: number;
  denominator: number;
};

function ticksPerBar(ppq: number, signature: TimelineSignaturePoint) {
  return Math.round(ppq * signature.numerator * (4 / signature.denominator));
}

function signatureAtTick(signatureMap: TimelineSignaturePoint[], tick: number) {
  return [...signatureMap]
    .sort((left, right) => left.tick - right.tick)
    .filter((point) => point.tick <= tick)
    .at(-1) ?? { tick: 0, numerator: 4, denominator: 4 };
}

export function planTimelineDawSelectionRoll({
  selectionStartTick,
  selectionEndTick,
  preRollBars,
  postRollBars,
  ppq,
  signatureMap,
}: {
  selectionStartTick: number;
  selectionEndTick: number;
  preRollBars: number;
  postRollBars: number;
  ppq: number;
  signatureMap: TimelineSignaturePoint[];
}): TimelineDawSelectionRollPlan {
  if (!Number.isSafeInteger(selectionStartTick) || selectionStartTick < 0) {
    throw new Error("Selection start must be a non-negative whole tick.");
  }
  if (!Number.isSafeInteger(selectionEndTick) || selectionEndTick <= selectionStartTick) {
    throw new Error("Selection end must be after selection start.");
  }
  if (!Number.isInteger(preRollBars) || preRollBars < 0 || preRollBars > 8) {
    throw new Error("Pre-roll must be between 0 and 8 whole bars.");
  }
  if (!Number.isInteger(postRollBars) || postRollBars < 0 || postRollBars > 8) {
    throw new Error("Post-roll must be between 0 and 8 whole bars.");
  }
  if (!Number.isSafeInteger(ppq) || ppq <= 0) {
    throw new Error("PPQ must be a positive whole number.");
  }

  const preRollTicks = ticksPerBar(
    ppq,
    signatureAtTick(signatureMap, selectionStartTick),
  ) * preRollBars;
  const postRollTicks = ticksPerBar(
    ppq,
    signatureAtTick(signatureMap, selectionEndTick),
  ) * postRollBars;

  return {
    selectionStartTick,
    selectionEndTick,
    playbackStartTick: Math.max(0, selectionStartTick - preRollTicks),
    playbackEndTick: selectionEndTick + postRollTicks,
    preRollTicks,
    postRollTicks,
  };
}
