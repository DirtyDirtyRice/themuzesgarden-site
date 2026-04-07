"use client";

type Note = {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  updated_at: string;
};

type Props = {
  notesErr: string | null;
  notesQuery: string;
  setNotesQuery: (value: string) => void;
  totalNotes: number;
  shownNotes: number;
  displayNotes: Note[];
  activeNoteId: string | null;
  activeNote: Note | null;
  editorTitle: string;
  setEditorTitle: (value: string) => void;
  editorBody: string;
  setEditorBody: (value: string) => void;
  editorDirty: boolean;
  autosaveOn: boolean;
  setAutosaveOn: (value: boolean) => void;
  creatingNote: boolean;
  savingNote: boolean;
  deletingNote: boolean;
  renamingId: string | null;
  renameValue: string;
  setRenameValue: (value: string) => void;
  renamingBusy: boolean;
  onTrySwitchNote: (nextId: string) => void;
  onCreateNote: () => void;
  onSaveActiveNote: () => void;
  onDeleteActiveNote: () => void;
  onTogglePin: (note: Note) => void;
  onStartRename: (note: Note) => void;
  onCancelRename: () => void;
  onSaveRename: (noteId: string) => void;
};

function firstLine(s: string) {
  const line = (s ?? "").replace(/\r/g, "").split("\n")[0] ?? "";
  return line.trim();
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function ProjectNotesWorkspace(props: Props) {
  const {
    notesErr,
    notesQuery,
    setNotesQuery,
    totalNotes,
    shownNotes,
    displayNotes,
    activeNoteId,
    activeNote,
    editorTitle,
    setEditorTitle,
    editorBody,
    setEditorBody,
    editorDirty,
    autosaveOn,
    setAutosaveOn,
    creatingNote,
    savingNote,
    deletingNote,
    renamingId,
    renameValue,
    setRenameValue,
    renamingBusy,
    onTrySwitchNote,
    onCreateNote,
    onSaveActiveNote,
    onDeleteActiveNote,
    onTogglePin,
    onStartRename,
    onCancelRename,
    onSaveRename,
  } = props;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[20rem,1fr]">
      <section className="rounded-xl border p-3 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-sm font-medium">Notes</div>
            <div className="text-xs text-zinc-500">
              Total: {totalNotes} • Showing: {shownNotes}
            </div>
          </div>

          <button
            className="rounded border px-3 py-2 text-xs disabled:opacity-60"
            onClick={onCreateNote}
            disabled={creatingNote}
          >
            {creatingNote ? "Creating…" : "New Note"}
          </button>
        </div>

        <input
          className="w-full rounded border px-3 py-2 text-sm"
          placeholder="Search notes…"
          value={notesQuery}
          onChange={(e) => setNotesQuery(e.target.value)}
        />

        {notesErr ? (
          <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {notesErr}
          </div>
        ) : null}

        <div className="max-h-[34rem] space-y-2 overflow-y-auto pr-1">
          {displayNotes.length === 0 ? (
            <div className="text-sm text-zinc-600">No notes yet.</div>
          ) : (
            displayNotes.map((note) => {
              const isActive = note.id === activeNoteId;
              const preview = firstLine(note.body || "");
              const previewText = preview || "Empty note";

              return (
                <div
                  key={note.id}
                  className={`rounded-lg border p-3 space-y-2 cursor-pointer ${
                    isActive ? "bg-zinc-50 border-black" : "bg-white"
                  }`}
                  onClick={() => onTrySwitchNote(note.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      {renamingId === note.id ? (
                        <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                          <input
                            className="w-full rounded border px-2 py-1 text-sm"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                          />
                          <div className="flex items-center gap-2">
                            <button
                              className="rounded border px-2 py-1 text-xs disabled:opacity-60"
                              onClick={() => onSaveRename(note.id)}
                              disabled={renamingBusy}
                            >
                              {renamingBusy ? "Saving…" : "Save"}
                            </button>
                            <button
                              className="rounded border px-2 py-1 text-xs"
                              onClick={onCancelRename}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="truncate text-sm font-medium">
                            {note.pinned ? "📌 " : ""}
                            {note.title || "Note"}
                          </div>
                          <div className="mt-1 line-clamp-2 text-xs text-zinc-500">
                            {previewText}
                          </div>
                        </>
                      )}
                    </div>

                    {renamingId !== note.id ? (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="rounded border px-2 py-1 text-[11px]"
                          onClick={() => onTogglePin(note)}
                          title={note.pinned ? "Unpin note" : "Pin note"}
                        >
                          {note.pinned ? "Unpin" : "Pin"}
                        </button>

                        <button
                          className="rounded border px-2 py-1 text-[11px]"
                          onClick={() => onStartRename(note)}
                        >
                          Rename
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <div className="text-[11px] text-zinc-500">
                    Updated: {formatDate(note.updated_at)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className="rounded-xl border p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-sm font-medium">
              {activeNote ? activeNote.title || "Note" : "Note Editor"}
            </div>
            <div className="text-xs text-zinc-500">
              {editorDirty ? "Unsaved changes" : "Saved"}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 rounded border px-3 py-2 text-xs">
              <input
                type="checkbox"
                checked={autosaveOn}
                onChange={(e) => setAutosaveOn(e.target.checked)}
              />
              Autosave
            </label>

            <button
              className="rounded border px-3 py-2 text-xs disabled:opacity-60"
              onClick={onSaveActiveNote}
              disabled={!activeNote || savingNote}
            >
              {savingNote ? "Saving…" : "Save"}
            </button>

            <button
              className="rounded border px-3 py-2 text-xs disabled:opacity-60"
              onClick={onDeleteActiveNote}
              disabled={!activeNote || deletingNote}
            >
              {deletingNote ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>

        {!activeNote ? (
          <div className="text-sm text-zinc-600">
            Select a note on the left, or create a new one.
          </div>
        ) : (
          <>
            <input
              className="w-full rounded border px-3 py-2 text-sm"
              value={editorTitle}
              onChange={(e) => setEditorTitle(e.target.value)}
              placeholder="Note title"
            />

            <textarea
              className="min-h-[28rem] w-full rounded border px-3 py-2 text-sm"
              value={editorBody}
              onChange={(e) => setEditorBody(e.target.value)}
              placeholder="Write your note here…"
            />
          </>
        )}
      </section>
    </div>
  );
}