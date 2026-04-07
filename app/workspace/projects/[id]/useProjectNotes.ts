"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { logProjectActivity } from "../../../../lib/projectActivity";
import type { LoadNotesOptions, Note, SaveActiveNoteOptions } from "./projectDetailsTypes";
import { looksLikeUuid } from "./projectDetailsUtils";

type UseProjectNotesArgs = {
  projectId: string;
  supabase: any;
};

export function useProjectNotes(args: UseProjectNotesArgs) {
  const { projectId, supabase } = args;

  const [notes, setNotes] = useState<Note[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [notesErr, setNotesErr] = useState<string | null>(null);

  const [notesQuery, setNotesQuery] = useState("");
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

  const [editorTitle, setEditorTitleRaw] = useState("");
  const [editorBody, setEditorBodyRaw] = useState("");
  const [editorDirty, setEditorDirty] = useState(false);

  const [creatingNote, setCreatingNote] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [deletingNote, setDeletingNote] = useState(false);

  const [autosaveOn, setAutosaveOn] = useState(false);
  const autosaveTimerRef = useRef<number | null>(null);

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renamingBusy, setRenamingBusy] = useState(false);

  const activeNote = useMemo(() => {
    if (!activeNoteId) return null;
    return notes.find((n) => n.id === activeNoteId) ?? null;
  }, [notes, activeNoteId]);

  const filteredNotes = useMemo(() => {
    const q = notesQuery.trim().toLowerCase();
    if (!q) return notes;

    return notes.filter((n) => {
      const t = (n.title ?? "").toLowerCase();
      const b = (n.body ?? "").toLowerCase();
      return t.includes(q) || b.includes(q);
    });
  }, [notes, notesQuery]);

  const displayNotes = useMemo(() => {
    const list = [...filteredNotes];
    list.sort((a, b) => {
      const ap = a.pinned ? 1 : 0;
      const bp = b.pinned ? 1 : 0;
      if (ap !== bp) return bp - ap;
      const ad = Date.parse(a.updated_at || "") || 0;
      const bd = Date.parse(b.updated_at || "") || 0;
      return bd - ad;
    });
    return list;
  }, [filteredNotes]);

  const totalNotes = notes.length;
  const shownNotes = displayNotes.length;

  const setEditorTitle = useCallback((value: string) => {
    setEditorTitleRaw(value);
    setEditorDirty(true);
  }, []);

  const setEditorBody = useCallback((value: string) => {
    setEditorBodyRaw(value);
    setEditorDirty(true);
  }, []);

  const loadNotes = useCallback(
    async (opts?: LoadNotesOptions) => {
      setNotesErr(null);
      setLoadingNotes(true);

      try {
        if (!supabase) throw new Error("Supabase client not found.");
        if (!looksLikeUuid(projectId)) throw new Error("Invalid project id format.");

        const { data, error } = await supabase
          .from("project_notes")
          .select("id, project_id, owner_id, title, body, pinned, created_at, updated_at")
          .eq("project_id", projectId)
          .order("updated_at", { ascending: false });

        if (error) throw new Error(error.message);

        const list = (data ?? []) as Note[];
        setNotes(list);

        const shouldAutoOpen = opts?.autoOpenNewest || (!activeNoteId && list.length > 0);

        if (shouldAutoOpen) {
          setActiveNoteId(list[0]?.id ?? null);
        } else if (activeNoteId && !list.some((n) => n.id === activeNoteId)) {
          setActiveNoteId(null);
        }
      } catch (e: any) {
        setNotesErr(e?.message ?? "Failed to load notes");
        setNotes([]);
        setActiveNoteId(null);
      } finally {
        setLoadingNotes(false);
      }
    },
    [supabase, projectId, activeNoteId]
  );

  const createNote = useCallback(async () => {
    setNotesErr(null);

    try {
      if (!supabase) throw new Error("Supabase client not found.");
      if (!looksLikeUuid(projectId)) throw new Error("Invalid project id format.");

      setCreatingNote(true);

      const seededTitle = notesQuery.trim() ? notesQuery.trim().slice(0, 120) : "Note";

      const { data, error } = await supabase
        .from("project_notes")
        .insert({ project_id: projectId, title: seededTitle, body: "", pinned: false })
        .select("id")
        .single();

      if (error) throw new Error(error.message);

      logProjectActivity(projectId, "note", `Created note: ${seededTitle || "Note"}`);

      setNotesQuery("");
      await loadNotes({ autoOpenNewest: true });
      if (data?.id) setActiveNoteId(String(data.id));
    } catch (e: any) {
      setNotesErr(e?.message ?? "Create note failed");
    } finally {
      setCreatingNote(false);
    }
  }, [supabase, projectId, notesQuery, loadNotes]);

  const saveActiveNote = useCallback(
    async (opts?: SaveActiveNoteOptions) => {
      if (!activeNote) return;
      if (!editorDirty && opts?.silent) return;

      setNotesErr(null);

      try {
        if (!supabase) throw new Error("Supabase client not found.");

        const title = (editorTitle || "Note").trim().slice(0, 120);
        const body = (editorBody || "").toString();

        if (!opts?.silent) setSavingNote(true);

        const { error } = await supabase
          .from("project_notes")
          .update({ title, body })
          .eq("id", activeNote.id);

        if (error) throw new Error(error.message);

        logProjectActivity(projectId, "note", `Saved note: ${title}`);

        setEditorDirty(false);
        await loadNotes();
      } catch (e: any) {
        if (!opts?.silent) setNotesErr(e?.message ?? "Save note failed");
      } finally {
        if (!opts?.silent) setSavingNote(false);
      }
    },
    [activeNote, editorDirty, supabase, editorTitle, editorBody, projectId, loadNotes]
  );

  const togglePin = useCallback(
    async (note: Note) => {
      setNotesErr(null);

      try {
        if (!supabase) throw new Error("Supabase client not found.");

        const { error } = await supabase
          .from("project_notes")
          .update({ pinned: !note.pinned })
          .eq("id", note.id);

        if (error) throw new Error(error.message);
        await loadNotes();
      } catch (e: any) {
        setNotesErr(e?.message ?? "Pin update failed");
      }
    },
    [supabase, loadNotes]
  );

  const startRename = useCallback((note: Note) => {
    setRenamingId(note.id);
    setRenameValue(note.title ?? "");
  }, []);

  const cancelRename = useCallback(() => {
    setRenamingId(null);
    setRenameValue("");
  }, []);

  const saveRename = useCallback(
    async (noteId: string) => {
      setNotesErr(null);

      const title = (renameValue || "Note").trim().slice(0, 120);
      if (!title) return;

      try {
        if (!supabase) throw new Error("Supabase client not found.");
        setRenamingBusy(true);

        const { error } = await supabase
          .from("project_notes")
          .update({ title })
          .eq("id", noteId);

        if (error) throw new Error(error.message);

        cancelRename();
        await loadNotes();
      } catch (e: any) {
        setNotesErr(e?.message ?? "Rename failed");
      } finally {
        setRenamingBusy(false);
      }
    },
    [renameValue, supabase, cancelRename, loadNotes]
  );

  const deleteActiveNote = useCallback(async () => {
    if (!activeNote) return;

    const ok = window.confirm("Delete this note? This cannot be undone.");
    if (!ok) return;

    setNotesErr(null);

    try {
      if (!supabase) throw new Error("Supabase client not found.");
      setDeletingNote(true);

      const deletedTitle = activeNote.title ?? "Note";

      const { error } = await supabase
        .from("project_notes")
        .delete()
        .eq("id", activeNote.id);

      if (error) throw new Error(error.message);

      logProjectActivity(projectId, "note", `Deleted note: ${deletedTitle}`);

      setActiveNoteId(null);
      setEditorTitleRaw("");
      setEditorBodyRaw("");
      setEditorDirty(false);

      await loadNotes({ autoOpenNewest: true });
    } catch (e: any) {
      setNotesErr(e?.message ?? "Delete note failed");
    } finally {
      setDeletingNote(false);
    }
  }, [activeNote, supabase, projectId, loadNotes]);

  const trySwitchNote = useCallback(
    (nextId: string) => {
      if (nextId === activeNoteId) return;

      if (!autosaveOn && editorDirty) {
        const ok = window.confirm("You have unsaved changes. Switch notes anyway?");
        if (!ok) return;
      }

      setActiveNoteId(nextId);
    },
    [activeNoteId, autosaveOn, editorDirty]
  );

  useEffect(() => {
    if (!activeNote) {
      setEditorTitleRaw("");
      setEditorBodyRaw("");
      setEditorDirty(false);
      return;
    }

    setEditorTitleRaw(activeNote.title ?? "");
    setEditorBodyRaw(activeNote.body ?? "");
    setEditorDirty(false);
  }, [activeNote?.id]);

  useEffect(() => {
    if (!autosaveOn) return;
    if (!activeNote) return;
    if (!editorDirty) return;

    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = window.setTimeout(() => {
      void saveActiveNote({ silent: true });
    }, 800);

    return () => {
      if (autosaveTimerRef.current) {
        window.clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }
    };
  }, [autosaveOn, activeNote, editorDirty, editorTitle, editorBody, saveActiveNote]);

  return {
    notes,
    setNotes,
    loadingNotes,
    notesErr,
    notesQuery,
    setNotesQuery,
    activeNoteId,
    setActiveNoteId,
    activeNote,
    filteredNotes,
    displayNotes,
    totalNotes,
    shownNotes,
    editorTitle,
    setEditorTitle,
    editorBody,
    setEditorBody,
    editorDirty,
    setEditorDirty,
    creatingNote,
    savingNote,
    deletingNote,
    autosaveOn,
    setAutosaveOn,
    renamingId,
    renameValue,
    setRenameValue,
    renamingBusy,
    loadNotes,
    createNote,
    saveActiveNote,
    togglePin,
    startRename,
    cancelRename,
    saveRename,
    deleteActiveNote,
    trySwitchNote,
  };
}