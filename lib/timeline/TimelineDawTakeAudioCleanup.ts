export function decideTimelineDawTakeAudioCleanup(input: {
  remainingReferenceCount: number | null;
  referenceCheckFailed: boolean;
}): { removeStoredAudio: boolean; warning: string | null } {
  if (input.referenceCheckFailed || input.remainingReferenceCount === null) {
    return {
      removeStoredAudio: false,
      warning: "The take was deleted, but its unused private audio could not be checked for cleanup. The recording list is accurate; storage cleanup can be retried later.",
    };
  }
  if ((input.remainingReferenceCount ?? 0) > 0) {
    return { removeStoredAudio: false, warning: null };
  }
  return { removeStoredAudio: true, warning: null };
}

export function timelineDawStoredAudioCleanupWarning() {
  return "The take was deleted, but its unused private audio could not be removed from storage. The recording list is accurate; storage cleanup can be retried later.";
}
