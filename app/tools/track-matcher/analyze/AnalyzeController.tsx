"use client";

export default function AnalyzeController() {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-white/45">
        Analyze Controller
      </p>

      <h2 className="mt-3 text-2xl font-black text-white">
        Paused safely
      </h2>

      <p className="mt-3 max-w-3xl text-sm leading-6 text-white/65">
        This controller is temporarily frozen while Pro Pitch DSP is being
        built. It intentionally avoids importing Analyze components, Analyze
        engines, guessed types, waveform logic, beat-grid logic, and mix
        suggestion logic.
      </p>

      <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4">
        <p className="text-sm font-bold text-amber-100">
          Green rule: Analyze stays paused until the foundation files are rebuilt
          forward in the correct order.
        </p>
      </div>
    </section>
  );
}