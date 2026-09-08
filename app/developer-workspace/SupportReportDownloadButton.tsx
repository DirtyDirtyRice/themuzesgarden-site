"use client";

import { useState } from "react";

export default function SupportReportDownloadButton() {
  const [status, setStatus] = useState<"idle" | "downloading" | "failed">("idle");

  async function download() {
    if (status === "downloading") return;
    setStatus("downloading");
    try {
      const response = await fetch("/api/developer-workspace/support-report", { cache: "no-store" });
      if (!response.ok) throw new Error("Support report failed.");
      const disposition = response.headers.get("Content-Disposition") ?? "";
      const filename = disposition.match(/filename="([^"]+)"/)?.[1] ?? "developer-workspace-support-report.json";
      const url = URL.createObjectURL(await response.blob());
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
      setStatus("idle");
    } catch {
      setStatus("failed");
    }
  }

  return (
    <button type="button" onClick={() => void download()} disabled={status === "downloading"} className="rounded-lg border border-cyan-300/25 px-3 py-2 text-xs font-bold text-cyan-100 hover:border-cyan-300/50 disabled:opacity-50">
      {status === "downloading" ? "Preparing report…" : status === "failed" ? "Retry support report" : "Download support report"}
    </button>
  );
}
