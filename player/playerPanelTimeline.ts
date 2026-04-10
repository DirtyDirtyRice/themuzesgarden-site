import { useEffect, useRef, useState } from "react";

export function usePlayerPanelTimeline(
  audioEl: React.ReactNode,
  open: boolean
) {
  const audioHostRef = useRef<HTMLDivElement | null>(null);
  const audioDomRef = useRef<HTMLAudioElement | null>(null);

  const [durSec, setDurSec] = useState<number>(0);
  const [curSec, setCurSec] = useState<number>(0);

  const [isSeeking, setIsSeeking] = useState(false);
  const [seekSec, setSeekSec] = useState<number>(0);

  useEffect(() => {
    const host = audioHostRef.current;
    if (!host) return;

    const el = host.querySelector("audio") as HTMLAudioElement | null;
    audioDomRef.current = el;

    if (!el) {
      setDurSec(0);
      setCurSec(0);
      return;
    }

    const audio = el;

    function pull() {
      const d = Number.isFinite(audio.duration) ? audio.duration : 0;
      const c = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;

      setDurSec(d > 0 ? d : 0);

      if (!isSeeking) {
        setCurSec(c >= 0 ? c : 0);
      }
    }

    pull();

    audio.addEventListener("loadedmetadata", pull);
    audio.addEventListener("durationchange", pull);
    audio.addEventListener("timeupdate", pull);

    return () => {
      audio.removeEventListener("loadedmetadata", pull);
      audio.removeEventListener("durationchange", pull);
      audio.removeEventListener("timeupdate", pull);
    };
  }, [audioEl, open, isSeeking]);

  function commitSeek(sec: number) {
    const el = audioDomRef.current;
    if (!el) return;

    const d = Number.isFinite(el.duration) ? el.duration : 0;
    const clamped = Math.max(0, Math.min(d > 0 ? d : sec, sec));

    try {
      el.currentTime = clamped;
      setCurSec(clamped);
    } catch {
      // ignore
    }
  }

  function finishSeek() {
    if (!isSeeking) return;
    commitSeek(seekSec);
    setIsSeeking(false);
  }

  return {
    audioHostRef,
    durSec,
    curSec,
    isSeeking,
    seekSec,
    setIsSeeking,
    setSeekSec,
    finishSeek,
  };
}