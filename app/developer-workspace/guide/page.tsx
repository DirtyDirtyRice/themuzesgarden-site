import Link from "next/link";

const capabilities = [
  ["Project intelligence", "Indexes files, symbols, imports, exports, references, dependencies, and exact source locations."],
  ["Continuous history", "Records symbol and relationship changes through the live watcher and imports committed Git history."],
  ["Build triage", "Collects compiler errors, separates primary failures from cascades, and orders root causes for repair."],
  ["Inactive code holding", "Keeps incomplete code capsules outside active source until requirements, imports, TypeScript, and activation pass."],
  ["Prevented-error proof", "Preserves evidence of rejected compiler failures, contract failures, architectural violations, and AI drift."],
  ["Safe changes", "Previews patches, verifies TypeScript and architecture, and restores the original file when a gate fails."],
];

const scenarios = [
  ["Starting from zero", "Use Create New Project. The workspace creates a strict TypeScript foundation, registers it, and can observe its lifecycle from the first symbol."],
  ["Adopting active development", "Register the existing folder, select it, and press Adopt Current Project to record the first symbol, relationship, verification, and health baseline."],
  ["Diagnosing a large failing file", "Run Fast Check, follow Recommended Repair Order, open each primary source location, and use the AI Assistant or Safe Patch only after reviewing its evidence."],
];

export default function DeveloperWorkspaceGuidePage() {
  return (
    <main className="mx-auto max-w-6xl p-4 pb-20">
      <section className="rounded-2xl border border-cyan-300/25 bg-[#0b1720] p-6 md:p-8">
        <div className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">Tester operating guide</div>
        <h1 className="mt-2 text-4xl font-black">Developer Workspace</h1>
        <p className="mt-3 max-w-4xl text-white/65">A local-first coding workspace that makes project structure, compiler failures, code evolution, prevented errors, and AI evidence visible without asking developers to paste files into chat.</p>
        <div className="mt-5 flex flex-wrap gap-2"><Link href="/developer-workspace" className="rounded-lg border border-cyan-300/45 bg-cyan-300/10 px-4 py-2 font-black text-cyan-100">Open workspace</Link><a href="/api/developer-workspace/support-report" download className="rounded-lg border border-white/15 px-4 py-2 font-bold text-white/70">Download support report</a></div>
      </section>

      <section className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{capabilities.map(([title, description]) => <article key={title} className="rounded-xl border border-white/10 bg-[#0b1720] p-4"><h2 className="font-black text-cyan-100">{title}</h2><p className="mt-2 text-sm leading-6 text-white/55">{description}</p></article>)}</section>

      <section className="mt-5 rounded-xl border border-violet-300/20 bg-[#0b1720] p-5"><h2 className="text-2xl font-black">Choose the adoption path</h2><div className="mt-4 grid gap-3 lg:grid-cols-3">{scenarios.map(([title, description], index) => <article key={title} className="rounded-lg border border-white/10 bg-black/20 p-4"><div className="text-xs font-black text-violet-300">SCENARIO {index + 1}</div><h3 className="mt-1 font-black">{title}</h3><p className="mt-2 text-sm leading-6 text-white/55">{description}</p></article>)}</div></section>

      <section className="mt-5 rounded-xl border border-emerald-300/20 bg-[#0b1720] p-5"><h2 className="text-2xl font-black">First tester session</h2><ol className="mt-4 grid gap-3 md:grid-cols-2">{["Confirm all readiness checks.", "Create or register a TypeScript project.", "Adopt the current project to establish its baseline.", "Start the Live Event Watcher.", "Run the fast TypeScript check.", "Review ordered repair clusters and exact source locations.", "Inspect AI Drift and Prevented Error evidence.", "Ask the AI Assistant a project-specific question.", "Download a support report if anything behaves unexpectedly."].map((step, index) => <li key={step} className="rounded-lg border border-white/10 bg-black/20 p-3 text-sm"><span className="mr-2 font-black text-emerald-300">{index + 1}.</span>{step}</li>)}</ol></section>

      <section className="mt-5 rounded-xl border border-amber-300/25 bg-amber-300/5 p-5"><h2 className="font-black text-amber-100">Safety rules</h2><ul className="mt-3 space-y-2 text-sm text-white/60"><li>Filesystem and mutation APIs are local-development-only.</li><li>A held capsule is not active code and cannot affect the project until validation and explicit activation succeed.</li><li>Compiler and production builds remain the final authorities; prediction does not replace verification.</li><li>Review every proposed patch. Safe Patch restores the original source when verification or architecture fails.</li><li>Support reports contain counts and health signals, not source code, absolute paths, candidate snapshots, environment variables, or credentials.</li></ul></section>
    </main>
  );
}
