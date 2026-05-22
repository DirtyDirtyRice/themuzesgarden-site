import { eyebrowClass, panelClass } from "./helpFoundationStyles";
import { StatusPill } from "./helpFoundationUiAtoms";

const helpStats = [
  {
    label: "Find It",
    value: "60+",
    detail: "Navigation encyclopedia entries",
  },
  {
    label: "Routes",
    value: "40+",
    detail: "Step-by-step navigation paths",
  },
  {
    label: "Workflows",
    value: "40+",
    detail: "How Do I guides",
  },
  {
    label: "Glossary",
    value: "40+",
    detail: "Plain-language definitions",
  },
];

const startHereCards = [
  {
    title: "I'm Lost",
    body: "Open Find It and search for the thing you need.",
  },
  {
    title: "I Need To Find Something",
    body: "Use Find It for locations, pages, tools, and workflows.",
  },
  {
    title: "I Need To Do Something",
    body: "Use How Do I for step-by-step workflows.",
  },
  {
    title: "I Need A Definition",
    body: "Use What Is This or the Glossary.",
  },
];

const featuredTopics = [
  "Library",
  "Projects",
  "Track Matcher",
  "Metadata",
  "Player",
  "Help",
];

export function HelpHeroPanel() {
  return (
    <section className={panelClass}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-4xl">
          <div className={eyebrowClass}>The Muzes Garden</div>

          <h1 className="mt-2 text-4xl font-black tracking-tight text-white">
            HELP
          </h1>

          <p className="mt-3 text-base leading-7 text-white/70">
            The Help Foundation is the navigation and learning system for The
            Muzes Garden. It explains where things are, how to get there, how
            to use them, and what they mean.
          </p>

          <p className="mt-3 text-sm leading-6 text-white/70">
            Verified workflows come first. Planned systems can be named, but
            instructions should stay tied to real tested routes whenever
            possible.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <StatusPill label="FIND IT" />
          <StatusPill label="HOW DO I?" />
          <StatusPill label="WHAT IS THIS?" />
          <StatusPill label="ROUTES" />
          <StatusPill label="GLOSSARY" />
          <StatusPill label="TIPS" />
          <StatusPill label="WHAT'S NEW?" />
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        {helpStats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-white/10 bg-black/40 p-4"
          >
            <div className="text-xs uppercase tracking-[0.2em] text-white/70">
              {stat.label}
            </div>

            <div className="mt-2 text-3xl font-black text-white">
              {stat.value}
            </div>

            <div className="mt-2 text-sm text-white/70">
              {stat.detail}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-white/10 bg-black/40 p-5">
        <div className="text-xs uppercase tracking-[0.2em] text-white/70">
          Start Here
        </div>

        <h2 className="mt-2 text-xl font-black text-white">
          Not sure where to begin?
        </h2>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {startHereCards.map((card) => (
            <div
              key={card.title}
              className="rounded-xl border border-white/10 bg-black/60 p-4"
            >
              <div className="font-bold text-white">
                {card.title}
              </div>

              <div className="mt-2 text-sm text-white/70">
                {card.body}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-black/40 p-5">
          <div className="text-xs uppercase tracking-[0.2em] text-white/70">
            Featured Topics
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {featuredTopics.map((topic) => (
              <div
                key={topic}
                className="rounded-full border border-white/10 px-3 py-2 text-sm text-white"
              >
                {topic}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/40 p-5">
          <div className="text-xs uppercase tracking-[0.2em] text-white/70">
            ADD-Friendly Recovery
          </div>

          <div className="mt-3 text-white font-bold">
            Lost?
          </div>

          <div className="mt-2 text-sm text-white/70">
            Open Help → Find It.
          </div>

          <div className="mt-2 text-sm text-white/70">
            Search for the thing you want.
          </div>

          <div className="mt-2 text-sm text-white/70">
            Follow the route chips one step at a time.
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-white/10 bg-black/40 p-5">
        <div className="text-xs uppercase tracking-[0.2em] text-white/70">
          Foundation Status
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <StatusPill label="VERIFIED WORKFLOWS" />
          <StatusPill label="HELP FOUNDATION" />
          <StatusPill label="ROUTE MAPS" />
          <StatusPill label="FIND IT" />
          <StatusPill label="TRACK MATCHER HELP" />
          <StatusPill label="METADATA HELP" />
        </div>
      </div>
    </section>
  );
}