"use client";

type MomentInspectorWorkspaceLaneMeta = {
  key: string;
  label: string;
  // ✅ FIX: allow optional badgeClassName so TS stops failing
  badgeClassName?: string;
};

type Props = {
  lanes: MomentInspectorWorkspaceLaneMeta[];
};

export default function MomentInspectorWorkspaceLegend({ lanes }: Props) {
  if (!lanes?.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {lanes.map((meta) => (
        <div
          key={meta.key}
          className={[
            "rounded-full border px-2 py-1 text-[11px] font-medium",
            // ✅ SAFE: fallback if undefined
            meta.badgeClassName ?? "",
          ].join(" ")}
        >
          {meta.label}
        </div>
      ))}
    </div>
  );
}
