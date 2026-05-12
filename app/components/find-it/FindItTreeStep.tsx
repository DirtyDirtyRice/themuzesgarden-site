"use client";

import { useRouter } from "next/navigation";

import {
  advanceNavigationGuide,
  setNavigationGuide,
} from "@/lib/navigation/navigationGuideState";

type TreeMarker = "here" | "target";

export default function FindItTreeStep({
  label,
  href,
  marker,
  fullPath,
  stepIndex,
}: {
  label: string;
  href?: string;
  marker?: TreeMarker;
  fullPath?: string[];
  stepIndex?: number;
}) {
  const router = useRouter();
  const canNavigate = Boolean(href);

  function handleClick() {
    if (!href) return;

    if (fullPath) {
      setNavigationGuide(fullPath);
    }

    if (typeof stepIndex === "number") {
      for (let index = 0; index < stepIndex; index += 1) {
        advanceNavigationGuide();
      }
    }

    router.push(href);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!canNavigate}
      className={[
        "w-full rounded-xl border px-3 py-2 text-left text-sm font-semibold transition",
        canNavigate
          ? "border-white/15 bg-black text-white hover:opacity-85 active:scale-[0.98]"
          : "border-white/10 bg-black/60 text-white/70",
      ].join(" ")}
    >
      <span className="flex items-center justify-between gap-3">
        <span>{label}</span>

        {marker === "here" ? (
          <span className="shrink-0 text-xs uppercase tracking-[0.14em] text-green-300">
            You are here
          </span>
        ) : null}

        {marker === "target" ? (
          <span className="shrink-0 text-xs uppercase tracking-[0.14em] text-blue-300">
            Target
          </span>
        ) : null}
      </span>
    </button>
  );
}