type DownloadableTrack = {
  id?: string;
  title?: string;
  name?: string;
  fileName?: string;
  url?: string;
  fileUrl?: string;
  publicUrl?: string;
  audioUrl?: string;
};

export type ProjectDownloadItem = {
  id: string;
  title: string;
  url: string;
};

export function getProjectTrackDownloadUrl(track: DownloadableTrack) {
  return track.url || track.fileUrl || track.publicUrl || track.audioUrl || "";
}

export function getProjectTrackDownloadTitle(track: DownloadableTrack) {
  return track.title || track.name || track.fileName || "project-track";
}

export function slugifyProjectDownloadName(value: string) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "download"
  );
}

export function buildProjectDownloadItems(
  tracks: DownloadableTrack[],
): ProjectDownloadItem[] {
  return tracks
    .map((track, index) => {
      const url = getProjectTrackDownloadUrl(track);

      return {
        id: track.id || `${index}`,
        title: getProjectTrackDownloadTitle(track),
        url,
      };
    })
    .filter((item) => item.url.length > 0);
}

export function downloadProjectUrl(url: string, fileName: string) {
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.rel = "noreferrer";

  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function downloadProjectFiles(items: ProjectDownloadItem[]) {
  items.forEach((item, index) => {
    window.setTimeout(() => {
      downloadProjectUrl(item.url, slugifyProjectDownloadName(item.title));
    }, index * 300);
  });
}

export function downloadProjectFolder(items: ProjectDownloadItem[]) {
  downloadProjectFiles(items);
}