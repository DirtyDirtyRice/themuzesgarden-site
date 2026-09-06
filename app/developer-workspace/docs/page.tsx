import Link from "next/link";

const capabilities = [
  ["Project map", "Indexes TypeScript files, folders, symbols, imports, exports, references, and exact source locations."],
  ["Change memory", "Imports committed Git history and watches live code changes so a coder can see how a project evolved."],
  ["Build diagnosis", "Separates primary TypeScript failures from cascading errors and recommends a repair order."],
  ["Architecture protection", "Measures architectural health, detects regressions, and prevents unsafe patches from becoming active."],
  ["Safe Patch", "Previews a proposed edit, verifies it, and restores the original file when verification fails."],
  ["Code holding", "Keeps incomplete generated code in inactive capsules until its requirements and validation are satisfied."],
  ["AI evidence", "Shows the files, symbols, relationships, diagnostics, and history used to support an AI answer."],
  ["Private support", "Creates a support report made of counts and health signals—not source code, secrets, or absolute paths."],
] as const;

const newProjectSteps = [
  "Open Standalone Readiness and confirm the local boundary and AI configuration.",
  "Choose Create New Project and supply a name and destination inside an approved local folder.",
  "Open the created project and review the strict TypeScript foundation before writing product code.",
  "Start the live watcher, then create the first feature and confirm its symbols and relationships appear.",
  "Introduce one harmless TypeScript mistake, run Fast Check, and confirm the primary failure is identified.",
  "Repair the mistake, rerun verification, and confirm the project returns to a healthy baseline.",
  "Try a deliberately unsafe Safe Patch and confirm the original file is restored.",
  "Download the privacy-safe support report and complete Beta Feedback.",
] as const;

const existingProjectSteps = [
  "Make or verify a normal source-control backup before connecting the workspace.",
  "Choose Register Existing Project and select the project root; do not select a parent folder containing unrelated projects.",
  "Run Adopt Current Project to record the initial symbol, relationship, verification, and architecture baseline.",
  "Review existing build errors before asking the assistant to make changes.",
  "Search for one important symbol and inspect its cross-references and dependency impact.",
  "Start the live watcher, make one small reversible edit in the normal editor, and confirm the event is recorded.",
  "Run verification and compare current architectural health with the adoption baseline.",
  "Use Safe Patch on a low-risk test change, inspect the preview, then confirm verification or rollback behavior.",
  "Download the privacy-safe support report and complete Beta Feedback.",
] as const;

const validations = [
  ["Project isolation", "Conflicting filenames, symbols, relationships, and event histories remain inside their own registered roots."],
  ["Project lifecycle", "New-project scaffolding, project registration, selection, and existing-project adoption are exercised."],
  ["Code intelligence", "Code-root parsing, stable symbol identities, dependency impact, and architectural health are tested."],
  ["Safety gates", "Held-code activation and architectural regression gates reject incomplete or unsafe changes."],
  ["Production build", "The complete Next.js production build compiles routes, TypeScript, and all standalone workspace pages."],
] as const;

function Steps({ items }: { items: readonly string[] }) {
  return <ol className="mt-4 space-y-2">{items.map((item, index) => <li key={item} className="rounded-lg border border-white/10 bg-black/20 p-3 text-sm leading-6"><span className="mr-2 font-black text-cyan-300">{index + 1}.</span>{item}</li>)}</ol>;
}

export default function DeveloperWorkspaceDocumentationPage() {
  return (
    <main className="mx-auto max-w-7xl p-4 pb-24">
      <section className="rounded-2xl border border-cyan-300/25 bg-[#0b1720] p-6 md:p-8">
        <div className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">Coder beta manual</div>
        <h1 className="mt-2 text-4xl font-black">Developer Workspace documentation</h1>
        <p className="mt-3 max-w-4xl leading-7 text-white/65">This local-first workspace helps a coder understand an unfamiliar TypeScript project, diagnose failures, preserve architectural intent, and verify proposed changes. It supports both a project beginning at zero and an active project already containing code and history.</p>
        <div className="mt-5 flex flex-wrap gap-2"><Link href="/developer-workspace" className="rounded-lg border border-cyan-300/40 px-4 py-2 font-black text-cyan-100">Open workspace</Link><Link href="/developer-workspace/beta-feedback" className="rounded-lg border border-amber-300/40 px-4 py-2 font-black text-amber-100">Open beta feedback</Link></div>
      </section>

      <section className="mt-5 rounded-xl border border-white/10 bg-[#0b1720] p-5"><h2 className="text-2xl font-black">What every part does</h2><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">{capabilities.map(([title, detail]) => <article key={title} className="rounded-lg border border-white/10 bg-black/20 p-4"><h3 className="font-black text-cyan-100">{title}</h3><p className="mt-2 text-sm leading-6 text-white/55">{detail}</p></article>)}</div></section>

      <section className="mt-5 grid gap-5 xl:grid-cols-2">
        <article className="rounded-xl border border-emerald-300/25 bg-[#0b1720] p-5"><div className="text-xs font-black uppercase tracking-widest text-emerald-300">Scenario A</div><h2 className="mt-1 text-2xl font-black">Coder at the beginning of a project</h2><p className="mt-2 text-sm leading-6 text-white/55">Validates whether the workspace can establish structure, history, and safety from the first line of code.</p><Steps items={newProjectSteps} /></article>
        <article className="rounded-xl border border-violet-300/25 bg-[#0b1720] p-5"><div className="text-xs font-black uppercase tracking-widest text-violet-300">Scenario B</div><h2 className="mt-1 text-2xl font-black">Coder in the middle of a project</h2><p className="mt-2 text-sm leading-6 text-white/55">Validates whether the workspace can learn an existing codebase without overwriting its history or confusing separate projects.</p><Steps items={existingProjectSteps} /></article>
      </section>

      <section className="mt-5 rounded-xl border border-amber-300/25 bg-[#0b1720] p-5"><h2 className="text-2xl font-black">What has already been validated</h2><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">{validations.map(([title, detail]) => <article key={title} className="rounded-lg border border-white/10 bg-black/20 p-4"><h3 className="font-black text-amber-100">{title}</h3><p className="mt-2 text-sm leading-6 text-white/55">{detail}</p></article>)}</div><p className="mt-4 text-sm text-white/50">The automated beta baseline currently contains 25 focused checks across 10 test files. A passing automated suite does not replace the two human scenarios above.</p></section>

      <section className="mt-5 grid gap-5 lg:grid-cols-2"><article className="rounded-xl border border-white/10 bg-[#0b1720] p-5"><h2 className="text-xl font-black">Installation and requirements</h2><ul className="mt-3 space-y-2 text-sm leading-6 text-white/60"><li>Run on the coder’s own computer through the local development server.</li><li>Use a current Node.js runtime and install the project dependencies.</li><li>Open <code>/developer-workspace</code> in Chrome and use Install app when Chrome offers it.</li><li>Set the server-only AI key only when AI assistance is required; never place it in browser storage.</li><li>Keep the project under normal source control. The workspace is an additional safety layer, not a replacement for Git.</li></ul></article><article className="rounded-xl border border-red-300/20 bg-[#0b1720] p-5"><h2 className="text-xl font-black">Beta safety boundaries</h2><ul className="mt-3 space-y-2 text-sm leading-6 text-white/60"><li>Use only projects the tester is authorized to access.</li><li>Review every proposed edit before activation.</li><li>Do not treat AI predictions as proof; TypeScript and production verification remain authoritative.</li><li>Report unexpected file changes immediately and preserve the project state.</li><li>Do not send proprietary source code in feedback. Use the privacy-safe support report.</li></ul></article></section>
    </main>
  );
}
