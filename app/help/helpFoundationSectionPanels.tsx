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
import { HelpCardShell, HelpNote, RouteRail, RouteSteps, StatusPill, TinyText } from "./helpFoundationUiAtoms";

export function JumpToPanel({ links }: { links: HelpJumpLink[] }) {
  return (
    <section className={panelClass}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className={eyebrowClass}>Jump To</div>
          <h2 className="mt-1 text-xl font-black text-white">Pick the help section you need</h2>
          <p className={`mt-2 ${subTextClass}`}>
            Use these buttons to jump directly to the explanation instead of scrolling through the whole page.
          </p>
        </div>
        <StatusPill label="ADD FRIENDLY" />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {links.map((link) => (
          <a key={link.href} href={link.href} className={jumpButtonClass} title={link.detail}>
            {link.label}
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
    <section id={id} className={`${panelClass} scroll-mt-24`}>
      <div>
        <div className={eyebrowClass}>{eyebrow}</div>
        <h2 className="mt-1 text-xl font-black text-white">{title}</h2>
        <p className={`mt-2 ${subTextClass}`}>{body}</p>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {cards.map((card) => (
          <HelpCardView key={card.title} card={card} />
        ))}
      </div>
    </section>
  );
}

export function QuickAnswersPanel({ answers }: { answers: HelpQuickAnswer[] }) {
  return (
    <section id="quick-answers" className={`${panelClass} scroll-mt-24`}>
      <div className={eyebrowClass}>Quick Answers</div>
      <h2 className="mt-1 text-xl font-black text-white">Fast answers for common confusion</h2>
      <p className={`mt-2 ${subTextClass}`}>
        These are short answers for things that can cause confusion during real use.
      </p>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {answers.map((answer) => (
          <div key={answer.question} className={insetPanelClass}>
            <div className={titleClass}>{answer.question}</div>
            <p className={`mt-2 ${subTextClass}`}>{answer.answer}</p>
            {answer.route ? <RouteSteps steps={answer.route} /> : null}
          </div>
        ))}
      </div>
    </section>
  );
}

export function GlossaryPanel({ items }: { items: HelpGlossaryItem[] }) {
  return (
    <section className={panelClass}>
      <div className={eyebrowClass}>Plain Words</div>
      <h2 className="mt-1 text-xl font-black text-white">Small glossary for the Help system</h2>
      <p className={`mt-2 ${subTextClass}`}>
        This keeps the meaning of Help, Navigation, Routes, and verified workflows consistent.
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <div key={item.term} className={insetPanelClass}>
            <div className={titleClass}>{item.term}</div>
            <p className={`mt-2 ${subTextClass}`}>{item.meaning}</p>
            <TinyText>{item.useWhen}</TinyText>
          </div>
        ))}
      </div>
    </section>
  );
}

export function RouteMapPanel({ maps }: { maps: HelpRouteMap[] }) {
  return (
    <section className={panelClass}>
      <div className={eyebrowClass}>Route Maps</div>
      <h2 className="mt-1 text-xl font-black text-white">You're Here → How To Get There foundation</h2>
      <p className={`mt-2 ${subTextClass}`}>
        These route maps prepare the future context-sensitive Help system without redesigning navigation yet.
      </p>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {maps.map((map) => (
          <div key={map.title} className={insetPanelClass}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className={titleClass}>{map.title}</div>
              <StatusPill label={map.verified ? "VERIFIED" : "FOUNDATION"} />
            </div>
            <p className={`mt-2 ${tinyTextClass}`}>{map.summary}</p>
            <div className="mt-3 grid gap-2 text-xs font-bold text-white/70">
              <div>Start: {map.start}</div>
              <div>Finish: {map.finish}</div>
            </div>
            <div className="mt-3">
              <RouteRail steps={map.steps} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function WhatsNewPanel({ cards }: { cards: HelpUpdateCard[] }) {
  return (
    <section id="whats-new" className={`${panelClass} scroll-mt-24`}>
      <div className={eyebrowClass}>What&apos;s New?</div>
      <h2 className="mt-1 text-xl font-black text-white">First HELP foundation</h2>
      <p className={`mt-2 ${subTextClass}`}>
        Added the first HELP page structure for future member guidance. This starts the knowledge base that supports Find It, How Do I, What Is This, Routes, Tips, and What&apos;s New.
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {cards.map((card, index) => (
          <div key={`${card.title}-${index}`} className={insetPanelClass}>
            <div className={titleClass}>{card.title}</div>
            <p className={`mt-2 ${tinyTextClass}`}>{card.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
