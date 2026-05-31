"use client";

import type {
  MultiTrackAnalysisNoteDraft,
  MultiTrackAnalysisNoteKind,
  MultiTrackAnalysisNoteRecord,
} from "../session/multiTrackAnalysisNoteTypes";
import {
  createMultiTrackAnalysisNotePriorityLabel,
} from "../session/multiTrackAnalysisNoteHelpers";

const cardClass =
  "rounded-2xl border border-white/10 bg-black/40 p-4 text-white";

const buttonClass =
  "rounded-xl border border-white/10 bg-white/[0.07] px-3 py-2 text-xs font-black text-white/75 transition-transform duration-150 hover:-translate-y-0.5 active:scale-[0.98]";

const noteKinds: Array<MultiTrackAnalysisNoteKind | "all"> = [
  "all",
  "listening",
  "arrangement",
  "timeline",
  "decision",
  "metadata",
  "prompt",
  "ai",
];

function kindLabel(kind: MultiTrackAnalysisNoteKind | "all") {
  if (kind === "all") return "All";
  if (kind === "ai") return "AI";
  return kind.charAt(0).toUpperCase() + kind.slice(1);
}

function NoteCard({ note }: { note: MultiTrackAnalysisNoteRecord }) {
  return (
    <article className={cardClass}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-white/45">
            {note.kind} / {note.target}
          </p>
          <h3 className="mt-2 text-sm font-black text-white">
            {note.title}
          </h3>
        </div>

        <span className="rounded-full border border-white/10 bg-white/[0.07] px-3 py-1 text-[0.65rem] font-black uppercase tracking-[0.14em] text-white/60">
          {createMultiTrackAnalysisNotePriorityLabel(note.priority)}
        </span>
      </div>

      <p className="mt-3 text-xs leading-5 text-white/55">
        {note.body}
      </p>

      <p className="mt-3 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[0.65rem] font-black uppercase tracking-[0.14em] text-white/55">
        {note.status}
      </p>
    </article>
  );
}

export function MultiTrackAnalysisNotesPanel({
  filteredNotes,
  onAddNote,
  onSelectKind,
  selectedKind,
  summary,
}: {
  filteredNotes: MultiTrackAnalysisNoteRecord[];
  onAddNote: (draft: MultiTrackAnalysisNoteDraft) => void;
  onSelectKind: (kind: MultiTrackAnalysisNoteKind | "all") => void;
  selectedKind: MultiTrackAnalysisNoteKind | "all";
  summary: string;
}) {
  function addDemoListeningNote() {
    onAddNote({
      kind: "listening",
      priority: "high",
      title: "Fresh listening note",
      body: "Added from the controller panel as a future human review note.",
      target: "pair",
    });
  }

  function addDemoTimelineNote() {
    onAddNote({
      kind: "timeline",
      priority: "medium",
      title: "Timeline review note",
      body: "Marks a future hook, transition, sync issue, or blend opportunity.",
      target: "session",
    });
  }

  function addDemoPromptNote() {
    onAddNote({
      kind: "prompt",
      priority: "low",
      title: "Prompt idea note",
      body: "Captures future prompt language without mixing prompt logic into the controller body.",
      target: "session",
    });
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white shadow-2xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-white/45">
            Analysis Notes
          </p>

          <h2 className="mt-2 text-xl font-black text-white">
            Human Review Notes
          </h2>

          <p className="mt-2 max-w-4xl text-sm leading-6 text-white/70">
            Captures listening, arrangement, decision, metadata, timeline,
            prompt, and AI notes outside the controller body so future analysis
            work does not become a giant page or controller file.
          </p>
        </div>

        <span className="rounded-full border border-white/10 bg-white/[0.07] px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-white/65">
          {summary}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {noteKinds.map((kind) => (
          <button
            key={kind}
            className={`${buttonClass} ${
              selectedKind === kind ? "border-white/25 bg-white/[0.14]" : ""
            }`}
            type="button"
            onClick={() => onSelectKind(kind)}
          >
            {kindLabel(kind)}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-black/35 p-3">
        <button className={buttonClass} type="button" onClick={addDemoListeningNote}>
          Add Listening Note
        </button>
        <button className={buttonClass} type="button" onClick={addDemoTimelineNote}>
          Add Timeline Note
        </button>
        <button className={buttonClass} type="button" onClick={addDemoPromptNote}>
          Add Prompt Note
        </button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {filteredNotes.map((note) => (
          <NoteCard key={note.id} note={note} />
        ))}
      </div>
    </section>
  );
}