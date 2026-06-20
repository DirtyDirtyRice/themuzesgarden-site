export type DownloadJsonOptions = {
  fileName: string;
  payload: unknown;
};

export function slugifyDownloadFileName(value: string): string {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 70) || "download"
  );
}

export function downloadJsonFile({
  fileName,
  payload,
}: DownloadJsonOptions) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

export function createDownloadStamp(): string {
  return new Date().toISOString().slice(0, 10);
}