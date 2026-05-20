"use client";

import { useCallback } from "react";

import {
  closeTrackMatcherAudioContext,
  createEmptyTrackMatcherProPitchRuntimeState,
  prepareTrackMatcherProPitchRuntime,
  type TrackMatcherProPitchRuntimeState,
} from "../trackMatcherProPitchDspRuntime";
import { getAudioTrackInput } from "./trackMatcherControllerMath";
import type {
  TrackMatcherDeckId,
  TrackMatcherTrackState,
} from "./trackMatcherControllerTypes";

export function useTrackMatcherProPitchPreparation({
  setRuntimeA,
  setRuntimeB,
}: {
  setRuntimeA: React.Dispatch<
    React.SetStateAction<TrackMatcherProPitchRuntimeState>
  >;
  setRuntimeB: React.Dispatch<
    React.SetStateAction<TrackMatcherProPitchRuntimeState>
  >;
}) {
  const closeRuntime = useCallback(
    (runtime: TrackMatcherProPitchRuntimeState) => {
      closeTrackMatcherAudioContext(runtime.audioContext);
    },
    [],
  );

  const prepareProPitchForTrack = useCallback(
    async (
      deckId: TrackMatcherDeckId,
      file: File,
      track: TrackMatcherTrackState,
    ) => {
      if (deckId === "A") {
        setRuntimeA((currentRuntime) => {
          closeRuntime(currentRuntime);

          return {
            ...createEmptyTrackMatcherProPitchRuntimeState(),
            status: "loading",
          };
        });
      } else {
        setRuntimeB((currentRuntime) => {
          closeRuntime(currentRuntime);

          return {
            ...createEmptyTrackMatcherProPitchRuntimeState(),
            status: "loading",
          };
        });
      }

      const preparedRuntime = await prepareTrackMatcherProPitchRuntime(
        getAudioTrackInput(track),
        file,
      );

      if (deckId === "A") {
        setRuntimeA((currentRuntime) => {
          closeRuntime(currentRuntime);
          return preparedRuntime;
        });
        return;
      }

      setRuntimeB((currentRuntime) => {
        closeRuntime(currentRuntime);
        return preparedRuntime;
      });
    },
    [closeRuntime, setRuntimeA, setRuntimeB],
  );

  return {
    closeRuntime,
    prepareProPitchForTrack,
  };
}
