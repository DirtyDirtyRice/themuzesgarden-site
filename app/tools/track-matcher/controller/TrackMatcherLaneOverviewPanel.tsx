"use client";

import { useState } from "react";

import TrackMatcherLanePanelHeader from "./TrackMatcherLanePanelHeader";
import TrackMatcherLaneSection from "./TrackMatcherLaneSection";
import TrackMatcherRegisteredPanelStack from "./TrackMatcherRegisteredPanelStack";
import {
  DEFAULT_TRACK_MATCHER_LANES,
  DEFAULT_TRACK_MATCHER_LANE_RELATIONSHIPS,
} from "./trackMatcherControllerConstants";
import { getTrackMatcherLaneGroups } from "./trackMatcherLaneOverviewGroups";
import { getTrackMatcherLaneSectionConfigs } from "./trackMatcherLaneSectionConfigs";
import { createTrackMatcherPanelRegistrySummary } from "./trackMatcherPanelRegistry";

const controlCards = [
  {
    title: "Compare Tracks",
    body: "Load Track A and Track B, then use the deck controls to play, pause, stop, nudge, or match timing.",
    href: "#track-matcher-decks",
    actionLabel: "Use Decks",
    icon: "▰",
    iconClass: "from-blue-600 to-violet-500",
  },
  {
    title: "BPM & Key Matching",
    body: "Set BPM, key, and mode for each track so comparison starts from musical context instead of guessing.",
    href: "#track-matcher-decks",
    actionLabel: "Set Music Info",
    icon: "♫",
    iconClass: "from-emerald-500 to-green-700",
  },
  {
    title: "Lane Intelligence",
    body: "Open the Lane Library only when you want the deeper architecture, route maps, and registry branches.",
    href: "#track-matcher-library",
    actionLabel: "Open Library",
    icon: "◇",
    iconClass: "from-fuchsia-500 to-purple-700",
  },
  {
    title: "Stem Analysis",
    body: "Prepare for future stem routing, riff tracing, hybrid construction, and Suno comparison workflows.",
    href: "#track-matcher-library",
    actionLabel: "View Future Lanes",
    icon: "♬",
    iconClass: "from-yellow-500 to-orange-600",
  },
];

const quickLinks = [
  {
    label: "Lane Registry",
    icon: "▣",
    iconClass: "text-fuchsia-400",
  },
  {
    label: "Lane Relationships",
    icon: "◇",
    iconClass: "text-sky-400",
  },
  {
    label: "Stem Separation",
    icon: "♬",
    iconClass: "text-cyan-400",
  },
  {
    label: "Hybrid Construction",
    icon: "♧",
    iconClass: "text-orange-400",
  },
  {
    label: "Future Architecture",
    icon: "✧",
    iconClass: "text-violet-400",
  },
];

const cardClass =
  "rounded-3xl border border-white/15 bg-black p-5 shadow-2xl shadow-black/20";

const buttonClass =
  "inline-flex min-h-10 items-center justify-center rounded-2xl border border-white/20 bg-black px-4 py-2 text-sm font-black text-white transition-transform duration-150 hover:-translate-y-0.5 active:scale-[0.98]";

const eyebrowClass =
  "text-xs font-black uppercase tracking-[0.28em] text-white/70";

function TrackMatcherControlCenter({ onOpenLibrary }: { onOpenLibrary: () => void }) {
  return (
    <section className="border-t border-white/10 pt-4">
      <p className={eyebrowClass}>Control Center</p>

      <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {controlCards.map((card) => {
          const opensLibrary = card.href === "#track-matcher-library";

          return (
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

                  {opensLibrary ? (
                    <button
                      type="button"
                      onClick={onOpenLibrary}
                      className={`mt-4 ${buttonClass}`}
                    >
                      {card.actionLabel}
                    </button>
                  ) : (
                    <a href={card.href} className="mt-4 inline-flex">
                      <span className={buttonClass}>{card.actionLabel}</span>
                    </a>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function TrackMatcherAtAGlance() {
  const registrySummary = createTrackMatcherPanelRegistrySummary();
  const metrics = [
    {
      label: "Loaded Tracks",
      value: "2",
      detail: "Track A and Track B decks",
      icon: "▰",
      iconClass: "text-blue-400",
    },
    {
      label: "Active Lanes",
      value: String(DEFAULT_TRACK_MATCHER_LANES.length),
      detail: "Audio intelligence lanes",
      icon: "◇",
      iconClass: "text-violet-400",
    },
    {
      label: "Relationships",
      value: String(DEFAULT_TRACK_MATCHER_LANE_RELATIONSHIPS.length),
      detail: "Lane relationship links",
      icon: "♧",
      iconClass: "text-emerald-400",
    },
    {
      label: "Registry Panels",
      value: String(registrySummary.totalPanels),
      detail: `${registrySummary.activePanels} active · ${registrySummary.plannedPanels} planned`,
      icon: "✧",
      iconClass: "text-yellow-400",
    },
  ];

  return (
    <section className="border-t border-white/10 pt-4">
      <p className={eyebrowClass}>At a Glance</p>

      <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
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

function TrackMatcherQuickLinks({ onOpenLibrary }: { onOpenLibrary: () => void }) {
  return (
    <section className="border-t border-white/10 pt-4">
      <p className={eyebrowClass}>Quick Links</p>

      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {quickLinks.map((link) => (
          <button
            key={link.label}
            type="button"
            onClick={onOpenLibrary}
            className="flex min-h-14 items-center justify-between rounded-2xl border border-white/15 bg-white/[0.04] px-4 py-3 text-left text-sm font-black text-white transition-transform duration-150 hover:-translate-y-0.5 active:scale-[0.98]"
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className={link.iconClass}>{link.icon}</span>
              <span className="truncate">{link.label}</span>
            </span>

            <span className="text-white/70">›</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function TrackMatcherLibraryContent() {
  const laneGroups = getTrackMatcherLaneGroups();
  const sectionConfigs = getTrackMatcherLaneSectionConfigs();

  return (
    <div className="mt-5 space-y-4 border-t border-white/10 pt-5">
      {sectionConfigs.map((section, index) => (
        <TrackMatcherLaneSection
          key={section.key}
          title={section.title}
          subtitle={section.subtitle}
          lanes={laneGroups[section.key]}
          columns={section.columns}
          defaultOpen={index === 0}
        />
      ))}

      <TrackMatcherRegisteredPanelStack />
    </div>
  );
}

function TrackMatcherFullLibrary({
  isOpen,
  onToggle,
}: {
  isOpen: boolean;
  onToggle: () => void;
}) {
  const sectionCount = getTrackMatcherLaneSectionConfigs().length;

  return (
    <section
      id="track-matcher-library"
      className="scroll-mt-24 border-t border-white/10 pt-4"
    >
      <div className="rounded-[2rem] border border-white/15 bg-black p-5 shadow-2xl shadow-black/25">
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full cursor-pointer list-none flex-wrap items-start justify-between gap-4 rounded-2xl p-1 text-left transition-transform duration-150 hover:-translate-y-0.5"
        >
          <div className="flex min-w-0 items-start gap-4">
            <span
              className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black text-xl font-black text-white transition-transform duration-150 ${
                isOpen ? "rotate-90" : ""
              }`}
            >
              ›
            </span>

            <div>
              <p className={eyebrowClass}>Full Track Matcher Library</p>

              <h2 className="mt-1 text-2xl font-black text-white">
                Open deeper lane architecture only when needed
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/70">
                This branch contains the lane groups, registry diagnostics,
                route map, zones, and future architecture panels. It now mounts
                only after you open it so Track Matcher stays fast.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/70">
              {sectionCount} Branches
            </span>

            <span className="rounded-full border border-white/10 bg-black px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/60">
              {isOpen ? "Close" : "Open"}
            </span>
          </div>
        </button>

        {isOpen ? <TrackMatcherLibraryContent /> : null}
      </div>
    </section>
  );
}

export default function TrackMatcherLaneOverviewPanel() {
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  function openLibrary() {
    setIsLibraryOpen(true);
    window.requestAnimationFrame(() => {
      document
        .getElementById("track-matcher-library")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <section className="space-y-5 rounded-[2rem] border border-white/10 bg-white/[0.03] p-5 shadow-2xl shadow-black/20">
      <TrackMatcherLanePanelHeader />
      <TrackMatcherControlCenter onOpenLibrary={openLibrary} />
      <TrackMatcherAtAGlance />
      <TrackMatcherQuickLinks onOpenLibrary={openLibrary} />
      <TrackMatcherFullLibrary
        isOpen={isLibraryOpen}
        onToggle={() => setIsLibraryOpen((current) => !current)}
      />
    </section>
  );
}
