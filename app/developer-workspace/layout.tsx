import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import InstallWorkspaceButton from "./InstallWorkspaceButton";
import WorkspaceConnectionStatus from "./WorkspaceConnectionStatus";

export const metadata: Metadata = {
  title: "AI Developer Workspace",
  description: "Local AI-assisted code intelligence, verification, error prevention, and project history workspace.",
  manifest: "/developer-workspace/manifest.webmanifest",
  applicationName: "AI Developer Workspace",
  appleWebApp: {
    capable: true,
    title: "Dev Workspace",
    statusBarStyle: "black-translucent",
  },
};

export default function StandaloneDeveloperWorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#050b10] text-white">
      <header className="sticky top-0 z-50 border-b border-cyan-300/20 bg-[#071016]/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-[1800px] flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg border border-cyan-300/40 bg-cyan-300/10 font-black text-cyan-200">DW</div>
            <div>
              <div className="text-sm font-black tracking-wide">Developer Workspace</div>
              <div className="text-xs text-white/45">AI-assisted code intelligence and prevention</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <WorkspaceConnectionStatus />
            <InstallWorkspaceButton />
            <Link href="/developer-workspace/guide" className="rounded-lg border border-violet-300/25 px-3 py-2 text-xs font-bold text-violet-100 hover:border-violet-300/50">Tester guide</Link>
            <a href="/api/developer-workspace/support-report" download className="rounded-lg border border-cyan-300/25 px-3 py-2 text-xs font-bold text-cyan-100 hover:border-cyan-300/50">Download support report</a>
            <Link href="/tools/developer-workspace" className="rounded-lg border border-white/15 px-3 py-2 text-xs font-bold text-white/70 hover:border-cyan-300/40 hover:text-white">Host-site view</Link>
          </div>
        </div>
        <nav aria-label="Developer Workspace sections" className="mx-auto mt-3 flex max-w-[1800px] gap-2 overflow-x-auto pb-1 text-xs">
          {[["Projects", "#workspace-projects"], ["Architecture", "#architecture"], ["Build Errors", "#build-errors"], ["Event Timeline", "#event-timeline"], ["Draft Holding", "#draft-activation"], ["Prevented Errors", "#prevented-errors"], ["AI Drift", "#ai-drift"], ["AI Assistant", "#ai-assistant"], ["Code Explorer", "#code-explorer"]].map(([label, href]) => <a key={href} href={href} className="shrink-0 rounded-full border border-white/10 px-3 py-1.5 font-bold text-white/60 hover:border-cyan-300/35 hover:text-cyan-100">{label}</a>)}
        </nav>
      </header>
      {children}
    </div>
  );
}
