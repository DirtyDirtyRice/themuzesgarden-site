export function applyTimelineDawPreferredTakeDeletion<T extends { id: string; preferred: boolean }>(input: {
  takes: T[];
  deletedTakeId: string;
  deletedTakeWasPreferred: boolean;
  replacementPreferredTakeId: string | null;
}): T[] {
  const remaining = input.takes.filter((take) => take.id !== input.deletedTakeId);
  if (!input.deletedTakeWasPreferred) return remaining;
  return remaining.map((take) => ({
    ...take,
    preferred: take.id === input.replacementPreferredTakeId,
  }));
}

export function timelineDawPreferredTakeReplacementWarning() {
  return "The preferred take was deleted, but another saved take could not be selected automatically. Choose Use as Preferred on the performance you want to keep.";
}
