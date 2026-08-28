"use client";

import { useCallback, useEffect, useState } from "react";
import {
  assessTimelineDawDevices,
  type TimelineDawDeviceDiagnosticReport,
} from "../../../../lib/timeline/TimelineDawDeviceDiagnostics";
import {
  resolveTimelineDawMidiTransportCommand,
  type TimelineDawMidiTransportCommand,
} from "../../../../lib/timeline/TimelineDawMidiTransportPolicy";

type MidiInputLike = {
  id: string;
  name?: string | null;
  manufacturer?: string | null;
  onmidimessage: ((event: { data: Uint8Array }) => void) | null;
};

type MidiAccessLike = {
  inputs: Map<string, MidiInputLike>;
  onstatechange: (() => void) | null;
};

type NavigatorWithMidi = Navigator & {
  requestMIDIAccess?: (options?: { sysex?: boolean }) => Promise<MidiAccessLike>;
};

const button = "rounded-xl border border-white/25 bg-white px-4 py-2 text-sm font-black text-black disabled:cursor-not-allowed disabled:opacity-40";

export default function ProjectDawDeviceDiagnostics() {
  const [report, setReport] = useState<TimelineDawDeviceDiagnosticReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [permission, setPermission] = useState<"unknown" | "granted" | "denied">("unknown");
  const [error, setError] = useState<string | null>(null);
  const [midiAccess, setMidiAccess] = useState<MidiAccessLike | null>(null);
  const [midiInputs, setMidiInputs] = useState<string[]>([]);
  const [lastMidiCommand, setLastMidiCommand] = useState<TimelineDawMidiTransportCommand | null>(null);

  const inspect = useCallback(async (testMicrophone: boolean) => {
    setBusy(true);
    setError(null);
    let nextPermission = permission;
    let stream: MediaStream | null = null;
    let context: AudioContext | null = null;
    try {
      const supported = typeof navigator !== "undefined" && !!navigator.mediaDevices?.enumerateDevices;
      if (supported && testMicrophone) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          nextPermission = "granted";
          setPermission("granted");
        } catch (cause) {
          nextPermission = "denied";
          setPermission("denied");
          setError(cause instanceof Error ? cause.message : "Microphone access was denied.");
        }
      }
      const devices = supported ? await navigator.mediaDevices.enumerateDevices() : [];
      if (typeof AudioContext !== "undefined" && testMicrophone) {
        context = new AudioContext({ latencyHint: "interactive" });
      }
      setReport(assessTimelineDawDevices({
        supported,
        secureContext: typeof window !== "undefined" && window.isSecureContext,
        permission: nextPermission,
        inputDevices: devices.filter((device) => device.kind === "audioinput").length,
        outputDevices: devices.filter((device) => device.kind === "audiooutput").length,
        labeledDevices: devices.filter((device) => !!device.label.trim()).length,
        sampleRate: context?.sampleRate ?? null,
        baseLatencyMs: context ? Math.round(context.baseLatency * 100_000) / 100 : null,
        outputLatencyMs: context && "outputLatency" in context
          ? Math.round(context.outputLatency * 100_000) / 100
          : null,
        audioWorkletSupported: typeof AudioWorkletNode !== "undefined",
        outputTimestampSupported: typeof AudioContext !== "undefined"
          && "getOutputTimestamp" in AudioContext.prototype,
        mediaSessionSupported: "mediaSession" in navigator,
        webMidiSupported: "requestMIDIAccess" in navigator,
      }));
    } finally {
      stream?.getTracks().forEach((track) => track.stop());
      if (context) await context.close();
      setBusy(false);
    }
  }, [permission]);

  useEffect(() => {
    void inspect(false);
  }, [inspect]);

  const connectMidiTransport = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const requestMidiAccess = (navigator as NavigatorWithMidi).requestMIDIAccess;
      if (!requestMidiAccess) throw new Error("This browser does not expose Web MIDI.");
      const access = await requestMidiAccess.call(navigator, { sysex: false });
      const attach = () => {
        const inputs = [...access.inputs.values()];
        setMidiInputs(inputs.map((input) => [input.manufacturer, input.name].filter(Boolean).join(" ") || `MIDI input ${input.id}`));
        inputs.forEach((input) => {
          input.onmidimessage = (event) => {
            const command = resolveTimelineDawMidiTransportCommand(event.data);
            if (!command) return;
            setLastMidiCommand(command);
            window.dispatchEvent(new CustomEvent("muzes:daw-midi-transport", { detail: { command } }));
          };
        });
      };
      access.onstatechange = attach;
      attach();
      setMidiAccess(access);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "MIDI transport could not connect.");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    const devices = navigator.mediaDevices;
    if (!devices?.addEventListener) return;
    const refresh = () => { void inspect(false); };
    devices.addEventListener("devicechange", refresh);
    return () => devices.removeEventListener("devicechange", refresh);
  }, [inspect]);

  return (
    <section className="rounded-3xl border border-white/15 bg-[#080808] p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-300">Audio devices</p>
          <h2 className="mt-2 text-2xl font-black">Device &amp; latency diagnostics</h2>
          <p className="mt-2 max-w-2xl text-sm text-white/60">
            Inspect connected browser audio devices and explicitly test microphone access before recording.
          </p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase ${report?.status === "ready" ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-200" : "border-amber-300/30 bg-amber-300/10 text-amber-200"}`}>
          {report?.status ?? "scanning"}
        </span>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" className={button} disabled={busy} onClick={() => void inspect(false)}>
          {busy ? "Scanning..." : "Rescan Devices"}
        </button>
        <button type="button" className={button} disabled={busy} onClick={() => void inspect(true)}>
          Test Microphone &amp; Latency
        </button>
        <button type="button" className={button} disabled={busy || !!midiAccess} onClick={() => void connectMidiTransport()}>
          {midiAccess ? "MIDI Transport Connected" : "Connect MIDI Transport"}
        </button>
      </div>
      {error ? <p role="alert" className="mt-4 text-sm text-red-200">{error}</p> : null}
      {report ? (
        <>
          <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3"><dt className="text-xs uppercase text-white/40">Inputs</dt><dd className="mt-1 text-xl font-black">{report.inputDevices}</dd></div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3"><dt className="text-xs uppercase text-white/40">Outputs</dt><dd className="mt-1 text-xl font-black">{report.outputDevices}</dd></div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3"><dt className="text-xs uppercase text-white/40">Sample rate</dt><dd className="mt-1 text-xl font-black">{report.sampleRate ? `${report.sampleRate.toLocaleString()} Hz` : "Test required"}</dd></div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3"><dt className="text-xs uppercase text-white/40">Latency estimate</dt><dd className="mt-1 text-xl font-black">{report.roundTripEstimateMs === null ? "Test required" : `${report.roundTripEstimateMs} ms`}</dd></div>
          </dl>
          {report.issues.length ? <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-amber-200">{report.issues.map((item) => <li key={item}>{item}</li>)}</ul> : null}
          {report.recommendations.length ? <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-sky-200">{report.recommendations.map((item) => <li key={item}>{item}</li>)}</ul> : null}
          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm">
            <p className="font-black text-white">Browser timing capabilities</p>
            <p className="mt-1 text-white/55">
              AudioWorklet {report.audioWorkletSupported ? "ready" : "unavailable"} · Output timestamps {report.outputTimestampSupported ? "ready" : "unavailable"} · Media Session {report.mediaSessionSupported ? "ready" : "unavailable"} · Web MIDI {report.webMidiSupported ? "ready" : "unavailable"}
            </p>
            <p className="mt-2 text-white/45">
              MIDI Start returns to the beginning and plays; Continue plays from the current position; Stop uses the DAW&apos;s saved stop-return behavior.
            </p>
            <p className="mt-2 text-white/55">
              {midiInputs.length ? `Inputs: ${midiInputs.join(", ")}` : "No MIDI input connected yet."}
              {lastMidiCommand ? ` Last command: ${lastMidiCommand}.` : ""}
            </p>
          </div>
        </>
      ) : null}
    </section>
  );
}
