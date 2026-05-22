import {
  eyebrowClass,
  insetPanelClass,
  jumpButtonClass,
  panelClass,
  subTextClass,
  tinyTextClass,
  titleClass,
} from "./helpFoundationStyles";
import type {
  HelpCard,
  HelpGlossaryItem,
  HelpJumpLink,
  HelpQuickAnswer,
  HelpRouteMap,
  HelpUpdateCard,
} from "./helpFoundationTypes";
import {
  HelpCardShell,
  HelpMiniLabel,
  HelpNote,
  RouteRail,
  RouteSteps,
  StatusPill,
  TinyText,
} from "./helpFoundationUiAtoms";
import HelpFoundationFindItPanel from "./helpFoundationFindItPanel";

function CountPill({ label }: { label: string }) {
  return (
    <span className="rounded-xl border border-white/10 bg-black px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white/70">
      {label}
    </span>
  );
}

function SectionHeader({
  eyebrow,
  title,
  body,
  count,
  countLabel = "cards",
}: {
  eyebrow: string;
  title: string;
  body: string;
  count?: number;
  countLabel?: string;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="max-w-3xl">
        <div className={eyebrowClass}>{eyebrow}</div>
        <h2 className="mt-1 text-xl font-black text-white">{title}</h2>
        <p className={`mt-2 ${subTextClass}`}>{body}</p>
      </div>

      {typeof count === "number" ? (
        <CountPill label={`${count} ${countLabel}`} />
      ) : null}
    </div>
  );
}

function HelpDisclosurePanel({
  id,
  eyebrow,
  title,
  body,
  count,
  countLabel = "cards",
  defaultOpen = false,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  count?: number;
  countLabel?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <details
        className={`${panelClass} group overflow-hidden`}
        open={defaultOpen}
      >
        <summary className="-m-2 flex cursor-pointer list-none flex-wrap items-start justify-between gap-4 rounded-2xl p-2 transition-transform duration-150 hover:-translate-y-0.5 [&::-webkit-details-marker]:hidden">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black text-lg font-black text-white transition-transform duration-150 group-open:rotate-90">
              ›
            </span>

            <div className="min-w-0">
              <div className={eyebrowClass}>{eyebrow}</div>
              <h2 className="mt-1 text-xl font-black text-white">{title}</h2>
              <p className={`mt-2 ${subTextClass}`}>{body}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {typeof count === "number" ? (
              <CountPill label={`${count} ${countLabel}`} />
            ) : null}

            <span className="rounded-xl border border-white/10 bg-black px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white/70 group-open:hidden">
              OPEN
            </span>

            <span className="hidden rounded-xl border border-white/10 bg-black px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white/70 group-open:inline-flex">
              CLOSE
            </span>
          </div>
        </summary>

        <div className="mt-5 border-t border-white/10 pt-5">{children}</div>
      </details>
    </section>
  );
}

function HelpControlHintPanel() {
  return (
    <div className={insetPanelClass}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wide text-white/70">
            How to use this page
          </div>

          <div className={`mt-1 ${titleClass}`}>
            Open only the help branch you need
          </div>
        </div>

        <StatusPill label="DROPDOWN TREE" />
      </div>

      <p className={`mt-2 ${tinyTextClass}`}>
        The Help page is now meant to work like a control center. Open a branch,
        read what you need, close it, then move to the next branch instead of
        scrolling through every explanation at once.
      </p>
    </div>
  );
}

export function JumpToPanel({ links }: { links: HelpJumpLink[] }) {
  return (
    <section className={panelClass}>
      <SectionHeader
        eyebrow="Help Control Center"
        title="Pick one rabbit hole at a time"
        body="Use these buttons as a quick map, then open the dropdown branch that matches the thing you are trying to understand."
        count={links.length}
        countLabel="branches"
      />

      <div className="mt-4">
        <HelpControlHintPanel />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {links.map((link, index) => (
          <a
            key={link.href}
            href={link.href}
            className={[
              jumpButtonClass,
              "flex-col items-start justify-start gap-1 text-left",
            ].join(" ")}
            title={link.detail}
          >
            <span className="text-[11px] font-bold uppercase tracking-wide text-white/70">
              {String(index + 1).padStart(2, "0")}
            </span>

            <span className="text-sm font-black text-white">{link.label}</span>

            <span className="text-xs font-medium leading-5 text-white/70">
              {link.detail}
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}

export function HelpCardView({ card }: { card: HelpCard }) {
  return (
    <HelpCardShell title={card.title} status={card.status}>
      <p>{card.body}</p>
      {card.route ? <RouteSteps steps={card.route} /> : null}
      {card.note ? <HelpNote>{card.note}</HelpNote> : null}
    </HelpCardShell>
  );
}

export function HelpSection({
  id,
  eyebrow,
  title,
  body,
  cards,
}: {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  cards: HelpCard[];
}) {
  return (
    <HelpDisclosurePanel
      id={id}
      eyebrow={eyebrow}
      title={title}
      body={body}
      count={cards.length}
    >
      <div className="grid gap-3 lg:grid-cols-2">
        {cards.map((card) => (
          <HelpCardView key={card.title} card={card} />
        ))}
      </div>
    </HelpDisclosurePanel>
  );
}

export function QuickAnswersPanel({ answers }: { answers: HelpQuickAnswer[] }) {
  return (
    <HelpDisclosurePanel
      id="quick-answers"
      eyebrow="Quick Answers"
      title="Fast answers for common confusion"
      body="Short answers for things that can cause confusion during real use."
      count={answers.length}
      countLabel="answers"
    >
      <div className="grid gap-3 lg:grid-cols-2">
        {answers.map((answer, index) => (
          <div key={answer.question} className={insetPanelClass}>
            <div className="flex flex-wrap items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 text-xs font-black text-white">
                {index + 1}
              </span>

              <div className="min-w-0 flex-1">
                <div className={titleClass}>{answer.question}</div>
                <p className={`mt-2 ${subTextClass}`}>{answer.answer}</p>
              </div>
            </div>

            {answer.route ? (
              <div className="mt-3">
                <HelpMiniLabel>Suggested route</HelpMiniLabel>
                <RouteSteps steps={answer.route} />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </HelpDisclosurePanel>
  );
}

export function GlossaryPanel({ items }: { items: HelpGlossaryItem[] }) {
  return (
    <HelpDisclosurePanel
      id="glossary"
      eyebrow="Plain Words"
      title="Small glossary for the Help system"
      body="Meanings for Help, Navigation, Routes, verified workflows, app areas, and future systems."
      count={items.length}
      countLabel="terms"
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <div key={item.term} className={insetPanelClass}>
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 text-xs font-black text-white">
                {item.term.slice(0, 1).toUpperCase()}
              </span>

              <div className="min-w-0">
                <div className={titleClass}>{item.term}</div>
                <p className={`mt-2 ${subTextClass}`}>{item.meaning}</p>
                <TinyText>{item.useWhen}</TinyText>
              </div>
            </div>
          </div>
        ))}
      </div>
    </HelpDisclosurePanel>
  );
}

export function RouteMapPanel({ maps }: { maps: HelpRouteMap[] }) {
  const verifiedCount = maps.filter((map) => map.verified).length;

  return (
    <HelpDisclosurePanel
      id="route-maps"
      eyebrow="Route Maps"
      title="You're Here → How To Get There foundation"
      body="Click-order maps for moving through the app without guessing."
      count={maps.length}
      countLabel="routes"
    >
      <div className="flex flex-wrap gap-2">
        <StatusPill label={`${verifiedCount} VERIFIED`} />
        <StatusPill label={`${maps.length - verifiedCount} FOUNDATION`} />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {maps.map((map, index) => (
          <div key={map.title} className={insetPanelClass}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wide text-white/70">
                  Route {index + 1}
                </div>

                <div className={`mt-1 ${titleClass}`}>{map.title}</div>
              </div>

              <StatusPill label={map.verified ? "VERIFIED" : "FOUNDATION"} />
            </div>

            <p className={`mt-2 ${tinyTextClass}`}>{map.summary}</p>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-black px-3 py-2">
                <div className="text-[11px] font-bold uppercase tracking-wide text-white/70">
                  Start
                </div>
                <div className="mt-1 text-sm font-bold text-white">
                  {map.start}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-black px-3 py-2">
                <div className="text-[11px] font-bold uppercase tracking-wide text-white/70">
                  Finish
                </div>
                <div className="mt-1 text-sm font-bold text-white">
                  {map.finish}
                </div>
              </div>
            </div>

            <div className="mt-3">
              <RouteRail steps={map.steps} />
            </div>
          </div>
        ))}
      </div>
    </HelpDisclosurePanel>
  );
}

export function WhatsNewPanel({ cards }: { cards: HelpUpdateCard[] }) {
  return (
    <HelpDisclosurePanel
      id="whats-new"
      eyebrow="What's New?"
      title="First HELP foundation"
      body="Recent Help foundation updates and verified app guidance."
      count={cards.length}
      countLabel="updates"
    >
      <div className="grid gap-3 md:grid-cols-3">
        {cards.map((card, index) => (
          <div key={`${card.title}-${index}`} className={insetPanelClass}>
            <div className="text-[11px] font-bold uppercase tracking-wide text-white/70">
              Update {index + 1}
            </div>

            <div className={`mt-1 ${titleClass}`}>{card.title}</div>
            <p className={`mt-2 ${tinyTextClass}`}>{card.body}</p>
          </div>
        ))}
      </div>
    </HelpDisclosurePanel>
  );
}

export function FindItSectionPanel() {
  return (
    <HelpDisclosurePanel
      id="find-it"
      eyebrow="Find It"
      title="Find the right page, feature, or help route"
      body="Use this when you know what you want to do but do not know where it lives yet."
      countLabel="tool"
      defaultOpen
    >
      <HelpFoundationFindItPanel />
    </HelpDisclosurePanel>
  );
}
