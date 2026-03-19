import { formatMomentTime } from "./playerUtils";
import { normalizeStart } from "./momentInspectorHelpers";
import type { TrackSection } from "./playerTypes";

export default function MomentInspectorTimeline({
  sections,
}: {
  sections: TrackSection[];
}) {
  const maxStart = Math.max(
    0,
    ...sections.map((s) => normalizeStart(s.start) ?? 0)
  );

  if (sections.length === 0) {
    return <div className="text-[10px] text-zinc-500">(none)</div>;
  }

  return (
    <div className="space-y-2">
      {sections.map((section, index) => {
        const start = normalizeStart(section.start);

        const widthPct =
          start !== null && maxStart > 0
            ? Math.max(3, Math.round((start / maxStart) * 100))
            : 3;

        return (
          <div key={`${section.id}:${index}`}>
            <div className="mb-1 flex items-center justify-between text-[10px] text-zinc-600">
              <span>{String(section.id)}</span>
              <span>{start === null ? "(no start)" : formatMomentTime(start)}</span>
            </div>

            <div className="h-2 overflow-hidden rounded bg-zinc-100">
              <div
                className="h-full bg-zinc-700"
                style={{ width: `${widthPct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}