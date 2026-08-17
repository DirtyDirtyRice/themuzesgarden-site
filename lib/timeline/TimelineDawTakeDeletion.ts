export function cleanTimelineDawDeletedTakeState(input: {
  deletedTakeId: string;
  auditionUrls: Record<string, string>;
  reviewingTakeId: string | null;
}): { auditionUrls: Record<string, string>; reviewingTakeId: string | null } {
  const auditionUrls = { ...input.auditionUrls };
  delete auditionUrls[input.deletedTakeId];
  return {
    auditionUrls,
    reviewingTakeId: input.reviewingTakeId === input.deletedTakeId ? null : input.reviewingTakeId,
  };
}
