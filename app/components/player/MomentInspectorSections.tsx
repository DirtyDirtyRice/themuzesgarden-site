import type { TrackSection } from "./playerTypes";
import {
  normalizeStart,
  getSectionDescriptionSafe,
  getSectionTagsSafe,
} from "./momentInspectorHelpers";
import { formatMomentTime } from "./playerUtils";

export default function MomentInspectorSections({
  sections,
}: {
  sections: TrackSection[];
}) {
  if (!sections.length) {
    return <div className="text-[10px] text-zinc-500">No sections.</div>;
  }

  return (
    <div className="space-y-2">
      {sections.map((section, index) => {
        const start = normalizeStart(section.start);
        const description = getSectionDescriptionSafe(section);
        const tags = getSectionTagsSafe(section);

        return (
          <div
            key={`${String(section.id)}:${index}`}
            className="rounded border bg-zinc-50 px-2 py-2"
          >
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-medium text-zinc-800">
                {String(section.id)}
              </div>

              <div className="text-[10px] text-zinc-500">
                {start === null ? "(no start)" : formatMomentTime(start)}
              </div>
            </div>

            <div className="mt-1 text-[10px] text-zinc-600">
              {description || "(no description)"}
            </div>

            <div className="mt-2 flex flex-wrap gap-1">
              {tags.length > 0 ? (
                tags.map((tag) => (
                  <span
                    key={`${section.id}:${tag}`}
                    className="rounded border bg-white px-2 py-0.5 text-[10px]"
                  >
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-[10px] text-zinc-500">
                  (no moment tags)
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}