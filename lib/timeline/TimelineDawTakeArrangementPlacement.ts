import type { DawRecordedSourceEventDetail } from "./TimelineDawRecordedSourceEvent";

export type TimelineDawArrangementTake = {
  name: string;
  source: DawRecordedSourceEventDetail["source"];
  audio: DawRecordedSourceEventDetail["audio"];
};

export function createTimelineDawTakeArrangementPlacement(
  take: TimelineDawArrangementTake,
): { detail: DawRecordedSourceEventDetail; confirmation: string } {
  return {
    detail: { source: take.source, audio: take.audio },
    confirmation: `${take.name} is being added to Tracks at the current play position.`,
  };
}
