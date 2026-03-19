"use client";

import type {
  MomentInspectorCompareMetricTone,
  MomentInspectorCompareResult,
} from "./momentInspectorCompare.types";

function getToneClass(tone: MomentInspectorCompareMetricTone): string {
  if (tone === "stronger") {
    return "text-emerald-700";
  }

  if (tone === "weaker") {
    return "text-red-700";
  }

  if (tone === "equal") {
    return "text-sky-700";
  }

  return "text-zinc-600";
}

export default function MomentInspectorComparePanel(props: {
  result: MomentInspectorCompareResult;
}) {
  const { result } = props;

  if (!result.summary.ready) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white/90 p-3">
      <div className="flex flex-col gap-3">
        <div>
          <div className="text-sm font-semibold text-zinc-900">
            Side-by-Side Comparison
          </div>
          <div className="text-xs text-zinc-600">
            Primary:{" "}
            <span className="font-semibold text-zinc-900">
              {result.summary.primaryFamilyId}
            </span>{" "}
            · Secondary:{" "}
            <span className="font-semibold text-zinc-900">
              {result.summary.secondaryFamilyId}
            </span>
          </div>
        </div>

        <div className="grid gap-3 xl:grid-cols-2">
          {result.sections.map((section) => (
            <div
              key={section.title}
              className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3"
            >
              <div className="mb-2 text-sm font-semibold text-zinc-900">
                {section.title}
              </div>

              <div className="flex flex-col gap-2">
                {section.rows.map((row) => (
                  <div
                    key={row.key}
                    className="grid grid-cols-[minmax(110px,1fr)_120px_120px] items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs"
                  >
                    <div className="font-medium text-zinc-700">{row.label}</div>
                    <div className={`font-semibold ${getToneClass(row.tone)}`}>
                      {row.primaryValue}
                    </div>
                    <div className="font-semibold text-zinc-900">
                      {row.secondaryValue}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}