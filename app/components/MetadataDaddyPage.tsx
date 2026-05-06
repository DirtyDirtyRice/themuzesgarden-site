import Link from "next/link";

export type MetadataDaddyChildLink = {
  title: string;
  href: string;
  description: string;
};

type MetadataDaddyPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  howToUse: string;
  childLinks: MetadataDaddyChildLink[];
  whatsComingTitle?: string;
  whatsComingLines?: string[];
};

export default function MetadataDaddyPage({
  eyebrow,
  title,
  description,
  howToUse,
  childLinks,
  whatsComingTitle = "What’s Coming",
  whatsComingLines = [],
}: MetadataDaddyPageProps) {
  return (
    <main className="min-h-screen bg-black px-4 py-6 text-white md:px-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-white/10 px-2 py-1 text-white/70">
                Metadata
              </span>
              <span className="rounded-full border border-white/10 px-2 py-1 text-white/70">
                Parent Page
              </span>
              <span className="rounded-full border border-white/10 px-2 py-1 text-white/70">
                Guided Navigation
              </span>
            </div>

            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
              {eyebrow}
            </p>

            <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
              {title}
            </h1>

            <p className="max-w-3xl text-sm leading-6 text-white/70 md:text-base">
              {description}
            </p>

            <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                How To Use This Page
              </p>

              <p className="mt-2 text-sm leading-6 text-white/75">
                {howToUse}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
              Child Pages
            </p>

            <h2 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
              Choose Where To Go Next
            </h2>

            <p className="max-w-3xl text-sm leading-6 text-white/70 md:text-base">
              These buttons open the main child pages for this part of the app.
              You can use this page as a guide first, or use the top navigation
              when you already know where you want to go.
            </p>

            <div className="grid gap-4 pt-2 md:grid-cols-3">
              {childLinks.map((child) => (
                <Link
                  key={child.href}
                  href={child.href}
                  className="rounded-2xl border border-white/10 bg-black/40 p-4 transition hover:bg-white/[0.06]"
                >
                  <div className="text-base font-semibold text-white">
                    {child.title}
                  </div>

                  <p className="mt-2 text-sm leading-6 text-white/70">
                    {child.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
              Preview
            </p>

            <h2 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
              {whatsComingTitle}
            </h2>

            <p className="max-w-3xl text-sm leading-6 text-white/70 md:text-base">
              This section is here on purpose so future ideas do not get lost.
              It can be removed later after these things are fully built.
            </p>

            {whatsComingLines.length > 0 ? (
              <div className="grid gap-3 pt-2">
                {whatsComingLines.map((line, index) => (
                  <div
                    key={`${line}-${index}`}
                    className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm leading-6 text-white/75"
                  >
                    {line}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}