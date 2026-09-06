import Link from "next/link";
import BetaFeedbackForm from "./BetaFeedbackForm";

export default function DeveloperWorkspaceBetaFeedbackPage() {
  return <main className="mx-auto max-w-6xl p-4 pb-24"><section className="rounded-2xl border border-amber-300/25 bg-[#0b1720] p-6"><div className="text-xs font-black uppercase tracking-[0.3em] text-amber-300">Real-coder beta</div><h1 className="mt-2 text-4xl font-black">Tell us what should be better</h1><p className="mt-3 max-w-3xl leading-7 text-white/60">Complete a documented scenario first. Record what helped, what slowed you down, what you expected but could not find, and what you would change. Specific observations are more useful than a simple pass or fail.</p><Link href="/developer-workspace/docs" className="mt-4 inline-block rounded-lg border border-cyan-300/35 px-4 py-2 font-black text-cyan-100">Read test scenarios</Link></section><div className="mt-5"><BetaFeedbackForm /></div></main>;
}
