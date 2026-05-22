"use client";

import Link from "next/link";

type ControlCard = {
  title: string;
  body: string;
  href: string;
  actionLabel: string;
  icon: string;
  iconClass: string;
};

type MetricCard = {
  label: string;
  value: string;
  detail: string;
  icon: string;
  iconClass: string;
};

type QuickLink = {
  label: string;
  href: string;
  icon: string;
  iconClass: string;
};

const pageShellClass = "min-h-screen bg-black text-white";

const mainClass =
  "mx-auto flex w-full max-w-7xl flex-col gap-5 px-5 py-7 sm:px-8 lg:px-10";

const sectionRuleClass = "border-t border-white/10 pt-4";

const panelClass =
  "rounded-[2rem] border border-white/15 bg-black p-5 shadow-2xl shadow-black/35";

const cardClass =
  "rounded-3xl border border-white/15 bg-black p-5 shadow-2xl shadow-black/20";

const buttonClass =
  "inline-flex min-h-10 items-center justify-center rounded-2xl border border-white/20 bg-black px-4 py-2 text-sm font-black text-white transition-transform duration-150 hover:-translate-y-0.5 active:scale-[0.98]";

const eyebrowClass =
  "text-xs font-black uppercase tracking-[0.28em] text-white/70";

const bodyClass = "text-sm leading-6 text-white/70";

const controlCards: ControlCard[] = [
  {
    title: "Open Existing Project",
    body: "Continue work on your projects, tracks, setlists, and more.",
    href: "/workspace/projects",
    actionLabel: "Open Projects",
    icon: "▰",
    iconClass: "from-blue-600 to-violet-500",
  },
  {
    title: "Create New Project",
    body: "Start a new project workspace from scratch.",
    href: "/workspace/projects#create-project",
    actionLabel: "Create Project",
    icon: "+",
    iconClass: "from-emerald-500 to-green-700",
  },
  {
    title: "Multi-Project Actions",
    body: "Select, download, and export one or many projects.",
    href: "/workspace/projects#project-list",
    actionLabel: "Manage Projects",
    icon: "♧",
    iconClass: "from-yellow-500 to-orange-600",
  },
  {
    title: "Need Help?",
    body: "Open Help or search for answers and system guidance.",
    href: "/help",
    actionLabel: "Open Help",
    icon: "?",
    iconClass: "from-sky-500 to-blue-700",
  },
];

const metricCards: MetricCard[] = [
  {
    label: "Total Projects",
    value: "0",
    detail: "All time",
    icon: "▱",
    iconClass: "text-violet-400",
  },
  {
    label: "Selected Projects",
    value: "0",
    detail: "Currently selected",
    icon: "✓",
    iconClass: "text-emerald-400",
  },
  {
    label: "Music Projects",
    value: "0",
    detail: "Music type projects",
    icon: "♫",
    iconClass: "text-yellow-400",
  },
  {
    label: "Shared/Public Projects",
    value: "0",
    detail: "Shared or public",
    icon: "♧",
    iconClass: "text-blue-400",
  },
];

const quickLinks: QuickLink[] = [
  {
    label: "Add-Friendly Route Guidance",
    href: "/help",
    icon: "▣",
    iconClass: "text-fuchsia-400",
  },
  {
    label: "Current Systems",
    href: "/help",
    icon: "▣",
    iconClass: "text-pink-400",
  },
  {
    label: "System Status",
    href: "/help",
    icon: "◇",
    iconClass: "text-sky-400",
  },
  {
    label: "Recent Updates",
    href: "/help",
    icon: "♬",
    iconClass: "text-cyan-400",
  },
  {
    label: "Planned Work",
    href: "/help",
    icon: "♧",
    iconClass: "text-orange-400",
  },
];

function HomeHero() {
  return (
    <section className="grid gap-6 border-b border-white/10 pb-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
      <div>
        <p className={eyebrowClass}>The Muzes Garden</p>

        <h1 className="mt-4 max-w-3xl text-5xl font-black leading-[0.92] tracking-[-0.06em] text-white sm:text-6xl lg:text-7xl">
          Home is the control center.
        </h1>

        <p className="mt-6 max-w-3xl text-base leading-7 text-white/70">
          Start simple. Open a working system, use Help when you feel lost, or
          open a dropdown to go deeper into status, routes, and planned work.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/help" className={buttonClass}>
            Start Here
          </Link>

          <Link href="/workspace/projects" className={buttonClass}>
            Open Projects
          </Link>
        </div>
      </div>

      <div className="rounded-[2rem] border border-white/15 bg-black p-6 shadow-2xl shadow-black/25 lg:mx-auto lg:w-full lg:max-w-[520px]">
        <p className={eyebrowClass}>How to use this page</p>

        <h2 className="mt-3 text-2xl font-black leading-tight text-white">
          Pick a dropdown. Go deeper only when you want.
        </h2>

        <p className="mt-4 text-base leading-7 text-white/70">
          Home stays clean on purpose. The details live inside dropdowns, Help,
          or the real system pages.
        </p>
      </div>
    </section>
  );
}

function ControlCenter() {
  return (
    <section className={sectionRuleClass}>
      <p className={eyebrowClass}>Control Center</p>

      <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {controlCards.map((card) => (
          <article key={card.title} className={cardClass}>
            <div className="flex items-start gap-4">
              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${card.iconClass} text-3xl font-black text-white shadow-2xl shadow-black/40`}
              >
                {card.icon}
              </div>

              <div className="min-w-0">
                <h2 className="text-base font-black text-white">
                  {card.title}
                </h2>

                <p className="mt-2 text-sm leading-6 text-white/70">
                  {card.body}
                </p>

                <Link href={card.href} className="mt-4 inline-flex">
                  <span className={buttonClass}>{card.actionLabel}</span>
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function AtAGlance() {
  return (
    <section className={sectionRuleClass}>
      <p className={eyebrowClass}>At a Glance</p>

      <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((metric) => (
          <article key={metric.label} className={cardClass}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className={`text-sm font-black ${metric.iconClass}`}>
                  {metric.label}
                </p>

                <div className={`mt-1 text-4xl font-black ${metric.iconClass}`}>
                  {metric.value}
                </div>
              </div>

              <div className={`text-4xl font-black ${metric.iconClass}`}>
                {metric.icon}
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-white/70">
              {metric.detail}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function RecentActivity() {
  return (
    <section className={sectionRuleClass}>
      <p className={eyebrowClass}>Recent Activity</p>

      <div className={`mt-3 ${panelClass}`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-black text-4xl text-white">
              ✧
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-black text-white">
                  Recent Activity
                </h2>

                <span className="rounded-full border border-white/15 bg-black px-2 py-1 text-xs font-black text-white/70">
                  Coming Soon
                </span>
              </div>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/70">
                Project history, recent changes, and recently opened items will
                appear here. This helps you pick up where you left off.
              </p>
            </div>
          </div>

          <div className="flex h-20 w-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-4xl text-white/50 sm:w-32">
            ◷
          </div>
        </div>
      </div>
    </section>
  );
}

function QuickLinks() {
  return (
    <section className={sectionRuleClass}>
      <p className={eyebrowClass}>Quick Links</p>

      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {quickLinks.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="flex min-h-14 items-center justify-between rounded-2xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm font-black text-white transition-transform duration-150 hover:-translate-y-0.5 active:scale-[0.98]"
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className={link.iconClass}>{link.icon}</span>
              <span className="truncate">{link.label}</span>
            </span>

            <span className="text-white/70">›</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className={pageShellClass}>
      <main className={mainClass}>
        <HomeHero />
        <ControlCenter />
        <AtAGlance />
        <RecentActivity />
        <QuickLinks />
      </main>
    </div>
  );
}
