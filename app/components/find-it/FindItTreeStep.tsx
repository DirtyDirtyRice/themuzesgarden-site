import type { TreeMarker } from "./findItTypes";

export default function FindItTreeStep({
  label,
  marker,
}: {
  label: string;
  marker?: TreeMarker;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={[
          "rounded-lg border px-3 py-2 text-sm font-semibold",
          marker === "here"
            ? "border-sky-300/50 bg-sky-300/15 text-sky-100"
            : marker === "target"
              ? "border-emerald-300/50 bg-emerald-300/15 text-emerald-100"
              : "border-white/15 bg-black text-white/80",
        ].join(" ")}
      >
        {label}
      </span>

      {marker === "here" ? (
        <span className="text-xs font-bold uppercase tracking-[0.16em] text-sky-100">
          ← you are here
        </span>
      ) : null}

      {marker === "target" ? (
        <span className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-100">
          ← go here
        </span>
      ) : null}
    </div>
  );
}