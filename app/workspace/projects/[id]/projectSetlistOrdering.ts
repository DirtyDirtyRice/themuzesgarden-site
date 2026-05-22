"use client";

import { useEffect, type Dispatch, type SetStateAction } from "react";
import {
  getProjectSetlistOrder,
  sameTrackOrder,
} from "./projectSetlistPersistence";

export function getLinkedTrackIds(linkedTracks: unknown[]): string[] {
  return linkedTracks
    .map((track: any) => String(track?.id ?? "").trim())
    .filter(Boolean);
}

export function reconcileSetlistOrder({
  project,
  linkedTracks,
}: {
  project: unknown;
  linkedTracks: unknown[];
}) {
  const savedOrder = getProjectSetlistOrder(project);
  const linkedIds = getLinkedTrackIds(linkedTracks);

  if (linkedIds.length === 0 && savedOrder.length === 0) {
    return [];
  }

  const linkedIdSet = new Set(linkedIds);
  const savedLinkedOrder = savedOrder.filter((trackId) =>
    linkedIdSet.has(trackId)
  );
  const missingLinkedIds = linkedIds.filter(
    (trackId) => !savedLinkedOrder.includes(trackId)
  );

  return [...savedLinkedOrder, ...missingLinkedIds];
}

export function shouldReplaceSetlistOrder(previousOrder: string[], nextOrder: string[]) {
  return !sameTrackOrder(previousOrder, nextOrder);
}

export function moveTrackInSetlistOrder(
  previousOrder: string[],
  trackId: string,
  direction: "up" | "down"
) {
  const cleanTrackId = String(trackId ?? "").trim();
  if (!cleanTrackId) return previousOrder;

  const nextOrder = previousOrder.slice();
  const currentIndex = nextOrder.indexOf(cleanTrackId);
  if (currentIndex === -1) return previousOrder;

  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= nextOrder.length) return previousOrder;

  const currentTrackId = nextOrder[currentIndex];
  nextOrder[currentIndex] = nextOrder[targetIndex];
  nextOrder[targetIndex] = currentTrackId;

  return nextOrder;
}

export function useReconciledProjectSetlistOrder({
  project,
  linkedTracks,
  setSetlistOrder,
}: {
  project: unknown;
  linkedTracks: unknown[];
  setSetlistOrder: Dispatch<SetStateAction<string[]>>;
}) {
  useEffect(() => {
    if (!project) return;

    const nextOrder = reconcileSetlistOrder({ project, linkedTracks });

    setSetlistOrder((previousOrder) =>
      shouldReplaceSetlistOrder(previousOrder, nextOrder)
        ? nextOrder
        : previousOrder
    );
  }, [project, linkedTracks, setSetlistOrder]);
}
