"use client";

import { useEffect, useRef, useState } from "react";

import TrackMatcherControls from "./TrackMatcherControls";
import TrackMatcherDetailsLink from "./TrackMatcherDetailsLink";
import TrackMatcherUploadPanel from "./TrackMatcherUploadPanel";

export type TrackMode = "major" | "minor";

export const TRACK_MATCHER_KEYS = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
] as const;

type TrackMatcherTrackState = {
  bpm: number;
  keyIndex: number;
  mode: TrackMode;
  trackName: string;
  fileUrl: string | null;
};

const DEFAULT_TRACK_A: TrackMatcherTrackState = {
  bpm: 100,
  keyIndex: 0,
  mode: "major",
  trackName: "",
  fileUrl: null,
};

const DEFAULT_TRACK_B: TrackMatcherTrackState = {
  bpm: 120,
  keyIndex: 7,
  mode: "minor",
  trackName: "",
  fileUrl: null,
};

function clampBpm(value: number) {
  return Math.min(180, Math.max(60, Number(value.toFixed(2))));
}

function revokeFileUrl(fileUrl: string | null) {
  if (!fileUrl) return;
  window.URL.revokeObjectURL(fileUrl);
}

export default function TrackMatcherController() {
  const [trackA, setTrackA] = useState<TrackMatcherTrackState>(DEFAULT_TRACK_A);
  const [trackB, setTrackB] = useState<TrackMatcherTrackState>(DEFAULT_TRACK_B);
  const [autoSyncBToA, setAutoSyncBToA] = useState(false);
  const [nudgeAmount] = useState(0.05);

  const audioRefA = useRef<HTMLAudioElement | null>(null);
  const audioRefB = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRefA.current) audioRefA.current.playbackRate = trackA.bpm / 100;
  }, [trackA.bpm]);

  useEffect(() => {
    if (audioRefB.current) audioRefB.current.playbackRate = trackB.bpm / 100;
  }, [trackB.bpm]);

  useEffect(() => {
    if (!autoSyncBToA) return;

    const syncInterval = window.setInterval(() => {
      setTrackB((currentTrackB) => {
        const difference = trackA.bpm - currentTrackB.bpm;

        if (Math.abs(difference) < 0.05) {
          return { ...currentTrackB, bpm: trackA.bpm };
        }

        return {
          ...currentTrackB,
          bpm: clampBpm(currentTrackB.bpm + difference * 0.25),
        };
      });
    }, 300);

    return () => window.clearInterval(syncInterval);
  }, [autoSyncBToA, trackA.bpm]);

  useEffect(() => {
    return () => {
      revokeFileUrl(trackA.fileUrl);
      revokeFileUrl(trackB.fileUrl);
    };
  }, [trackA.fileUrl, trackB.fileUrl]);

  const setTrackAFile = (file: File) => {
    const nextUrl = window.URL.createObjectURL(file);

    setTrackA((currentTrackA) => {
      revokeFileUrl(currentTrackA.fileUrl);
      return { ...currentTrackA, trackName: file.name, fileUrl: nextUrl };
    });
  };

  const setTrackBFile = (file: File) => {
    const nextUrl = window.URL.createObjectURL(file);

    setTrackB((currentTrackB) => {
      revokeFileUrl(currentTrackB.fileUrl);
      return { ...currentTrackB, trackName: file.name, fileUrl: nextUrl };
    });
  };

  const setTrackABpm = (bpm: number) => {
    setTrackA((currentTrackA) => ({ ...currentTrackA, bpm: clampBpm(bpm) }));
  };

  const setTrackBBpm = (bpm: number) => {
    setTrackB((currentTrackB) => ({ ...currentTrackB, bpm: clampBpm(bpm) }));
  };

  const setTrackAKeyIndex = (keyIndex: number) => {
    setTrackA((currentTrackA) => ({ ...currentTrackA, keyIndex }));
  };

  const setTrackBKeyIndex = (keyIndex: number) => {
    setTrackB((currentTrackB) => ({ ...currentTrackB, keyIndex }));
  };

  const setTrackAMode = (mode: TrackMode) => {
    setTrackA((currentTrackA) => ({ ...currentTrackA, mode }));
  };

  const setTrackBMode = (mode: TrackMode) => {
    setTrackB((currentTrackB) => ({ ...currentTrackB, mode }));
  };

  const playBoth = () => {
    if (!audioRefA.current || !audioRefB.current) return;

    audioRefA.current.currentTime = 0;
    audioRefB.current.currentTime = 0;

    void audioRefA.current.play();
    void audioRefB.current.play();
  };

  const pauseBoth = () => {
    audioRefA.current?.pause();
    audioRefB.current?.pause();
  };

  const stopBoth = () => {
    if (audioRefA.current) {
      audioRefA.current.pause();
      audioRefA.current.currentTime = 0;
    }

    if (audioRefB.current) {
      audioRefB.current.pause();
      audioRefB.current.currentTime = 0;
    }
  };

  const nudgeBBackward = () => {
    if (!audioRefB.current) return;
    audioRefB.current.currentTime = Math.max(0, audioRefB.current.currentTime - nudgeAmount);
  };

  const nudgeBForward = () => {
    if (!audioRefB.current) return;

    audioRefB.current.currentTime = Math.min(
      audioRefB.current.duration || Number.POSITIVE_INFINITY,
      audioRefB.current.currentTime + nudgeAmount,
    );
  };

  const resetBToStart = () => {
    if (!audioRefB.current) return;
    audioRefB.current.currentTime = 0;
  };

  const matchBToA = () => {
    setTrackB((currentTrackB) => ({
      ...currentTrackB,
      bpm: trackA.bpm,
      keyIndex: trackA.keyIndex,
      mode: trackA.mode,
    }));
  };

  const matchAToB = () => {
    setTrackA((currentTrackA) => ({
      ...currentTrackA,
      bpm: trackB.bpm,
      keyIndex: trackB.keyIndex,
      mode: trackB.mode,
    }));
  };

  return (
    <main className="min-h-screen bg-black p-8 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl">
            <div className="text-2xl font-bold">Track Matcher</div>
            <p className="mt-2 text-sm text-white/60">
              Load Track A and Track B. Use Details for how syncing, BPM, key controls, and nudge timing work.
            </p>
          </div>

          <div className="w-full max-w-sm">
            <TrackMatcherDetailsLink />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <TrackMatcherUploadPanel
            audioRef={audioRefA}
            bpm={trackA.bpm}
            fileUrl={trackA.fileUrl}
            keyIndex={trackA.keyIndex}
            mode={trackA.mode}
            onBpmChange={setTrackABpm}
            onFileSelect={setTrackAFile}
            onKeyIndexChange={setTrackAKeyIndex}
            onModeChange={setTrackAMode}
            title="Track A"
            trackName={trackA.trackName}
          />

          <TrackMatcherUploadPanel
            audioRef={audioRefB}
            bpm={trackB.bpm}
            fileUrl={trackB.fileUrl}
            keyIndex={trackB.keyIndex}
            mode={trackB.mode}
            onBpmChange={setTrackBBpm}
            onFileSelect={setTrackBFile}
            onKeyIndexChange={setTrackBKeyIndex}
            onModeChange={setTrackBMode}
            title="Track B"
            trackName={trackB.trackName}
          />
        </div>

        <TrackMatcherControls
          autoSyncBToA={autoSyncBToA}
          onMatchAToB={matchAToB}
          onMatchBToA={matchBToA}
          onNudgeBBackward={nudgeBBackward}
          onNudgeBForward={nudgeBForward}
          onPauseBoth={pauseBoth}
          onPlayBoth={playBoth}
          onResetBToStart={resetBToStart}
          onStopBoth={stopBoth}
          onToggleAutoSync={() => setAutoSyncBToA((current) => !current)}
        />
      </div>
    </main>
  );
}