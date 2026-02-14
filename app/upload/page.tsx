"use client";

import { useMemo, useRef, useState } from "react";
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
  // remove extension
  const base = name.replace(/\.[^/.]+$/, "");
  return base.trim() || "Untitled";
}

function newTrackId() {
  const c = globalThis.crypto as unknown as { randomUUID?: () => string };
  return c?.randomUUID?.() ?? `upl_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export default function UploadPage() {
  // ✅ CHANGE THIS if your public bucket name is different
  const BUCKET = "audio";

  // Optional: files go into this folder inside the bucket
  const FOLDER = "uploads";

  const inputRef = useRef<HTMLInputElement | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [items, setItems] = useState<UploadedItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const accept = useMemo(() => ".mp3,audio/mpeg", []);

  async function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);

    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    setIsUploading(true);

    try {
      const nextItems: UploadedItem[] = [];

      for (const file of files) {
        const safeName = makeSafeFileName(file.name);
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

        nextItems.push({
          name: file.name,
          path,
          publicUrl,
          addedToLibrary: false,
        });
      }

      setItems((prev) => [...nextItems, ...prev]);
      if (inputRef.current) inputRef.current.value = "";
    } catch (err: any) {
      setError(err?.message ?? "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  }

  function addItemToLibrary(it: UploadedItem) {
    const id = newTrackId();

    const track: Track = {
      id,
      title: titleFromFileName(it.name),
      artist: "The Muzes Garden",
      url: it.publicUrl,
      tags: ["uploaded"],
      createdAt: new Date().toISOString(),
    };

    addUploadedTrack(track);

    setItems((prev) =>
      prev.map((x) =>
        x.path === it.path ? { ...x, addedToLibrary: true, trackId: id } : x
      )
    );
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <TopNav />

      <main className="mx-auto max-w-5xl px-5 py-10">
        <h1 className="text-2xl font-semibold">Upload</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Upload MP3 files to Supabase Storage, then add them to your Library.
        </p>

        <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm font-medium">Select MP3 files</div>
              <div className="mt-1 text-xs text-zinc-600">
                Bucket: <span className="font-mono">{BUCKET}</span> · Folder:{" "}
                <span className="font-mono">{FOLDER}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                ref={inputRef}
                type="file"
                accept={accept}
                multiple
                onChange={onPickFiles}
                className="hidden"
              />
              <button
                onClick={() => inputRef.current?.click()}
                disabled={isUploading}
                className={[
                  "rounded-xl border px-4 py-2 text-sm transition",
                  isUploading
                    ? "border-zinc-200 bg-zinc-100 text-zinc-500"
                    : "border-zinc-900 bg-zinc-900 text-white hover:opacity-90",
                ].join(" ")}
              >
                {isUploading ? "Uploading..." : "Choose files"}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
              <div className="mt-2 text-xs text-red-700/80">
                If this says bucket not found, change{" "}
                <span className="font-mono">BUCKET</span> at the top of this file
                to your real public bucket name.
              </div>
            </div>
          )}
        </section>

        <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Uploaded</div>
            <div className="text-xs text-zinc-600">{items.length} item(s)</div>
          </div>

          {items.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-5 text-sm text-zinc-700">
              No uploads yet.
            </div>
          ) : (
            <div className="mt-4 grid gap-3">
              {items.map((it) => (
                <div
                  key={it.path}
                  className="rounded-2xl border border-zinc-200 bg-white p-4"
                >
                  <div className="text-sm font-semibold">{it.name}</div>
                  <div className="mt-1 break-all font-mono text-xs text-zinc-600">
                    {it.path}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <a
                      href={it.publicUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs hover:bg-zinc-50"
                    >
                      Open public URL
                    </a>
                    <button
                      onClick={() => copy(it.publicUrl)}
                      className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs hover:bg-zinc-50"
                    >
                      Copy URL
                    </button>

                    <button
                      onClick={() => addItemToLibrary(it)}
                      disabled={it.addedToLibrary}
                      className={[
                        "rounded-xl border px-3 py-2 text-xs transition",
                        it.addedToLibrary
                          ? "border-zinc-200 bg-zinc-100 text-zinc-500"
                          : "border-zinc-900 bg-zinc-900 text-white hover:opacity-90",
                      ].join(" ")}
                    >
                      {it.addedToLibrary ? "Added to Library" : "Add to Library"}
                    </button>

                    <audio className="mt-2 w-full" controls src={it.publicUrl} />
                  </div>

                  {it.addedToLibrary && (
                    <div className="mt-2 text-xs text-zinc-600">
                      Tag added: <span className="font-mono">uploaded</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}