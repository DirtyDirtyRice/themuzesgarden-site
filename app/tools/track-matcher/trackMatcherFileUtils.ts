export type TrackMatcherAudioFileInfo = {
  fileName: string;
  displayName: string;
  sizeBytes: number;
  sizeLabel: string;
  mimeType: string;
  objectUrl: string;
};

export function getTrackMatcherDisplayName(fileName: string) {
  return fileName.replace(/\.[^/.]+$/, "") || fileName || "Untitled Track";
}

export function formatTrackMatcherFileSize(sizeBytes: number) {
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    return "0 KB";
  }

  const kilobytes = sizeBytes / 1024;

  if (kilobytes < 1024) {
    return `${Math.round(kilobytes)} KB`;
  }

  const megabytes = kilobytes / 1024;
  return `${megabytes.toFixed(1)} MB`;
}

export function isTrackMatcherAudioFile(file: File) {
  if (file.type.startsWith("audio/")) {
    return true;
  }

  const loweredName = file.name.toLowerCase();

  return (
    loweredName.endsWith(".mp3") ||
    loweredName.endsWith(".wav") ||
    loweredName.endsWith(".m4a") ||
    loweredName.endsWith(".aac") ||
    loweredName.endsWith(".ogg") ||
    loweredName.endsWith(".flac")
  );
}

export function createTrackMatcherAudioFileInfo(
  file: File,
): TrackMatcherAudioFileInfo {
  return {
    fileName: file.name,
    displayName: getTrackMatcherDisplayName(file.name),
    sizeBytes: file.size,
    sizeLabel: formatTrackMatcherFileSize(file.size),
    mimeType: file.type || "audio/unknown",
    objectUrl: URL.createObjectURL(file),
  };
}

export function revokeTrackMatcherObjectUrl(objectUrl: string) {
  if (!objectUrl) {
    return;
  }

  if (typeof URL === "undefined") {
    return;
  }

  URL.revokeObjectURL(objectUrl);
}

export async function readTrackMatcherFileAsArrayBuffer(file: File) {
  return file.arrayBuffer();
}

export function createTrackMatcherFileError(file: File) {
  if (isTrackMatcherAudioFile(file)) {
    return "";
  }

  return `${file.name} is not a supported audio file. Use MP3, WAV, M4A, AAC, OGG, or FLAC.`;
}