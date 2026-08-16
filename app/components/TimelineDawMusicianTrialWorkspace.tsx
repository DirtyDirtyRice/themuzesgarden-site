"use client";

import { useEffect, useRef, useState } from "react";
import { encodeTimelineDawPcmWav, TimelineDawPcmCaptureBuffer } from "@/lib/timeline/TimelineDawPcmCapture";
import { parseTimelineDawMusicianTrialTrim } from "@/lib/timeline/TimelineDawMusicianTrialEdit";
import { deleteTimelineDawMusicianTrialTake, loadTimelineDawMusicianTrialTake, saveTimelineDawMusicianTrialTake } from "@/lib/timeline/TimelineDawMusicianTrialTakeStore";

const button = "rounded-lg bg-white px-3 py-2 font-black text-black disabled:opacity-40";
export default function TimelineDawMusicianTrialWorkspace({ sessionId, onStepComplete }: { sessionId: string; onStepComplete?: (step: "record" | "edit" | "save" | "export") => void }) {
  const [wav, setWav] = useState<Blob | null>(null), [url, setUrl] = useState(""), [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0), [trimStart, setTrimStart] = useState(0), [trimEnd, setTrimEnd] = useState(0);
  const [message, setMessage] = useState(""), [error, setError] = useState("");
  const stream = useRef<MediaStream | null>(null), context = useRef<AudioContext | null>(null), processor = useRef<ScriptProcessorNode | null>(null), capture = useRef<TimelineDawPcmCaptureBuffer | null>(null);
  function show(blob: Blob | null) { setWav(blob); setUrl((current) => { if (current) URL.revokeObjectURL(current); return blob ? URL.createObjectURL(blob) : ""; }); }
  useEffect(() => { let active = true; void loadTimelineDawMusicianTrialTake(sessionId).then((take) => { if (active && take) { show(take.wav); onStepComplete?.("save"); setMessage("Your saved browser-private test take was reopened."); } }).catch(() => setError("A previous browser-private test take could not be reopened.")); return () => { active = false; }; }, [onStepComplete, sessionId]);
  useEffect(() => () => { stream.current?.getTracks().forEach((track) => track.stop()); if (context.current) void context.current.close(); }, []);
  async function start() {
    setError(""); setMessage("");
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      const audioContext = new AudioContext(); await audioContext.resume();
      const source = audioContext.createMediaStreamSource(media), node = audioContext.createScriptProcessor(4096, Math.min(2, Math.max(1, source.channelCount)), 1), silent = audioContext.createGain(); silent.gain.value = 0;
      const buffer = new TimelineDawPcmCaptureBuffer(audioContext.sampleRate, node.channelCount, audioContext.sampleRate * 60 * 5);
      node.onaudioprocess = (event) => buffer.appendBounded(Array.from({ length: node.channelCount }, (_, channel) => new Float32Array(event.inputBuffer.getChannelData(Math.min(channel, event.inputBuffer.numberOfChannels - 1)))));
      source.connect(node); node.connect(silent); silent.connect(audioContext.destination);
      stream.current = media; context.current = audioContext; processor.current = node; capture.current = buffer; setRecording(true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Recording could not start."); }
  }
  async function stop() {
    setRecording(false); stream.current?.getTracks().forEach((track) => track.stop()); processor.current?.disconnect();
    if (context.current) await context.current.close();
    try {
      const pcm = capture.current?.finalizePcm(); if (!pcm) throw new Error("No recorded audio was captured.");
      const encoded = encodeTimelineDawPcmWav(pcm.channels, pcm.sampleRate), blob = new Blob([encoded.bytes.slice().buffer], { type: "audio/wav" });
      show(blob); setDuration(encoded.durationSeconds); setTrimStart(0); setTrimEnd(encoded.durationSeconds);
      await saveTimelineDawMusicianTrialTake({ sessionId, wav: blob, savedAt: new Date().toISOString() }); onStepComplete?.("record"); setMessage("Test take saved privately in this browser. Refresh the page to confirm it reopens.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Test take could not be saved."); }
    finally { stream.current = null; context.current = null; processor.current = null; capture.current = null; }
  }
  async function inspectDuration() {
    if (!wav) return; const decodedContext = new AudioContext();
    try { const decoded = await decodedContext.decodeAudioData(await wav.arrayBuffer()); setDuration(decoded.duration); setTrimEnd((value) => value || decoded.duration); }
    finally { await decodedContext.close(); }
  }
  async function exportEdit() {
    if (!wav) return; setError(""); const decodedContext = new AudioContext();
    try {
      const decoded = await decodedContext.decodeAudioData(await wav.arrayBuffer()), trim = parseTimelineDawMusicianTrialTrim({ startSeconds: trimStart, endSeconds: trimEnd || decoded.duration, durationSeconds: decoded.duration, sampleRate: decoded.sampleRate });
      const channels = Array.from({ length: decoded.numberOfChannels }, (_, channel) => new Float32Array(decoded.getChannelData(channel).slice(trim.startFrame, trim.endFrame)));
      const encoded = encodeTimelineDawPcmWav(channels, decoded.sampleRate), download = URL.createObjectURL(new Blob([encoded.bytes.slice().buffer], { type: "audio/wav" })), anchor = document.createElement("a");
      anchor.href = download; anchor.download = `musician-test-${sessionId}.wav`; anchor.click(); onStepComplete?.("export"); setTimeout(() => URL.revokeObjectURL(download), 1_000); setMessage("Edited WAV exported. Tell the owner whether this process felt clear.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Edited WAV could not be exported."); }
    finally { await decodedContext.close(); }
  }
  async function clear() { await deleteTimelineDawMusicianTrialTake(sessionId); show(null); setDuration(0); setTrimStart(0); setTrimEnd(0); setMessage("Browser-private test take deleted."); }
  return <section className="rounded-2xl border border-sky-300/35 bg-sky-300/[.05] p-4"><h2 className="text-2xl font-black">Hands-on Musician Test</h2><p className="mt-1 text-sm text-white/65">Record up to five minutes, play it, trim it, save/reopen it, and export a WAV. Your test take stays in this browser and never changes the owner&apos;s original project.</p><div className="mt-3 flex flex-wrap gap-2"><button className={button} disabled={recording} onClick={() => void start()}>Record New Take</button><button className={button} disabled={!recording} onClick={() => void stop()}>Stop &amp; Save</button>{wav ? <button className={button} onClick={() => void clear()}>Delete Test Take</button> : null}</div>{url ? <div className="mt-4"><audio className="w-full" controls src={url} onLoadedMetadata={() => void inspectDuration()}/><div className="mt-3 grid gap-2 sm:grid-cols-2"><label>Trim start (seconds)<input className="ml-2 w-28 rounded bg-black px-2 py-1" type="number" min={0} max={duration} step={0.01} value={trimStart} onChange={(event) => { setTrimStart(Number(event.target.value)); onStepComplete?.("edit"); }}/></label><label>Trim end (seconds)<input className="ml-2 w-28 rounded bg-black px-2 py-1" type="number" min={0} max={duration} step={0.01} value={trimEnd} onChange={(event) => { setTrimEnd(Number(event.target.value)); onStepComplete?.("edit"); }}/></label></div><button className={`${button} mt-3`} onClick={() => void exportEdit()}>Export Edited WAV</button></div> : null}{message ? <p className="mt-3 text-emerald-200">{message}</p> : null}{error ? <p role="alert" className="mt-3 text-red-200">{error}</p> : null}</section>;
}
