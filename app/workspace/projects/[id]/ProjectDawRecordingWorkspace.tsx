"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  TimelineDawPcmCaptureBuffer,
  encodeTimelineDawPcmWav,
} from "../../../../lib/timeline/TimelineDawPcmCapture";
import { encodeTimelineDawMp3 } from "../../../../lib/timeline/TimelineDawMp3Encoder";
import { parseTimelineDawCaptureWorkletMessage } from "../../../../lib/timeline/TimelineDawCaptureWorkletProtocol";
import { uploadDawRenderSource, type DawRenderSource } from "./projectDawApi";
import {
  createDawRecordingTakeAudition,
  deleteDawRecordingTake,
  loadDawRecordingTakes,
  preferDawRecordingTake,
  registerDawRecordingTake,
  type DawRecordingTake,
} from "./projectDawApi";
import type { DawSession } from "./projectDawTypes";

export const DAW_RECORDED_SOURCE_EVENT = "the-muzes-garden:daw-recorded-source";

export type DawRecordedSourceEventDetail = {
  source: DawRenderSource;
  audio: {
    sampleRate: number;
    channelCount: number;
    frameCount: number;
    durationSeconds: number;
  };
};

const button = "rounded-xl border border-white/25 bg-white px-4 py-2 text-sm font-black text-black disabled:cursor-not-allowed disabled:opacity-40";

type UploadedTake = DawRecordingTake & { mp3Url?: string };

export default function ProjectDawRecordingWorkspace({ session }: { session: DawSession }) {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState("");
  const [takeName, setTakeName] = useState(`${session.name} Take 1`);
  const [outputFormat, setOutputFormat] = useState<"wav" | "mp3">("wav");
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [auditionUrls, setAuditionUrls] = useState<Record<string, string>>({});
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [takes, setTakes] = useState<UploadedTake[]>([]);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<AudioNode | null>(null);
  const silenceRef = useRef<GainNode | null>(null);
  const captureRef = useRef<TimelineDawPcmCaptureBuffer | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef(0);
  const captureErrorRef = useRef<Error | null>(null);
  const mp3UrlsRef = useRef<string[]>([]);

  const scanDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    const next = (await navigator.mediaDevices.enumerateDevices())
      .filter((device) => device.kind === "audioinput");
    setDevices(next);
    setDeviceId((current) =>
      next.some((device) => device.deviceId === current)
        ? current
        : next[0]?.deviceId ?? "");
  }, []);

  useEffect(() => {
    void scanDevices();
    const media = navigator.mediaDevices;
    if (!media?.addEventListener) return;
    media.addEventListener("devicechange", scanDevices);
    return () => media.removeEventListener("devicechange", scanDevices);
  }, [scanDevices]);

  useEffect(() => {
    let active = true;
    void loadDawRecordingTakes(session.id)
      .then(({ takes: stored }) => { if (active) setTakes(stored); })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Recording takes could not be loaded."); });
    return () => { active = false; };
  }, [session.id]);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    silenceRef.current?.disconnect();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if (contextRef.current) void contextRef.current.close();
    mp3UrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  async function startRecording() {
    if (recording || uploading) return;
    setError(null);
    captureErrorRef.current = null;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
          channelCount: { ideal: 2 },
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      const context = new AudioContext({ latencyHint: "interactive" });
      await context.resume();
      const source = context.createMediaStreamSource(stream);
      const channelCount = Math.max(
        1,
        Math.min(2, stream.getAudioTracks()[0]?.getSettings().channelCount ?? source.channelCount ?? 1),
      );
      const capture = new TimelineDawPcmCaptureBuffer(
        context.sampleRate,
        channelCount,
        context.sampleRate * 60 * 30,
      );
      const legacyProcessor = context.createScriptProcessor(4096, channelCount, channelCount);
      const silence = context.createGain();
      silence.gain.value = 0;
      legacyProcessor.onaudioprocess = (event) => {
        try {
          const channels = Array.from({ length: channelCount }, (_, channel) =>
            event.inputBuffer.numberOfChannels > channel
              ? new Float32Array(event.inputBuffer.getChannelData(channel))
              : new Float32Array(event.inputBuffer.length));
          capture.append(channels);
        } catch (cause) {
          captureErrorRef.current = cause instanceof Error ? cause : new Error("PCM capture failed.");
        }
      };
      let processor: AudioNode = legacyProcessor;
      if (context.audioWorklet && typeof AudioWorkletNode !== "undefined") {
        try {
          await context.audioWorklet.addModule("/daw-pcm-capture-worklet.js");
          const worklet = new AudioWorkletNode(context, "timeline-daw-pcm-capture", {
            numberOfInputs: 1,
            numberOfOutputs: 1,
            outputChannelCount: [channelCount],
            channelCount,
            channelCountMode: "explicit",
            processorOptions: { channelCount },
          });
          worklet.port.onmessage = (event: MessageEvent<unknown>) => {
            try {
              capture.append(parseTimelineDawCaptureWorkletMessage(event.data, channelCount));
            } catch (cause) {
              captureErrorRef.current = cause instanceof Error ? cause : new Error("PCM worklet message failed.");
            }
          };
          processor = worklet;
        } catch {
          processor = legacyProcessor;
        }
      }
      source.connect(processor);
      processor.connect(silence);
      silence.connect(context.destination);
      streamRef.current = stream;
      contextRef.current = context;
      sourceRef.current = source;
      processorRef.current = processor;
      silenceRef.current = silence;
      captureRef.current = capture;
      startedAtRef.current = performance.now();
      setElapsedSeconds(0);
      timerRef.current = setInterval(() => {
        setElapsedSeconds(Math.floor((performance.now() - startedAtRef.current) / 1000));
      }, 250);
      setRecording(true);
      await scanDevices();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Microphone recording could not start.");
      await releaseCapture();
    }
  }

  async function releaseCapture(): Promise<void> {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    silenceRef.current?.disconnect();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    const context = contextRef.current;
    processorRef.current = null;
    sourceRef.current = null;
    silenceRef.current = null;
    streamRef.current = null;
    contextRef.current = null;
    if (context && context.state !== "closed") await context.close();
  }

  async function stopRecording() {
    if (!recording) return;
    setRecording(false);
    setUploading(true);
    setError(null);
    const capture = captureRef.current;
    captureRef.current = null;
    await releaseCapture();
    try {
      if (captureErrorRef.current) throw captureErrorRef.current;
      if (!capture) throw new Error("PCM capture was not available.");
      const pcm = capture.finalizePcm();
      const wav = encodeTimelineDawPcmWav(pcm.channels, pcm.sampleRate);
      const mp3Bytes = outputFormat === "mp3" ? encodeTimelineDawMp3(pcm.channels, pcm.sampleRate) : null;
      const safeName = takeName.trim().replace(/[^a-zA-Z0-9._-]+/g, "-") || "recorded-take";
      const file = new File(
        [wav.bytes.slice().buffer],
        safeName.toLowerCase().endsWith(".wav") ? safeName : `${safeName}.wav`,
        { type: "audio/wav" },
      );
      const uploaded = await uploadDawRenderSource(session.id, file);
      const detail: DawRecordedSourceEventDetail = uploaded;
      const { take } = await registerDawRecordingTake(session.id, uploaded);
      let mp3Url: string | undefined;
      if (mp3Bytes) {
        mp3Url = URL.createObjectURL(new Blob([mp3Bytes.slice().buffer], { type: "audio/mpeg" }));
        mp3UrlsRef.current.push(mp3Url);
      }
      setTakes((current) => [{ ...take, mp3Url }, ...current]);
      window.dispatchEvent(new CustomEvent<DawRecordedSourceEventDetail>(
        DAW_RECORDED_SOURCE_EVENT,
        { detail },
      ));
      setTakeName(`${session.name} Take ${takes.length + 2}`);
      setElapsedSeconds(0);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Recorded WAV could not be uploaded.");
    } finally {
      setUploading(false);
    }
  }

  async function auditionTake(take: UploadedTake) {
    setUploading(true);
    setError(null);
    try {
      const result = await createDawRecordingTakeAudition(session.id, take.id);
      setAuditionUrls((current) => ({ ...current, [take.id]: result.auditionUrl }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Recording audition could not be prepared.");
    } finally {
      setUploading(false);
    }
  }

  async function preferTake(take: UploadedTake) {
    setUploading(true);
    setError(null);
    try {
      const { take: preferred } = await preferDawRecordingTake(session.id, take.id);
      setTakes((current) => current.map((item) => ({ ...item, preferred: item.id === preferred.id })));
      window.dispatchEvent(new CustomEvent<DawRecordedSourceEventDetail>(
        DAW_RECORDED_SOURCE_EVENT,
        { detail: { source: preferred.source, audio: preferred.audio } },
      ));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Preferred take could not be updated.");
    } finally {
      setUploading(false);
    }
  }

  async function deleteTake(take: UploadedTake) {
    if (!window.confirm(`Delete ${take.name} and its private WAV permanently?`)) return;
    setUploading(true);
    setError(null);
    try {
      await deleteDawRecordingTake(session.id, take.id);
      setTakes((current) => current.filter((item) => item.id !== take.id));
      if (take.mp3Url) {
        URL.revokeObjectURL(take.mp3Url);
        mp3UrlsRef.current = mp3UrlsRef.current.filter((url) => url !== take.mp3Url);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Recording take could not be deleted.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="rounded-3xl border border-white/15 bg-[#080808] p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-rose-300">Recording</p>
          <h2 className="mt-2 text-2xl font-black">Live PCM capture</h2>
          <p className="mt-2 max-w-2xl text-sm text-white/60">
            WAV is the default private master. You can also create a 192 kbps MP3 copy for quick sharing.
          </p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase ${recording ? "border-red-300/40 bg-red-400/15 text-red-200" : "border-white/15 bg-white/5 text-white/55"}`}>
          {recording ? `Recording ${elapsedSeconds}s` : uploading ? "Uploading" : "Ready"}
        </span>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <select
          className="rounded-xl border border-white/20 bg-black px-3 py-2 text-white"
          value={deviceId}
          onChange={(event) => setDeviceId(event.target.value)}
          disabled={recording || uploading}
          aria-label="Recording input"
        >
          {!devices.length ? <option value="">No audio inputs found</option> : null}
          {devices.map((device, index) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `Audio input ${index + 1}`}
            </option>
          ))}
        </select>
        <input
          className="rounded-xl border border-white/20 bg-black px-3 py-2 text-white"
          value={takeName}
          onChange={(event) => setTakeName(event.target.value)}
          disabled={recording || uploading}
          aria-label="Recorded take name"
        />
        <select
          className="rounded-xl border border-white/20 bg-black px-3 py-2 text-white"
          value={outputFormat}
          onChange={(event) => setOutputFormat(event.target.value as "wav" | "mp3")}
          disabled={recording || uploading}
          aria-label="Recording output format"
        >
          <option value="wav">WAV master (default)</option>
          <option value="mp3">WAV master + MP3 copy</option>
        </select>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className={button} disabled={recording || uploading || !devices.length} onClick={() => void startRecording()}>Start Recording</button>
        <button type="button" className={button} disabled={!recording} onClick={() => void stopRecording()}>Stop &amp; Save</button>
        <button type="button" className={button} disabled={recording || uploading} onClick={() => void scanDevices()}>Rescan Inputs</button>
      </div>
      {error ? <p role="alert" className="mt-4 text-sm text-red-200">{error}</p> : null}
      {takes.length ? (
        <ol className="mt-5 grid gap-2">
          {takes.map((take) => (
            <li key={take.source.uri} className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-black">{take.name}</p>
                {take.preferred ? <span className="rounded-full bg-emerald-400/15 px-2 py-1 text-xs font-black text-emerald-200">Preferred</span> : null}
              </div>
              <p className="mt-1 text-xs text-white/45">
                {take.audio.channelCount} channel ? {take.audio.sampleRate.toLocaleString()} Hz ? {take.audio.durationSeconds.toFixed(2)}s ? privately uploaded
              </p>
              {take.mp3Url ? (
                <a className="mt-2 inline-block text-sm font-black text-rose-300 hover:text-rose-200" href={take.mp3Url} download={take.name.replace(/\.wav$/i, ".mp3")}>Download MP3 copy</a>
              ) : null}
              {auditionUrls[take.id] ? (
                <audio className="mt-3 w-full" controls preload="metadata" src={auditionUrls[take.id]} />
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className={button} disabled={uploading} onClick={() => void auditionTake(take)}>{auditionUrls[take.id] ? "Refresh Audition" : "Audition Take"}</button>
                <button type="button" className={button} disabled={uploading || take.preferred} onClick={() => void preferTake(take)}>Use as Preferred</button>
                <button type="button" className={button} disabled={uploading} onClick={() => void deleteTake(take)}>Delete Take</button>
              </div>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
