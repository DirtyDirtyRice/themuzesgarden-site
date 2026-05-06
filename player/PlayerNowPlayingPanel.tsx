"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import MetadataPanel from "./MetadataPanel";
import type { AnyTrack } from "./playerTypes";

type ToggleKey = "metadata" | "tags" | "description";
type PlayerTagMode = "add" | "replace";

function getCleanText(value: unknown): string {
  return String(value ?? "").trim();
}

function getTagList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item ?? "").trim()).filter(Boolean);
}

function PanelToggleButton({
  label,
  isOpen,
  onClick,
  count,
}: {
  label: string;
  isOpen: boolean;
  onClick: () => void;
  count?: number | null;
}) {
  return (
    <button
      type="button"
      aria-expanded={isOpen}
      onClick={onClick}
      className="rounded-lg border border-white/20 bg-black px-2.5 py-1.5 text-[11px] text-[color:var(--text-strong)]"
    >
      {label}
      {typeof count === "number" ? ` (${count})` : ""}
    </button>
  );
}

export default function PlayerNowPlayingPanel(props: {
  nowLabel: string;
  nowId: string | null;
  compact: boolean;
  tab: "project" | "search";
  trackCountLabel: string;
  hasNow: boolean;
  canUseProject: boolean;
  hasProjectTracks: boolean;
  nowIdx: number;
  upNextIdx: number;
  projectTracksLength: number;
  remainingCount: number;
  trimmedQuery: string;
  nowTrack: AnyTrack | null;
}) {
  const {
    nowLabel,
    nowId,
    compact,
    tab,
    trackCountLabel,
    hasNow,
    canUseProject,
    hasProjectTracks,
    nowIdx,
    upNextIdx,
    projectTracksLength,
    remainingCount,
    trimmedQuery,
    nowTrack,
  } = props;

  const router = useRouter();
  const pathname = usePathname();
  const [openPanel, setOpenPanel] = useState<ToggleKey | null>(null);

  const visibility = nowTrack?.visibility ?? null;

  const visibilityLabel =
    visibility === "private"
      ? "Private"
      : visibility === "public"
        ? "Public"
        : visibility === "shared"
          ? "Shared"
          : null;

  const metadataTargetId =
    typeof nowTrack?.metadataId === "string" && nowTrack.metadataId.trim()
      ? nowTrack.metadataId.trim()
      : nowId;

  const trackDescription = useMemo(() => {
    if (!nowTrack || typeof nowTrack !== "object") return "";

    const record = nowTrack as Record<string, unknown>;

    return (
      getCleanText(record.description) ||
      getCleanText(record.notes) ||
      getCleanText(record.summary) ||
      getCleanText(record.prompt)
    );
  }, [nowTrack]);

  const tagList = useMemo(() => {
    if (!nowTrack || typeof nowTrack !== "object") return [];
    const record = nowTrack as Record<string, unknown>;
    return getTagList(record.tags);
  }, [nowTrack]);

  function togglePanel(next: ToggleKey) {
    setOpenPanel((current) => (current === next ? null : next));
  }

  function handleTagClick(
    tag: string,
    event: React.MouseEvent<HTMLButtonElement>
  ) {
    if (typeof window === "undefined") return;

    const mode: PlayerTagMode = event.shiftKey ? "replace" : "add";

    window.dispatchEvent(
      new CustomEvent("muzesgarden-search-tag", {
        detail: { tag, mode },
      })
    );

    if (pathname !== "/library") {
      router.push(
        `/library?playerTag=${encodeURIComponent(tag)}&playerMode=${encodeURIComponent(mode)}`
      );
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black px-3 py-3 text-[color:var(--text-normal)]">
      <div className="flex items-center justify-between">
        <div className="text-[11px] text-[color:var(--text-normal)]">
          NOW PLAYING
        </div>

        <div className="rounded-full border border-white/20 bg-black px-2 py-0.5 text-[11px] text-[color:var(--text-normal)]">
          {nowLabel ? "LIVE" : "IDLE"}
        </div>
      </div>

      <div className="mt-1 text-sm font-semibold text-[color:var(--text-strong)]">
        {nowLabel || "(none)"}
      </div>

      {visibilityLabel ? (
        <div className="mt-1 text-[11px] text-[color:var(--text-normal)]">
          {visibilityLabel}
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <PanelToggleButton
          label="Metadata"
          isOpen={openPanel === "metadata"}
          onClick={() => togglePanel("metadata")}
          count={metadataTargetId ? null : 0}
        />

        <PanelToggleButton
          label="Tags"
          isOpen={openPanel === "tags"}
          onClick={() => togglePanel("tags")}
          count={tagList.length}
        />

        <PanelToggleButton
          label="Description"
          isOpen={openPanel === "description"}
          onClick={() => togglePanel("description")}
          count={trackDescription ? 1 : 0}
        />
      </div>

      {openPanel === "metadata" ? (
        <div className="mt-3 rounded-xl border border-white/15 bg-black p-3">
          {metadataTargetId ? (
            <MetadataPanel targetType="track" targetId={metadataTargetId} />
          ) : (
            <div className="text-[11px] text-[color:var(--text-normal)]">
              No metadata target found for this track yet.
            </div>
          )}
        </div>
      ) : null}

      {openPanel === "tags" ? (
        <div className="mt-3 rounded-xl border border-white/15 bg-black p-3">
          <div className="text-xs font-medium text-[color:var(--text-strong)]">
            Tags
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {tagList.length === 0 ? (
              <div className="text-[11px] text-[color:var(--text-normal)]">
                No tags yet.
              </div>
            ) : (
              tagList.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={(event) => handleTagClick(tag, event)}
                  className="rounded-full border border-white/20 bg-black px-2.5 py-1 text-[11px] text-[color:var(--text-strong)]"
                  title={`Click to add ${tag} to Library filters. Shift+Click to replace filters.`}
                >
                  {tag}
                </button>
              ))
            )}
          </div>

          {tagList.length > 0 ? (
            <div className="mt-3 text-[11px] text-[color:var(--text-normal)]">
              Click a tag to add it to Library filters. Shift+Click replaces filters.
            </div>
          ) : null}
        </div>
      ) : null}

      {openPanel === "description" ? (
        <div className="mt-3 rounded-xl border border-white/15 bg-black p-3">
          <div className="text-xs font-medium text-[color:var(--text-strong)]">
            Description
          </div>

          <div className="mt-3 text-sm leading-6 text-[color:var(--text-normal)]">
            {trackDescription || "No description yet."}
          </div>
        </div>
      ) : null}

      {compact ? (
        <div className="mt-2 text-[11px] text-[color:var(--text-normal)]">
          <span>{tab === "project" ? "Project" : "Search"}</span>
          {" • "}
          <span>{trackCountLabel}</span>
          {" • "}
          <span>{hasNow ? "Live" : "Idle"}</span>
        </div>
      ) : null}

      {canUseProject && hasProjectTracks ? (
        <div className="mt-2 text-[11px] text-[color:var(--text-normal)]">
          <span className="font-medium text-[color:var(--text-strong)]">
            Now: {nowIdx >= 0 ? String(nowIdx + 1).padStart(2, "0") : "--"}
          </span>
          {" • "}
          <span>
            Up Next:{" "}
            {upNextIdx >= 0 && upNextIdx < projectTracksLength
              ? String(upNextIdx + 1).padStart(2, "0")
              : "--"}
          </span>
          {" • "}
          <span>Remaining: {remainingCount}</span>
        </div>
      ) : null}

      {!compact && canUseProject && hasProjectTracks && !hasNow ? (
        <div className="mt-2 text-[11px] text-[color:var(--text-normal)]">
          Tip: Press{" "}
          <span className="font-medium text-[color:var(--text-strong)]">
            Play All
          </span>
        </div>
      ) : null}

      {!compact && tab === "search" && !hasNow ? (
        <div className="mt-2 text-[11px] text-[color:var(--text-normal)]">
          {trimmedQuery ? (
            <>
              Use{" "}
              <span className="font-medium text-[color:var(--text-strong)]">
                Enter
              </span>{" "}
              or{" "}
              <span className="font-medium text-[color:var(--text-strong)]">
                Shift+Enter
              </span>
            </>
          ) : (
            <>Search to begin</>
          )}
        </div>
      ) : null}
    </div>
  );
}