"use client";

type Props = {
  engineState: unknown;
};

type NoteItem = {
  title: string;
  body: string;
  tag: string;
};

const panelClass =
  "rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white shadow-xl";

const cardClass =
  "rounded-2xl border border-white/10 bg-black p-4";

function readRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function readText(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function buildNotes(engineState: unknown): NoteItem[] {
  const state = readRecord(engineState);
  const health = readRecord(state.health);
  const relationship = readRecord(state.relationship);
  const sync = readRecord(state.sync);

  return [
    {
      title: "Green state preserved",
      body: readText(
        health.summary,
        "Core engine, relationship layer, and sync layer are recovered and compiling."
      ),
      tag: "Build safety",
    },
    {
      title: "Insight layer stays off",
      body: "The broken insight layer is intentionally not restored during this expansion. Dashboard growth should use the verified green foundations only.",
      tag: "Do not restore",
    },
    {
      title: "Relationship layer available",
      body: readText(
        relationship.summary,
        "Relationship state is visible through the existing relationship panel and can now support more workstation cards."
      ),
      tag: "Recovered",
    },
    {
      title: "Sync layer available",
      body: readText(
        sync.summary,
        "Sync state is available for future timing, alignment, and track matching workstation controls."
      ),
      tag: "Recovered",
    },
    {
      title: "Next build rule",
      body: "After this panel batch, run the build, verify green, then push before continuing the next Multi Track expansion.",
      tag: "Workflow",
    },
  ];
}

export function MultiTrackSessionNotesPanel({ engineState }: Props) {
  const notes = buildNotes(engineState);

  return (
    <section className={panelClass}>
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-white/70">
          Session Notes
        </p>
        <h3 className="mt-2 text-2xl font-black text-white">
          Multi Track expansion log
        </h3>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-white/70">
          A visible memory rail for the workstation so the page explains what is
          green, what is intentionally avoided, and what should happen next.
        </p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {notes.map((note) => (
          <article key={note.title} className={cardClass}>
            <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-white/70">
              {note.tag}
            </span>

            <h4 className="mt-4 text-lg font-black text-white">{note.title}</h4>

            <p className="mt-2 text-sm leading-6 text-white/70">{note.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}