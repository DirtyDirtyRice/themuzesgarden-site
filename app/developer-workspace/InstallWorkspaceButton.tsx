"use client";

import { useEffect, useState } from "react";

type InstallChoice = { outcome: "accepted" | "dismissed"; platform: string };

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<InstallChoice>;
}

function isStandalone(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches
    || ("standalone" in navigator && (navigator as Navigator & { standalone?: boolean }).standalone === true);
}

export default function InstallWorkspaceButton() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    setInstalled(isStandalone());

    function capture(event: Event) {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    }

    function confirmInstalled() {
      setInstalled(true);
      setPromptEvent(null);
    }

    window.addEventListener("beforeinstallprompt", capture);
    window.addEventListener("appinstalled", confirmInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", capture);
      window.removeEventListener("appinstalled", confirmInstalled);
    };
  }, []);

  async function install() {
    if (!promptEvent || installing) return;
    setInstalling(true);
    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
      setPromptEvent(null);
    } finally {
      setInstalling(false);
    }
  }

  if (installed) {
    return <span className="rounded-lg border border-emerald-300/30 bg-emerald-300/10 px-3 py-2 text-xs font-black text-emerald-100">Installed app</span>;
  }

  if (!promptEvent) return null;

  return (
    <button type="button" onClick={() => void install()} disabled={installing} className="rounded-lg border border-emerald-300/40 bg-emerald-300/10 px-3 py-2 text-xs font-black text-emerald-100 hover:border-emerald-300/70 disabled:opacity-50">
      {installing ? "Opening installer…" : "Install app"}
    </button>
  );
}
