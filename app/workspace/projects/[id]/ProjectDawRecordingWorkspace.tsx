"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  TimelineDawPcmCaptureBuffer,
  encodeTimelineDawPcmWav,
} from "../../../../lib/timeline/TimelineDawPcmCapture";
import { encodeTimelineDawMp3 } from "../../../../lib/timeline/TimelineDawMp3Encoder";
import { parseTimelineDawCaptureWorkletMessage } from "../../../../lib/timeline/TimelineDawCaptureWorkletProtocol";
import { analyzeTimelineDawInputLevel } from "../../../../lib/timeline/TimelineDawInputLevel";
import { createTimelineDawCountIn, type TimelineDawCountInBeat } from "../../../../lib/timeline/TimelineDawCountIn";
import { getTimelineDawRecordingCueBeat } from "../../../../lib/timeline/TimelineDawRecordingCue";
import { createTimelineDawRecordingRecoveryView } from "../../../../lib/timeline/TimelineDawRecordingRecovery";
import {
  assessTimelineDawRecordingPreflight,
  type TimelineDawRecordingPreflightResult,
} from "../../../../lib/timeline/TimelineDawRecordingPreflight";
import { loadDawRecordingReadiness, recordDawRecordingReadiness, uploadDawRenderSource } from "./projectDawApi";
import {
  getTimelineDawRestoredDeviceWarning,
  parseTimelineDawRecordingSetup,
  timelineDawRecordingSetupKey,
  type TimelineDawRecordingEvidence,
} from "../../../../lib/timeline/TimelineDawRecordingSetup";
import {
  assessTimelineDawRecordingMonitoring,
  type TimelineDawMonitoringMode,
} from "../../../../lib/timeline/TimelineDawRecordingMonitoring";
import {
  createDawRecordingTakeAudition,
  deleteDawRecordingTake,
  loadDawRecordingTakes,
  preferDawRecordingTake,
  registerDawRecordingTake,
  reviewDawRecordingTake,
  type DawRecordingPlan,
  type DawRecordingTake,
} from "./projectDawApi";
import type { DawSession } from "./projectDawTypes";
import { DAW_RECORDED_SOURCE_EVENT, type DawRecordedSourceEventDetail } from "@/lib/timeline/TimelineDawRecordedSourceEvent";
import { TIMELINE_DAW_LOCAL_ACTIVITY_EVENT } from "@/lib/timeline/TimelineDawSafeExitPolicy";
import TimelineDawTakeCompWorkspace from "@/app/components/TimelineDawTakeCompWorkspace";


const button = "rounded-xl border border-white/25 bg-white px-4 py-2 text-sm font-black text-black disabled:cursor-not-allowed disabled:opacity-40";

type UploadedTake = DawRecordingTake & { mp3Url?: string };
type RecoverableRecording = {
  file: File;
  downloadUrl: string;
  plan: DawRecordingPlan;
  uploaded: DawRecordedSourceEventDetail | null;
  mp3Url?: string;
  failure: string;
};

export default function ProjectDawRecordingWorkspace({ session }: { session: DawSession }) {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [devicesScanned, setDevicesScanned] = useState(false);
  const [deviceId, setDeviceId] = useState("");
  const [takeName, setTakeName] = useState(`${session.name} Take 1`);
  const [outputFormat, setOutputFormat] = useState<"wav" | "mp3">("wav");
  const [recordingMode, setRecordingMode] = useState<DawRecordingPlan["mode"]>("normal");
  const [countInBars, setCountInBars] = useState(0);
  const [bpm, setBpm] = useState(120);
  const [beatsPerBar, setBeatsPerBar] = useState(4);
  const [rangeStartSeconds, setRangeStartSeconds] = useState(0);
  const [rangeEndSeconds, setRangeEndSeconds] = useState(4);
  const [loopPasses, setLoopPasses] = useState(3);
  const [recording, setRecording] = useState(false);
  const [countingIn, setCountingIn] = useState(false);
  const [countInBeat, setCountInBeat] = useState<TimelineDawCountInBeat | null>(null);
  const [uploading, setUploading] = useState(false);
  const [auditionUrls, setAuditionUrls] = useState<Record<string, string>>({});
  const [inputPeakDb, setInputPeakDb] = useState(-96);
  const [inputClipped, setInputClipped] = useState(false);
  const [captureMode, setCaptureMode] = useState<"worklet" | "compatibility" | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [takes, setTakes] = useState<UploadedTake[]>([]);
  const [reviewingTakeId, setReviewingTakeId] = useState<string | null>(null);
  const [reviewName, setReviewName] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [preflightBusy, setPreflightBusy] = useState(false);
  const [preflight, setPreflight] = useState<TimelineDawRecordingPreflightResult | null>(null);
  const [latestEvidence, setLatestEvidence] = useState<TimelineDawRecordingEvidence | null>(null);
  const [setupLoaded, setSetupLoaded] = useState(false);
  const [restoredDeviceId, setRestoredDeviceId] = useState("");
  const [monitoringMode, setMonitoringMode] = useState<TimelineDawMonitoringMode>("off");
  const [headphonesConfirmed, setHeadphonesConfirmed] = useState(false);
  const [monitoringLatencyMs, setMonitoringLatencyMs] = useState<number | null>(null);
  const [cueEnabled, setCueEnabled] = useState(false);
  const [cueVolume, setCueVolume] = useState(0.2);
  const [cueAccentEnabled, setCueAccentEnabled] = useState(true);
  const [cueHeadphonesConfirmed, setCueHeadphonesConfirmed] = useState(false);
  const [recovery, setRecovery] = useState<RecoverableRecording | null>(null);
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
  const meterUpdatedAtRef = useRef(0);
  const countInGenerationRef = useRef(0);
  const cueTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recoveryUrlRef = useRef<string | null>(null);

  const scanDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    const next = (await navigator.mediaDevices.enumerateDevices())
      .filter((device) => device.kind === "audioinput");
    setDevices(next);
    setDevicesScanned(true);
    setDeviceId((current) =>
      next.some((device) => device.deviceId === current)
        ? current
        : next[0]?.deviceId ?? "");
  }, []);

  useEffect(() => {
    queueMicrotask(() => void scanDevices());
    const media = navigator.mediaDevices;
    if (!media?.addEventListener) return;
    media.addEventListener("devicechange", scanDevices);
    return () => media.removeEventListener("devicechange", scanDevices);
  }, [scanDevices]);

  useEffect(() => {
    setPreflight(null);
  }, [deviceId]);

  useEffect(() => {
    try {
      const saved = parseTimelineDawRecordingSetup(JSON.parse(localStorage.getItem(timelineDawRecordingSetupKey(session.id)) ?? "null"));
      if (saved) {
        setDeviceId(saved.deviceId); setRestoredDeviceId(saved.deviceId);
        setOutputFormat(saved.outputFormat); setRecordingMode(saved.recordingMode);
        setCountInBars(saved.countInBars); setBpm(saved.bpm); setBeatsPerBar(saved.beatsPerBar);
        setMonitoringMode(saved.monitoringMode);
        setCueEnabled(saved.cue.enabled); setCueVolume(saved.cue.volume); setCueAccentEnabled(saved.cue.accentEnabled);
      }
    } catch {
      localStorage.removeItem(timelineDawRecordingSetupKey(session.id));
    } finally {
      setSetupLoaded(true);
    }
    void loadDawRecordingReadiness(session.id).then(setLatestEvidence).catch(() => setLatestEvidence(null));
  }, [session.id]);

  useEffect(() => {
    if (!setupLoaded) return;
    localStorage.setItem(timelineDawRecordingSetupKey(session.id), JSON.stringify({
      deviceId, outputFormat, recordingMode, countInBars, bpm, beatsPerBar, monitoringMode,
      cue: { enabled: cueEnabled, volume: cueVolume, accentEnabled: cueAccentEnabled },
    }));
  }, [beatsPerBar, bpm, countInBars, cueAccentEnabled, cueEnabled, cueVolume, deviceId, monitoringMode, outputFormat, recordingMode, session.id, setupLoaded]);

  useEffect(() => {
    let active = true;
    void loadDawRecordingTakes(session.id)
      .then(({ takes: stored }) => { if (active) setTakes(stored); })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Recording takes could not be loaded."); });
    return () => { active = false; };
  }, [session.id]);

  useEffect(() => () => {
    countInGenerationRef.current += 1;
    if (cueTimerRef.current) clearTimeout(cueTimerRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    silenceRef.current?.disconnect();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if (contextRef.current) void contextRef.current.close();
    mp3UrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    if (recoveryUrlRef.current) URL.revokeObjectURL(recoveryUrlRef.current);
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent(TIMELINE_DAW_LOCAL_ACTIVITY_EVENT, {
      detail: { sessionId: session.id, recording: recording || countingIn, uploading },
    }));
    return () => {
      window.dispatchEvent(new CustomEvent(TIMELINE_DAW_LOCAL_ACTIVITY_EVENT, {
        detail: { sessionId: session.id, recording: false, uploading: false },
      }));
    };
  }, [countingIn, recording, session.id, uploading]);

  function appendCaptureBlock(capture: TimelineDawPcmCaptureBuffer, channels: Float32Array[]) {
    capture.append(channels);
    const level = analyzeTimelineDawInputLevel(channels);
    if (level.clipped) setInputClipped(true);
    const now = performance.now();
    if (now - meterUpdatedAtRef.current < 100) return;
    meterUpdatedAtRef.current = now;
    setInputPeakDb(level.peakDbfs);
  }

  async function testInputLevel() {
    if (recording || uploading || preflightBusy) return;
    setError(null);
    setPreflight(null);
    setPreflightBusy(true);
    let stream: MediaStream | null = null;
    let context: AudioContext | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      context = new AudioContext({ latencyHint: "interactive" });
      await context.resume();
      const source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      const samples = new Float32Array(analyser.fftSize);
      let peak = 0;
      const finishAt = performance.now() + 1800;
      while (performance.now() < finishAt) {
        analyser.getFloatTimeDomainData(samples);
        for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
        await new Promise((resolve) => window.setTimeout(resolve, 50));
      }
      source.disconnect();
      analyser.disconnect();
      const peakDbfs = peak > 0 ? 20 * Math.log10(peak) : -96;
      const outputLatency = "outputLatency" in context ? context.outputLatency : 0;
      setMonitoringLatencyMs(Math.round((context.baseLatency + outputLatency) * 100_000) / 100);
      const result = assessTimelineDawRecordingPreflight(peakDbfs);
      setPreflight(result);
      const selectedDevice = devices.find((device) => device.deviceId === deviceId);
      const evidence: TimelineDawRecordingEvidence = {
        deviceId, deviceLabel: selectedDevice?.label || "Selected audio input",
        peakDbfs: result.peakDbfs, status: result.status, ready: result.ready,
        observedAt: new Date().toISOString(),
      };
      await recordDawRecordingReadiness(session.id, evidence);
      setLatestEvidence(evidence);
      setRestoredDeviceId(deviceId);
      await scanDevices();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Input level check could not start.");
    } finally {
      stream?.getTracks().forEach((track) => track.stop());
      if (context && context.state !== "closed") await context.close();
      setPreflightBusy(false);
    }
  }

  const restoredDeviceWarning = setupLoaded && devicesScanned
    ? getTimelineDawRestoredDeviceWarning(restoredDeviceId, devices.map((device) => device.deviceId))
    : null;
  const monitoringAssessment = assessTimelineDawRecordingMonitoring({
    mode: monitoringMode,
    latencyMs: monitoringLatencyMs,
    headphonesConfirmed,
  });
  const recoveryView = createTimelineDawRecordingRecoveryView({
    hasRecovery: Boolean(recovery), uploading, uploadedSourceAvailable: Boolean(recovery?.uploaded),
  });

  async function runCountIn(context: AudioContext): Promise<boolean> {
    const beats = createTimelineDawCountIn({ bars: countInBars, beatsPerBar, bpm });
    if (!beats.length) return true;
    const generation = ++countInGenerationRef.current;
    setCountingIn(true);
    for (const beat of beats) {
      if (countInGenerationRef.current !== generation) return false;
      setCountInBeat(beat);
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = beat.accent ? 1320 : 880;
      gain.gain.setValueAtTime(0.0001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.22, context.currentTime + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.07);
      oscillator.connect(gain); gain.connect(context.destination);
      oscillator.start(); oscillator.stop(context.currentTime + 0.08);
      await new Promise((resolve) => window.setTimeout(resolve, beat.delayMs));
      oscillator.disconnect(); gain.disconnect();
    }
    if (countInGenerationRef.current !== generation) return false;
    setCountingIn(false); setCountInBeat(null);
    return true;
  }

  function stopRecordingCue() {
    if (cueTimerRef.current) clearTimeout(cueTimerRef.current);
    cueTimerRef.current = null;
  }

  function startRecordingCue(context: AudioContext) {
    stopRecordingCue();
    if (!cueEnabled) return;
    let beatIndex = 0;
    const play = () => {
      if (context.state === "closed") return;
      const cue = getTimelineDawRecordingCueBeat({
        beatIndex, beatsPerBar, bpm,
        settings: { enabled: cueEnabled, volume: cueVolume, accentEnabled: cueAccentEnabled },
      });
      const oscillator = context.createOscillator(), gain = context.createGain();
      oscillator.frequency.value = cue.frequencyHz;
      gain.gain.setValueAtTime(0.0001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(cue.gain, context.currentTime + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.05);
      oscillator.connect(gain); gain.connect(context.destination);
      oscillator.start(); oscillator.stop(context.currentTime + 0.06);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
      beatIndex += 1;
      cueTimerRef.current = setTimeout(play, cue.intervalMs);
    };
    play();
  }

  async function cancelCountIn() {
    countInGenerationRef.current += 1;
    setCountingIn(false); setCountInBeat(null);
    await releaseCapture();
  }

  async function startRecording() {
    if (recording || uploading || countingIn) return;
    setError(null);
    captureErrorRef.current = null;
    setInputPeakDb(-96);
    setInputClipped(false);
    setCaptureMode(null);
    meterUpdatedAtRef.current = 0;
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
      streamRef.current = stream;
      contextRef.current = context;
      sourceRef.current = source;
      if (!await runCountIn(context)) return;
      setCaptureMode("compatibility");
      const capture = new TimelineDawPcmCaptureBuffer(
        context.sampleRate,
        channelCount,
        context.sampleRate * 60 * 30,
      );
      const legacyProcessor = context.createScriptProcessor(4096, channelCount, channelCount);
      const silence = context.createGain();
      silence.gain.value = monitoringAssessment.browserGain;
      legacyProcessor.onaudioprocess = (event) => {
        try {
          const channels = Array.from({ length: channelCount }, (_, channel) =>
            event.inputBuffer.numberOfChannels > channel
              ? new Float32Array(event.inputBuffer.getChannelData(channel))
              : new Float32Array(event.inputBuffer.length));
          appendCaptureBlock(capture, channels);
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
              appendCaptureBlock(capture, parseTimelineDawCaptureWorkletMessage(event.data, channelCount));
            } catch (cause) {
              captureErrorRef.current = cause instanceof Error ? cause : new Error("PCM worklet message failed.");
            }
          };
          processor = worklet;
          setCaptureMode("worklet");
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
      startRecordingCue(context);
      await scanDevices();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Microphone recording could not start.");
      await releaseCapture();
    }
  }

  async function releaseCapture(): Promise<void> {
    stopRecordingCue();
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
    let recoverable: RecoverableRecording | null = null;
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
      const rangeStartFrame = Math.round(rangeStartSeconds * pcm.sampleRate);
      const rangeEndFrame = recordingMode === "normal" ? null : Math.round(rangeEndSeconds * pcm.sampleRate);
      const recordingPlan: DawRecordingPlan = {
        mode: recordingMode,
        countInBars,
        beatsPerBar,
        bpm,
        rangeStartFrame,
        rangeEndFrame,
        loopPasses: recordingMode === "loop" ? loopPasses : 1,
        countInCaptured: false,
      };
      let mp3Url: string | undefined;
      if (mp3Bytes) {
        mp3Url = URL.createObjectURL(new Blob([mp3Bytes.slice().buffer], { type: "audio/mpeg" }));
        mp3UrlsRef.current.push(mp3Url);
      }
      const downloadUrl = URL.createObjectURL(file);
      recoveryUrlRef.current = downloadUrl;
      recoverable = { file, downloadUrl, plan: recordingPlan, uploaded: null, mp3Url, failure: "" };
      const uploaded = await uploadDawRenderSource(session.id, file);
      recoverable.uploaded = uploaded;
      const detail: DawRecordedSourceEventDetail = uploaded;
      const { takes: registeredTakes } = await registerDawRecordingTake(session.id, uploaded, recordingPlan);
      setTakes((current) => [...registeredTakes.map((take) => ({ ...take, mp3Url })), ...current]);
      window.dispatchEvent(new CustomEvent<DawRecordedSourceEventDetail>(
        DAW_RECORDED_SOURCE_EVENT,
        { detail },
      ));
      setTakeName(`${session.name} Take ${takes.length + 2}`);
      setElapsedSeconds(0);
      URL.revokeObjectURL(downloadUrl);
      recoveryUrlRef.current = null;
    } catch (cause) {
      const failure = cause instanceof Error ? cause.message : "Recorded WAV could not be uploaded.";
      if (recoverable) setRecovery({ ...recoverable, failure });
      setError(recoverable ? "Private save was interrupted. Your WAV is available in Local Recovery below." : failure);
    } finally {
      setUploading(false);
    }
  }

  async function retryRecoverableRecording() {
    if (!recovery || uploading) return;
    setUploading(true); setError(null);
    try {
      const uploaded = recovery.uploaded ?? await uploadDawRenderSource(session.id, recovery.file);
      if (!recovery.uploaded) setRecovery((current) => current ? { ...current, uploaded } : current);
      const { takes: registeredTakes } = await registerDawRecordingTake(session.id, uploaded, recovery.plan);
      setTakes((current) => [...registeredTakes.map((take) => ({ ...take, mp3Url: recovery.mp3Url })), ...current]);
      window.dispatchEvent(new CustomEvent<DawRecordedSourceEventDetail>(DAW_RECORDED_SOURCE_EVENT, { detail: uploaded }));
      URL.revokeObjectURL(recovery.downloadUrl); recoveryUrlRef.current = null;
      setRecovery(null); setTakeName(`${session.name} Take ${takes.length + 2}`); setElapsedSeconds(0);
    } catch (cause) {
      const failure = cause instanceof Error ? cause.message : "Recovery save failed.";
      setRecovery((current) => current ? { ...current, failure } : current);
      setError("Recovery remains available. The private save did not complete.");
    } finally { setUploading(false); }
  }

  function deleteRecoverableRecording() {
    if (!recovery || !window.confirm("Delete this local recovery WAV? Download it first if you may need it.")) return;
    URL.revokeObjectURL(recovery.downloadUrl); recoveryUrlRef.current = null;
    if (recovery.mp3Url) {
      URL.revokeObjectURL(recovery.mp3Url);
      mp3UrlsRef.current = mp3UrlsRef.current.filter((url) => url !== recovery.mp3Url);
    }
    setRecovery(null); setError(null);
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

  function beginTakeReview(take: UploadedTake) {
    setReviewingTakeId(take.id);
    setReviewName(take.name);
    setReviewNotes(take.notes);
    setReviewRating(take.rating);
    setError(null);
  }

  async function saveTakeReview(take: UploadedTake) {
    setUploading(true);
    setError(null);
    try {
      const { take: reviewed } = await reviewDawRecordingTake(session.id, take.id, {
        name: reviewName,
        notes: reviewNotes,
        rating: reviewRating,
      });
      setTakes((current) => current.map((item) => (
        item.id === reviewed.id ? { ...item, ...reviewed } : item
      )));
      setReviewingTakeId(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Recording take review could not be saved.");
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
          {countingIn && countInBeat ? `Count-in ${countInBeat.bar}:${countInBeat.beat}` : recording ? `Recording ${elapsedSeconds}s` : uploading ? "Uploading" : "Ready"}
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
      <div className="mt-4 rounded-xl border border-sky-300/25 bg-sky-300/[0.05] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black">Input preflight</p>
            <p className="mt-1 text-xs text-white/55">Play or sing at performance volume for two seconds. This check does not save audio.</p>
          </div>
          <button type="button" className={button} disabled={recording || uploading || preflightBusy || !devices.length} onClick={() => void testInputLevel()}>
            {preflightBusy ? "Listening..." : preflight ? "Test Input Again" : "Test Input Level"}
          </button>
        </div>
        {restoredDeviceWarning ? <p role="alert" className="mt-3 text-sm font-bold text-amber-200">{restoredDeviceWarning}</p> : null}
        {!preflight && latestEvidence ? (
          <p className="mt-3 text-xs text-white/55">
            Last private check: {latestEvidence.status} at {latestEvidence.peakDbfs.toFixed(1)} dBFS on {latestEvidence.deviceLabel}, {new Date(latestEvidence.observedAt).toLocaleString()}. Run a fresh check before treating this setup as ready.
          </p>
        ) : null}
        {preflight ? (
          <div className="mt-3" role="status" aria-live="polite">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className={preflight.ready ? "font-black text-emerald-200" : preflight.status === "clipping" ? "font-black text-red-200" : "font-black text-amber-200"}>
                {preflight.status === "ready" ? "Ready to record" : preflight.status === "clipping" ? "Clipping" : preflight.status === "hot" ? "Too hot" : preflight.status === "low" ? "Too quiet" : "No useful signal"}
              </span>
              <span className="font-mono text-white/70">Peak {preflight.peakDbfs.toFixed(1)} dBFS</span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-black">
              <div className={`h-full ${preflight.ready ? "bg-emerald-400" : preflight.status === "clipping" ? "bg-red-400" : "bg-amber-300"}`} style={{ width: `${Math.max(0, Math.min(100, ((preflight.peakDbfs + 60) / 60) * 100))}%` }} />
            </div>
            <p className="mt-2 text-xs text-white/70">{preflight.guidance}</p>
          </div>
        ) : null}
      </div>
      <div className="mt-4 rounded-xl border border-violet-300/25 bg-violet-300/[0.05] p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,14rem)_1fr]">
          <label className="grid gap-1 text-xs font-black uppercase tracking-wide text-white/65">
            Monitoring path
            <select className="rounded-lg border border-white/20 bg-black px-3 py-2 text-white" value={monitoringMode} onChange={(event) => { setMonitoringMode(event.target.value as TimelineDawMonitoringMode); setHeadphonesConfirmed(false); }} disabled={recording || uploading}>
              <option value="off">Off (silent capture)</option>
              <option value="direct">Hardware/direct monitoring</option>
              <option value="browser">Browser monitoring</option>
            </select>
          </label>
          <div className="self-end">
            <p className={`text-sm font-bold ${monitoringAssessment.ready ? "text-emerald-200" : "text-amber-200"}`}>{monitoringAssessment.recommendation}</p>
            {monitoringLatencyMs !== null ? <p className="mt-1 text-xs text-white/50">Measured browser latency: {monitoringLatencyMs.toFixed(1)} ms</p> : null}
          </div>
        </div>
        {monitoringMode === "browser" ? (
          <label className="mt-3 flex items-start gap-2 text-sm text-white/75">
            <input type="checkbox" checked={headphonesConfirmed} onChange={(event) => setHeadphonesConfirmed(event.target.checked)} disabled={recording || uploading} />
            I am wearing headphones and speakers are muted.
          </label>
        ) : null}
      </div>
      <div className="mt-4 rounded-xl border border-fuchsia-300/25 bg-fuchsia-300/[0.05] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm font-black">
            <input type="checkbox" checked={cueEnabled} onChange={(event) => { setCueEnabled(event.target.checked); setCueHeadphonesConfirmed(false); }} disabled={recording || countingIn || uploading} />
            Metronome during recording
          </label>
          {cueEnabled ? <span className="text-xs text-fuchsia-200">Clicks play to output only and never enter captured PCM.</span> : null}
        </div>
        {cueEnabled ? (
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <label className="grid gap-1 text-xs font-black uppercase tracking-wide text-white/65">Cue volume
              <input type="range" min={0.05} max={0.5} step={0.05} value={cueVolume} onChange={(event) => setCueVolume(Number(event.target.value))} disabled={recording || countingIn || uploading} />
              <span>{Math.round(cueVolume * 200)}%</span>
            </label>
            <label className="flex items-center gap-2 text-sm text-white/75">
              <input type="checkbox" checked={cueAccentEnabled} onChange={(event) => setCueAccentEnabled(event.target.checked)} disabled={recording || countingIn || uploading} /> Accent beat one
            </label>
            <label className="flex items-center gap-2 text-sm text-white/75">
              <input type="checkbox" checked={cueHeadphonesConfirmed} onChange={(event) => setCueHeadphonesConfirmed(event.target.checked)} disabled={recording || countingIn || uploading} /> Headphones on; speakers muted
            </label>
          </div>
        ) : null}
      </div>
      <div className="mt-4 grid gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 md:grid-cols-4">
        <label className="grid gap-1 text-xs font-black uppercase tracking-wide text-white/65">Mode
          <select className="rounded-lg border border-white/20 bg-black px-3 py-2 text-white" value={recordingMode} onChange={(event) => setRecordingMode(event.target.value as DawRecordingPlan["mode"])} disabled={recording || uploading}>
            <option value="normal">Normal</option><option value="punch">Punch range</option><option value="loop">Loop passes</option>
          </select>
        </label>
        <label className="grid gap-1 text-xs font-black uppercase tracking-wide text-white/65">Count-in bars
          <input type="number" min={0} max={8} className="rounded-lg border border-white/20 bg-black px-3 py-2 text-white" value={countInBars} onChange={(event) => setCountInBars(Number(event.target.value))} disabled={recording || uploading} />
        </label>
        <label className="grid gap-1 text-xs font-black uppercase tracking-wide text-white/65">Tempo
          <input type="number" min={20} max={400} className="rounded-lg border border-white/20 bg-black px-3 py-2 text-white" value={bpm} onChange={(event) => setBpm(Number(event.target.value))} disabled={recording || uploading} />
        </label>
        <label className="grid gap-1 text-xs font-black uppercase tracking-wide text-white/65">Beats per bar
          <input type="number" min={1} max={32} className="rounded-lg border border-white/20 bg-black px-3 py-2 text-white" value={beatsPerBar} onChange={(event) => setBeatsPerBar(Number(event.target.value))} disabled={recording || uploading} />
        </label>
        <label className="grid gap-1 text-xs font-black uppercase tracking-wide text-white/65">Timeline start (seconds)
          <input type="number" min={0} step={0.01} className="rounded-lg border border-white/20 bg-black px-3 py-2 text-white" value={rangeStartSeconds} onChange={(event) => setRangeStartSeconds(Number(event.target.value))} disabled={recording || uploading} />
        </label>
        {recordingMode !== "normal" ? <label className="grid gap-1 text-xs font-black uppercase tracking-wide text-white/65">Range end (seconds)
          <input type="number" min={0} step={0.01} className="rounded-lg border border-white/20 bg-black px-3 py-2 text-white" value={rangeEndSeconds} onChange={(event) => setRangeEndSeconds(Number(event.target.value))} disabled={recording || uploading} />
        </label> : null}
        {recordingMode === "loop" ? <label className="grid gap-1 text-xs font-black uppercase tracking-wide text-white/65">Passes
          <input type="number" min={1} max={99} className="rounded-lg border border-white/20 bg-black px-3 py-2 text-white" value={loopPasses} onChange={(event) => setLoopPasses(Number(event.target.value))} disabled={recording || uploading} />
        </label> : null}
        <p className="self-end text-xs text-white/45">Count-in is excluded from every saved take. Punch and loop passes are placed at the exact range start.</p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className={button} disabled={recoveryView.startHeld || recording || countingIn || uploading || !devices.length || !monitoringAssessment.ready || (cueEnabled && !cueHeadphonesConfirmed) || (recordingMode !== "normal" && rangeEndSeconds <= rangeStartSeconds)} onClick={() => void startRecording()}>Start Recording</button>
        {countingIn ? <button type="button" className={button} onClick={() => void cancelCountIn()}>Cancel Count-In</button> : null}
        <button type="button" className={button} disabled={!recording} onClick={() => void stopRecording()}>Stop &amp; Save</button>
        <button type="button" className={button} disabled={recording || uploading} onClick={() => void scanDevices()}>Rescan Inputs</button>
      </div>
      {countingIn && countInBeat ? (
        <div className="mt-4 rounded-xl border border-amber-300/30 bg-amber-300/10 p-4 text-center" role="status" aria-live="assertive">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-200">Count-in — audio is not recording yet</p>
          <p className="mt-2 text-4xl font-black">Bar {countInBeat.bar} · Beat {countInBeat.beat}</p>
        </div>
      ) : null}
      {captureMode ? (
        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-3">
          <div className="flex items-center justify-between gap-3 text-xs font-black uppercase tracking-wide">
            <span>Input level</span>
            <span className={inputClipped ? "text-red-300" : inputPeakDb > -6 ? "text-amber-200" : "text-emerald-200"}>
              {inputClipped ? "Clipping detected" : `${inputPeakDb.toFixed(1)} dBFS`} ? {captureMode === "worklet" ? "AudioWorklet" : "Compatibility"}
            </span>
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-black">
            <div
              className={`h-full transition-[width] duration-100 ${inputClipped ? "bg-red-400" : inputPeakDb > -6 ? "bg-amber-300" : "bg-emerald-400"}`}
              style={{ width: `${Math.max(0, Math.min(100, ((inputPeakDb + 60) / 60) * 100))}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-white/45">Aim for peaks between -18 and -6 dBFS. Lower the interface gain if clipping is detected.</p>
        </div>
      ) : null}
      {error ? <p role="alert" className="mt-4 text-sm text-red-200">{error}</p> : null}
      {recovery ? (
        <section className="mt-4 rounded-xl border border-amber-300/40 bg-amber-300/10 p-4" aria-label="Local recording recovery">
          <p className="text-sm font-black text-amber-100">Unsaved recording protected locally</p>
          <p className="mt-1 text-xs text-white/70">{recoveryView.privacy}</p>
          <p className="mt-2 break-words text-xs text-red-200">Last save error: {recovery.failure}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a className={button} href={recovery.downloadUrl} download={recovery.file.name}>Download Recovery WAV</a>
            <button type="button" className={button} disabled={uploading} onClick={() => void retryRecoverableRecording()}>{uploading ? "Retrying..." : recoveryView.retryLabel}</button>
            <button type="button" className={button} disabled={uploading} onClick={deleteRecoverableRecording}>Delete Local Recovery</button>
          </div>
          <p className="mt-3 text-xs font-bold text-amber-200">Resolve this recovery before starting another take; only one recovery WAV is held at a time.</p>
        </section>
      ) : null}
      {takes.length ? (
        <ol className="mt-5 grid gap-2">
          {takes.map((take) => (
            <li key={take.source.uri} className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-black">{take.name}</p>
                {take.preferred ? <span className="rounded-full bg-emerald-400/15 px-2 py-1 text-xs font-black text-emerald-200">Preferred</span> : null}
                {take.recording.mode !== "normal" ? <span className="rounded-full bg-violet-400/15 px-2 py-1 text-xs font-black text-violet-200">{take.recording.mode} pass {take.recording.passNumber}</span> : null}
              </div>
              <p className="mt-1 text-xs text-white/45">
                {take.audio.channelCount} channel ? {take.audio.sampleRate.toLocaleString()} Hz ? {((take.recording.sourceOutFrame - take.recording.sourceInFrame) / take.audio.sampleRate).toFixed(2)}s usable ? timeline { (take.recording.timelineStartFrame / take.audio.sampleRate).toFixed(2)}s
              </p>
              <p className="mt-2 text-sm font-black text-amber-200" aria-label={`${take.rating} out of 5 stars`}>
                {take.rating ? `${take.rating}/5 rating` : "Not rated"}
              </p>
              {take.notes ? <p className="mt-2 whitespace-pre-wrap text-sm text-white/65">{take.notes}</p> : null}
              {reviewingTakeId === take.id ? (
                <div className="mt-3 grid gap-3 rounded-xl border border-rose-300/25 bg-black/60 p-3">
                  <label className="grid gap-1 text-xs font-black uppercase tracking-wide text-white/65">
                    Take name
                    <input
                      className="rounded-xl border border-white/20 bg-black px-3 py-2 text-sm font-normal normal-case tracking-normal text-white"
                      value={reviewName}
                      maxLength={120}
                      onChange={(event) => setReviewName(event.target.value)}
                      disabled={uploading}
                    />
                  </label>
                  <label className="grid gap-1 text-xs font-black uppercase tracking-wide text-white/65">
                    Musician notes
                    <textarea
                      className="min-h-24 rounded-xl border border-white/20 bg-black px-3 py-2 text-sm font-normal normal-case tracking-normal text-white"
                      value={reviewNotes}
                      maxLength={1000}
                      onChange={(event) => setReviewNotes(event.target.value)}
                      disabled={uploading}
                    />
                    <span className="text-right font-normal normal-case tracking-normal text-white/40">{reviewNotes.length}/1000</span>
                  </label>
                  <fieldset disabled={uploading}>
                    <legend className="text-xs font-black uppercase tracking-wide text-white/65">Rating</legend>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {[0, 1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          className={`rounded-lg border px-3 py-2 text-sm font-black ${reviewRating === rating ? "border-amber-200 bg-amber-300 text-black" : "border-white/20 bg-black text-white"}`}
                          onClick={() => setReviewRating(rating)}
                        >
                          {rating === 0 ? "Unrated" : `${rating}/5`}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className={button} disabled={uploading || !reviewName.trim()} onClick={() => void saveTakeReview(take)}>Save Review</button>
                    <button type="button" className={button} disabled={uploading} onClick={() => setReviewingTakeId(null)}>Cancel</button>
                  </div>
                </div>
              ) : null}
              {take.mp3Url ? (
                <a className="mt-2 inline-block text-sm font-black text-rose-300 hover:text-rose-200" href={take.mp3Url} download={take.name.replace(/\.wav$/i, ".mp3")}>Download MP3 copy</a>
              ) : null}
              {auditionUrls[take.id] ? (
                <audio className="mt-3 w-full" controls preload="metadata" src={auditionUrls[take.id]} />
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className={button} disabled={uploading} onClick={() => void auditionTake(take)}>{auditionUrls[take.id] ? "Refresh Audition" : "Audition Take"}</button>
                <button type="button" className={button} disabled={uploading || take.preferred} onClick={() => void preferTake(take)}>Use as Preferred</button>
                <button type="button" className={button} disabled={uploading} onClick={() => beginTakeReview(take)}>{reviewingTakeId === take.id ? "Reset Review" : "Review Take"}</button>
                <button type="button" className={button} disabled={uploading} onClick={() => void deleteTake(take)}>Delete Take</button>
              </div>
            </li>
          ))}
        </ol>
      ) : null}
      <TimelineDawTakeCompWorkspace sessionId={session.id} takes={takes} />
    </section>
  );
}
