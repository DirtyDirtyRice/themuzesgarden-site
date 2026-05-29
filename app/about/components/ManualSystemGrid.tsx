import Link from "next/link";

export type ManualSystemCard = {
  title: string;
  href: string;
  summary: string;
  whyItMatters: string;
  status: "Working now" | "Building now" | "Planned";
};

function getStatusClass(status: ManualSystemCard["status"]) {
  if (status === "Working now") {
    return "border-emerald-100/20 bg-emerald-300/[0.06] text-emerald-50/75";
  }

  if (status === "Building now") {
    return "border-amber-100/20 bg-amber-300/[0.06] text-amber-50/75";
  }

  return "border-white/15 bg-white/[0.04] text-white/55";
}

export default function ManualSystemGrid({
  title,
  body,
  systems,
}: {
  title: string;
  body: string;
  systems: ManualSystemCard[];
}) {
  return (
    <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-white">{title}</h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">
            {body}
          </p>
        </div>

        <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
          {systems.length} pages
        </span>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {systems.map((system) => (
          <article
            key={system.href}
            className="rounded-xl border border-white/10 bg-black/35 p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <Link
                href={system.href}
                className="text-lg font-semibold text-white underline-offset-4 transition hover:text-white/75 hover:underline"
              >
                {system.title}
              </Link>

              <span
                className={[
                  "rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em]",
                  getStatusClass(system.status),
                ].join(" ")}
              >
                {system.status}
              </span>
            </div>

            <p className="mt-3 text-sm leading-6 text-white/60">
              {system.summary}
            </p>

            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.025] p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
                Why it matters
              </p>

              <p className="mt-1 text-sm leading-6 text-white/55">
                {system.whyItMatters}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}