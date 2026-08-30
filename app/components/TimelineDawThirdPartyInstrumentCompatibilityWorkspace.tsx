"use client";

import { useState } from "react";
import { assessTimelineDawThirdPartyInstrumentCompatibility, type TimelineDawThirdPartyInstrumentCompatibilityReport } from "@/lib/timeline/TimelineDawThirdPartyInstrumentCompatibilityPolicy";
import type { TimelineDawPluginExecutionPath } from "@/lib/timeline/TimelineDawPluginCompatibilityPolicy";
import type { TimelinePluginFormat } from "@/lib/timeline/TimelinePluginProcessingHostEngine";

const checks = ["fingerprintVerified", "vendorVerified", "sampleRateSupported", "channelLayoutSupported", "latencyMeasured", "stateRecallPassed", "bypassRecoveryPassed", "renderedAudioVerified", "midiNoteResponsePassed", "velocityAndChannelPassed", "presetAndProgramRecallPassed", "automationPassed", "polyphonyPassed"] as const;
const labels: Record<(typeof checks)[number], string> = { fingerprintVerified: "Binary fingerprint verified", vendorVerified: "Vendor and version verified", sampleRateSupported: "Sample rate supported", channelLayoutSupported: "Output channels supported", latencyMeasured: "Latency measured", stateRecallPassed: "State recall passed", bypassRecoveryPassed: "Bypass/crash recovery passed", renderedAudioVerified: "Returned render verified", midiNoteResponsePassed: "MIDI note on/off passed", velocityAndChannelPassed: "Velocity and channels passed", presetAndProgramRecallPassed: "Preset/program recall passed", automationPassed: "Automation passed", polyphonyPassed: "Polyphony/load passed" };
const field = "rounded-lg border border-white/20 bg-black px-3 py-2 text-white";

export default function TimelineDawThirdPartyInstrumentCompatibilityWorkspace() {
  const [format, setFormat] = useState<TimelinePluginFormat>("wasm");
  const [executionPath, setExecutionPath] = useState<TimelineDawPluginExecutionPath>("browser-native");
  const [evidence, setEvidence] = useState<Record<(typeof checks)[number], boolean>>(Object.fromEntries(checks.map((check) => [check, false])) as Record<(typeof checks)[number], boolean>);
  const [report, setReport] = useState<TimelineDawThirdPartyInstrumentCompatibilityReport | null>(null);
  return <div className="mt-3 rounded-xl border border-violet-200/20 bg-black/25 p-3">
    <p className="text-[11px] font-black uppercase tracking-wider text-violet-200">Third-party virtual instruments</p><p className="mt-1 text-base font-black">Qualify the instrument before activation</p><p className="mt-1 text-sm text-white/60">Built-in and WASM instruments may run in Chrome after qualification. Desktop VST3, AU, AAX, and CLAP instruments require a separately verified bridge or rendered-audio exchange.</p>
    <div className="mt-3 grid gap-2 md:grid-cols-2"><label className="font-black">Format<select className={`${field} mt-1 block w-full`} value={format} onChange={(event) => { setFormat(event.target.value as TimelinePluginFormat); setReport(null); }}>{["built-in", "wasm", "vst3", "au", "aax", "clap"].map((value) => <option key={value}>{value}</option>)}</select></label><label className="font-black">Processing path<select className={`${field} mt-1 block w-full`} value={executionPath} onChange={(event) => { setExecutionPath(event.target.value as TimelineDawPluginExecutionPath); setReport(null); }}><option value="browser-native">Browser native</option><option value="desktop-bridge">Verified desktop bridge</option><option value="rendered-exchange">Rendered-audio exchange</option></select></label></div>
    <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{checks.map((check) => <label key={check} className="flex items-start gap-2 text-sm"><input type="checkbox" checked={evidence[check]} onChange={(event) => { setEvidence((current) => ({ ...current, [check]: event.target.checked })); setReport(null); }} />{labels[check]}</label>)}</div>
    <button type="button" className="mt-3 rounded-lg border border-white/25 bg-white px-3 py-2 font-black text-black" onClick={() => setReport(assessTimelineDawThirdPartyInstrumentCompatibility({ format, executionPath, ...evidence }))}>Assess Instrument</button>
    {report ? <div className={`mt-3 rounded-lg border p-3 ${report.status === "qualified" ? "border-emerald-300/40 text-emerald-100" : "border-amber-300/40 text-amber-100"}`}><p className="font-black">{report.status === "qualified" ? report.safeMode === "verified-render" ? "VERIFIED OFFLINE RENDER" : "QUALIFIED FOR ACTIVATION" : "HELD · ACTIVATION BLOCKED"}</p><p className="mt-1 text-sm">{report.warning}</p>{[...report.issues, ...report.requirements].length ? <ul className="mt-2 list-disc pl-5 text-sm">{[...report.issues, ...report.requirements].map((item) => <li key={item}>{item}</li>)}</ul> : null}<p className="mt-2 text-xs font-bold">Editable MIDI and source audio remain preserved in every result.</p></div> : null}
  </div>;
}
