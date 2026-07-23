"use client";

import { useCallback, useEffect, useState } from "react";

type ConnectionState = "checking" | "ready" | "offline" | "unavailable";

const appearance: Record<ConnectionState, string> = {
  checking: "border-cyan-300/30 bg-cyan-300/10 text-cyan-100",
  ready: "border-emerald-300/30 bg-emerald-300/10 text-emerald-100",
  offline: "border-amber-300/35 bg-amber-300/10 text-amber-100",
  unavailable: "border-red-300/35 bg-red-300/10 text-red-100",
};

const label: Record<ConnectionState, string> = {
  checking: "Checking engine…",
  ready: "Engine ready",
  offline: "Browser offline",
  unavailable: "Engine unavailable",
};

export default function WorkspaceConnectionStatus() {
  const [state, setState] = useState<ConnectionState>("checking");
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);

  const inspect = useCallback(async () => {
    if (!navigator.onLine) {
      setState("offline");
      setCheckedAt(new Date());
      return;
    }

    setState("checking");
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch("/api/developer-workspace/projects", {
        cache: "no-store",
        signal: controller.signal,
      });
      setState(response.ok ? "ready" : "unavailable");
    } catch {
      setState(navigator.onLine ? "unavailable" : "offline");
    } finally {
      window.clearTimeout(timeout);
      setCheckedAt(new Date());
    }
  }, []);

  useEffect(() => {
    void inspect();
    const interval = window.setInterval(() => void inspect(), 30000);
    const online = () => void inspect();
    const offline = () => {
      setState("offline");
      setCheckedAt(new Date());
    };
    const visible = () => { if (document.visibilityState === "visible") void inspect(); };
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    document.addEventListener("visibilitychange", visible);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [inspect]);

  const detail = checkedAt ? `Last checked ${checkedAt.toLocaleTimeString()}. Click to check again.` : "Checking the local workspace API.";

  return (
    <button type="button" onClick={() => void inspect()} className={`rounded-full border px-3 py-1 text-xs font-bold transition-colors ${appearance[state]}`} title={detail} aria-live="polite">
      <span className="mr-1.5" aria-hidden="true">●</span>{label[state]}
    </button>
  );
}
