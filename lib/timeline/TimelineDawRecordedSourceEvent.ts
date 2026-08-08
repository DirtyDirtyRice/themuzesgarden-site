export const DAW_RECORDED_SOURCE_EVENT = "the-muzes-garden:daw-recorded-source";

export type DawRecordedSourceEventDetail = {
  source: {
    id: string;
    name: string;
    uri: string;
    byteLength: number;
    checksum: string;
  };
  audio: {
    sampleRate: number;
    channelCount: number;
    frameCount: number;
    durationSeconds: number;
  };
};
