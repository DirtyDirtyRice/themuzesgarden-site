import type { Track } from "../../../types/track";
import { supabase } from "../../../lib/supabaseClient";
import { addUploadedTrack } from "../../../lib/uploadedTracks";

export type UploadVisibility = "shared" | "private";

export type UploadedProjectItem = {
  name: string;
  path: string;
  publicUrl: string;
  addedToLibrary: boolean;
  trackId: string;
};

export type UploadProjectAudioFilesResult = {
  uploadedItems: UploadedProjectItem[];
  skippedFiles: string[];
};

const BUCKET = "audio";
const FOLDER = "uploads";

export const projectUploadAccept =
  ".wav,.mp3,.flac,.aiff,.aif,audio/wav,audio/mpeg,audio/flac,audio/aiff";

export function isSupportedProjectAudioFile(file: File) {
  const name = file.name.toLowerCase();

  return (
    name.endsWith(".wav") ||
    name.endsWith(".mp3") ||
    name.endsWith(".flac") ||
    name.endsWith(".aiff") ||
    name.endsWith(".aif")
  );
}

export function getProjectUploadDisplayName(file: File) {
  const relativePath = String((file as any).webkitRelativePath ?? "").trim();
  return relativePath || file.name;
}

export function makeProjectUploadSafeFileName(original: string) {
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

export function titleFromProjectUploadFileName(name: string) {
  const base = name.replace(/\.[^/.]+$/, "");
  return base.trim() || "Untitled";
}

export function newProjectUploadTrackId() {
  const c = globalThis.crypto as unknown as { randomUUID?: () => string };

  return (
    c?.randomUUID?.() ??
    `upl_${Date.now()}_${Math.random().toString(16).slice(2)}`
  );
}

export function createProjectUploadedTrack({
  item,
  visibility,
  userId,
}: {
  item: UploadedProjectItem;
  visibility: UploadVisibility;
  userId: string | null;
}): Track {
  return {
    id: item.trackId,
    title: titleFromProjectUploadFileName(item.name),
    artist: "The Muzes Garden",
    url: item.publicUrl,
    tags: ["uploaded"],
    visibility,
    ownerId: userId ?? undefined,
    createdAt: new Date().toISOString(),
  };
}

export function summarizeUploadResult(result: UploadProjectAudioFilesResult) {
  const uploadedCount = result.uploadedItems.length;
  const skippedCount = result.skippedFiles.length;

  if (uploadedCount === 0 && skippedCount === 0) {
    return "No files selected.";
  }

  if (uploadedCount === 0 && skippedCount > 0) {
    return `No supported audio files found. Skipped ${skippedCount} file${
      skippedCount === 1 ? "" : "s"
    }.`;
  }

  if (skippedCount === 0) {
    return `Uploaded ${uploadedCount} file${uploadedCount === 1 ? "" : "s"}.`;
  }

  return `Uploaded ${uploadedCount} file${
    uploadedCount === 1 ? "" : "s"
  }. Skipped ${skippedCount} unsupported file${
    skippedCount === 1 ? "" : "s"
  }.`;
}

export async function uploadProjectAudioFiles({
  files,
  visibility,
  userId,
}: {
  files: File[];
  visibility: UploadVisibility;
  userId: string | null;
}): Promise<UploadProjectAudioFilesResult> {
  const supportedFiles = files.filter(isSupportedProjectAudioFile);
  const skippedFiles = files
    .filter((file) => !isSupportedProjectAudioFile(file))
    .map(getProjectUploadDisplayName);

  const uploadedItems: UploadedProjectItem[] = [];

  for (const file of supportedFiles) {
    const displayName = getProjectUploadDisplayName(file);
    const safeName = makeProjectUploadSafeFileName(
      displayName.replace(/[\\/]+/g, " "),
    );
    const path = `${FOLDER}/${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "audio/mpeg",
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const publicUrl = data.publicUrl;
    const trackId = newProjectUploadTrackId();

    const uploadedItem: UploadedProjectItem = {
      name: displayName,
      path,
      publicUrl,
      addedToLibrary: true,
      trackId,
    };

    addUploadedTrack(
      createProjectUploadedTrack({
        item: uploadedItem,
        visibility,
        userId,
      }),
    );

    uploadedItems.push(uploadedItem);
  }

  return {
    uploadedItems,
    skippedFiles,
  };
}