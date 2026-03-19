import type { AnyTrack } from "./playerTypes";
import { emitTagSearch, getTagSourceSummary } from "./playerUtils";
import { getOriginUiLabel } from "./projectTabHelpers";

export default function ProjectTrackTags({
  track,
  tags,
}: {
  track: AnyTrack;
  tags: string[];
}) {
  if (!tags.length) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {tags.slice(0, 6).map((tag) => {
        const source = getTagSourceSummary(track, tag);
        const originLabel = getOriginUiLabel(source.originLabel);

        return (
          <button
            key={`${track.id}:${tag}`}
            type="button"
            className="rounded border px-2 py-0.5 text-[10px] hover:bg-zinc-100"
            onClick={(e) => {
              e.stopPropagation();
              emitTagSearch(tag);
            }}
            title={`Search tag: ${tag} • source: ${originLabel}`}
          >
            {tag}
          </button>
        );
      })}
    </div>
  );
}