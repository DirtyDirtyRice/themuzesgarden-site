"use client";

import { useState } from "react";

import { PROJECT_TAB_CONFIG } from "./projectTabConfig";
import type { Project, ProjectVisibility, Tab } from "./projectDetailsTypes";

type Props = {
  project: Project | null;
  tab: Tab | null;
  setTab: (t: Tab | null) => void;
  onSaveProjectSettings: (settings: {
    title: string;
    visibility: Exclude<ProjectVisibility, "shared">;
  }) => Promise<boolean>;
};

const buttonClass = [
  "min-w-[120px] rounded-xl border border-white/25 bg-black",
  "px-4 py-2 text-sm font-bold text-white",
  "transition-transform duration-150",
  "hover:scale-[1.03] active:scale-[0.98]",
].join(" ");

export default function ProjectTabs({
  project,
  tab,
  setTab,
  onSaveProjectSettings,
}: Props) {
  const [howToOpen, setHowToOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function openEditor() {
    if (!project) return;
    setTitle(project.title);
    setVisibility(project.visibility === "public" ? "public" : "private");
    setMessage(null);
    setEditOpen(true);
  }

  async function saveSettings() {
    if (!project || !title.trim()) return;

    if (visibility === "public" && project.visibility !== "public") {
      const confirmed = window.confirm(
        `Make "${title.trim()}" public? Every linked song will be public.`,
      );
      if (!confirmed) return;
    }

    setSaving(true);
    setMessage(null);
    const saved = await onSaveProjectSettings({ title, visibility });
    setSaving(false);
    setMessage(
      saved
        ? "Project settings saved."
        : "Project settings could not be saved.",
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {PROJECT_TAB_CONFIG.map((t) => {
          const active = t.key === tab;

          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(active ? null : t.key)}
              className={[buttonClass, active ? "ring-1 ring-white/40" : ""].join(" ")}
            >
              {t.label}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => (editOpen ? setEditOpen(false) : openEditor())}
          className={buttonClass}
          title="Edit project name and privacy"
          disabled={!project}
        >
          {editOpen ? "Close Editor" : "Edit Project"}
        </button>

        <button
          type="button"
          onClick={() => setHowToOpen((current) => !current)}
          className={[
            "min-w-[120px] rounded-xl border border-white/25",
            "bg-white px-4 py-2 text-sm font-black text-black",
            "transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98]",
          ].join(" ")}
        >
          {howToOpen ? "Close Help" : "How To"}
        </button>
      </div>

      {editOpen ? (
        <section className="rounded-2xl border border-white/25 bg-black p-4">
          <h2 className="text-base font-black text-white">Edit Project</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_180px_auto]">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="rounded-xl border border-white/25 bg-black px-4 py-3 text-white"
              aria-label="Project title"
            />
            <select
              value={visibility}
              onChange={(event) =>
                setVisibility(event.target.value as "private" | "public")
              }
              className="rounded-xl border border-white/25 bg-black px-4 py-3 text-white"
              aria-label="Project privacy"
            >
              <option value="private">Private</option>
              <option value="public">Public</option>
            </select>
            <button
              type="button"
              onClick={saveSettings}
              disabled={saving || !title.trim()}
              className={buttonClass}
            >
              {saving ? "Saving" : "Save Changes"}
            </button>
          </div>
          {message ? (
            <p className="mt-3 text-sm text-white/70">{message}</p>
          ) : null}
        </section>
      ) : null}
      {howToOpen ? (
        <section className="rounded-2xl border border-white/20 bg-black p-4 text-sm leading-6 text-white/75">
          <h2 className="text-base font-black text-white">Project Page Help</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5">
            <li><span className="font-black text-white">Overview</span> shows project status and playback readiness.</li>
            <li><span className="font-black text-white">Library</span> shows the songs/files linked to this project.</li>
            <li><span className="font-black text-white">Upload File</span> and <span className="font-black text-white">Upload Folder</span> add new files into this project.</li>
            <li><span className="font-black text-white">Project Liaison</span> sends existing Library songs into projects.</li>
            <li><span className="font-black text-white">Play Project</span> uses the linked songs as the project setlist.</li>
          </ol>
        </section>
      ) : null}
    </div>
  );
}