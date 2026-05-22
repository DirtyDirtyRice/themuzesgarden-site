"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import TopNav from "../components/TopNav";
import { supabase } from "../../lib/supabaseClient";
import type { Track } from "../../types/track";
import { addUploadedTrack } from "../../lib/uploadedTracks";

type UploadedItem = {
  name: string;
  path: string;
  publicUrl: string;
  addedToLibrary: boolean;
  trackId?: string;
};

type UploadVisibility = "shared" | "private";

const BUCKET = "audio";
const FOLDER = "uploads";

const buttonClass =
  "rounded-xl border border-white/25 bg-black px-4 py-2 text-sm font-bold text-white transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";

const secondaryButtonClass =
  "rounded-xl border border-white/25 bg-black px-3 py-2 text-xs font-bold text-white transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98]";

const panelClass = "rounded-2xl border border-white/25 bg-black p-5";

const helperTextClass = "text-sm leading-6 text-white/70";

function makeSafeFileName(original: string) {
  const cleaned = original
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\w.\- ]+/g, "");
  const parts = cleaned.split(".");
  const ext = parts.length > 1 ? parts.pop() : "mp3";
  const base = parts.join(".") || "audio";

  const c = globalThis.crypto as unknown as { randomUUID?: () => string };
  const id =
    c?.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(16).slice(2)}`;

  return `${base}-${id}.${ext}`;
}

function titleFromFileName(name: string) {
  const base = name.replace(/\.[^/.]+$/, "");
  return base.trim() || "Untitled";
}

function newTrackId() {
  const c = globalThis.crypto as unknown as { randomUUID?: () => string };
  return (
    c?.randomUUID?.() ??
    `upl_${Date.now()}_${Math.random().toString(16).slice(2)}`
  );
}

function getFileDisplayName(file: File) {
  const relativePath = String((file as any).webkitRelativePath ?? "").trim();
  return relativePath || file.name;
}

function isSupportedAudioFile(file: File) {
  const name = file.name.toLowerCase();
  return (
    name.endsWith(".wav") ||
    name.endsWith(".mp3") ||
    name.endsWith(".flac") ||
    name.endsWith(".aiff") ||
    name.endsWith(".aif")
  );
}

export default function UploadPage() {
  const router = useRouter();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  const [checkingSession, setCheckingSession] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [items, setItems] = useState<UploadedItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<UploadVisibility>("shared");
  const [userId, setUserId] = useState<string | null>(null);

  const accept = useMemo(
    () => ".wav,.mp3,.flac,.aiff,.aif,audio/wav,audio/mpeg,audio/flac,audio/aiff",
    []
  );

  useEffect(() => {
    let mounted = true;

    async function check() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        const session = data.session;
        if (!session) {
          router.replace("/members");
          return;
        }

        if (mounted) {
          setUserId(session.user?.id ?? null);
        }
      } catch {
        router.replace("/members");
        return;
      } finally {
        if (mounted) setCheckingSession(false);
      }
    }

    check();

    return () => {
      mounted = false;
    };
  }, [router]);

  function createUploadedTrack(it: UploadedItem): Track {
    return {
      id: it.trackId ?? newTrackId(),
      title: titleFromFileName(it.name),
      artist: "The Muzes Garden",
      url: it.publicUrl,
      tags: ["uploaded"],
      visibility,
      ownerId: userId ?? undefined,
      createdAt: new Date().toISOString(),
    };
  }

  async function uploadFiles(fileList: FileList | null) {
    setError(null);

    const files = Array.from(fileList ?? []).filter(isSupportedAudioFile);
    if (!files.length) return;

    setIsUploading(true);

    try {
      const nextItems: UploadedItem[] = [];

      for (const file of files) {
        const displayName = getFileDisplayName(file);
        const safeName = makeSafeFileName(displayName.replace(/[\\/]+/g, " "));
        const path = `${FOLDER}/${safeName}`;

        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type || "audio/mpeg",
          });

        if (upErr) throw upErr;

        const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
        const publicUrl = data.publicUrl;
        const trackId = newTrackId();

        const uploadedItem: UploadedItem = {
          name: displayName,
          path,
          publicUrl,
          addedToLibrary: true,
          trackId,
        };

        addUploadedTrack(createUploadedTrack(uploadedItem));
        nextItems.push(uploadedItem);
      }

      setItems((prev) => [...nextItems, ...prev]);

      if (fileInputRef.current) fileInputRef.current.value = "";
      if (folderInputRef.current) folderInputRef.current.value = "";
    } catch (err: any) {
      setError(err?.message ?? "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-black text-white">
        <TopNav />
        <main className="mx-auto max-w-5xl px-5 py-10">
          <h1 className="text-3xl font-black text-white">Upload</h1>
          <p className="mt-2 text-base text-white/70">Checking session…</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <TopNav />

      <main className="mx-auto max-w-5xl px-5 py-10">
        <h1 className="text-3xl font-black text-white">Upload</h1>

        <div className="mt-2 space-y-2 text-base leading-7 text-white/70">
          <p>Upload audio files from your computer to add them to your Library.</p>
          <p>
            Click Choose files to add a single song, multiple songs, or choose a
            song folder.
          </p>
        </div>

        <section className={`mt-6 ${panelClass}`}>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-base font-bold text-white">
                  Choose audio files
                </div>
                <div className="mt-1 text-sm text-white/70">
                  WAV, MP3, FLAC, AIFF, and AIF files are supported.
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={accept}
                  multiple
                  onChange={(event) => uploadFiles(event.target.files)}
                  className="hidden"
                />

                <input
                  ref={folderInputRef}
                  type="file"
                  accept={accept}
                  multiple
                  onChange={(event) => uploadFiles(event.target.files)}
                  className="hidden"
                  {...({ webkitdirectory: "", directory: "" } as any)}
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className={buttonClass}
                >
                  {isUploading ? "Uploading..." : "Choose files"}
                </button>

                <button
                  type="button"
                  onClick={() => folderInputRef.current?.click()}
                  disabled={isUploading}
                  className={buttonClass}
                >
                  Choose folder
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="upload-visibility"
                className="text-sm font-bold text-white"
              >
                Visibility
              </label>

              <select
                id="upload-visibility"
                value={visibility}
                onChange={(event) =>
                  setVisibility(event.target.value as UploadVisibility)
                }
                className="w-full max-w-xs rounded-xl border border-white/25 bg-black px-3 py-2 text-sm text-white outline-none"
              >
                <option value="shared">Shared</option>
                <option value="private">Private</option>
              </select>

              <div className="text-sm leading-6 text-white/70">
                New tracks added from this upload page will use this visibility
                setting.
              </div>
            </div>
          </div>

          {error ? (
            <div className="mt-4 rounded-xl border border-white/25 bg-black p-3 text-sm text-white/70">
              {error}
              <div className="mt-2 text-xs text-white/70">
                If this says bucket not found, check the app audio storage
                settings.
              </div>
            </div>
          ) : null}
        </section>

        <section className={`mt-6 ${panelClass}`}>
          <div className="flex items-center justify-between gap-3">
            <div className="text-base font-bold text-white">Uploaded</div>
            <div className="text-sm text-white/70">{items.length} item(s)</div>
          </div>

          {items.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-white/25 bg-black p-5 text-sm text-white/70">
              No uploads yet.
            </div>
          ) : (
            <div className="mt-4 grid gap-3">
              {items.map((it) => (
                <div
                  key={it.path}
                  className="rounded-2xl border border-white/25 bg-black p-4"
                >
                  <div className="text-sm font-bold text-white">{it.name}</div>
                  <div className="mt-1 break-all font-mono text-xs text-white/70">
                    {it.path}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <a
                      href={it.publicUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={secondaryButtonClass}
                    >
                      Open audio
                    </a>

                    <button
                      type="button"
                      onClick={() => copy(it.publicUrl)}
                      className={secondaryButtonClass}
                    >
                      Copy URL
                    </button>

                    <span className="rounded-xl border border-white/25 bg-black px-3 py-2 text-xs font-bold text-white">
                      Added to Library
                    </span>

                    <audio className="mt-2 w-full" controls src={it.publicUrl} />
                  </div>

                  {it.addedToLibrary ? (
                    <div className="mt-2 text-xs text-white/70">
                      Tag added: <span className="font-mono">uploaded</span> •
                      Visibility: <span className="font-mono">{visibility}</span>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className={`mt-6 ${panelClass}`}>
          <div className="text-base font-bold text-white">
            Upload route
          </div>
          <p className={helperTextClass}>
            Computer → Upload → Library → Project. Storage happens behind the
            scenes so you do not need to manage songs in Supabase by hand.
          </p>
        </section>
      </main>
    </div>
  );
}
