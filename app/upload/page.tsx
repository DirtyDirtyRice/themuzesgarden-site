"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import TopNav from "../components/TopNav";
import { supabase } from "../../lib/supabaseClient";
import {
  projectUploadAccept,
  summarizeUploadResult,
  uploadProjectAudioFiles,
  type UploadedProjectItem,
  type UploadVisibility,
} from "../shared/uploads/projectUploadHelpers";

const buttonClass =
  "rounded-xl border border-white/25 bg-black px-4 py-2 text-sm font-bold text-white transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";

const secondaryButtonClass =
  "rounded-xl border border-white/25 bg-black px-3 py-2 text-xs font-bold text-white transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98]";

const panelClass = "rounded-2xl border border-white/25 bg-black p-5";

const helperTextClass = "text-sm leading-6 text-white/70";

export default function UploadPage() {
  const router = useRouter();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  const [checkingSession, setCheckingSession] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [items, setItems] = useState<UploadedProjectItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [skippedFiles, setSkippedFiles] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<UploadVisibility>("shared");
  const [userId, setUserId] = useState<string | null>(null);

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

  async function uploadFiles(fileList: FileList | null) {
    setError(null);
    setUploadMessage(null);
    setSkippedFiles([]);

    const files = Array.from(fileList ?? []);
    if (!files.length) return;

    setIsUploading(true);

    try {
      const result = await uploadProjectAudioFiles({
        files,
        visibility,
        userId,
      });

      setItems((prev) => [...result.uploadedItems, ...prev]);
      setSkippedFiles(result.skippedFiles);
      setUploadMessage(summarizeUploadResult(result));

      if (fileInputRef.current) fileInputRef.current.value = "";
      if (folderInputRef.current) folderInputRef.current.value = "";
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed.");
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
                  accept={projectUploadAccept}
                  multiple
                  onChange={(event) => uploadFiles(event.target.files)}
                  className="hidden"
                />

                <input
                  ref={folderInputRef}
                  type="file"
                  accept={projectUploadAccept}
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

          {uploadMessage ? (
            <div className="mt-4 rounded-xl border border-white/25 bg-black p-3 text-sm text-white/70">
              {uploadMessage}
            </div>
          ) : null}

          {skippedFiles.length > 0 ? (
            <div className="mt-3 rounded-xl border border-white/25 bg-black p-3 text-sm text-white/70">
              <div className="font-bold text-white">Skipped unsupported files</div>
              <div className="mt-2 space-y-1">
                {skippedFiles.slice(0, 10).map((fileName) => (
                  <div key={fileName} className="break-all text-xs text-white/70">
                    {fileName}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

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
              {items.map((item) => (
                <div
                  key={item.path}
                  className="rounded-2xl border border-white/25 bg-black p-4"
                >
                  <div className="text-sm font-bold text-white">{item.name}</div>
                  <div className="mt-1 break-all font-mono text-xs text-white/70">
                    {item.path}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <a
                      href={item.publicUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={secondaryButtonClass}
                    >
                      Open audio
                    </a>

                    <button
                      type="button"
                      onClick={() => copy(item.publicUrl)}
                      className={secondaryButtonClass}
                    >
                      Copy URL
                    </button>

                    <span className="rounded-xl border border-white/25 bg-black px-3 py-2 text-xs font-bold text-white">
                      Added to Library
                    </span>

                    <audio className="mt-2 w-full" controls src={item.publicUrl} />
                  </div>

                  {item.addedToLibrary ? (
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
          <div className="text-base font-bold text-white">Upload route</div>
          <p className={helperTextClass}>
            Computer → Shared Upload Engine → Library → Project. Storage happens
            behind the scenes so you do not need to manage songs in Supabase by
            hand.
          </p>
        </section>
      </main>
    </div>
  );
}